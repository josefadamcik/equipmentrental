import { MembershipTier } from '../MembershipTier.js';

describe('MembershipTier', () => {
  describe('getDiscountPercentage', () => {
    it('should return 0% for BASIC tier', () => {
      expect(MembershipTier.getDiscountPercentage(MembershipTier.BASIC)).toBe(0);
    });

    it('should return 5% for SILVER tier', () => {
      expect(MembershipTier.getDiscountPercentage(MembershipTier.SILVER)).toBe(5);
    });

    it('should return 10% for GOLD tier', () => {
      expect(MembershipTier.getDiscountPercentage(MembershipTier.GOLD)).toBe(10);
    });

    it('should return 15% for PLATINUM tier', () => {
      expect(MembershipTier.getDiscountPercentage(MembershipTier.PLATINUM)).toBe(15);
    });
  });

  describe('getMaxConcurrentRentals', () => {
    it('should return 2 for BASIC tier', () => {
      expect(MembershipTier.getMaxConcurrentRentals(MembershipTier.BASIC)).toBe(2);
    });

    it('should return 3 for SILVER tier', () => {
      expect(MembershipTier.getMaxConcurrentRentals(MembershipTier.SILVER)).toBe(3);
    });

    it('should return 5 for GOLD tier', () => {
      expect(MembershipTier.getMaxConcurrentRentals(MembershipTier.GOLD)).toBe(5);
    });

    it('should return 10 for PLATINUM tier', () => {
      expect(MembershipTier.getMaxConcurrentRentals(MembershipTier.PLATINUM)).toBe(10);
    });
  });

  describe('getMaxRentalDays', () => {
    it('should return 7 days for BASIC tier', () => {
      expect(MembershipTier.getMaxRentalDays(MembershipTier.BASIC)).toBe(7);
    });

    it('should return 14 days for SILVER tier', () => {
      expect(MembershipTier.getMaxRentalDays(MembershipTier.SILVER)).toBe(14);
    });

    it('should return 30 days for GOLD tier', () => {
      expect(MembershipTier.getMaxRentalDays(MembershipTier.GOLD)).toBe(30);
    });

    it('should return 60 days for PLATINUM tier', () => {
      expect(MembershipTier.getMaxRentalDays(MembershipTier.PLATINUM)).toBe(60);
    });
  });

  describe('allowsEarlyReservations', () => {
    it('should return false for BASIC tier', () => {
      expect(MembershipTier.allowsEarlyReservations(MembershipTier.BASIC)).toBe(false);
    });

    it('should return false for SILVER tier', () => {
      expect(MembershipTier.allowsEarlyReservations(MembershipTier.SILVER)).toBe(false);
    });

    it('should return true for GOLD tier', () => {
      expect(MembershipTier.allowsEarlyReservations(MembershipTier.GOLD)).toBe(true);
    });

    it('should return true for PLATINUM tier', () => {
      expect(MembershipTier.allowsEarlyReservations(MembershipTier.PLATINUM)).toBe(true);
    });
  });

  describe('values', () => {
    it('should return all tier values', () => {
      const values = MembershipTier.values();

      expect(values).toContain(MembershipTier.BASIC);
      expect(values).toContain(MembershipTier.SILVER);
      expect(values).toContain(MembershipTier.GOLD);
      expect(values).toContain(MembershipTier.PLATINUM);
      expect(values.length).toBe(4);
    });
  });
});
