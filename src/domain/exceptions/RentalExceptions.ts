import { DomainException } from './DomainException';

/**
 * Thrown when a rental operation is not allowed due to business rule violations
 */
export class RentalNotAllowedError extends DomainException {
  constructor(reason: string, metadata?: Record<string, unknown>) {
    super(`Rental not allowed: ${reason}`, 'RENTAL_NOT_ALLOWED', metadata);
  }
}

/**
 * Thrown when attempting an invalid state transition in a rental
 */
export class InvalidStateTransitionError extends DomainException {
  constructor(currentState: string, attemptedState: string, metadata?: Record<string, unknown>) {
    super(
      `Invalid state transition from '${currentState}' to '${attemptedState}'`,
      'INVALID_STATE_TRANSITION',
      { currentState, attemptedState, ...metadata },
    );
  }
}

/**
 * Thrown when a rental cannot be found
 */
export class RentalNotFoundError extends DomainException {
  constructor(rentalId: string, metadata?: Record<string, unknown>) {
    super(`Rental not found with ID: ${rentalId}`, 'RENTAL_NOT_FOUND', {
      rentalId,
      ...metadata,
    });
  }
}

/**
 * Thrown when attempting to return a rental that is already returned
 */
export class RentalAlreadyReturnedError extends DomainException {
  constructor(rentalId: string, metadata?: Record<string, unknown>) {
    super(`Rental ${rentalId} has already been returned`, 'RENTAL_ALREADY_RETURNED', {
      rentalId,
      ...metadata,
    });
  }
}

/**
 * Thrown when rental period extension is not valid
 */
export class InvalidRentalExtensionError extends DomainException {
  constructor(reason: string, metadata?: Record<string, unknown>) {
    super(`Invalid rental extension: ${reason}`, 'INVALID_RENTAL_EXTENSION', metadata);
  }
}

/**
 * Thrown when attempting to modify an overdue rental in an invalid way
 */
export class OverdueRentalError extends DomainException {
  constructor(rentalId: string, daysOverdue: number, metadata?: Record<string, unknown>) {
    super(`Rental ${rentalId} is ${daysOverdue} day(s) overdue`, 'RENTAL_OVERDUE', {
      rentalId,
      daysOverdue,
      ...metadata,
    });
  }
}
