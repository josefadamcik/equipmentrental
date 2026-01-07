import { DamageAssessment } from '../DamageAssessment.js';
import { DamageAssessmentId, EquipmentId, RentalId } from '../../value-objects/identifiers.js';
import { Money } from '../../value-objects/Money.js';
import { EquipmentCondition } from '../../types/EquipmentCondition.js';

describe('DamageAssessment Entity', () => {
  describe('create', () => {
    it('should create damage assessment with valid properties', () => {
      const rentalId = RentalId.generate();
      const equipmentId = EquipmentId.generate();

      const assessment = DamageAssessment.create({
        rentalId,
        equipmentId,
        conditionBefore: EquipmentCondition.EXCELLENT,
        conditionAfter: EquipmentCondition.GOOD,
        notes: 'Minor scratches on surface',
        assessedBy: 'John Doe',
      });

      expect(assessment.rentalId).toBe(rentalId);
      expect(assessment.equipmentId).toBe(equipmentId);
      expect(assessment.conditionBefore).toBe(EquipmentCondition.EXCELLENT);
      expect(assessment.conditionAfter).toBe(EquipmentCondition.GOOD);
      expect(assessment.notes).toBe('Minor scratches on surface');
      expect(assessment.assessedBy).toBe('John Doe');
      expect(assessment.assessedAt).toBeInstanceOf(Date);
      expect(assessment.damageFee.equals(Money.dollars(50))).toBe(true); // 1 level degradation
    });

    it('should throw error if assessor name is empty', () => {
      expect(() =>
        DamageAssessment.create({
          rentalId: RentalId.generate(),
          equipmentId: EquipmentId.generate(),
          conditionBefore: EquipmentCondition.EXCELLENT,
          conditionAfter: EquipmentCondition.GOOD,
          notes: 'Some notes',
          assessedBy: '',
        }),
      ).toThrow('Assessor name cannot be empty');
    });

    it('should throw error if assessor name is whitespace', () => {
      expect(() =>
        DamageAssessment.create({
          rentalId: RentalId.generate(),
          equipmentId: EquipmentId.generate(),
          conditionBefore: EquipmentCondition.EXCELLENT,
          conditionAfter: EquipmentCondition.GOOD,
          notes: 'Some notes',
          assessedBy: '   ',
        }),
      ).toThrow('Assessor name cannot be empty');
    });

    it('should calculate zero damage fee when condition stays the same', () => {
      const assessment = DamageAssessment.create({
        rentalId: RentalId.generate(),
        equipmentId: EquipmentId.generate(),
        conditionBefore: EquipmentCondition.GOOD,
        conditionAfter: EquipmentCondition.GOOD,
        notes: 'No change in condition',
        assessedBy: 'John Doe',
      });

      expect(assessment.damageFee.equals(Money.zero())).toBe(true);
    });

    it('should calculate zero damage fee when condition improves', () => {
      const assessment = DamageAssessment.create({
        rentalId: RentalId.generate(),
        equipmentId: EquipmentId.generate(),
        conditionBefore: EquipmentCondition.GOOD,
        conditionAfter: EquipmentCondition.EXCELLENT,
        notes: 'Equipment was cleaned and polished',
        assessedBy: 'John Doe',
      });

      expect(assessment.damageFee.equals(Money.zero())).toBe(true);
    });

    it('should calculate $50 fee for 1 level degradation', () => {
      const assessment = DamageAssessment.create({
        rentalId: RentalId.generate(),
        equipmentId: EquipmentId.generate(),
        conditionBefore: EquipmentCondition.EXCELLENT,
        conditionAfter: EquipmentCondition.GOOD,
        notes: 'Minor wear',
        assessedBy: 'John Doe',
      });

      expect(assessment.damageFee.equals(Money.dollars(50))).toBe(true);
    });

    it('should calculate $150 fee for 2 level degradation', () => {
      const assessment = DamageAssessment.create({
        rentalId: RentalId.generate(),
        equipmentId: EquipmentId.generate(),
        conditionBefore: EquipmentCondition.EXCELLENT,
        conditionAfter: EquipmentCondition.FAIR,
        notes: 'Moderate damage',
        assessedBy: 'John Doe',
      });

      expect(assessment.damageFee.equals(Money.dollars(150))).toBe(true);
    });

    it('should calculate $300 fee for 3 level degradation', () => {
      const assessment = DamageAssessment.create({
        rentalId: RentalId.generate(),
        equipmentId: EquipmentId.generate(),
        conditionBefore: EquipmentCondition.EXCELLENT,
        conditionAfter: EquipmentCondition.POOR,
        notes: 'Significant damage',
        assessedBy: 'John Doe',
      });

      expect(assessment.damageFee.equals(Money.dollars(300))).toBe(true);
    });

    it('should calculate $500 fee for 4 level degradation', () => {
      const assessment = DamageAssessment.create({
        rentalId: RentalId.generate(),
        equipmentId: EquipmentId.generate(),
        conditionBefore: EquipmentCondition.EXCELLENT,
        conditionAfter: EquipmentCondition.DAMAGED,
        notes: 'Severe damage',
        assessedBy: 'John Doe',
      });

      expect(assessment.damageFee.equals(Money.dollars(500))).toBe(true);
    });

    it('should calculate $500 fee for 5 level degradation', () => {
      const assessment = DamageAssessment.create({
        rentalId: RentalId.generate(),
        equipmentId: EquipmentId.generate(),
        conditionBefore: EquipmentCondition.EXCELLENT,
        conditionAfter: EquipmentCondition.UNDER_REPAIR,
        notes: 'Equipment needs major repair',
        assessedBy: 'John Doe',
      });

      expect(assessment.damageFee.equals(Money.dollars(500))).toBe(true);
    });

    it('should calculate correct fee for various degradation levels', () => {
      // GOOD to FAIR (1 level)
      let assessment = DamageAssessment.create({
        rentalId: RentalId.generate(),
        equipmentId: EquipmentId.generate(),
        conditionBefore: EquipmentCondition.GOOD,
        conditionAfter: EquipmentCondition.FAIR,
        notes: 'Test',
        assessedBy: 'John Doe',
      });
      expect(assessment.damageFee.equals(Money.dollars(50))).toBe(true);

      // GOOD to POOR (2 levels)
      assessment = DamageAssessment.create({
        rentalId: RentalId.generate(),
        equipmentId: EquipmentId.generate(),
        conditionBefore: EquipmentCondition.GOOD,
        conditionAfter: EquipmentCondition.POOR,
        notes: 'Test',
        assessedBy: 'John Doe',
      });
      expect(assessment.damageFee.equals(Money.dollars(150))).toBe(true);

      // FAIR to DAMAGED (2 levels)
      assessment = DamageAssessment.create({
        rentalId: RentalId.generate(),
        equipmentId: EquipmentId.generate(),
        conditionBefore: EquipmentCondition.FAIR,
        conditionAfter: EquipmentCondition.DAMAGED,
        notes: 'Test',
        assessedBy: 'John Doe',
      });
      expect(assessment.damageFee.equals(Money.dollars(150))).toBe(true);

      // POOR to UNDER_REPAIR (2 levels)
      assessment = DamageAssessment.create({
        rentalId: RentalId.generate(),
        equipmentId: EquipmentId.generate(),
        conditionBefore: EquipmentCondition.POOR,
        conditionAfter: EquipmentCondition.UNDER_REPAIR,
        notes: 'Test',
        assessedBy: 'John Doe',
      });
      expect(assessment.damageFee.equals(Money.dollars(150))).toBe(true);
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute damage assessment from props', () => {
      const id = DamageAssessmentId.generate();
      const rentalId = RentalId.generate();
      const equipmentId = EquipmentId.generate();
      const damageFee = Money.dollars(150);
      const assessedAt = new Date();

      const assessment = DamageAssessment.reconstitute({
        id,
        rentalId,
        equipmentId,
        conditionBefore: EquipmentCondition.EXCELLENT,
        conditionAfter: EquipmentCondition.FAIR,
        notes: 'Moderate scratches',
        damageFee,
        assessedAt,
        assessedBy: 'Jane Smith',
      });

      expect(assessment.id).toBe(id);
      expect(assessment.rentalId).toBe(rentalId);
      expect(assessment.equipmentId).toBe(equipmentId);
      expect(assessment.conditionBefore).toBe(EquipmentCondition.EXCELLENT);
      expect(assessment.conditionAfter).toBe(EquipmentCondition.FAIR);
      expect(assessment.notes).toBe('Moderate scratches');
      expect(assessment.damageFee).toBe(damageFee);
      expect(assessment.assessedAt).toBe(assessedAt);
      expect(assessment.assessedBy).toBe('Jane Smith');
    });
  });

  describe('hasDamage', () => {
    it('should return true when damage fee is greater than zero', () => {
      const assessment = DamageAssessment.create({
        rentalId: RentalId.generate(),
        equipmentId: EquipmentId.generate(),
        conditionBefore: EquipmentCondition.EXCELLENT,
        conditionAfter: EquipmentCondition.GOOD,
        notes: 'Minor damage',
        assessedBy: 'John Doe',
      });

      expect(assessment.hasDamage()).toBe(true);
    });

    it('should return false when damage fee is zero', () => {
      const assessment = DamageAssessment.create({
        rentalId: RentalId.generate(),
        equipmentId: EquipmentId.generate(),
        conditionBefore: EquipmentCondition.GOOD,
        conditionAfter: EquipmentCondition.GOOD,
        notes: 'No damage',
        assessedBy: 'John Doe',
      });

      expect(assessment.hasDamage()).toBe(false);
    });
  });

  describe('hasConditionDegraded', () => {
    it('should return true when condition has degraded', () => {
      const assessment = DamageAssessment.create({
        rentalId: RentalId.generate(),
        equipmentId: EquipmentId.generate(),
        conditionBefore: EquipmentCondition.EXCELLENT,
        conditionAfter: EquipmentCondition.GOOD,
        notes: 'Some wear',
        assessedBy: 'John Doe',
      });

      expect(assessment.hasConditionDegraded()).toBe(true);
    });

    it('should return false when condition stayed the same', () => {
      const assessment = DamageAssessment.create({
        rentalId: RentalId.generate(),
        equipmentId: EquipmentId.generate(),
        conditionBefore: EquipmentCondition.GOOD,
        conditionAfter: EquipmentCondition.GOOD,
        notes: 'No change',
        assessedBy: 'John Doe',
      });

      expect(assessment.hasConditionDegraded()).toBe(false);
    });

    it('should return false when condition improved', () => {
      const assessment = DamageAssessment.create({
        rentalId: RentalId.generate(),
        equipmentId: EquipmentId.generate(),
        conditionBefore: EquipmentCondition.FAIR,
        conditionAfter: EquipmentCondition.GOOD,
        notes: 'Equipment cleaned',
        assessedBy: 'John Doe',
      });

      expect(assessment.hasConditionDegraded()).toBe(false);
    });
  });

  describe('getDegradationLevels', () => {
    it('should return 0 when condition stayed the same', () => {
      const assessment = DamageAssessment.create({
        rentalId: RentalId.generate(),
        equipmentId: EquipmentId.generate(),
        conditionBefore: EquipmentCondition.GOOD,
        conditionAfter: EquipmentCondition.GOOD,
        notes: 'No change',
        assessedBy: 'John Doe',
      });

      expect(assessment.getDegradationLevels()).toBe(0);
    });

    it('should return 0 when condition improved', () => {
      const assessment = DamageAssessment.create({
        rentalId: RentalId.generate(),
        equipmentId: EquipmentId.generate(),
        conditionBefore: EquipmentCondition.FAIR,
        conditionAfter: EquipmentCondition.EXCELLENT,
        notes: 'Restored',
        assessedBy: 'John Doe',
      });

      expect(assessment.getDegradationLevels()).toBe(0);
    });

    it('should return 1 for one level degradation', () => {
      const assessment = DamageAssessment.create({
        rentalId: RentalId.generate(),
        equipmentId: EquipmentId.generate(),
        conditionBefore: EquipmentCondition.EXCELLENT,
        conditionAfter: EquipmentCondition.GOOD,
        notes: 'Minor wear',
        assessedBy: 'John Doe',
      });

      expect(assessment.getDegradationLevels()).toBe(1);
    });

    it('should return 2 for two level degradation', () => {
      const assessment = DamageAssessment.create({
        rentalId: RentalId.generate(),
        equipmentId: EquipmentId.generate(),
        conditionBefore: EquipmentCondition.EXCELLENT,
        conditionAfter: EquipmentCondition.FAIR,
        notes: 'Moderate damage',
        assessedBy: 'John Doe',
      });

      expect(assessment.getDegradationLevels()).toBe(2);
    });

    it('should return 3 for three level degradation', () => {
      const assessment = DamageAssessment.create({
        rentalId: RentalId.generate(),
        equipmentId: EquipmentId.generate(),
        conditionBefore: EquipmentCondition.GOOD,
        conditionAfter: EquipmentCondition.DAMAGED,
        notes: 'Significant damage',
        assessedBy: 'John Doe',
      });

      expect(assessment.getDegradationLevels()).toBe(3);
    });

    it('should return 5 for maximum degradation', () => {
      const assessment = DamageAssessment.create({
        rentalId: RentalId.generate(),
        equipmentId: EquipmentId.generate(),
        conditionBefore: EquipmentCondition.EXCELLENT,
        conditionAfter: EquipmentCondition.UNDER_REPAIR,
        notes: 'Severe damage requiring repair',
        assessedBy: 'John Doe',
      });

      expect(assessment.getDegradationLevels()).toBe(5);
    });
  });

  describe('updateNotes', () => {
    it('should update assessment notes', () => {
      const assessment = DamageAssessment.create({
        rentalId: RentalId.generate(),
        equipmentId: EquipmentId.generate(),
        conditionBefore: EquipmentCondition.EXCELLENT,
        conditionAfter: EquipmentCondition.GOOD,
        notes: 'Initial notes',
        assessedBy: 'John Doe',
      });

      expect(assessment.notes).toBe('Initial notes');

      assessment.updateNotes('Updated notes with more details');

      expect(assessment.notes).toBe('Updated notes with more details');
    });

    it('should allow empty notes', () => {
      const assessment = DamageAssessment.create({
        rentalId: RentalId.generate(),
        equipmentId: EquipmentId.generate(),
        conditionBefore: EquipmentCondition.EXCELLENT,
        conditionAfter: EquipmentCondition.GOOD,
        notes: 'Original notes',
        assessedBy: 'John Doe',
      });

      assessment.updateNotes('');

      expect(assessment.notes).toBe('');
    });
  });

  describe('toSnapshot', () => {
    it('should return a copy of assessment props', () => {
      const id = DamageAssessmentId.generate();
      const rentalId = RentalId.generate();
      const equipmentId = EquipmentId.generate();
      const damageFee = Money.dollars(150);
      const assessedAt = new Date();

      const assessment = DamageAssessment.reconstitute({
        id,
        rentalId,
        equipmentId,
        conditionBefore: EquipmentCondition.EXCELLENT,
        conditionAfter: EquipmentCondition.FAIR,
        notes: 'Test notes',
        damageFee,
        assessedAt,
        assessedBy: 'John Doe',
      });

      const snapshot = assessment.toSnapshot();

      expect(snapshot.id).toBe(id);
      expect(snapshot.rentalId).toBe(rentalId);
      expect(snapshot.equipmentId).toBe(equipmentId);
      expect(snapshot.conditionBefore).toBe(EquipmentCondition.EXCELLENT);
      expect(snapshot.conditionAfter).toBe(EquipmentCondition.FAIR);
      expect(snapshot.notes).toBe('Test notes');
      expect(snapshot.damageFee).toBe(damageFee);
      expect(snapshot.assessedAt).toBe(assessedAt);
      expect(snapshot.assessedBy).toBe('John Doe');
    });
  });

  describe('edge cases and comprehensive fee calculation', () => {
    it('should handle all possible condition transitions correctly', () => {
      const conditions = [
        EquipmentCondition.EXCELLENT,
        EquipmentCondition.GOOD,
        EquipmentCondition.FAIR,
        EquipmentCondition.POOR,
        EquipmentCondition.DAMAGED,
        EquipmentCondition.UNDER_REPAIR,
      ];

      const expectedFees = [
        [0, 0, 0, 0, 0, 0], // From EXCELLENT
        [50, 0, 0, 0, 0, 0], // From GOOD
        [150, 50, 0, 0, 0, 0], // From FAIR
        [300, 150, 50, 0, 0, 0], // From POOR
        [500, 300, 150, 50, 0, 0], // From DAMAGED
        [500, 500, 300, 150, 50, 0], // From UNDER_REPAIR
      ];

      for (let beforeIdx = 0; beforeIdx < conditions.length; beforeIdx++) {
        for (let afterIdx = 0; afterIdx < conditions.length; afterIdx++) {
          const assessment = DamageAssessment.create({
            rentalId: RentalId.generate(),
            equipmentId: EquipmentId.generate(),
            conditionBefore: conditions[beforeIdx],
            conditionAfter: conditions[afterIdx],
            notes: `${conditions[beforeIdx]} -> ${conditions[afterIdx]}`,
            assessedBy: 'Test Assessor',
          });

          const expectedFee = expectedFees[afterIdx][beforeIdx];
          expect(assessment.damageFee.equals(Money.dollars(expectedFee))).toBe(true);
        }
      }
    });
  });
});
