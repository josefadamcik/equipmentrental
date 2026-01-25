import { DomainException } from './DomainException.js';

/**
 * Thrown when a reservation cannot be found
 */
export class ReservationNotFoundError extends DomainException {
  constructor(reservationId: string, metadata?: Record<string, unknown>) {
    super(`Reservation not found with ID: ${reservationId}`, 'RESERVATION_NOT_FOUND', {
      reservationId,
      ...metadata,
    });
  }
}

/**
 * Thrown when attempting to perform an invalid operation on a cancelled reservation
 */
export class ReservationAlreadyCancelledError extends DomainException {
  constructor(reservationId: string, metadata?: Record<string, unknown>) {
    super(
      `Reservation ${reservationId} has already been cancelled`,
      'RESERVATION_ALREADY_CANCELLED',
      {
        reservationId,
        ...metadata,
      },
    );
  }
}

/**
 * Thrown when attempting to fulfill a reservation that is not in a valid state
 */
export class InvalidReservationStateError extends DomainException {
  constructor(
    reservationId: string,
    currentState: string,
    reason: string,
    metadata?: Record<string, unknown>,
  ) {
    super(
      `Reservation ${reservationId} is in invalid state '${currentState}': ${reason}`,
      'INVALID_RESERVATION_STATE',
      { reservationId, currentState, reason, ...metadata },
    );
  }
}
