import { RentalId } from '../../../domain/value-objects/identifiers.js';
import { EquipmentRepository } from '../../../domain/ports/EquipmentRepository.js';
import { MemberRepository } from '../../../domain/ports/MemberRepository.js';
import { RentalRepository } from '../../../domain/ports/RentalRepository.js';
import { ReservationRepository } from '../../../domain/ports/ReservationRepository.js';
import { DateRange } from '../../../domain/value-objects/DateRange.js';
import { RentalNotFoundError } from '../../../domain/exceptions/RentalExceptions.js';
import { EquipmentNotFoundError } from '../../../domain/exceptions/EquipmentExceptions.js';
import { MemberNotFoundError } from '../../../domain/exceptions/MemberExceptions.js';

/**
 * Command to extend a rental period
 */
export interface ExtendRentalCommand {
  rentalId: string;
  additionalDays: number;
}

/**
 * Result of extending a rental
 */
export interface ExtendRentalResult {
  rentalId: string;
  newEndDate: Date;
  additionalCost: number;
  newTotalCost: number;
  extensionDays: number;
}

/**
 * Handler for extending a rental period
 * Validates extension is allowed and calculates additional costs
 */
export class ExtendRentalCommandHandler {
  constructor(
    private readonly rentalRepository: RentalRepository,
    private readonly equipmentRepository: EquipmentRepository,
    private readonly memberRepository: MemberRepository,
    private readonly reservationRepository: ReservationRepository,
  ) {}

  async execute(command: ExtendRentalCommand): Promise<ExtendRentalResult> {
    // Validate input
    if (command.additionalDays <= 0) {
      throw new Error('Extension days must be positive');
    }

    // Parse rental ID
    const rentalId = RentalId.create(command.rentalId);

    // Load rental
    const rental = await this.rentalRepository.findById(rentalId);
    if (!rental) {
      throw new RentalNotFoundError(rentalId.value);
    }

    // Load equipment to get daily rate
    const equipment = await this.equipmentRepository.findById(rental.equipmentId);
    if (!equipment) {
      throw new EquipmentNotFoundError(rental.equipmentId.value);
    }

    // Load member to apply discount
    const member = await this.memberRepository.findById(rental.memberId);
    if (!member) {
      throw new MemberNotFoundError(rental.memberId.value);
    }

    // Calculate new period
    const currentPeriod = rental.period;
    const newEndDate = new Date(currentPeriod.end);
    newEndDate.setDate(newEndDate.getDate() + command.additionalDays);

    // Create extended period to check for conflicts
    const extendedPeriod = DateRange.create(
      new Date(currentPeriod.end.getTime() + 1), // Start from day after current end
      newEndDate,
    );

    // Check for conflicting reservations during the extension period
    const conflictingReservations = await this.reservationRepository.findConflicting(
      rental.equipmentId,
      extendedPeriod,
    );
    if (conflictingReservations.length > 0) {
      throw new Error(
        `Cannot extend rental: equipment is reserved during the extension period. ${conflictingReservations.length} conflicting reservation(s) found.`,
      );
    }

    // Validate total rental period doesn't exceed member's tier limits
    const totalDays = rental.getDurationDays() + command.additionalDays;
    const maxRentalDays = member.getMaxRentalDays();
    if (totalDays > maxRentalDays) {
      throw new Error(
        `Total rental period of ${totalDays} days would exceed member's maximum of ${maxRentalDays} days`,
      );
    }

    // Calculate additional cost with member discount
    const additionalBaseCost = equipment.calculateRentalCost(command.additionalDays);
    const additionalCost = member.applyDiscount(additionalBaseCost);

    // Extend the rental
    rental.extendPeriod(command.additionalDays, additionalCost);

    // Persist changes
    await this.rentalRepository.save(rental);

    // Note: We could publish a RentalExtended event here if defined
    // For now, we'll skip event publishing since RentalExtended event is not in the domain events

    return {
      rentalId: rental.id.value,
      newEndDate: rental.period.end,
      additionalCost: additionalCost.amount,
      newTotalCost: rental.totalCost.amount,
      extensionDays: command.additionalDays,
    };
  }
}
