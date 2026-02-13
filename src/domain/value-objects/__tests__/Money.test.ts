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

  describe('cents getter', () => {
    it('should return internal cents for whole dollar amount', () => {
      const money = Money.dollars(100);
      expect(money.cents).toBe(10000);
    });

    it('should return internal cents for fractional dollar amount', () => {
      const money = Money.dollars(99.99);
      expect(money.cents).toBe(9999);
    });

    it('should return zero cents for Money.zero()', () => {
      const money = Money.zero();
      expect(money.cents).toBe(0);
    });
  });

  describe('fromCents factory', () => {
    it('should create money from integer cents', () => {
      const money = Money.fromCents(1050);
      expect(money.amount).toBe(10.5);
      expect(money.cents).toBe(1050);
    });

    it('should create zero money from zero cents', () => {
      const money = Money.fromCents(0);
      expect(money.amount).toBe(0);
      expect(money.cents).toBe(0);
    });

    it('should throw for negative cents', () => {
      expect(() => Money.fromCents(-1)).toThrow('Money amount cannot be negative');
    });

    it('should throw for non-integer cents', () => {
      expect(() => Money.fromCents(10.5)).toThrow(
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

  describe('floating-point precision', () => {
    it('should correctly add 0.1 + 0.2 to equal 0.3', () => {
      // Without integer-based arithmetic, 0.1 + 0.2 = 0.30000000000000004 in JS.
      const result = Money.dollars(0.1).add(Money.dollars(0.2));
      expect(result.equals(Money.dollars(0.3))).toBe(true);
      expect(result.amount).toBe(0.3);
    });

    it('should correctly add small cents amounts without floating-point drift', () => {
      // 10 cents + 20 cents should equal exactly 30 cents
      const result = Money.fromCents(10).add(Money.fromCents(20));
      expect(result.cents).toBe(30);
      expect(result.amount).toBe(0.3);
    });

    it('should correctly multiply amounts that would drift with float arithmetic', () => {
      // $1.10 * 3 should be exactly $3.30
      const result = Money.dollars(1.1).multiply(3);
      expect(result.equals(Money.dollars(3.3))).toBe(true);
      expect(result.amount).toBe(3.3);
    });

    it('should handle repeated additions without accumulating error', () => {
      // Adding $0.10 ten times should equal exactly $1.00
      let total = Money.zero();
      for (let i = 0; i < 10; i++) {
        total = total.add(Money.dollars(0.1));
      }
      expect(total.equals(Money.dollars(1.0))).toBe(true);
      expect(total.amount).toBe(1.0);
    });

    it('should store cents as integers internally', () => {
      expect(Money.dollars(0.1).cents).toBe(10);
      expect(Money.dollars(0.2).cents).toBe(20);
      expect(Money.dollars(0.1).add(Money.dollars(0.2)).cents).toBe(30);
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
