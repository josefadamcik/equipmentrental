/**
 * Base class for all domain-specific exceptions.
 * Provides a consistent structure for error handling across the domain layer.
 */
export abstract class DomainException extends Error {
  /**
   * Unique error code for categorizing and identifying the exception type
   */
  public readonly code: string;

  /**
   * Optional metadata providing additional context about the error
   */
  public readonly metadata?: Record<string, unknown>;

  /**
   * Timestamp when the exception was created
   */
  public readonly timestamp: Date;

  constructor(message: string, code: string, metadata?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.metadata = metadata;
    this.timestamp = new Date();

    // Maintains proper stack trace for where error was thrown (only in V8 engines)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    // Set the prototype explicitly to maintain instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /**
   * Returns a JSON representation of the exception
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      metadata: this.metadata,
      timestamp: this.timestamp.toISOString(),
    };
  }

  /**
   * Returns a string representation of the exception
   */
  toString(): string {
    const metadataStr = this.metadata ? ` | ${JSON.stringify(this.metadata)}` : '';
    return `[${this.code}] ${this.message}${metadataStr}`;
  }
}
