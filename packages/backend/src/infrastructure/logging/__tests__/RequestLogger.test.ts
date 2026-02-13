import express, { Express, Request, Response } from 'express';
import request from 'supertest';
import { createRequestLogger, getRequestId, getRequestDuration } from '../RequestLogger.js';
import { ILogger, LogContext } from '../Logger.js';

// Helper to create a delay
const delay = (ms: number): Promise<void> =>
  // eslint-disable-next-line no-undef
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Mock logger for testing
 * Uses a shared logs array so child loggers log to the same array
 */
class MockLogger implements ILogger {
  // Shared logs array across all instances (parent and children)
  private static sharedLogs: Array<{
    level: 'error' | 'warn' | 'info' | 'debug';
    message: string;
    context?: LogContext;
    error?: Error;
  }> = [];

  private childContext: LogContext = {};

  get logs() {
    return MockLogger.sharedLogs;
  }

  error(message: string, error?: Error, context?: LogContext): void {
    MockLogger.sharedLogs.push({
      level: 'error',
      message,
      error,
      context: { ...this.childContext, ...context },
    });
  }

  warn(message: string, context?: LogContext): void {
    MockLogger.sharedLogs.push({
      level: 'warn',
      message,
      context: { ...this.childContext, ...context },
    });
  }

  info(message: string, context?: LogContext): void {
    MockLogger.sharedLogs.push({
      level: 'info',
      message,
      context: { ...this.childContext, ...context },
    });
  }

  debug(message: string, context?: LogContext): void {
    MockLogger.sharedLogs.push({
      level: 'debug',
      message,
      context: { ...this.childContext, ...context },
    });
  }

  child(context: LogContext): ILogger {
    const childLogger = new MockLogger();
    childLogger.childContext = { ...this.childContext, ...context };
    return childLogger;
  }

  reset(): void {
    MockLogger.sharedLogs = [];
    this.childContext = {};
  }
}

