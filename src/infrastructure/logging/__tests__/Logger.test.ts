import { Logger, NoOpLogger, createLogger } from '../Logger.js';
import { LoggingConfig } from '../../config/Config.js';
import { existsSync, readFileSync, unlinkSync, rmdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Logger', () => {
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleInfoSpy: jest.SpyInstance;
  let consoleDebugSpy: jest.SpyInstance;
  let testLogFile: string;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();
    testLogFile = join(tmpdir(), 'test-logs', 'test.log');
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleInfoSpy.mockRestore();
    consoleDebugSpy.mockRestore();

    // Clean up test log file
    if (existsSync(testLogFile)) {
      unlinkSync(testLogFile);
    }
    const testLogDir = join(tmpdir(), 'test-logs');
    if (existsSync(testLogDir)) {
      rmdirSync(testLogDir);
    }
  });

  describe('Console Logging', () => {
    describe('Text Format', () => {
      it('should log error messages to console in text format', () => {
        const config: LoggingConfig = {
          level: 'error',
          format: 'text',
          destination: 'console',
        };
        const logger = new Logger(config);

        logger.error('Test error message');

        expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
        const output = consoleErrorSpy.mock.calls[0][0];
        expect(output).toContain('ERROR');
        expect(output).toContain('Test error message');
      });

      it('should log error with Error object', () => {
        const config: LoggingConfig = {
          level: 'error',
          format: 'text',
          destination: 'console',
        };
        const logger = new Logger(config);
        const error = new Error('Test error');

        logger.error('Error occurred', error);

        expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
        const output = consoleErrorSpy.mock.calls[0][0];
        expect(output).toContain('ERROR');
        expect(output).toContain('Error occurred');
        expect(output).toContain('Error: Test error');
      });

      it('should log warn messages to console in text format', () => {
        const config: LoggingConfig = {
          level: 'warn',
          format: 'text',
          destination: 'console',
        };
        const logger = new Logger(config);

        logger.warn('Test warning message');

        expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
        const output = consoleWarnSpy.mock.calls[0][0];
        expect(output).toContain('WARN');
        expect(output).toContain('Test warning message');
      });

      it('should log info messages to console in text format', () => {
        const config: LoggingConfig = {
          level: 'info',
          format: 'text',
          destination: 'console',
        };
        const logger = new Logger(config);

        logger.info('Test info message');

        expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
        const output = consoleInfoSpy.mock.calls[0][0];
        expect(output).toContain('INFO');
        expect(output).toContain('Test info message');
      });

      it('should log debug messages to console in text format', () => {
        const config: LoggingConfig = {
          level: 'debug',
          format: 'text',
          destination: 'console',
        };
        const logger = new Logger(config);

        logger.debug('Test debug message');

        expect(consoleDebugSpy).toHaveBeenCalledTimes(1);
        const output = consoleDebugSpy.mock.calls[0][0];
        expect(output).toContain('DEBUG');
        expect(output).toContain('Test debug message');
      });

      it('should include context in text format logs', () => {
        const config: LoggingConfig = {
          level: 'info',
          format: 'text',
          destination: 'console',
        };
        const logger = new Logger(config);

        logger.info('Test message', { userId: '123', action: 'test' });

        expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
        const output = consoleInfoSpy.mock.calls[0][0];
        expect(output).toContain('userId');
        expect(output).toContain('123');
        expect(output).toContain('action');
        expect(output).toContain('test');
      });
    });

    describe('JSON Format', () => {
      it('should log error messages in JSON format', () => {
        const config: LoggingConfig = {
          level: 'error',
          format: 'json',
          destination: 'console',
        };
        const logger = new Logger(config);

        logger.error('Test error message');

        expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
        const output = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
        expect(output.level).toBe('error');
        expect(output.message).toBe('Test error message');
        expect(output.timestamp).toBeDefined();
      });

      it('should log error with Error object in JSON format', () => {
        const config: LoggingConfig = {
          level: 'error',
          format: 'json',
          destination: 'console',
        };
        const logger = new Logger(config);
        const error = new Error('Test error');

        logger.error('Error occurred', error);

        expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
        const output = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
        expect(output.level).toBe('error');
        expect(output.message).toBe('Error occurred');
        expect(output.error).toBeDefined();
        expect(output.error.name).toBe('Error');
        expect(output.error.message).toBe('Test error');
        expect(output.error.stack).toBeDefined();
      });

      it('should include context in JSON format logs', () => {
        const config: LoggingConfig = {
          level: 'info',
          format: 'json',
          destination: 'console',
        };
        const logger = new Logger(config);

        logger.info('Test message', { userId: '123', action: 'test' });

        expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
        const output = JSON.parse(consoleInfoSpy.mock.calls[0][0]);
        expect(output.context.userId).toBe('123');
        expect(output.context.action).toBe('test');
      });
    });
  });

  describe('Log Level Filtering', () => {
    it('should only log errors when level is error', () => {
      const config: LoggingConfig = {
        level: 'error',
        format: 'text',
        destination: 'console',
      };
      const logger = new Logger(config);

      logger.error('Error message');
      logger.warn('Warn message');
      logger.info('Info message');
      logger.debug('Debug message');

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).toHaveBeenCalledTimes(0);
      expect(consoleInfoSpy).toHaveBeenCalledTimes(0);
      expect(consoleDebugSpy).toHaveBeenCalledTimes(0);
    });

    it('should log errors and warnings when level is warn', () => {
      const config: LoggingConfig = {
        level: 'warn',
        format: 'text',
        destination: 'console',
      };
      const logger = new Logger(config);

      logger.error('Error message');
      logger.warn('Warn message');
      logger.info('Info message');
      logger.debug('Debug message');

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleInfoSpy).toHaveBeenCalledTimes(0);
      expect(consoleDebugSpy).toHaveBeenCalledTimes(0);
    });

    it('should log errors, warnings, and info when level is info', () => {
      const config: LoggingConfig = {
        level: 'info',
        format: 'text',
        destination: 'console',
      };
      const logger = new Logger(config);

      logger.error('Error message');
      logger.warn('Warn message');
      logger.info('Info message');
      logger.debug('Debug message');

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
      expect(consoleDebugSpy).toHaveBeenCalledTimes(0);
    });

    it('should log all levels when level is debug', () => {
      const config: LoggingConfig = {
        level: 'debug',
        format: 'text',
        destination: 'console',
      };
      const logger = new Logger(config);

      logger.error('Error message');
      logger.warn('Warn message');
      logger.info('Info message');
      logger.debug('Debug message');

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
      expect(consoleDebugSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('File Logging', () => {
    it('should write logs to file', () => {
      const config: LoggingConfig = {
        level: 'info',
        format: 'json',
        destination: 'file',
        filePath: testLogFile,
      };
      const logger = new Logger(config);

      logger.info('Test message');

      expect(existsSync(testLogFile)).toBe(true);
      const content = readFileSync(testLogFile, 'utf8');
      const logEntry = JSON.parse(content.trim());
      expect(logEntry.level).toBe('info');
      expect(logEntry.message).toBe('Test message');
    });

    it('should append multiple logs to file', () => {
      const config: LoggingConfig = {
        level: 'info',
        format: 'json',
        destination: 'file',
        filePath: testLogFile,
      };
      const logger = new Logger(config);

      logger.info('First message');
      logger.info('Second message');

      const content = readFileSync(testLogFile, 'utf8');
      const lines = content.trim().split('\n');
      expect(lines.length).toBe(2);
      expect(JSON.parse(lines[0]).message).toBe('First message');
      expect(JSON.parse(lines[1]).message).toBe('Second message');
    });

    it('should create directory if it does not exist', () => {
      const config: LoggingConfig = {
        level: 'info',
        format: 'json',
        destination: 'file',
        filePath: testLogFile,
      };
      const logger = new Logger(config);

      logger.info('Test message');

      expect(existsSync(join(tmpdir(), 'test-logs'))).toBe(true);
      expect(existsSync(testLogFile)).toBe(true);
    });

    it('should fallback to console if file write fails', () => {
      const invalidPath = '/invalid/path/that/does/not/exist/test.log';
      const config: LoggingConfig = {
        level: 'info',
        format: 'json',
        destination: 'file',
        filePath: invalidPath,
      };

      // Attempting to create a logger with an invalid path should throw
      expect(() => new Logger(config)).toThrow();
    });
  });

  describe('Both Destinations', () => {
    it('should write logs to both console and file', () => {
      const config: LoggingConfig = {
        level: 'info',
        format: 'json',
        destination: 'both',
        filePath: testLogFile,
      };
      const logger = new Logger(config);

      logger.info('Test message');

      // Check console
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1);

      // Check file
      expect(existsSync(testLogFile)).toBe(true);
      const content = readFileSync(testLogFile, 'utf8');
      const logEntry = JSON.parse(content.trim());
      expect(logEntry.message).toBe('Test message');
    });
  });

  describe('Child Logger', () => {
    it('should create child logger with additional context', () => {
      const config: LoggingConfig = {
        level: 'info',
        format: 'json',
        destination: 'console',
      };
      const logger = new Logger(config);
      const childLogger = logger.child({ service: 'test-service' });

      childLogger.info('Test message', { action: 'test' });

      expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
      const output = JSON.parse(consoleInfoSpy.mock.calls[0][0]);
      expect(output.context.service).toBe('test-service');
      expect(output.context.action).toBe('test');
    });

    it('should merge parent and child context', () => {
      const config: LoggingConfig = {
        level: 'info',
        format: 'json',
        destination: 'console',
      };
      const logger = new Logger(config, { app: 'test-app' });
      const childLogger = logger.child({ service: 'test-service' });

      childLogger.info('Test message');

      expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
      const output = JSON.parse(consoleInfoSpy.mock.calls[0][0]);
      expect(output.context.app).toBe('test-app');
      expect(output.context.service).toBe('test-service');
    });
  });

  describe('Base Context', () => {
    it('should include base context in all logs', () => {
      const config: LoggingConfig = {
        level: 'info',
        format: 'json',
        destination: 'console',
      };
      const logger = new Logger(config, { app: 'test-app', version: '1.0.0' });

      logger.info('Test message');

      expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
      const output = JSON.parse(consoleInfoSpy.mock.calls[0][0]);
      expect(output.context.app).toBe('test-app');
      expect(output.context.version).toBe('1.0.0');
    });
  });
});

