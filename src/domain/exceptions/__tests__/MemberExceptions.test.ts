import { DomainException } from '../DomainException';
import {
  MemberNotFoundError,
  MemberSuspendedError,
  RentalLimitExceededError,
  MemberHasOverdueRentalsError,
  MemberInactiveError,
  InsufficientMemberTierError,
} from '../MemberExceptions';

describe('MemberExceptions', () => {
  describe('MemberNotFoundError', () => {
    it('should create error with member ID', () => {
      const error = new MemberNotFoundError('M123');

      expect(error.message).toBe('Member not found with ID: M123');
      expect(error.code).toBe('MEMBER_NOT_FOUND');
    });

    it('should include member ID in metadata', () => {
      const error = new MemberNotFoundError('M123');

      expect(error.metadata).toEqual({ memberId: 'M123' });
    });

    it('should merge additional metadata', () => {
      const additionalMetadata = { searchedBy: 'admin@example.com', timestamp: '2024-01-01' };
      const error = new MemberNotFoundError('M123', additionalMetadata);

      expect(error.metadata).toEqual({
        memberId: 'M123',
        searchedBy: 'admin@example.com',
        timestamp: '2024-01-01',
      });
    });

    it('should be an instance of DomainException', () => {
      const error = new MemberNotFoundError('M123');

      expect(error).toBeInstanceOf(MemberNotFoundError);
      expect(error).toBeInstanceOf(DomainException);
    });
  });

  describe('MemberSuspendedError', () => {
    it('should create error with member ID and reason', () => {
      const error = new MemberSuspendedError('M123', 'multiple violations');

      expect(error.message).toBe('Member M123 is suspended: multiple violations');
      expect(error.code).toBe('MEMBER_SUSPENDED');
    });

    it('should include member ID and reason in metadata', () => {
      const error = new MemberSuspendedError('M123', 'multiple violations');

      expect(error.metadata).toEqual({
        memberId: 'M123',
        reason: 'multiple violations',
      });
    });

    it('should merge additional metadata', () => {
      const additionalMetadata = { suspensionDate: '2024-01-01', endDate: '2024-02-01' };
      const error = new MemberSuspendedError('M123', 'payment issues', additionalMetadata);

      expect(error.metadata).toEqual({
        memberId: 'M123',
        reason: 'payment issues',
        suspensionDate: '2024-01-01',
        endDate: '2024-02-01',
      });
    });

    it('should be throwable and catchable', () => {
      try {
        throw new MemberSuspendedError('M123', 'test reason');
      } catch (error) {
        expect(error).toBeInstanceOf(DomainException);
        expect(error).toBeInstanceOf(MemberSuspendedError);
      }
    });
  });

  describe('RentalLimitExceededError', () => {
    it('should create error with member ID, current and max rentals', () => {
      const error = new RentalLimitExceededError('M123', 5, 3);

      expect(error.message).toBe('Member M123 has reached rental limit (5/3)');
      expect(error.code).toBe('RENTAL_LIMIT_EXCEEDED');
    });

    it('should include all rental limit details in metadata', () => {
      const error = new RentalLimitExceededError('M123', 5, 3);

      expect(error.metadata).toEqual({
        memberId: 'M123',
        currentRentals: 5,
        maxAllowed: 3,
      });
    });

    it('should merge additional metadata', () => {
      const additionalMetadata = { memberTier: 'BASIC', attemptedRentalId: 'E456' };
      const error = new RentalLimitExceededError('M123', 5, 3, additionalMetadata);

      expect(error.metadata).toEqual({
        memberId: 'M123',
        currentRentals: 5,
        maxAllowed: 3,
        memberTier: 'BASIC',
        attemptedRentalId: 'E456',
      });
    });

    it('should handle different rental limits', () => {
      const testCases = [
        { current: 1, max: 1 },
        { current: 10, max: 5 },
        { current: 100, max: 50 },
      ];

      testCases.forEach(({ current, max }) => {
        const error = new RentalLimitExceededError('M123', current, max);
        expect(error.message).toContain(`(${current}/${max})`);
        expect(error.metadata?.currentRentals).toBe(current);
        expect(error.metadata?.maxAllowed).toBe(max);
      });
    });
  });

  describe('MemberHasOverdueRentalsError', () => {
    it('should create error with member ID and overdue count', () => {
      const error = new MemberHasOverdueRentalsError('M123', 2);

      expect(error.message).toBe('Member M123 has 2 overdue rental(s)');
      expect(error.code).toBe('MEMBER_HAS_OVERDUE_RENTALS');
    });

    it('should include member ID and overdue count in metadata', () => {
      const error = new MemberHasOverdueRentalsError('M123', 2);

      expect(error.metadata).toEqual({
        memberId: 'M123',
        overdueCount: 2,
      });
    });

    it('should merge additional metadata', () => {
      const additionalMetadata = { totalOutstanding: 150.0, oldestOverdueDate: '2024-01-01' };
      const error = new MemberHasOverdueRentalsError('M123', 2, additionalMetadata);

      expect(error.metadata).toEqual({
        memberId: 'M123',
        overdueCount: 2,
        totalOutstanding: 150.0,
        oldestOverdueDate: '2024-01-01',
      });
    });

    it('should handle singular and plural overdue rentals', () => {
      const error1 = new MemberHasOverdueRentalsError('M123', 1);
      expect(error1.message).toBe('Member M123 has 1 overdue rental(s)');

      const error2 = new MemberHasOverdueRentalsError('M123', 5);
      expect(error2.message).toBe('Member M123 has 5 overdue rental(s)');
    });

    it('should be an instance of DomainException', () => {
      const error = new MemberHasOverdueRentalsError('M123', 2);

      expect(error).toBeInstanceOf(DomainException);
    });
  });

  describe('MemberInactiveError', () => {
    it('should create error with member ID', () => {
      const error = new MemberInactiveError('M123');

      expect(error.message).toBe('Member M123 account is inactive');
      expect(error.code).toBe('MEMBER_INACTIVE');
    });

    it('should include member ID in metadata', () => {
      const error = new MemberInactiveError('M123');

      expect(error.metadata).toEqual({ memberId: 'M123' });
    });

    it('should support additional metadata', () => {
      const additionalMetadata = { deactivatedDate: '2023-12-31', reason: 'expired membership' };
      const error = new MemberInactiveError('M123', additionalMetadata);

      expect(error.metadata).toEqual({
        memberId: 'M123',
        deactivatedDate: '2023-12-31',
        reason: 'expired membership',
      });
    });

    it('should be throwable', () => {
      expect(() => {
        throw new MemberInactiveError('M123');
      }).toThrow('Member M123 account is inactive');
    });
  });

  describe('InsufficientMemberTierError', () => {
    it('should create error with member ID and tier details', () => {
      const error = new InsufficientMemberTierError('M123', 'BASIC', 'PREMIUM');

      expect(error.message).toBe("Member M123 tier 'BASIC' is insufficient (requires 'PREMIUM')");
      expect(error.code).toBe('INSUFFICIENT_MEMBER_TIER');
    });

    it('should include member ID and tier details in metadata', () => {
      const error = new InsufficientMemberTierError('M123', 'BASIC', 'PREMIUM');

      expect(error.metadata).toEqual({
        memberId: 'M123',
        currentTier: 'BASIC',
        requiredTier: 'PREMIUM',
      });
    });

    it('should merge additional metadata', () => {
      const additionalMetadata = {
        attemptedAction: 'rent premium equipment',
        suggestedUpgrade: true,
      };
      const error = new InsufficientMemberTierError('M123', 'BASIC', 'PREMIUM', additionalMetadata);

      expect(error.metadata).toEqual({
        memberId: 'M123',
        currentTier: 'BASIC',
        requiredTier: 'PREMIUM',
        attemptedAction: 'rent premium equipment',
        suggestedUpgrade: true,
      });
    });

    it('should work with different tier combinations', () => {
      const tierCombinations = [
        { current: 'BASIC', required: 'PREMIUM' },
        { current: 'BASIC', required: 'VIP' },
        { current: 'PREMIUM', required: 'VIP' },
      ];

      tierCombinations.forEach(({ current, required }) => {
        const error = new InsufficientMemberTierError('M123', current, required);
        expect(error.message).toContain(current);
        expect(error.message).toContain(required);
        expect(error.metadata?.currentTier).toBe(current);
        expect(error.metadata?.requiredTier).toBe(required);
      });
    });

    it('should be an instance of DomainException', () => {
      const error = new InsufficientMemberTierError('M123', 'BASIC', 'PREMIUM');

      expect(error).toBeInstanceOf(InsufficientMemberTierError);
      expect(error).toBeInstanceOf(DomainException);
    });
  });

  describe('All Member Exceptions', () => {
    it('should all extend DomainException', () => {
      const exceptions = [
        new MemberNotFoundError('M123'),
        new MemberSuspendedError('M123', 'test'),
        new RentalLimitExceededError('M123', 5, 3),
        new MemberHasOverdueRentalsError('M123', 2),
        new MemberInactiveError('M123'),
        new InsufficientMemberTierError('M123', 'BASIC', 'PREMIUM'),
      ];

      exceptions.forEach((exception) => {
        expect(exception).toBeInstanceOf(DomainException);
        expect(exception).toBeInstanceOf(Error);
      });
    });

    it('should all have unique error codes', () => {
      const exceptions = [
        new MemberNotFoundError('M123'),
        new MemberSuspendedError('M123', 'test'),
        new RentalLimitExceededError('M123', 5, 3),
        new MemberHasOverdueRentalsError('M123', 2),
        new MemberInactiveError('M123'),
        new InsufficientMemberTierError('M123', 'BASIC', 'PREMIUM'),
      ];

      const codes = exceptions.map((e) => e.code);
      const uniqueCodes = new Set(codes);

      expect(uniqueCodes.size).toBe(codes.length);
    });

    it('should all have timestamps', () => {
      const exceptions = [
        new MemberNotFoundError('M123'),
        new MemberSuspendedError('M123', 'test'),
        new RentalLimitExceededError('M123', 5, 3),
        new MemberHasOverdueRentalsError('M123', 2),
        new MemberInactiveError('M123'),
        new InsufficientMemberTierError('M123', 'BASIC', 'PREMIUM'),
      ];

      exceptions.forEach((exception) => {
        expect(exception.timestamp).toBeInstanceOf(Date);
      });
    });

    it('should all include memberId in metadata', () => {
      const exceptions = [
        new MemberNotFoundError('M123'),
        new MemberSuspendedError('M123', 'test'),
        new RentalLimitExceededError('M123', 5, 3),
        new MemberHasOverdueRentalsError('M123', 2),
        new MemberInactiveError('M123'),
        new InsufficientMemberTierError('M123', 'BASIC', 'PREMIUM'),
      ];

      exceptions.forEach((exception) => {
        expect(exception.metadata?.memberId).toBe('M123');
      });
    });
  });
});
