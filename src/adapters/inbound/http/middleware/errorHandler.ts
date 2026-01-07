import { Request, Response, NextFunction } from 'express';
import { DomainException } from '../../../../domain/exceptions/DomainException.js';
import {
  EquipmentNotAvailableError,
  EquipmentNotFoundError,
  EquipmentAlreadyRentedError,
  EquipmentInMaintenanceError,
  EquipmentConditionUnacceptableError,
  EquipmentRetiredError,
} from '../../../../domain/exceptions/EquipmentExceptions.js';
import {
  MemberNotFoundError,
  MemberSuspendedError,
  RentalLimitExceededError,
  MemberHasOverdueRentalsError,
  MemberInactiveError,
  InsufficientMemberTierError,
} from '../../../../domain/exceptions/MemberExceptions.js';
import {
  RentalNotAllowedError,
  RentalAlreadyReturnedError,
  InvalidRentalExtensionError,
  OverdueRentalError,
} from '../../../../domain/exceptions/RentalExceptions.js';
import { ErrorResponse } from '../dtos/ErrorDTOs.js';

/**
 * Maps domain exceptions to HTTP status codes
 */
function getStatusCodeForException(error: Error): number {
  // Not found errors -> 404
  if (error instanceof EquipmentNotFoundError || error instanceof MemberNotFoundError) {
    return 404;
  }

  // Business rule violations -> 409 Conflict
  if (
    error instanceof EquipmentNotAvailableError ||
    error instanceof EquipmentAlreadyRentedError ||
    error instanceof EquipmentInMaintenanceError ||
    error instanceof EquipmentConditionUnacceptableError ||
    error instanceof EquipmentRetiredError ||
    error instanceof RentalNotAllowedError ||
    error instanceof RentalAlreadyReturnedError ||
    error instanceof InvalidRentalExtensionError ||
    error instanceof OverdueRentalError
  ) {
    return 409;
  }

  // Authorization/Permission errors -> 403 Forbidden
  if (
    error instanceof MemberSuspendedError ||
    error instanceof RentalLimitExceededError ||
    error instanceof MemberHasOverdueRentalsError ||
    error instanceof MemberInactiveError ||
    error instanceof InsufficientMemberTierError
  ) {
    return 403;
  }

  // Domain exceptions we don't have specific handling for -> 400 Bad Request
  if (error instanceof DomainException) {
    return 400;
  }

  // Default to 500 Internal Server Error
  return 500;
}

/**
 * Gets error code from exception name or type
 */
function getErrorCode(error: Error): string {
  if (error instanceof DomainException) {
    // Use the exception class name as the error code
    return error.constructor.name
      .replace(/Error$/, '')
      .replace(/([A-Z])/g, '_$1')
      .toUpperCase()
      .substring(1);
  }

  // For validation errors
  if (error.message.includes('validation') || error.message.includes('invalid')) {
    return 'VALIDATION_ERROR';
  }

  return 'INTERNAL_ERROR';
}

/**
 * Express error handler middleware
 * Catches all errors and converts them to standardized HTTP responses
 */
export function errorHandler(error: Error, req: Request, res: Response, _next: NextFunction): void {
  // Log the error for debugging
  console.error('Error handling request:', {
    method: req.method,
    path: req.path,
    error: error.message,
    stack: error.stack,
  });

  const statusCode = getStatusCodeForException(error);
  const errorCode = getErrorCode(error);

  const errorResponse: ErrorResponse = {
    error: {
      code: errorCode,
      message: error.message,
    },
  };

  // Add additional details for domain exceptions
  if (error instanceof DomainException) {
    errorResponse.error.details = {
      type: error.constructor.name,
    };
  }

  res.status(statusCode).json(errorResponse);
}

/**
 * Express middleware to handle 404 Not Found for undefined routes
 */
export function notFoundHandler(req: Request, res: Response): void {
  const errorResponse: ErrorResponse = {
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Route not found: ${req.method} ${req.path}`,
    },
  };

  res.status(404).json(errorResponse);
}