describe('NoOpLogger', () => {
  it('should not log anything', () => {
    const logger = new NoOpLogger();
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    const consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();
    const consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();

    logger.error('Error');
    logger.warn('Warn');
    logger.info('Info');
    logger.debug('Debug');

    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
    expect(consoleInfoSpy).not.toHaveBeenCalled();
    expect(consoleDebugSpy).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleInfoSpy.mockRestore();
    consoleDebugSpy.mockRestore();
  });

  it('should return itself as child logger', () => {
    const logger = new NoOpLogger();
    const child = logger.child({ test: 'context' });
    expect(child).toBe(logger);
  });
});

describe('createLogger', () => {
  it('should create a logger with the given config', () => {
    const config: LoggingConfig = {
      level: 'info',
      format: 'json',
      destination: 'console',
    };
    const logger = createLogger(config);

    expect(logger).toBeInstanceOf(Logger);
  });

  it('should create a logger with base context', () => {
    const config: LoggingConfig = {
      level: 'info',
      format: 'json',
      destination: 'console',
    };
    const consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();
    const logger = createLogger(config, { app: 'test' });

    logger.info('Test');

    const output = JSON.parse(consoleInfoSpy.mock.calls[0][0]);
    expect(output.context.app).toBe('test');

    consoleInfoSpy.mockRestore();
  });
});
