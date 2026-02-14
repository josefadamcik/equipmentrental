import { EquipmentId, MemberId } from '../../../domain/value-objects/identifiers.js';
import { DateRange } from '../../../domain/value-objects/DateRange.js';
import { EquipmentRepository } from '../../../domain/ports/EquipmentRepository.js';
import { MemberRepository } from '../../../domain/ports/MemberRepository.js';
import { RentalRepository } from '../../../domain/ports/RentalRepository.js';
import { ReservationRepository } from '../../../domain/ports/ReservationRepository.js';
import { EventPublisher } from '../../../domain/ports/EventPublisher.js';
import { Rental } from '../../../domain/entities/Rental.js';
import { RentalCreated } from '../../../domain/events/RentalEvents.js';
import {
  EquipmentNotAvailableError,
  EquipmentNotFoundError,
} from '../../../domain/exceptions/EquipmentExceptions.js';
import {
  MemberNotFoundError,
  RentalLimitExceededError,
  MemberInactiveError,
} from '../../../domain/exceptions/MemberExceptions.js';
import { RentalNotAllowedError } from '../../../domain/exceptions/RentalExceptions.js';
import { getMaxConcurrentRentals } from '../../../domain/types/MembershipTier.js';

/**
 * Command to create a new rental
 */
export interface CreateRentalCommand {
  equipmentId: string;
  memberId: string;
  startDate: Date;
  endDate: Date;
}

/**
 * Result of creating a rental
 */
export interface CreateRentalResult {
  rentalId: string;
  totalCost: number;
  discountApplied: number;
}

/**
 * Handler for creating a new rental
 * Orchestrates the rental creation process with all necessary validations
 */
export class CreateRentalCommandHandler {
  constructor(
    private readonly equipmentRepository: EquipmentRepository,
    private readonly memberRepository: MemberRepository,
    private readonly rentalRepository: RentalRepository,
    private readonly reservationRepository: ReservationRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(command: CreateRentalCommand): Promise<CreateRentalResult> {
    // Parse identifiers
    const equipmentId = EquipmentId.create(command.equipmentId);
    const memberId = MemberId.create(command.memberId);
    const period = DateRange.create(command.startDate, command.endDate);

    // Validate equipment exists and is available
    const equipment = await this.equipmentRepository.findById(equipmentId);
    if (!equipment) {
      throw new EquipmentNotFoundError(equipmentId.value);
    }

    if (!equipment.isAvailable) {
      throw new EquipmentNotAvailableError(equipmentId.value, 'Equipment is currently rented');
    }

    // Validate member exists and can rent
    const member = await this.memberRepository.findById(memberId);
    if (!member) {
      throw new MemberNotFoundError(memberId.value);
    }

    if (!member.isActive) {
      throw new MemberInactiveError(memberId.value);
    }

    if (!member.canRent()) {
      const maxRentals = getMaxConcurrentRentals(member.tier);
      throw new RentalLimitExceededError(memberId.value, member.activeRentalCount, maxRentals);
    }

    // Validate rental period is within member's tier limits
    const maxRentalDays = member.getMaxRentalDays();
    if (period.getDays() > maxRentalDays) {
      throw new RentalNotAllowedError(
        `Rental period of ${period.getDays()} days exceeds member's maximum of ${maxRentalDays} days`,
      );
    }

    // Check for conflicting reservations for this equipment
    const conflictingReservations = await this.reservationRepository.findConflicting(
      equipmentId,
      period,
    );
    if (conflictingReservations.length > 0) {
      throw new RentalNotAllowedError(
        `Equipment is reserved during the requested period. ${conflictingReservations.length} conflicting reservation(s) found.`,
      );
    }

    // Calculate rental cost and apply member discount
    const baseCost = equipment.calculateRentalCost(period.getDays());
    const discountedCost = member.applyDiscount(baseCost);
    const discountAmount = baseCost.amount - discountedCost.amount;

    // Create rental
    const rental = Rental.create({
      equipmentId,
      memberId,
      period,
      baseCost: discountedCost,
      conditionAtStart: equipment.condition,
    });

    // Mark equipment as rented
    equipment.markAsRented(rental.id.value);

    // Increment member's active rental count
    member.incrementActiveRentals();

    // Persist changes
    await this.rentalRepository.save(rental);
    await this.equipmentRepository.save(equipment);
    await this.memberRepository.save(member);

    // Publish domain event
    const event = RentalCreated.create(
      rental.id,
      memberId,
      equipmentId,
      period,
      equipment.dailyRate,
    );
    await this.eventPublisher.publish(event);

    return {
      rentalId: rental.id.value,
      totalCost: rental.totalCost.amount,
      discountApplied: discountAmount,
    };
  }
}
