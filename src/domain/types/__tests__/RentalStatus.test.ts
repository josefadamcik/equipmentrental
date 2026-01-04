import { RentalStatus, isActive, isCompleted, isInPossession, getRentalStatusValues } from '../RentalStatus.js';

describe('RentalStatus', () => {
  describe('isActive', () => {
    it('should return true for ACTIVE status', () => {
      expect(isActive(RentalStatus.ACTIVE)).toBe(true);
    });

    it('should return true for OVERDUE status', () => {
      expect(isActive(RentalStatus.OVERDUE)).toBe(true);
    });

    it('should return false for RESERVED status', () => {
      expect(isActive(RentalStatus.RESERVED)).toBe(false);
    });

    it('should return false for RETURNED status', () => {
      expect(isActive(RentalStatus.RETURNED)).toBe(false);
    });

    it('should return false for CANCELLED status', () => {
      expect(isActive(RentalStatus.CANCELLED)).toBe(false);
    });
  });

  describe('isCompleted', () => {
    it('should return true for RETURNED status', () => {
      expect(isCompleted(RentalStatus.RETURNED)).toBe(true);
    });

    it('should return true for CANCELLED status', () => {
      expect(isCompleted(RentalStatus.CANCELLED)).toBe(true);
    });

    it('should return false for RESERVED status', () => {
      expect(isCompleted(RentalStatus.RESERVED)).toBe(false);
    });

    it('should return false for ACTIVE status', () => {
      expect(isCompleted(RentalStatus.ACTIVE)).toBe(false);
    });

    it('should return false for OVERDUE status', () => {
      expect(isCompleted(RentalStatus.OVERDUE)).toBe(false);
    });
  });

  describe('isInPossession', () => {
    it('should return true for ACTIVE status', () => {
      expect(isInPossession(RentalStatus.ACTIVE)).toBe(true);
    });

    it('should return true for OVERDUE status', () => {
      expect(isInPossession(RentalStatus.OVERDUE)).toBe(true);
    });

    it('should return false for RESERVED status', () => {
      expect(isInPossession(RentalStatus.RESERVED)).toBe(false);
    });

    it('should return false for RETURNED status', () => {
      expect(isInPossession(RentalStatus.RETURNED)).toBe(false);
    });

    it('should return false for CANCELLED status', () => {
      expect(isInPossession(RentalStatus.CANCELLED)).toBe(false);
    });
  });

  describe('getRentalStatusValues', () => {
    it('should return all status values', () => {
      const values = getRentalStatusValues();

      expect(values).toContain(RentalStatus.RESERVED);
      expect(values).toContain(RentalStatus.ACTIVE);
      expect(values).toContain(RentalStatus.OVERDUE);
      expect(values).toContain(RentalStatus.RETURNED);
      expect(values).toContain(RentalStatus.CANCELLED);
      expect(values.length).toBe(5);
    });
  });
});
