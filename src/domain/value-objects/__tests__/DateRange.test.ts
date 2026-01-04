import { DateRange } from '../DateRange.js';

describe('DateRange', () => {
  describe('creation', () => {
    it('should create a valid date range', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-10');
      const range = DateRange.create(start, end);

      expect(range.start).toEqual(start);
      expect(range.end).toEqual(end);
    });

    it('should throw error if start date is after end date', () => {
      const start = new Date('2024-01-10');
      const end = new Date('2024-01-01');

      expect(() => DateRange.create(start, end)).toThrow('Start date must be before end date');
    });

    it('should throw error if start date equals end date', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-01');

      expect(() => DateRange.create(start, end)).toThrow('Start date must be before end date');
    });
  });

  describe('overlaps', () => {
    it('should detect overlapping ranges', () => {
      const range1 = DateRange.create(new Date('2024-01-01'), new Date('2024-01-10'));
      const range2 = DateRange.create(new Date('2024-01-05'), new Date('2024-01-15'));

      expect(range1.overlaps(range2)).toBe(true);
      expect(range2.overlaps(range1)).toBe(true);
    });

    it('should detect non-overlapping ranges', () => {
      const range1 = DateRange.create(new Date('2024-01-01'), new Date('2024-01-10'));
      const range2 = DateRange.create(new Date('2024-01-11'), new Date('2024-01-20'));

      expect(range1.overlaps(range2)).toBe(false);
      expect(range2.overlaps(range1)).toBe(false);
    });

    it('should detect adjacent ranges as non-overlapping', () => {
      const range1 = DateRange.create(new Date('2024-01-01'), new Date('2024-01-10'));
      const range2 = DateRange.create(new Date('2024-01-10'), new Date('2024-01-20'));

      expect(range1.overlaps(range2)).toBe(false);
    });

    it('should detect fully contained ranges as overlapping', () => {
      const range1 = DateRange.create(new Date('2024-01-01'), new Date('2024-01-31'));
      const range2 = DateRange.create(new Date('2024-01-10'), new Date('2024-01-20'));

      expect(range1.overlaps(range2)).toBe(true);
      expect(range2.overlaps(range1)).toBe(true);
    });
  });

  describe('contains', () => {
    it('should return true if date is within range', () => {
      const range = DateRange.create(new Date('2024-01-01'), new Date('2024-01-10'));
      const date = new Date('2024-01-05');

      expect(range.contains(date)).toBe(true);
    });

    it('should return true if date equals start date', () => {
      const range = DateRange.create(new Date('2024-01-01'), new Date('2024-01-10'));
      const date = new Date('2024-01-01');

      expect(range.contains(date)).toBe(true);
    });

    it('should return false if date equals end date', () => {
      const range = DateRange.create(new Date('2024-01-01'), new Date('2024-01-10'));
      const date = new Date('2024-01-10');

      expect(range.contains(date)).toBe(false);
    });

    it('should return false if date is before range', () => {
      const range = DateRange.create(new Date('2024-01-01'), new Date('2024-01-10'));
      const date = new Date('2023-12-31');

      expect(range.contains(date)).toBe(false);
    });

    it('should return false if date is after range', () => {
      const range = DateRange.create(new Date('2024-01-01'), new Date('2024-01-10'));
      const date = new Date('2024-01-11');

      expect(range.contains(date)).toBe(false);
    });
  });

  describe('getDays', () => {
    it('should calculate number of days in range', () => {
      const range = DateRange.create(new Date('2024-01-01'), new Date('2024-01-11'));

      expect(range.getDays()).toBe(10);
    });

    it('should handle single day range', () => {
      const range = DateRange.create(new Date('2024-01-01T00:00:00'), new Date('2024-01-01T12:00:00'));

      expect(range.getDays()).toBe(1);
    });
  });

  describe('getDaysUntilEnd', () => {
    it('should calculate days until end from a date', () => {
      const range = DateRange.create(new Date('2024-01-01'), new Date('2024-01-11'));
      const fromDate = new Date('2024-01-05');

      expect(range.getDaysUntilEnd(fromDate)).toBe(6);
    });

    it('should return negative for dates after end', () => {
      const range = DateRange.create(new Date('2024-01-01'), new Date('2024-01-10'));
      const fromDate = new Date('2024-01-15');

      expect(range.getDaysUntilEnd(fromDate)).toBeLessThan(0);
    });
  });

  describe('status checks', () => {
    it('should detect if range has ended', () => {
      const pastRange = DateRange.create(new Date('2023-01-01'), new Date('2023-01-10'));
      const now = new Date('2024-01-01');

      expect(pastRange.hasEnded(now)).toBe(true);
    });

    it('should detect if range has not ended', () => {
      const futureRange = DateRange.create(new Date('2024-01-01'), new Date('2024-12-31'));
      const now = new Date('2024-06-01');

      expect(futureRange.hasEnded(now)).toBe(false);
    });

    it('should detect if range has started', () => {
      const range = DateRange.create(new Date('2023-01-01'), new Date('2024-12-31'));
      const now = new Date('2024-01-01');

      expect(range.hasStarted(now)).toBe(true);
    });

    it('should detect if range has not started', () => {
      const futureRange = DateRange.create(new Date('2025-01-01'), new Date('2025-12-31'));
      const now = new Date('2024-01-01');

      expect(futureRange.hasStarted(now)).toBe(false);
    });

    it('should detect if range is active', () => {
      const range = DateRange.create(new Date('2023-01-01'), new Date('2025-12-31'));
      const now = new Date('2024-06-01');

      expect(range.isActive(now)).toBe(true);
    });

    it('should detect if range is not active (not started)', () => {
      const futureRange = DateRange.create(new Date('2025-01-01'), new Date('2025-12-31'));
      const now = new Date('2024-01-01');

      expect(futureRange.isActive(now)).toBe(false);
    });

    it('should detect if range is not active (ended)', () => {
      const pastRange = DateRange.create(new Date('2023-01-01'), new Date('2023-12-31'));
      const now = new Date('2024-01-01');

      expect(pastRange.isActive(now)).toBe(false);
    });
  });

  describe('extendBy', () => {
    it('should extend range by specified days', () => {
      const range = DateRange.create(new Date('2024-01-01'), new Date('2024-01-10'));
      const extended = range.extendBy(5);

      expect(extended.start).toEqual(new Date('2024-01-01'));
      expect(extended.end).toEqual(new Date('2024-01-15'));
    });

    it('should throw error for non-positive days', () => {
      const range = DateRange.create(new Date('2024-01-01'), new Date('2024-01-10'));

      expect(() => range.extendBy(0)).toThrow('Extension days must be positive');
      expect(() => range.extendBy(-5)).toThrow('Extension days must be positive');
    });

    it('should not modify original range', () => {
      const range = DateRange.create(new Date('2024-01-01'), new Date('2024-01-10'));
      const originalEnd = range.end;

      range.extendBy(5);

      expect(range.end).toEqual(originalEnd);
    });
  });

  describe('equals', () => {
    it('should return true for equal ranges', () => {
      const range1 = DateRange.create(new Date('2024-01-01'), new Date('2024-01-10'));
      const range2 = DateRange.create(new Date('2024-01-01'), new Date('2024-01-10'));

      expect(range1.equals(range2)).toBe(true);
    });

    it('should return false for different ranges', () => {
      const range1 = DateRange.create(new Date('2024-01-01'), new Date('2024-01-10'));
      const range2 = DateRange.create(new Date('2024-01-01'), new Date('2024-01-15'));

      expect(range1.equals(range2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return string representation', () => {
      const range = DateRange.create(new Date('2024-01-01'), new Date('2024-01-10'));
      const result = range.toString();

      expect(result).toContain('2024-01-01');
      expect(result).toContain('2024-01-10');
    });
  });
});
