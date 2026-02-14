import { EquipmentId, MemberId } from '../../../domain/value-objects/identifiers.js';
import { DateRange } from '../../../domain/value-objects/DateRange.js';
import { EquipmentRepository } from '../../../domain/ports/EquipmentRepository.js';
import { MemberRepository } from '../../../domain/ports/MemberRepository.js';
import { ReservationRepository } from '../../../domain/ports/ReservationRepository.js';
import { EventPublisher } from '../../../domain/ports/EventPublisher.js';
import { Reservation } from '../../../domain/entities/Reservation.js';
import { ReservationCreated } from '../../../domain/events/ReservationEvents.js';
import { EquipmentNotFoundError } from '../../../domain/exceptions/EquipmentExceptions.js';
import {
  MemberNotFoundError,
  MemberInactiveError,
} from '../../../domain/exceptions/MemberExceptions.js';
import { RentalNotAllowedError } from '../../../domain/exceptions/RentalExceptions.js';
import { InvalidReservationStateError } from '../../../domain/exceptions/ReservationExceptions.js';

/**
 * Command to create a new reservation
 */
export interface CreateReservationCommand {
  equipmentId: string;
  memberId: string;
  startDate: Date;
  endDate: Date;
}

/**
 * Result of creating a reservation
 */
export interface CreateReservationResult {
  reservationId: string;
  equipmentId: string;
  memberId: string;
  startDate: Date;
  endDate: Date;
  estimatedCost: number;
}

/**
 * Handler for creating a new reservation
 * Validates availability and prevents double-booking
 */
export class CreateReservationCommandHandler {
  constructor(
    private readonly equipmentRepository: EquipmentRepository,
    private readonly memberRepository: MemberRepository,
    private readonly reservationRepository: ReservationRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(command: CreateReservationCommand): Promise<CreateReservationResult> {
    // Parse identifiers
    const equipmentId = EquipmentId.create(command.equipmentId);
    const memberId = MemberId.create(command.memberId);
    const period = DateRange.create(command.startDate, command.endDate);

    // Validate equipment exists
    const equipment = await this.equipmentRepository.findById(equipmentId);
    if (!equipment) {
      throw new EquipmentNotFoundError(equipmentId.value);
    }

    // Validate member exists and is active
    const member = await this.memberRepository.findById(memberId);
    if (!member) {
      throw new MemberNotFoundError(memberId.value);
    }

    if (!member.isActive) {
      throw new MemberInactiveError(memberId.value);
    }

    // Validate reservation period is in the future
    const now = new Date();
    if (period.hasStarted(now)) {
      throw new InvalidReservationStateError('new', 'PENDING', 'Reservation must be for a future date');
    }

    // Validate rental period is within member's tier limits
    const maxRentalDays = member.getMaxRentalDays();
    if (period.getDays() > maxRentalDays) {
      throw new RentalNotAllowedError(
        `Reservation period of ${period.getDays()} days exceeds member's maximum of ${maxRentalDays} days`,
      );
    }

    // Check for conflicting reservations
    const conflictingReservations = await this.reservationRepository.findConflicting(
      equipmentId,
      period,
    );
    if (conflictingReservations.length > 0) {
      throw new RentalNotAllowedError(
        `Equipment is already reserved during the requested period. ${conflictingReservations.length} conflicting reservation(s) found.`,
      );
    }

    // Create reservation
    const reservation = Reservation.create({
      equipmentId,
      memberId,
      period,
    });

    // Auto-confirm the reservation (in a real system, this might require approval)
    reservation.confirm(now);

    // Persist reservation
    await this.reservationRepository.save(reservation);

    // Publish domain event
    const event = ReservationCreated.create(reservation.id, memberId, equipmentId, period);
    await this.eventPublisher.publish(event);

    // Calculate estimated cost (with member discount)
    const baseCost = equipment.calculateRentalCost(period.getDays());
    const estimatedCost = member.applyDiscount(baseCost);

    return {
      reservationId: reservation.id.value,
      equipmentId: equipmentId.value,
      memberId: memberId.value,
      startDate: period.start,
      endDate: period.end,
      estimatedCost: estimatedCost.amount,
    };
  }
}
