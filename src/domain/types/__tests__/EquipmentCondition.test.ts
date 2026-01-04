import {
  EquipmentCondition,
  isRentable,
  needsRepair,
  getEquipmentConditionValues,
} from '../EquipmentCondition.js';

describe('EquipmentCondition', () => {
  describe('isRentable', () => {
    it('should return true for EXCELLENT condition', () => {
      expect(isRentable(EquipmentCondition.EXCELLENT)).toBe(true);
    });

    it('should return true for GOOD condition', () => {
      expect(isRentable(EquipmentCondition.GOOD)).toBe(true);
    });

    it('should return true for FAIR condition', () => {
      expect(isRentable(EquipmentCondition.FAIR)).toBe(true);
    });

    it('should return false for POOR condition', () => {
      expect(isRentable(EquipmentCondition.POOR)).toBe(false);
    });

    it('should return false for DAMAGED condition', () => {
      expect(isRentable(EquipmentCondition.DAMAGED)).toBe(false);
    });

    it('should return false for UNDER_REPAIR condition', () => {
      expect(isRentable(EquipmentCondition.UNDER_REPAIR)).toBe(false);
    });
  });

  describe('needsRepair', () => {
    it('should return true for DAMAGED condition', () => {
      expect(needsRepair(EquipmentCondition.DAMAGED)).toBe(true);
    });

    it('should return true for UNDER_REPAIR condition', () => {
      expect(needsRepair(EquipmentCondition.UNDER_REPAIR)).toBe(true);
    });

    it('should return false for EXCELLENT condition', () => {
      expect(needsRepair(EquipmentCondition.EXCELLENT)).toBe(false);
    });

    it('should return false for GOOD condition', () => {
      expect(needsRepair(EquipmentCondition.GOOD)).toBe(false);
    });

    it('should return false for FAIR condition', () => {
      expect(needsRepair(EquipmentCondition.FAIR)).toBe(false);
    });

    it('should return false for POOR condition', () => {
      expect(needsRepair(EquipmentCondition.POOR)).toBe(false);
    });
  });

  describe('getEquipmentConditionValues', () => {
    it('should return all condition values', () => {
      const values = getEquipmentConditionValues();

      expect(values).toContain(EquipmentCondition.EXCELLENT);
      expect(values).toContain(EquipmentCondition.GOOD);
      expect(values).toContain(EquipmentCondition.FAIR);
      expect(values).toContain(EquipmentCondition.POOR);
      expect(values).toContain(EquipmentCondition.DAMAGED);
      expect(values).toContain(EquipmentCondition.UNDER_REPAIR);
      expect(values.length).toBe(6);
    });
  });
});
