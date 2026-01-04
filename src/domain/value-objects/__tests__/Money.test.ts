import { Money } from '../Money.js';

describe('Money', () => {
  describe('creation', () => {
    it('should create money with positive amount', () => {
      const money = Money.dollars(100);
      expect(money.amount).toBe(100);
    });

    it('should create zero money', () => {
      const money = Money.zero();
      expect(money.amount).toBe(0);
    });

    it('should throw error for negative amount', () => {
      expect(() => Money.dollars(-10)).toThrow('Money amount cannot be negative');
    });

    it('should accept amounts with 2 decimal places', () => {
      const money = Money.dollars(99.99);
      expect(money.amount).toBe(99.99);
    });

    it('should throw error for more than 2 decimal places', () => {
      expect(() => Money.dollars(10.123)).toThrow(
        'Money amount must have at most 2 decimal places',
      );
    });
  });

  describe('arithmetic', () => {
    it('should add two money amounts', () => {
      const money1 = Money.dollars(50);
      const money2 = Money.dollars(30);
      const result = money1.add(money2);

      expect(result.amount).toBe(80);
    });

    it('should subtract money amounts', () => {
      const money1 = Money.dollars(100);
      const money2 = Money.dollars(30);
      const result = money1.subtract(money2);

      expect(result.amount).toBe(70);
    });

    it('should multiply money by factor', () => {
      const money = Money.dollars(50);
      const result = money.multiply(2.5);

      expect(result.amount).toBe(125);
    });

    it('should handle multiplication with rounding', () => {
      const money = Money.dollars(10);
      const result = money.multiply(0.333);

      expect(result.amount).toBe(3.33);
    });

    it('should throw error when subtraction results in negative', () => {
      const money1 = Money.dollars(30);
      const money2 = Money.dollars(100);

      expect(() => money1.subtract(money2)).toThrow('Money amount cannot be negative');
    });
  });

  describe('comparison', () => {
    it('should compare two money amounts for equality', () => {
      const money1 = Money.dollars(100);
      const money2 = Money.dollars(100);

      expect(money1.equals(money2)).toBe(true);
    });

    it('should return false when comparing different amounts', () => {
      const money1 = Money.dollars(100);
      const money2 = Money.dollars(50);

      expect(money1.equals(money2)).toBe(false);
    });

    it('should check if money is greater than', () => {
      const money1 = Money.dollars(100);
      const money2 = Money.dollars(50);

      expect(money1.isGreaterThan(money2)).toBe(true);
      expect(money2.isGreaterThan(money1)).toBe(false);
    });

    it('should check if money is less than', () => {
      const money1 = Money.dollars(50);
      const money2 = Money.dollars(100);

      expect(money1.isLessThan(money2)).toBe(true);
      expect(money2.isLessThan(money1)).toBe(false);
    });

    it('should check if money is greater than or equal', () => {
      const money1 = Money.dollars(100);
      const money2 = Money.dollars(100);
      const money3 = Money.dollars(50);

      expect(money1.isGreaterThanOrEqual(money2)).toBe(true);
      expect(money1.isGreaterThanOrEqual(money3)).toBe(true);
      expect(money3.isGreaterThanOrEqual(money1)).toBe(false);
    });

    it('should check if money is less than or equal', () => {
      const money1 = Money.dollars(100);
      const money2 = Money.dollars(100);
      const money3 = Money.dollars(150);

      expect(money1.isLessThanOrEqual(money2)).toBe(true);
      expect(money1.isLessThanOrEqual(money3)).toBe(true);
      expect(money3.isLessThanOrEqual(money1)).toBe(false);
    });
  });

  describe('string representation', () => {
    it('should format as dollar string', () => {
      const money = Money.dollars(123.45);
      expect(money.toString()).toBe('$123.45');
    });

    it('should format zero correctly', () => {
      const money = Money.zero();
      expect(money.toString()).toBe('$0.00');
    });
  });
});
