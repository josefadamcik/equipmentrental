import { RentalId } from '../../../domain/value-objects/identifiers.js';
import { EquipmentCondition } from '../../../domain/types/EquipmentCondition.js';
import { EquipmentRepository } from '../../../domain/ports/EquipmentRepository.js';
import { MemberRepository } from '../../../domain/ports/MemberRepository.js';
import { RentalRepository } from '../../../domain/ports/RentalRepository.js';
import { EventPublisher } from '../../../domain/ports/EventPublisher.js';
import { RentalReturned } from '../../../domain/events/RentalEvents.js';
import { RentalNotFoundError } from '../../../domain/exceptions/RentalExceptions.js';
import { EquipmentNotFoundError } from '../../../domain/exceptions/EquipmentExceptions.js';
import { MemberNotFoundError } from '../../../domain/exceptions/MemberExceptions.js';

/**
 * Command to return a rental
 */
export interface ReturnRentalCommand {
  rentalId: string;
  conditionAtReturn: EquipmentCondition;
  notes?: string;
}

/**
 * Result of returning a rental
 */
export interface ReturnRentalResult {
  rentalId: string;
  returnedAt: Date;
  totalCost: number;
  lateFees: number;
  damageFees: number;
  wasLate: boolean;
  conditionChanged: boolean;
}

/**
 * Handler for returning a rental
 * Manages the complete return process including late fees and damage assessment
 */
export class ReturnRentalCommandHandler {
  constructor(
    private readonly rentalRepository: RentalRepository,
    private readonly equipmentRepository: EquipmentRepository,
    private readonly memberRepository: MemberRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(command: ReturnRentalCommand): Promise<ReturnRentalResult> {
    // Parse rental ID
    const rentalId = RentalId.create(command.rentalId);

    // Load rental
    const rental = await this.rentalRepository.findById(rentalId);
    if (!rental) {
      throw new RentalNotFoundError(rentalId.value);
    }

    // Load equipment
    const equipment = await this.equipmentRepository.findById(rental.equipmentId);
    if (!equipment) {
      throw new EquipmentNotFoundError(rental.equipmentId.value);
    }

    // Load member
    const member = await this.memberRepository.findById(rental.memberId);
    if (!member) {
      throw new MemberNotFoundError(rental.memberId.value);
    }

    // Calculate damage fee based on condition change
    const damageFee = rental.calculateDamageFee(command.conditionAtReturn);

    // Return the rental (this handles late fee calculation internally)
    const now = new Date();
    const wasLate = rental.isOverdue(now);
    rental.returnRental(command.conditionAtReturn, damageFee, now);

    // Update equipment status and condition
    equipment.markAsReturned(command.conditionAtReturn);

    // Decrement member's active rental count
    member.decrementActiveRentals();

    // Persist changes
    await this.rentalRepository.save(rental);
    await this.equipmentRepository.save(equipment);
    await this.memberRepository.save(member);

    // Publish domain event
    const event = RentalReturned.create(
      rental.id,
      rental.returnedAt!,
      rental.lateFee,
      rental.totalCost,
    );
    await this.eventPublisher.publish(event);

    return {
      rentalId: rental.id.value,
      returnedAt: rental.returnedAt!,
      totalCost: rental.totalCost.amount,
      lateFees: rental.lateFee.amount,
      damageFees: damageFee.amount,
      wasLate,
      conditionChanged: rental.conditionAtStart !== command.conditionAtReturn,
    };
  }
}
