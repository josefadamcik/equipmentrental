import { DomainException } from '../DomainException';
import {
  RentalNotAllowedError,
  InvalidStateTransitionError,
  RentalNotFoundError,
  RentalAlreadyReturnedError,
  InvalidRentalExtensionError,
  OverdueRentalError,
} from '../RentalExceptions';

describe('RentalExceptions', () => {
  describe('RentalNotAllowedError', () => {
    it('should create error with reason', () => {
      const error = new RentalNotAllowedError('Member has overdue rentals');

      expect(error.message).toBe('Rental not allowed: Member has overdue rentals');
      expect(error.code).toBe('RENTAL_NOT_ALLOWED');
      expect(error).toBeInstanceOf(DomainException);
    });

    it('should create error with metadata', () => {
      const metadata = { memberId: 'M123', overdueCount: 2 };
      const error = new RentalNotAllowedError('Member has overdue rentals', metadata);

      expect(error.metadata).toEqual(metadata);
    });

    it('should be catchable as DomainException', () => {
      try {
        throw new RentalNotAllowedError('Test reason');
      } catch (error) {
        expect(error).toBeInstanceOf(DomainException);
        expect(error).toBeInstanceOf(RentalNotAllowedError);
      }
    });
  });

  describe('InvalidStateTransitionError', () => {
    it('should create error with state transition details', () => {
      const error = new InvalidStateTransitionError('ACTIVE', 'PENDING');

      expect(error.message).toBe("Invalid state transition from 'ACTIVE' to 'PENDING'");
      expect(error.code).toBe('INVALID_STATE_TRANSITION');
    });

    it('should include states in metadata', () => {
      const error = new InvalidStateTransitionError('ACTIVE', 'PENDING');

      expect(error.metadata).toEqual({
        currentState: 'ACTIVE',
        attemptedState: 'PENDING',
      });
    });

    it('should merge additional metadata', () => {
      const additionalMetadata = { rentalId: 'R123', timestamp: '2024-01-01' };
      const error = new InvalidStateTransitionError('ACTIVE', 'PENDING', additionalMetadata);

      expect(error.metadata).toEqual({
        currentState: 'ACTIVE',
        attemptedState: 'PENDING',
        rentalId: 'R123',
        timestamp: '2024-01-01',
      });
    });

    it('should be an instance of DomainException', () => {
      const error = new InvalidStateTransitionError('ACTIVE', 'PENDING');

      expect(error).toBeInstanceOf(InvalidStateTransitionError);
      expect(error).toBeInstanceOf(DomainException);
    });
  });

  describe('RentalNotFoundError', () => {
    it('should create error with rental ID', () => {
      const error = new RentalNotFoundError('R123');

      expect(error.message).toBe('Rental not found with ID: R123');
      expect(error.code).toBe('RENTAL_NOT_FOUND');
    });

    it('should include rental ID in metadata', () => {
      const error = new RentalNotFoundError('R123');

      expect(error.metadata).toEqual({ rentalId: 'R123' });
    });

    it('should merge additional metadata', () => {
      const additionalMetadata = { requestedBy: 'user@example.com' };
      const error = new RentalNotFoundError('R123', additionalMetadata);

      expect(error.metadata).toEqual({
        rentalId: 'R123',
        requestedBy: 'user@example.com',
      });
    });
  });

  describe('RentalAlreadyReturnedError', () => {
    it('should create error with rental ID', () => {
      const error = new RentalAlreadyReturnedError('R123');

      expect(error.message).toBe('Rental R123 has already been returned');
      expect(error.code).toBe('RENTAL_ALREADY_RETURNED');
    });

    it('should include rental ID in metadata', () => {
      const error = new RentalAlreadyReturnedError('R123');

      expect(error.metadata).toEqual({ rentalId: 'R123' });
    });

    it('should be throwable and catchable', () => {
      expect(() => {
        throw new RentalAlreadyReturnedError('R123');
      }).toThrow('Rental R123 has already been returned');
    });
  });

  describe('InvalidRentalExtensionError', () => {
    it('should create error with reason', () => {
      const error = new InvalidRentalExtensionError('Extension period exceeds maximum allowed');

      expect(error.message).toBe(
        'Invalid rental extension: Extension period exceeds maximum allowed',
      );
      expect(error.code).toBe('INVALID_RENTAL_EXTENSION');
    });

    it('should support metadata', () => {
      const metadata = { requestedDays: 30, maxDays: 14 };
      const error = new InvalidRentalExtensionError('Too many days requested', metadata);

      expect(error.metadata).toEqual(metadata);
    });

    it('should be an instance of DomainException', () => {
      const error = new InvalidRentalExtensionError('Test reason');

      expect(error).toBeInstanceOf(DomainException);
    });
  });

  describe('OverdueRentalError', () => {
    it('should create error with rental ID and days overdue', () => {
      const error = new OverdueRentalError('R123', 5);

      expect(error.message).toBe('Rental R123 is 5 day(s) overdue');
      expect(error.code).toBe('RENTAL_OVERDUE');
    });

    it('should include rental ID and days overdue in metadata', () => {
      const error = new OverdueRentalError('R123', 5);

      expect(error.metadata).toEqual({
        rentalId: 'R123',
        daysOverdue: 5,
      });
    });

    it('should handle singular day correctly in message', () => {
      const error = new OverdueRentalError('R123', 1);

      expect(error.message).toBe('Rental R123 is 1 day(s) overdue');
    });

    it('should merge additional metadata', () => {
      const additionalMetadata = { lateFee: 25.0, memberId: 'M456' };
      const error = new OverdueRentalError('R123', 5, additionalMetadata);

      expect(error.metadata).toEqual({
        rentalId: 'R123',
        daysOverdue: 5,
        lateFee: 25.0,
        memberId: 'M456',
      });
    });

    it('should be throwable with correct error code', () => {
      try {
        throw new OverdueRentalError('R123', 5);
      } catch (error) {
        expect(error).toBeInstanceOf(DomainException);
        expect(error).toBeInstanceOf(OverdueRentalError);
      }
    });
  });

  describe('All Rental Exceptions', () => {
    it('should all extend DomainException', () => {
      const exceptions = [
        new RentalNotAllowedError('test'),
        new InvalidStateTransitionError('A', 'B'),
        new RentalNotFoundError('R123'),
        new RentalAlreadyReturnedError('R123'),
        new InvalidRentalExtensionError('test'),
        new OverdueRentalError('R123', 1),
      ];

      exceptions.forEach((exception) => {
        expect(exception).toBeInstanceOf(DomainException);
        expect(exception).toBeInstanceOf(Error);
      });
    });

    it('should all have unique error codes', () => {
      const exceptions = [
        new RentalNotAllowedError('test'),
        new InvalidStateTransitionError('A', 'B'),
        new RentalNotFoundError('R123'),
        new RentalAlreadyReturnedError('R123'),
        new InvalidRentalExtensionError('test'),
        new OverdueRentalError('R123', 1),
      ];

      const codes = exceptions.map((e) => e.code);
      const uniqueCodes = new Set(codes);

      expect(uniqueCodes.size).toBe(codes.length);
    });

    it('should all have timestamps', () => {
      const exceptions = [
        new RentalNotAllowedError('test'),
        new InvalidStateTransitionError('A', 'B'),
        new RentalNotFoundError('R123'),
        new RentalAlreadyReturnedError('R123'),
        new InvalidRentalExtensionError('test'),
        new OverdueRentalError('R123', 1),
      ];

      exceptions.forEach((exception) => {
        expect(exception.timestamp).toBeInstanceOf(Date);
      });
    });
  });
});
