import { ReservationId } from '../../../domain/value-objects/identifiers.js';
import { ReservationRepository } from '../../../domain/ports/ReservationRepository.js';
import { EventPublisher } from '../../../domain/ports/EventPublisher.js';
import { ReservationCancelled } from '../../../domain/events/ReservationEvents.js';

/**
 * Command to cancel a reservation
 */
export interface CancelReservationCommand {
  reservationId: string;
  reason?: string;
}

/**
 * Result of cancelling a reservation
 */
export interface CancelReservationResult {
  reservationId: string;
  cancelledAt: Date;
  reason?: string;
}

/**
 * Exception thrown when reservation is not found
 */
export class ReservationNotFoundError extends Error {
  constructor(reservationId: string) {
    super(`Reservation not found: ${reservationId}`);
    this.name = 'ReservationNotFoundError';
  }
}

/**
 * Handler for cancelling a reservation
 * Validates the reservation can be cancelled and publishes cancellation event
 */
export class CancelReservationCommandHandler {
  constructor(
    private readonly reservationRepository: ReservationRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(command: CancelReservationCommand): Promise<CancelReservationResult> {
    // Parse reservation ID
    const reservationId = ReservationId.create(command.reservationId);

    // Load reservation
    const reservation = await this.reservationRepository.findById(reservationId);
    if (!reservation) {
      throw new ReservationNotFoundError(reservationId.value);
    }

    // Cancel the reservation (will throw if not in a cancellable state)
    const now = new Date();
    reservation.cancel(now);

    // Persist changes
    await this.reservationRepository.save(reservation);

    // Publish domain event
    const event = ReservationCancelled.create(reservation.id, reservation.memberId, command.reason);
    await this.eventPublisher.publish(event);

    return {
      reservationId: reservation.id.value,
      cancelledAt: reservation.cancelledAt!,
      reason: command.reason,
    };
  }
}