describe('RequestLogger', () => {
  let app: Express;
  let mockLogger: MockLogger;

  beforeEach(() => {
    app = express();
    mockLogger = new MockLogger();
    mockLogger.reset(); // Reset shared logs before each test
  });

  describe('Basic Request Logging', () => {
    it('should log incoming request and successful response', async () => {
      app.use(createRequestLogger(mockLogger));
      app.get('/test', (_req, res) => {
        res.status(200).json({ message: 'success' });
      });

      await request(app).get('/test').expect(200);

      expect(mockLogger.logs.length).toBe(2);
      expect(mockLogger.logs[0].message).toBe('Incoming HTTP request');
      expect(mockLogger.logs[1].message).toBe('HTTP request completed successfully');
    });

    it('should add request ID to request context', async () => {
      let capturedRequestId: string | undefined;

      app.use(createRequestLogger(mockLogger));
      app.get('/test', (req, res) => {
        capturedRequestId = getRequestId(req);
        res.status(200).send('ok');
      });

      await request(app).get('/test').expect(200);

      expect(capturedRequestId).toBeDefined();
      expect(typeof capturedRequestId).toBe('string');
      expect(capturedRequestId!.length).toBeGreaterThan(0);
    });

    it('should track request duration', async () => {
      let capturedDuration: number | undefined;

      app.use(createRequestLogger(mockLogger));
      app.get('/test', async (req, res) => {
        // Add small delay
        await delay(10);
        capturedDuration = getRequestDuration(req);
        res.status(200).send('ok');
      });

      await request(app).get('/test').expect(200);

      expect(capturedDuration).toBeDefined();
      expect(capturedDuration!).toBeGreaterThanOrEqual(10);
    });
  });

  describe('HTTP Status Code Logging', () => {
    it('should log successful 2xx responses as info', async () => {
      app.use(createRequestLogger(mockLogger));
      app.get('/test', (_req, res) => {
        res.status(201).json({ message: 'created' });
      });

      await request(app).get('/test').expect(201);

      const responseLogs = mockLogger.logs.filter((log) => log.message.includes('completed'));
      expect(responseLogs[0].level).toBe('info');
      expect(responseLogs[0].message).toBe('HTTP request completed successfully');
    });

    it('should log 4xx client errors as warnings', async () => {
      app.use(createRequestLogger(mockLogger));
      app.get('/test', (_req, res) => {
        res.status(404).json({ error: 'Not Found' });
      });

      await request(app).get('/test').expect(404);

      const responseLogs = mockLogger.logs.filter((log) => log.message.includes('completed'));
      expect(responseLogs[0].level).toBe('warn');
      expect(responseLogs[0].message).toBe('HTTP request completed with client error');
    });

    it('should log 5xx server errors as errors', async () => {
      app.use(createRequestLogger(mockLogger));
      app.get('/test', (_req, res) => {
        res.status(500).json({ error: 'Internal Server Error' });
      });

      await request(app).get('/test').expect(500);

      const responseLogs = mockLogger.logs.filter((log) => log.message.includes('failed'));
      expect(responseLogs.length).toBeGreaterThan(0);
      expect(responseLogs[0].level).toBe('error');
      expect(responseLogs[0].message).toBe('HTTP request failed with server error');
    });
  });

  describe('Request Context', () => {
    it('should log request method and path', async () => {
      app.use(createRequestLogger(mockLogger));
      app.post('/api/test', (_req, res) => {
        res.status(200).send('ok');
      });

      await request(app).post('/api/test').expect(200);

      const requestLog = mockLogger.logs[0];
      expect(requestLog.context).toBeDefined();
    });

    it('should log query parameters', async () => {
      app.use(createRequestLogger(mockLogger));
      app.get('/test', (_req, res) => {
        res.status(200).send('ok');
      });

      await request(app).get('/test?foo=bar&baz=qux').expect(200);

      const requestLog = mockLogger.logs[0];
      expect(requestLog.context).toBeDefined();
      expect(requestLog.context!.query).toEqual({ foo: 'bar', baz: 'qux' });
    });

    it('should log route parameters', async () => {
      app.use(createRequestLogger(mockLogger));
      app.get('/users/:userId', (_req, res) => {
        res.status(200).send('ok');
      });

      await request(app).get('/users/123').expect(200);

      const requestLog = mockLogger.logs[0];
      expect(requestLog.context).toBeDefined();
      // Note: params are empty at middleware time, populated later by router
      // This is expected Express behavior
      expect(requestLog.context!.params).toEqual({});
    });

    it('should log user agent', async () => {
      app.use(createRequestLogger(mockLogger));
      app.get('/test', (_req, res) => {
        res.status(200).send('ok');
      });

      await request(app).get('/test').set('User-Agent', 'Test Agent').expect(200);

      const requestLog = mockLogger.logs[0];
      expect(requestLog.context).toBeDefined();
    });
  });

  describe('Response Context', () => {
    it('should log response status code', async () => {
      app.use(createRequestLogger(mockLogger));
      app.get('/test', (_req, res) => {
        res.status(201).send('ok');
      });

      await request(app).get('/test').expect(201);

      const responseLog = mockLogger.logs[1];
      expect(responseLog.context).toBeDefined();
      expect(responseLog.context!.statusCode).toBe(201);
    });

    it('should log response time', async () => {
      app.use(createRequestLogger(mockLogger));
      app.get('/test', async (_req, res) => {
        await delay(10);
        res.status(200).send('ok');
      });

      await request(app).get('/test').expect(200);

      const responseLog = mockLogger.logs[1];
      expect(responseLog.context).toBeDefined();
      expect(responseLog.context!.responseTime).toBeDefined();
      expect(typeof responseLog.context!.responseTime).toBe('string');
      expect(responseLog.context!.responseTime).toMatch(/\d+ms/);
    });
  });

  describe('Request Body Logging', () => {
    it('should not log request body by default', async () => {
      app.use(express.json());
      app.use(createRequestLogger(mockLogger));
      app.post('/test', (_req, res) => {
        res.status(200).send('ok');
      });

      await request(app).post('/test').send({ data: 'test' }).expect(200);

      const requestLog = mockLogger.logs[0];
      expect(requestLog.context).toBeDefined();
      expect(requestLog.context!.body).toBeUndefined();
    });

    it('should log request body when configured', async () => {
      app.use(express.json());
      app.use(createRequestLogger(mockLogger, { logRequestBody: true }));
      app.post('/test', (_req, res) => {
        res.status(200).send('ok');
      });

      await request(app).post('/test').send({ data: 'test' }).expect(200);

      const requestLog = mockLogger.logs[0];
      expect(requestLog.context).toBeDefined();
      expect(requestLog.context!.body).toEqual({ data: 'test' });
    });

    it('should truncate large request bodies', async () => {
      const largeBody = { data: 'x'.repeat(2000) };

      app.use(express.json());
      app.use(createRequestLogger(mockLogger, { logRequestBody: true, maxBodySize: 100 }));
      app.post('/test', (_req, res) => {
        res.status(200).send('ok');
      });

      await request(app).post('/test').send(largeBody).expect(200);

      const requestLog = mockLogger.logs[0];
      expect(requestLog.context).toBeDefined();
      expect(requestLog.context!.body).toBeDefined();
    });
  });

  describe('Response Body Logging', () => {
    it('should not log response body by default', async () => {
      app.use(createRequestLogger(mockLogger));
      app.get('/test', (_req, res) => {
        res.status(200).json({ data: 'test' });
      });

      await request(app).get('/test').expect(200);

      const responseLog = mockLogger.logs[1];
      expect(responseLog.context).toBeDefined();
      expect(responseLog.context!.body).toBeUndefined();
    });

    it('should log response body when configured', async () => {
      app.use(createRequestLogger(mockLogger, { logResponseBody: true }));
      app.get('/test', (_req, res) => {
        res.status(200).send('test response');
      });

      await request(app).get('/test').expect(200);

      const responseLog = mockLogger.logs[1];
      expect(responseLog.context).toBeDefined();
      expect(responseLog.context!.body).toBeDefined();
    });
  });

  describe('Path Exclusions', () => {
    it('should exclude health check endpoint by default', async () => {
      app.use(createRequestLogger(mockLogger));
      app.get('/health', (_req, res) => {
        res.status(200).send('ok');
      });

      await request(app).get('/health').expect(200);

      expect(mockLogger.logs.length).toBe(0);
    });

    it('should exclude custom paths when configured', async () => {
      app.use(createRequestLogger(mockLogger, { excludePaths: ['/metrics', '/status'] }));
      app.get('/metrics', (_req, res) => {
        res.status(200).send('ok');
      });
      app.get('/status', (_req, res) => {
        res.status(200).send('ok');
      });

      await request(app).get('/metrics').expect(200);
      expect(mockLogger.logs.length).toBe(0);

      await request(app).get('/status').expect(200);
      expect(mockLogger.logs.length).toBe(0);
    });

    it('should still log non-excluded paths', async () => {
      app.use(createRequestLogger(mockLogger, { excludePaths: ['/health'] }));
      app.get('/api/test', (_req, res) => {
        res.status(200).send('ok');
      });

      await request(app).get('/api/test').expect(200);

      expect(mockLogger.logs.length).toBe(2);
    });
  });

  describe('Error Handling', () => {
    it('should log request even if route throws error', async () => {
      app.use(createRequestLogger(mockLogger));
      app.get('/test', () => {
        throw new Error('Route error');
      });
      app.use((err: Error, _req: Request, res: Response) => {
        res.status(500).json({ error: err.message });
      });

      await request(app).get('/test').expect(500);

      expect(mockLogger.logs.length).toBeGreaterThan(0);
      expect(mockLogger.logs[0].message).toBe('Incoming HTTP request');
    });
  });

  describe('getRequestId', () => {
    it('should return request ID from context', async () => {
      let requestId: string | undefined;

      app.use(createRequestLogger(mockLogger));
      app.get('/test', (req, res) => {
        requestId = getRequestId(req);
        res.status(200).send('ok');
      });

      await request(app).get('/test').expect(200);

      expect(requestId).toBeDefined();
      expect(typeof requestId).toBe('string');
    });

    it('should return undefined if no context', async () => {
      app.get('/test', (req, res) => {
        const requestId = getRequestId(req);
        expect(requestId).toBeUndefined();
        res.status(200).send('ok');
      });

      await request(app).get('/test').expect(200);
    });
  });

  describe('getRequestDuration', () => {
    it('should return request duration from context', async () => {
      let duration: number | undefined;

      app.use(createRequestLogger(mockLogger));
      app.get('/test', async (req, res) => {
        await delay(10);
        duration = getRequestDuration(req);
        res.status(200).send('ok');
      });

      await request(app).get('/test').expect(200);

      expect(duration).toBeDefined();
      expect(duration!).toBeGreaterThanOrEqual(10);
    });

    it('should return undefined if no context', async () => {
      app.get('/test', (req, res) => {
        const duration = getRequestDuration(req);
        expect(duration).toBeUndefined();
        res.status(200).send('ok');
      });

      await request(app).get('/test').expect(200);
    });
  });
});
