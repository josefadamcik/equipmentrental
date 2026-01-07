import { Request, Response, NextFunction } from 'express';
import { ILogger } from './Logger.js';
import { randomUUID } from 'crypto';
import { Buffer } from 'buffer';

/**
 * Request context stored in Express request object
 */
export interface RequestContext {
  requestId: string;
  startTime: number;
}

/**
 * Augment Express Request type to include our context
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      requestContext?: RequestContext;
    }
  }
}

/**
 * Request logger configuration
 */
export interface RequestLoggerConfig {
  /**
   * Whether to log request bodies (can be verbose)
   */
  logRequestBody?: boolean;

  /**
   * Whether to log response bodies (can be verbose)
   */
  logResponseBody?: boolean;

  /**
   * Maximum body size to log (in bytes)
   */
  maxBodySize?: number;

  /**
   * Paths to exclude from logging (e.g., health checks)
   */
  excludePaths?: string[];
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<RequestLoggerConfig> = {
  logRequestBody: false,
  logResponseBody: false,
  maxBodySize: 1024,
  excludePaths: ['/health'],
};

/**
 * Create Express middleware for request logging
 */
export function createRequestLogger(
  logger: ILogger,
  config: RequestLoggerConfig = {},
): (req: Request, res: Response, next: NextFunction) => void {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  return (req: Request, res: Response, next: NextFunction): void => {
    // Generate request ID and track start time
    const requestId = randomUUID();
    const startTime = Date.now();

    // Store context in request object
    req.requestContext = {
      requestId,
      startTime,
    };

    // Check if path should be excluded
    if (mergedConfig.excludePaths.includes(req.path)) {
      next();
      return;
    }

    // Create child logger with request context
    const requestLogger = logger.child({
      requestId,
      method: req.method,
      path: req.path,
      userAgent: req.get('user-agent'),
    });

    // Log incoming request
    const requestContext: Record<string, unknown> = {
      query: req.query,
      params: req.params,
    };

    if (mergedConfig.logRequestBody && req.body) {
      requestContext.body = truncateBody(req.body, mergedConfig.maxBodySize);
    }

    requestLogger.info('Incoming HTTP request', requestContext);

    // Capture original end function
    const originalEnd = res.end;

    // Override end function to log response
    res.end = function (chunk?: unknown, ...args: unknown[]): Response {
      // Restore original end function
      res.end = originalEnd;

      // Calculate response time
      const responseTime = Date.now() - startTime;

      // Build response context
      const responseContext: Record<string, unknown> = {
        statusCode: res.statusCode,
        responseTime: `${responseTime}ms`,
      };

      if (mergedConfig.logResponseBody && chunk) {
        responseContext.body = truncateBody(chunk, mergedConfig.maxBodySize);
      }

      // Log response
      if (res.statusCode >= 500) {
        requestLogger.error('HTTP request failed with server error', undefined, responseContext);
      } else if (res.statusCode >= 400) {
        requestLogger.warn('HTTP request completed with client error', responseContext);
      } else {
        requestLogger.info('HTTP request completed successfully', responseContext);
      }

      // Call original end function with all arguments
      // @ts-expect-error - TypeScript struggles with dynamic end function signature
      return originalEnd.call(this, chunk, ...args);
    };

    next();
  };
}

/**
 * Truncate body to maximum size for logging
 */
function truncateBody(body: unknown, maxSize: number): unknown {
  if (typeof body === 'string') {
    return body.length > maxSize ? body.substring(0, maxSize) + '...[truncated]' : body;
  }

  if (Buffer.isBuffer(body)) {
    return body.length > maxSize ? '[Binary data truncated]' : '[Binary data]';
  }

  if (typeof body === 'object' && body !== null) {
    const serialized = JSON.stringify(body);
    if (serialized.length > maxSize) {
      return serialized.substring(0, maxSize) + '...[truncated]';
    }
    return body;
  }

  return body;
}

/**
 * Get request ID from Express request
 */
export function getRequestId(req: Request): string | undefined {
  return req.requestContext?.requestId;
}

/**
 * Get request duration in milliseconds
 */
export function getRequestDuration(req: Request): number | undefined {
  if (!req.requestContext) return undefined;
  return Date.now() - req.requestContext.startTime;
}
