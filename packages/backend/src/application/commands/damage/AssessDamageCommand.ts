import { RentalId, EquipmentId } from '../../../domain/value-objects/identifiers.js';
import { EquipmentCondition } from '../../../domain/types/EquipmentCondition.js';
import { RentalRepository } from '../../../domain/ports/RentalRepository.js';
import { EquipmentRepository } from '../../../domain/ports/EquipmentRepository.js';
import { DamageAssessment } from '../../../domain/entities/DamageAssessment.js';
import { RentalNotFoundError } from '../../../domain/exceptions/RentalExceptions.js';
import { EquipmentNotFoundError } from '../../../domain/exceptions/EquipmentExceptions.js';

/**
 * Command to assess damage on returned equipment
 */
export interface AssessDamageCommand {
  rentalId: string;
  equipmentId: string;
  conditionAfter: EquipmentCondition;
  notes: string;
  assessedBy: string;
}

/**
 * Result of damage assessment
 */
export interface AssessDamageResult {
  assessmentId: string;
  rentalId: string;
  equipmentId: string;
  conditionBefore: EquipmentCondition;
  conditionAfter: EquipmentCondition;
  damageFee: number;
  hasDamage: boolean;
  degradationLevels: number;
  notes: string;
  assessedAt: Date;
  assessedBy: string;
}

/**
 * Handler for assessing damage on equipment
 * Creates a damage assessment record for returned rentals
 */
export class AssessDamageCommandHandler {
  constructor(
    private readonly rentalRepository: RentalRepository,
    private readonly equipmentRepository: EquipmentRepository,
  ) {}

  async execute(command: AssessDamageCommand): Promise<AssessDamageResult> {
    // Parse identifiers
    const rentalId = RentalId.create(command.rentalId);
    const equipmentId = EquipmentId.create(command.equipmentId);

    // Load rental
    const rental = await this.rentalRepository.findById(rentalId);
    if (!rental) {
      throw new RentalNotFoundError(rentalId.value);
    }

    // Validate rental has been returned
    if (!rental.returnedAt) {
      throw new Error('Cannot assess damage on rental that has not been returned');
    }

    // Load equipment
    const equipment = await this.equipmentRepository.findById(equipmentId);
    if (!equipment) {
      throw new EquipmentNotFoundError(equipmentId.value);
    }

    // Validate equipment matches rental
    if (rental.equipmentId.value !== equipmentId.value) {
      throw new Error(
        `Equipment ID ${equipmentId.value} does not match rental's equipment ID ${rental.equipmentId.value}`,
      );
    }

    // Create damage assessment
    const assessment = DamageAssessment.create({
      rentalId,
      equipmentId,
      conditionBefore: rental.conditionAtStart,
      conditionAfter: command.conditionAfter,
      notes: command.notes,
      assessedBy: command.assessedBy,
    });

    // Note: In a real system, we would persist this assessment to a DamageAssessmentRepository
    // For now, we're just creating it and returning the result

    return {
      assessmentId: assessment.id.value,
      rentalId: rentalId.value,
      equipmentId: equipmentId.value,
      conditionBefore: assessment.conditionBefore,
      conditionAfter: assessment.conditionAfter,
      damageFee: assessment.damageFee.amount,
      hasDamage: assessment.hasDamage(),
      degradationLevels: assessment.getDegradationLevels(),
      notes: assessment.notes,
      assessedAt: assessment.assessedAt,
      assessedBy: assessment.assessedBy,
    };
  }
}
