import { LoggingConfig } from '../config/Config.js';
import { appendFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

/**
 * Log levels in order of severity
 */
export const LogLevel = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
} as const;

export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];

/**
 * Metadata that can be attached to log entries
 */
export type LogContext = Record<string, unknown>;

/**
 * Structured log entry
 */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * Logger interface
 */
export interface ILogger {
  error(message: string, error?: Error, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  debug(message: string, context?: LogContext): void;
  child(context: LogContext): ILogger;
}

/**
 * Structured logger implementation
 */
export class Logger implements ILogger {
  private readonly config: LoggingConfig;
  private readonly baseContext: LogContext;
  private readonly levelPriority: Record<LogLevel, number> = {
    [LogLevel.ERROR]: 0,
    [LogLevel.WARN]: 1,
    [LogLevel.INFO]: 2,
    [LogLevel.DEBUG]: 3,
  };

  constructor(config: LoggingConfig, baseContext: LogContext = {}) {
    this.config = config;
    this.baseContext = baseContext;
    this.initializeFileLogging();
  }

  /**
   * Initialize file logging by ensuring directory exists
   */
  private initializeFileLogging(): void {
    if (
      (this.config.destination === 'file' || this.config.destination === 'both') &&
      this.config.filePath
    ) {
      const dir = dirname(this.config.filePath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    }
  }

  /**
   * Check if a log level should be logged based on configuration
   */
  private shouldLog(level: LogLevel): boolean {
    const configuredLevel = this.config.level as LogLevel;
    return this.levelPriority[level] <= this.levelPriority[configuredLevel];
  }

  /**
   * Create a log entry
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    error?: Error,
    context?: LogContext,
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...this.baseContext, ...context },
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    return entry;
  }

  /**
   * Format log entry as JSON
   */
  private formatAsJson(entry: LogEntry): string {
    return JSON.stringify(entry);
  }

  /**
   * Format log entry as human-readable text
   */
  private formatAsText(entry: LogEntry): string {
    const levelColors: Record<LogLevel, string> = {
      [LogLevel.ERROR]: '\x1b[31m', // Red
      [LogLevel.WARN]: '\x1b[33m', // Yellow
      [LogLevel.INFO]: '\x1b[36m', // Cyan
      [LogLevel.DEBUG]: '\x1b[90m', // Gray
    };
    const resetColor = '\x1b[0m';
    const color = levelColors[entry.level];

    let output = `${color}[${entry.timestamp}] ${entry.level.toUpperCase()}${resetColor}: ${entry.message}`;

    if (entry.context && Object.keys(entry.context).length > 0) {
      output += `\n  Context: ${JSON.stringify(entry.context)}`;
    }

    if (entry.error) {
      output += `\n  Error: ${entry.error.name}: ${entry.error.message}`;
      if (entry.error.stack) {
        output += `\n  Stack: ${entry.error.stack}`;
      }
    }

    return output;
  }

  /**
   * Format log entry based on configuration
   */
  private format(entry: LogEntry): string {
    return this.config.format === 'json' ? this.formatAsJson(entry) : this.formatAsText(entry);
  }

  /**
   * Write log entry to configured destinations
   */
  private write(entry: LogEntry): void {
    const formatted = this.format(entry);

    if (this.config.destination === 'console' || this.config.destination === 'both') {
      // Write to appropriate console method
      switch (entry.level) {
        case LogLevel.ERROR:
          console.error(formatted);
          break;
        case LogLevel.WARN:
          console.warn(formatted);
          break;
        case LogLevel.INFO:
          console.info(formatted);
          break;
        case LogLevel.DEBUG:
          console.debug(formatted);
          break;
      }
    }

    if (
      (this.config.destination === 'file' || this.config.destination === 'both') &&
      this.config.filePath
    ) {
      try {
        appendFileSync(this.config.filePath, formatted + '\n', 'utf8');
      } catch (err) {
        // Fallback to console if file writing fails
        console.error('Failed to write to log file:', err);
        console.error(formatted);
      }
    }
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    const entry = this.createLogEntry(LogLevel.ERROR, message, error, context);
    this.write(entry);
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    const entry = this.createLogEntry(LogLevel.WARN, message, undefined, context);
    this.write(entry);
  }

  /**
   * Log an info message
   */
  info(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    const entry = this.createLogEntry(LogLevel.INFO, message, undefined, context);
    this.write(entry);
  }

  /**
   * Log a debug message
   */
  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    const entry = this.createLogEntry(LogLevel.DEBUG, message, undefined, context);
    this.write(entry);
  }

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): ILogger {
    return new Logger(this.config, { ...this.baseContext, ...context });
  }
}

/**
 * No-op logger for testing or when logging is disabled
 */
export class NoOpLogger implements ILogger {
  error(_message: string, _error?: Error, _context?: LogContext): void {
    // No-op
  }

  warn(_message: string, _context?: LogContext): void {
    // No-op
  }

  info(_message: string, _context?: LogContext): void {
    // No-op
  }

  debug(_message: string, _context?: LogContext): void {
    // No-op
  }

  child(_context: LogContext): ILogger {
    return this;
  }
}

/**
 * Factory function to create a logger
 */
export function createLogger(config: LoggingConfig, context?: LogContext): ILogger {
  return new Logger(config, context);
}
