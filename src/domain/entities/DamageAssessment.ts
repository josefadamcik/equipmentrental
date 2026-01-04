import { DamageAssessmentId, EquipmentId, RentalId } from '../value-objects/identifiers.js';
import { Money } from '../value-objects/Money.js';
import { EquipmentCondition } from '../types/EquipmentCondition.js';

export interface DamageAssessmentProps {
  id: DamageAssessmentId;
  rentalId: RentalId;
  equipmentId: EquipmentId;
  conditionBefore: EquipmentCondition;
  conditionAfter: EquipmentCondition;
  notes: string;
  damageFee: Money;
  assessedAt: Date;
  assessedBy: string;
}

/**
 * DamageAssessment entity for evaluating equipment condition on return
 */
export class DamageAssessment {
  private constructor(private props: DamageAssessmentProps) {}

  static create(props: {
    rentalId: RentalId;
    equipmentId: EquipmentId;
    conditionBefore: EquipmentCondition;
    conditionAfter: EquipmentCondition;
    notes: string;
    assessedBy: string;
  }): DamageAssessment {
    if (!props.assessedBy || props.assessedBy.trim().length === 0) {
      throw new Error('Assessor name cannot be empty');
    }

    const damageFee = DamageAssessment.calculateDamageFee(
      props.conditionBefore,
      props.conditionAfter,
    );

    return new DamageAssessment({
      id: DamageAssessmentId.generate(),
      rentalId: props.rentalId,
      equipmentId: props.equipmentId,
      conditionBefore: props.conditionBefore,
      conditionAfter: props.conditionAfter,
      notes: props.notes,
      damageFee,
      assessedAt: new Date(),
      assessedBy: props.assessedBy,
    });
  }

  static reconstitute(props: DamageAssessmentProps): DamageAssessment {
    return new DamageAssessment(props);
  }

  /**
   * Calculate damage fee based on condition change
   */
  private static calculateDamageFee(before: EquipmentCondition, after: EquipmentCondition): Money {
    const conditionOrder = [
      EquipmentCondition.EXCELLENT,
      EquipmentCondition.GOOD,
      EquipmentCondition.FAIR,
      EquipmentCondition.POOR,
      EquipmentCondition.DAMAGED,
      EquipmentCondition.UNDER_REPAIR,
    ];

    const beforeIndex = conditionOrder.indexOf(before);
    const afterIndex = conditionOrder.indexOf(after);

    // No fee if condition stayed the same or improved
    if (afterIndex <= beforeIndex) {
      return Money.zero();
    }

    // Calculate degradation levels
    const degradationLevels = afterIndex - beforeIndex;

    // Fee structure:
    // 1 level degradation: $50
    // 2 levels: $150
    // 3 levels: $300
    // 4+ levels: $500
    if (degradationLevels === 1) {
      return Money.dollars(50);
    } else if (degradationLevels === 2) {
      return Money.dollars(150);
    } else if (degradationLevels === 3) {
      return Money.dollars(300);
    } else {
      return Money.dollars(500);
    }
  }

  // Getters
  get id(): DamageAssessmentId {
    return this.props.id;
  }

  get rentalId(): RentalId {
    return this.props.rentalId;
  }

  get equipmentId(): EquipmentId {
    return this.props.equipmentId;
  }

  get conditionBefore(): EquipmentCondition {
    return this.props.conditionBefore;
  }

  get conditionAfter(): EquipmentCondition {
    return this.props.conditionAfter;
  }

  get notes(): string {
    return this.props.notes;
  }

  get damageFee(): Money {
    return this.props.damageFee;
  }

  get assessedAt(): Date {
    return this.props.assessedAt;
  }

  get assessedBy(): string {
    return this.props.assessedBy;
  }

  /**
   * Check if damage was detected
   */
  hasDamage(): boolean {
    return this.props.damageFee.amount > 0;
  }

  /**
   * Check if condition degraded
   */
  hasConditionDegraded(): boolean {
    const conditionOrder = [
      EquipmentCondition.EXCELLENT,
      EquipmentCondition.GOOD,
      EquipmentCondition.FAIR,
      EquipmentCondition.POOR,
      EquipmentCondition.DAMAGED,
      EquipmentCondition.UNDER_REPAIR,
    ];

    const beforeIndex = conditionOrder.indexOf(this.props.conditionBefore);
    const afterIndex = conditionOrder.indexOf(this.props.conditionAfter);

    return afterIndex > beforeIndex;
  }

  /**
   * Get degradation level count
   */
  getDegradationLevels(): number {
    const conditionOrder = [
      EquipmentCondition.EXCELLENT,
      EquipmentCondition.GOOD,
      EquipmentCondition.FAIR,
      EquipmentCondition.POOR,
      EquipmentCondition.DAMAGED,
      EquipmentCondition.UNDER_REPAIR,
    ];

    const beforeIndex = conditionOrder.indexOf(this.props.conditionBefore);
    const afterIndex = conditionOrder.indexOf(this.props.conditionAfter);

    return Math.max(0, afterIndex - beforeIndex);
  }

  /**
   * Update assessment notes
   */
  updateNotes(newNotes: string): void {
    this.props.notes = newNotes;
  }

  /**
   * Get assessment snapshot for persistence
   */
  toSnapshot(): DamageAssessmentProps {
    return { ...this.props };
  }
}
