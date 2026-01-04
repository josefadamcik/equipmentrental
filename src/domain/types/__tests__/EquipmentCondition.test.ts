import { EquipmentCondition } from '../EquipmentCondition.js';

describe('EquipmentCondition', () => {
  describe('isRentable', () => {
    it('should return true for EXCELLENT condition', () => {
      expect(EquipmentCondition.isRentable(EquipmentCondition.EXCELLENT)).toBe(true);
    });

    it('should return true for GOOD condition', () => {
      expect(EquipmentCondition.isRentable(EquipmentCondition.GOOD)).toBe(true);
    });

    it('should return true for FAIR condition', () => {
      expect(EquipmentCondition.isRentable(EquipmentCondition.FAIR)).toBe(true);
    });

    it('should return false for POOR condition', () => {
      expect(EquipmentCondition.isRentable(EquipmentCondition.POOR)).toBe(false);
    });

    it('should return false for DAMAGED condition', () => {
      expect(EquipmentCondition.isRentable(EquipmentCondition.DAMAGED)).toBe(false);
    });

    it('should return false for UNDER_REPAIR condition', () => {
      expect(EquipmentCondition.isRentable(EquipmentCondition.UNDER_REPAIR)).toBe(false);
    });
  });

  describe('needsRepair', () => {
    it('should return true for DAMAGED condition', () => {
      expect(EquipmentCondition.needsRepair(EquipmentCondition.DAMAGED)).toBe(true);
    });

    it('should return true for UNDER_REPAIR condition', () => {
      expect(EquipmentCondition.needsRepair(EquipmentCondition.UNDER_REPAIR)).toBe(true);
    });

    it('should return false for EXCELLENT condition', () => {
      expect(EquipmentCondition.needsRepair(EquipmentCondition.EXCELLENT)).toBe(false);
    });

    it('should return false for GOOD condition', () => {
      expect(EquipmentCondition.needsRepair(EquipmentCondition.GOOD)).toBe(false);
    });

    it('should return false for FAIR condition', () => {
      expect(EquipmentCondition.needsRepair(EquipmentCondition.FAIR)).toBe(false);
    });

    it('should return false for POOR condition', () => {
      expect(EquipmentCondition.needsRepair(EquipmentCondition.POOR)).toBe(false);
    });
  });

  describe('values', () => {
    it('should return all condition values', () => {
      const values = EquipmentCondition.values();

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
