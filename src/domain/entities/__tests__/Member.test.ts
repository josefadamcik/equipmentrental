import { Member } from '../Member.js';
import { MembershipTier } from '../../types/MembershipTier.js';
import { Money } from '../../value-objects/Money.js';

describe('Member Entity', () => {
  describe('create', () => {
    it('should create member with valid properties', () => {
      const member = Member.create({
        name: 'John Doe',
        email: 'john@example.com',
        tier: MembershipTier.BASIC,
        joinDate: new Date('2024-01-01'),
        isActive: true,
      });

      expect(member.name).toBe('John Doe');
      expect(member.email).toBe('john@example.com');
      expect(member.tier).toBe(MembershipTier.BASIC);
      expect(member.activeRentalCount).toBe(0);
      expect(member.totalRentals).toBe(0);
      expect(member.isActive).toBe(true);
    });

    it('should throw error if name is empty', () => {
      expect(() =>
        Member.create({
          name: '',
          email: 'john@example.com',
          tier: MembershipTier.BASIC,
          joinDate: new Date(),
          isActive: true,
        }),
      ).toThrow('Member name cannot be empty');
    });

    it('should throw error if email is invalid', () => {
      expect(() =>
        Member.create({
          name: 'John Doe',
          email: 'invalid-email',
          tier: MembershipTier.BASIC,
          joinDate: new Date(),
          isActive: true,
        }),
      ).toThrow('Invalid email address');
    });
  });

  describe('canRent', () => {
    it('should allow rental if member is active and below limit', () => {
      const member = Member.create({
        name: 'John Doe',
        email: 'john@example.com',
        tier: MembershipTier.BASIC,
        joinDate: new Date(),
        isActive: true,
      });

      expect(member.canRent()).toBe(true);
    });

    it('should not allow rental if member is inactive', () => {
      const member = Member.create({
        name: 'John Doe',
        email: 'john@example.com',
        tier: MembershipTier.BASIC,
        joinDate: new Date(),
        isActive: false,
      });

      expect(member.canRent()).toBe(false);
    });

    it('should not allow rental if at concurrent rental limit', () => {
      const member = Member.create({
        name: 'John Doe',
        email: 'john@example.com',
        tier: MembershipTier.BASIC,
        joinDate: new Date(),
        isActive: true,
      });

      // BASIC tier allows 2 concurrent rentals
      member.incrementActiveRentals();
      member.incrementActiveRentals();

      expect(member.canRent()).toBe(false);
    });
  });

  describe('getMaxRentalDays', () => {
    it('should return correct max rental days for BASIC tier', () => {
      const member = Member.create({
        name: 'John Doe',
        email: 'john@example.com',
        tier: MembershipTier.BASIC,
        joinDate: new Date(),
        isActive: true,
      });

      expect(member.getMaxRentalDays()).toBe(7);
    });

    it('should return correct max rental days for PLATINUM tier', () => {
      const member = Member.create({
        name: 'John Doe',
        email: 'john@example.com',
        tier: MembershipTier.PLATINUM,
        joinDate: new Date(),
        isActive: true,
      });

      expect(member.getMaxRentalDays()).toBe(60);
    });
  });

  describe('applyDiscount', () => {
    it('should apply no discount for BASIC tier', () => {
      const member = Member.create({
        name: 'John Doe',
        email: 'john@example.com',
        tier: MembershipTier.BASIC,
        joinDate: new Date(),
        isActive: true,
      });

      const cost = Money.dollars(100);
      const discounted = member.applyDiscount(cost);

      expect(discounted.equals(Money.dollars(100))).toBe(true);
    });

    it('should apply 5% discount for SILVER tier', () => {
      const member = Member.create({
        name: 'John Doe',
        email: 'john@example.com',
        tier: MembershipTier.SILVER,
        joinDate: new Date(),
        isActive: true,
      });

      const cost = Money.dollars(100);
      const discounted = member.applyDiscount(cost);

      expect(discounted.equals(Money.dollars(95))).toBe(true);
    });

    it('should apply 10% discount for GOLD tier', () => {
      const member = Member.create({
        name: 'John Doe',
        email: 'john@example.com',
        tier: MembershipTier.GOLD,
        joinDate: new Date(),
        isActive: true,
      });

      const cost = Money.dollars(100);
      const discounted = member.applyDiscount(cost);

      expect(discounted.equals(Money.dollars(90))).toBe(true);
    });

    it('should apply 15% discount for PLATINUM tier', () => {
      const member = Member.create({
        name: 'John Doe',
        email: 'john@example.com',
        tier: MembershipTier.PLATINUM,
        joinDate: new Date(),
        isActive: true,
      });

      const cost = Money.dollars(100);
      const discounted = member.applyDiscount(cost);

      expect(discounted.equals(Money.dollars(85))).toBe(true);
    });
  });

  describe('incrementActiveRentals', () => {
    it('should increment active and total rental counts', () => {
      const member = Member.create({
        name: 'John Doe',
        email: 'john@example.com',
        tier: MembershipTier.BASIC,
        joinDate: new Date(),
        isActive: true,
      });

      member.incrementActiveRentals();

      expect(member.activeRentalCount).toBe(1);
      expect(member.totalRentals).toBe(1);
    });

    it('should throw error if at rental limit', () => {
      const member = Member.create({
        name: 'John Doe',
        email: 'john@example.com',
        tier: MembershipTier.BASIC,
        joinDate: new Date(),
        isActive: true,
      });

      member.incrementActiveRentals();
      member.incrementActiveRentals();

      expect(() => member.incrementActiveRentals()).toThrow(
        'Member has reached maximum concurrent rental limit',
      );
    });
  });

  describe('decrementActiveRentals', () => {
    it('should decrement active rental count', () => {
      const member = Member.create({
        name: 'John Doe',
        email: 'john@example.com',
        tier: MembershipTier.BASIC,
        joinDate: new Date(),
        isActive: true,
      });

      member.incrementActiveRentals();
      member.decrementActiveRentals();

      expect(member.activeRentalCount).toBe(0);
      expect(member.totalRentals).toBe(1); // Total should not decrease
    });

    it('should throw error if no active rentals', () => {
      const member = Member.create({
        name: 'John Doe',
        email: 'john@example.com',
        tier: MembershipTier.BASIC,
        joinDate: new Date(),
        isActive: true,
      });

      expect(() => member.decrementActiveRentals()).toThrow('No active rentals to decrement');
    });
  });

  describe('upgradeTier', () => {
    it('should upgrade member tier', () => {
      const member = Member.create({
        name: 'John Doe',
        email: 'john@example.com',
        tier: MembershipTier.BASIC,
        joinDate: new Date(),
        isActive: true,
      });

      member.upgradeTier(MembershipTier.GOLD);

      expect(member.tier).toBe(MembershipTier.GOLD);
    });
  });

  describe('deactivate', () => {
    it('should deactivate member with no active rentals', () => {
      const member = Member.create({
        name: 'John Doe',
        email: 'john@example.com',
        tier: MembershipTier.BASIC,
        joinDate: new Date(),
        isActive: true,
      });

      member.deactivate();

      expect(member.isActive).toBe(false);
    });

    it('should throw error if member has active rentals', () => {
      const member = Member.create({
        name: 'John Doe',
        email: 'john@example.com',
        tier: MembershipTier.BASIC,
        joinDate: new Date(),
        isActive: true,
      });

      member.incrementActiveRentals();

      expect(() => member.deactivate()).toThrow('Cannot deactivate member with active rentals');
    });
  });

  describe('reactivate', () => {
    it('should reactivate deactivated member', () => {
      const member = Member.create({
        name: 'John Doe',
        email: 'john@example.com',
        tier: MembershipTier.BASIC,
        joinDate: new Date(),
        isActive: true,
      });

      member.deactivate();
      member.reactivate();

      expect(member.isActive).toBe(true);
    });
  });

  describe('updateEmail', () => {
    it('should update member email', () => {
      const member = Member.create({
        name: 'John Doe',
        email: 'john@example.com',
        tier: MembershipTier.BASIC,
        joinDate: new Date(),
        isActive: true,
      });

      member.updateEmail('newemail@example.com');

      expect(member.email).toBe('newemail@example.com');
    });

    it('should throw error for invalid email', () => {
      const member = Member.create({
        name: 'John Doe',
        email: 'john@example.com',
        tier: MembershipTier.BASIC,
        joinDate: new Date(),
        isActive: true,
      });

      expect(() => member.updateEmail('invalid-email')).toThrow('Invalid email address');
    });
  });

  describe('updateName', () => {
    it('should update member name', () => {
      const member = Member.create({
        name: 'John Doe',
        email: 'john@example.com',
        tier: MembershipTier.BASIC,
        joinDate: new Date(),
        isActive: true,
      });

      member.updateName('Jane Doe');

      expect(member.name).toBe('Jane Doe');
    });

    it('should throw error for empty name', () => {
      const member = Member.create({
        name: 'John Doe',
        email: 'john@example.com',
        tier: MembershipTier.BASIC,
        joinDate: new Date(),
        isActive: true,
      });

      expect(() => member.updateName('')).toThrow('Member name cannot be empty');
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute member from snapshot', () => {
      const member = Member.create({
        name: 'John Doe',
        email: 'john@example.com',
        tier: MembershipTier.BASIC,
        joinDate: new Date(),
        isActive: true,
      });

      const snapshot = member.toSnapshot();
      const reconstituted = Member.reconstitute(snapshot);

      expect(reconstituted.name).toBe(member.name);
      expect(reconstituted.email).toBe(member.email);
      expect(reconstituted.id.equals(member.id)).toBe(true);
    });
  });
});
