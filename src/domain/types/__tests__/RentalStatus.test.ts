import { RentalStatus } from '../RentalStatus.js';

describe('RentalStatus', () => {
  describe('isActive', () => {
    it('should return true for ACTIVE status', () => {
      expect(RentalStatus.isActive(RentalStatus.ACTIVE)).toBe(true);
    });

    it('should return true for OVERDUE status', () => {
      expect(RentalStatus.isActive(RentalStatus.OVERDUE)).toBe(true);
    });

    it('should return false for RESERVED status', () => {
      expect(RentalStatus.isActive(RentalStatus.RESERVED)).toBe(false);
    });

    it('should return false for RETURNED status', () => {
      expect(RentalStatus.isActive(RentalStatus.RETURNED)).toBe(false);
    });

    it('should return false for CANCELLED status', () => {
      expect(RentalStatus.isActive(RentalStatus.CANCELLED)).toBe(false);
    });
  });

  describe('isCompleted', () => {
    it('should return true for RETURNED status', () => {
      expect(RentalStatus.isCompleted(RentalStatus.RETURNED)).toBe(true);
    });

    it('should return true for CANCELLED status', () => {
      expect(RentalStatus.isCompleted(RentalStatus.CANCELLED)).toBe(true);
    });

    it('should return false for RESERVED status', () => {
      expect(RentalStatus.isCompleted(RentalStatus.RESERVED)).toBe(false);
    });

    it('should return false for ACTIVE status', () => {
      expect(RentalStatus.isCompleted(RentalStatus.ACTIVE)).toBe(false);
    });

    it('should return false for OVERDUE status', () => {
      expect(RentalStatus.isCompleted(RentalStatus.OVERDUE)).toBe(false);
    });
  });

  describe('isInPossession', () => {
    it('should return true for ACTIVE status', () => {
      expect(RentalStatus.isInPossession(RentalStatus.ACTIVE)).toBe(true);
    });

    it('should return true for OVERDUE status', () => {
      expect(RentalStatus.isInPossession(RentalStatus.OVERDUE)).toBe(true);
    });

    it('should return false for RESERVED status', () => {
      expect(RentalStatus.isInPossession(RentalStatus.RESERVED)).toBe(false);
    });

    it('should return false for RETURNED status', () => {
      expect(RentalStatus.isInPossession(RentalStatus.RETURNED)).toBe(false);
    });

    it('should return false for CANCELLED status', () => {
      expect(RentalStatus.isInPossession(RentalStatus.CANCELLED)).toBe(false);
    });
  });

  describe('values', () => {
    it('should return all status values', () => {
      const values = RentalStatus.values();

      expect(values).toContain(RentalStatus.RESERVED);
      expect(values).toContain(RentalStatus.ACTIVE);
      expect(values).toContain(RentalStatus.OVERDUE);
      expect(values).toContain(RentalStatus.RETURNED);
      expect(values).toContain(RentalStatus.CANCELLED);
      expect(values.length).toBe(5);
    });
  });
});
