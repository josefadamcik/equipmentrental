/**
 * Data Transfer Objects for Error HTTP responses
 * These DTOs define the contract for error responses
 */

/**
 * Standard error response structure
 */
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * Validation error response structure
 */
export interface ValidationErrorResponse {
  error: {
    code: 'VALIDATION_ERROR';
    message: string;
    fields?: Array<{
      field: string;
      message: string;
    }>;
  };
}
