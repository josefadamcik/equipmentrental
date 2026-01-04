import { describe, it, expect, beforeEach } from '@jest/globals';
import { EquipmentDamaged } from '../EquipmentEvents';
import { EquipmentId, DamageAssessmentId, RentalId } from '../../value-objects/identifiers';
import { EquipmentCondition } from '../../types/EquipmentCondition';
import { Money } from '../../value-objects/Money';

describe('EquipmentEvents', () => {
  let equipmentId: EquipmentId;
  let damageAssessmentId: DamageAssessmentId;
  let rentalId: RentalId;

  beforeEach(() => {
    equipmentId = EquipmentId.generate();
    damageAssessmentId = DamageAssessmentId.generate();
    rentalId = RentalId.generate();
  });

  describe('EquipmentDamaged', () => {
    it('should create event with correct properties', () => {
      const previousCondition = EquipmentCondition.EXCELLENT;
      const newCondition = EquipmentCondition.GOOD;
      const damageDescription = 'Minor scratches on surface';
      const repairCost = Money.dollars(50);

      const event = EquipmentDamaged.create(
        equipmentId,
        damageAssessmentId,
        rentalId,
        previousCondition,
        newCondition,
        damageDescription,
        repairCost,
      );

      expect(event.eventType).toBe('EquipmentDamaged');
      expect(event.eventId).toBeDefined();
      expect(event.occurredAt).toBeInstanceOf(Date);
      expect(event.aggregateId).toBe(equipmentId.value);
      expect(event.equipmentId).toBe(equipmentId);
      expect(event.damageAssessmentId).toBe(damageAssessmentId);
      expect(event.rentalId).toBe(rentalId);
      expect(event.previousCondition).toBe(previousCondition);
      expect(event.newCondition).toBe(newCondition);
      expect(event.damageDescription).toBe(damageDescription);
      expect(event.repairCost).toBe(repairCost);
    });

    it('should handle minor damage', () => {
      const event = EquipmentDamaged.create(
        equipmentId,
        damageAssessmentId,
        rentalId,
        EquipmentCondition.EXCELLENT,
        EquipmentCondition.GOOD,
        'Light scratches',
        Money.dollars(25),
      );

      expect(event.previousCondition).toBe(EquipmentCondition.EXCELLENT);
      expect(event.newCondition).toBe(EquipmentCondition.GOOD);
      expect(event.repairCost.equals(Money.dollars(25))).toBe(true);
    });

    it('should handle moderate damage', () => {
      const event = EquipmentDamaged.create(
        equipmentId,
        damageAssessmentId,
        rentalId,
        EquipmentCondition.GOOD,
        EquipmentCondition.FAIR,
        'Dents and scratches',
        Money.dollars(150),
      );

      expect(event.previousCondition).toBe(EquipmentCondition.GOOD);
      expect(event.newCondition).toBe(EquipmentCondition.FAIR);
      expect(event.repairCost.equals(Money.dollars(150))).toBe(true);
    });

    it('should handle severe damage', () => {
      const event = EquipmentDamaged.create(
        equipmentId,
        damageAssessmentId,
        rentalId,
        EquipmentCondition.FAIR,
        EquipmentCondition.POOR,
        'Broken components, major repairs needed',
        Money.dollars(500),
      );

      expect(event.previousCondition).toBe(EquipmentCondition.FAIR);
      expect(event.newCondition).toBe(EquipmentCondition.POOR);
      expect(event.repairCost.equals(Money.dollars(500))).toBe(true);
    });

    it('should handle critical damage', () => {
      const event = EquipmentDamaged.create(
        equipmentId,
        damageAssessmentId,
        rentalId,
        EquipmentCondition.POOR,
        EquipmentCondition.DAMAGED,
        'Equipment beyond repair, needs major work',
        Money.dollars(2000),
      );

      expect(event.previousCondition).toBe(EquipmentCondition.POOR);
      expect(event.newCondition).toBe(EquipmentCondition.DAMAGED);
      expect(event.repairCost.equals(Money.dollars(2000))).toBe(true);
    });

    it('should handle zero repair cost for assessment only', () => {
      const event = EquipmentDamaged.create(
        equipmentId,
        damageAssessmentId,
        rentalId,
        EquipmentCondition.EXCELLENT,
        EquipmentCondition.EXCELLENT,
        'No damage found upon inspection',
        Money.zero(),
      );

      expect(event.repairCost.equals(Money.zero())).toBe(true);
    });

    it('should preserve detailed damage descriptions', () => {
      const detailedDescription = 'Deep scratch on left side panel (3 inches), dent on top corner (1 inch diameter), missing protective cap';

      const event = EquipmentDamaged.create(
        equipmentId,
        damageAssessmentId,
        rentalId,
        EquipmentCondition.GOOD,
        EquipmentCondition.FAIR,
        detailedDescription,
        Money.dollars(200),
      );

      expect(event.damageDescription).toBe(detailedDescription);
    });

    it('should generate unique event IDs', () => {
      const event1 = EquipmentDamaged.create(
        equipmentId,
        damageAssessmentId,
        rentalId,
        EquipmentCondition.EXCELLENT,
        EquipmentCondition.GOOD,
        'Damage 1',
        Money.dollars(50),
      );
      const event2 = EquipmentDamaged.create(
        equipmentId,
        damageAssessmentId,
        rentalId,
        EquipmentCondition.EXCELLENT,
        EquipmentCondition.GOOD,
        'Damage 2',
        Money.dollars(50),
      );

      expect(event1.eventId).not.toBe(event2.eventId);
    });

    it('should set occurredAt to current time', () => {
      const before = new Date();
      const event = EquipmentDamaged.create(
        equipmentId,
        damageAssessmentId,
        rentalId,
        EquipmentCondition.EXCELLENT,
        EquipmentCondition.GOOD,
        'Test damage',
        Money.dollars(50),
      );
      const after = new Date();

      expect(event.occurredAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(event.occurredAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should implement DomainEvent interface', () => {
      const event = EquipmentDamaged.create(
        equipmentId,
        damageAssessmentId,
        rentalId,
        EquipmentCondition.EXCELLENT,
        EquipmentCondition.GOOD,
        'Test damage',
        Money.dollars(50),
      );

      expect(event.eventId).toBeDefined();
      expect(event.occurredAt).toBeInstanceOf(Date);
      expect(event.eventType).toBeDefined();
      expect(event.aggregateId).toBeDefined();
    });

    it('should track condition transitions correctly', () => {
      const transitions = [
        { from: EquipmentCondition.EXCELLENT, to: EquipmentCondition.GOOD },
        { from: EquipmentCondition.GOOD, to: EquipmentCondition.FAIR },
        { from: EquipmentCondition.FAIR, to: EquipmentCondition.POOR },
        { from: EquipmentCondition.POOR, to: EquipmentCondition.DAMAGED },
      ];

      transitions.forEach(({ from, to }) => {
        const event = EquipmentDamaged.create(
          equipmentId,
          damageAssessmentId,
          rentalId,
          from,
          to,
          `Transition from ${from} to ${to}`,
          Money.dollars(100),
        );

        expect(event.previousCondition).toBe(from);
        expect(event.newCondition).toBe(to);
      });
    });
  });
});
