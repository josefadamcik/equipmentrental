import { DomainEvent } from './DomainEvent';
import { EquipmentId } from '../value-objects/identifiers';
import { DamageAssessmentId } from '../value-objects/identifiers';
import { RentalId } from '../value-objects/identifiers';
import type { EquipmentCondition } from '../types/EquipmentCondition';
import { Money } from '../value-objects/Money';

/**
 * Event emitted when equipment is damaged
 */
export class EquipmentDamaged implements DomainEvent {
  readonly eventType = 'EquipmentDamaged';

  constructor(
    public readonly eventId: string,
    public readonly occurredAt: Date,
    public readonly aggregateId: string,
    public readonly equipmentId: EquipmentId,
    public readonly damageAssessmentId: DamageAssessmentId,
    public readonly rentalId: RentalId,
    public readonly previousCondition: EquipmentCondition,
    public readonly newCondition: EquipmentCondition,
    public readonly damageDescription: string,
    public readonly repairCost: Money,
  ) {}

  static create(
    equipmentId: EquipmentId,
    damageAssessmentId: DamageAssessmentId,
    rentalId: RentalId,
    previousCondition: EquipmentCondition,
    newCondition: EquipmentCondition,
    damageDescription: string,
    repairCost: Money,
  ): EquipmentDamaged {
    return new EquipmentDamaged(
      crypto.randomUUID(),
      new Date(),
      equipmentId.value,
      equipmentId,
      damageAssessmentId,
      rentalId,
      previousCondition,
      newCondition,
      damageDescription,
      repairCost,
    );
  }
}
