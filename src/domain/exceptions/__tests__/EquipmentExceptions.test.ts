import { DomainException } from '../DomainException';
import {
  EquipmentNotAvailableError,
  EquipmentNotFoundError,
  EquipmentAlreadyRentedError,
  EquipmentInMaintenanceError,
  EquipmentConditionUnacceptableError,
  EquipmentRetiredError,
} from '../EquipmentExceptions';

describe('EquipmentExceptions', () => {
  describe('EquipmentNotAvailableError', () => {
    it('should create error with equipment ID and reason', () => {
      const error = new EquipmentNotAvailableError('E123', 'currently rented');

      expect(error.message).toBe('Equipment E123 is not available: currently rented');
      expect(error.code).toBe('EQUIPMENT_NOT_AVAILABLE');
    });

    it('should include equipment ID and reason in metadata', () => {
      const error = new EquipmentNotAvailableError('E123', 'currently rented');

      expect(error.metadata).toEqual({
        equipmentId: 'E123',
        reason: 'currently rented',
      });
    });

    it('should merge additional metadata', () => {
      const additionalMetadata = { requestedBy: 'M456', timestamp: '2024-01-01' };
      const error = new EquipmentNotAvailableError('E123', 'reserved', additionalMetadata);

      expect(error.metadata).toEqual({
        equipmentId: 'E123',
        reason: 'reserved',
        requestedBy: 'M456',
        timestamp: '2024-01-01',
      });
    });

    it('should be an instance of DomainException', () => {
      const error = new EquipmentNotAvailableError('E123', 'test reason');

      expect(error).toBeInstanceOf(EquipmentNotAvailableError);
      expect(error).toBeInstanceOf(DomainException);
    });
  });

  describe('EquipmentNotFoundError', () => {
    it('should create error with equipment ID', () => {
      const error = new EquipmentNotFoundError('E123');

      expect(error.message).toBe('Equipment not found with ID: E123');
      expect(error.code).toBe('EQUIPMENT_NOT_FOUND');
    });

    it('should include equipment ID in metadata', () => {
      const error = new EquipmentNotFoundError('E123');

      expect(error.metadata).toEqual({ equipmentId: 'E123' });
    });

    it('should merge additional metadata', () => {
      const additionalMetadata = { searchedBy: 'admin@example.com' };
      const error = new EquipmentNotFoundError('E123', additionalMetadata);

      expect(error.metadata).toEqual({
        equipmentId: 'E123',
        searchedBy: 'admin@example.com',
      });
    });

    it('should be throwable and catchable', () => {
      expect(() => {
        throw new EquipmentNotFoundError('E123');
      }).toThrow('Equipment not found with ID: E123');
    });
  });

  describe('EquipmentAlreadyRentedError', () => {
    it('should create error with equipment ID and rental ID', () => {
      const error = new EquipmentAlreadyRentedError('E123', 'R456');

      expect(error.message).toBe('Equipment E123 is already rented (Rental ID: R456)');
      expect(error.code).toBe('EQUIPMENT_ALREADY_RENTED');
    });

    it('should include equipment ID and rental ID in metadata', () => {
      const error = new EquipmentAlreadyRentedError('E123', 'R456');

      expect(error.metadata).toEqual({
        equipmentId: 'E123',
        currentRentalId: 'R456',
      });
    });

    it('should merge additional metadata', () => {
      const additionalMetadata = { attemptedBy: 'M789' };
      const error = new EquipmentAlreadyRentedError('E123', 'R456', additionalMetadata);

      expect(error.metadata).toEqual({
        equipmentId: 'E123',
        currentRentalId: 'R456',
        attemptedBy: 'M789',
      });
    });

    it('should be an instance of DomainException', () => {
      const error = new EquipmentAlreadyRentedError('E123', 'R456');

      expect(error).toBeInstanceOf(DomainException);
    });
  });

  describe('EquipmentInMaintenanceError', () => {
    it('should create error with equipment ID', () => {
      const error = new EquipmentInMaintenanceError('E123');

      expect(error.message).toBe('Equipment E123 is currently in maintenance');
      expect(error.code).toBe('EQUIPMENT_IN_MAINTENANCE');
    });

    it('should include equipment ID in metadata', () => {
      const error = new EquipmentInMaintenanceError('E123');

      expect(error.metadata).toEqual({ equipmentId: 'E123' });
    });

    it('should support additional metadata', () => {
      const additionalMetadata = {
        maintenanceStartDate: '2024-01-01',
        estimatedCompletion: '2024-01-15',
      };
      const error = new EquipmentInMaintenanceError('E123', additionalMetadata);

      expect(error.metadata).toEqual({
        equipmentId: 'E123',
        maintenanceStartDate: '2024-01-01',
        estimatedCompletion: '2024-01-15',
      });
    });

    it('should be throwable', () => {
      try {
        throw new EquipmentInMaintenanceError('E123');
      } catch (error) {
        expect(error).toBeInstanceOf(DomainException);
        expect(error).toBeInstanceOf(EquipmentInMaintenanceError);
      }
    });
  });

  describe('EquipmentConditionUnacceptableError', () => {
    it('should create error with equipment ID and condition', () => {
      const error = new EquipmentConditionUnacceptableError('E123', 'POOR');

      expect(error.message).toBe("Equipment E123 condition 'POOR' is unacceptable for rental");
      expect(error.code).toBe('EQUIPMENT_CONDITION_UNACCEPTABLE');
    });

    it('should include equipment ID and condition in metadata', () => {
      const error = new EquipmentConditionUnacceptableError('E123', 'POOR');

      expect(error.metadata).toEqual({
        equipmentId: 'E123',
        currentCondition: 'POOR',
      });
    });

    it('should merge additional metadata', () => {
      const additionalMetadata = { minRequiredCondition: 'FAIR', assessmentDate: '2024-01-01' };
      const error = new EquipmentConditionUnacceptableError('E123', 'POOR', additionalMetadata);

      expect(error.metadata).toEqual({
        equipmentId: 'E123',
        currentCondition: 'POOR',
        minRequiredCondition: 'FAIR',
        assessmentDate: '2024-01-01',
      });
    });

    it('should work with different condition values', () => {
      const conditions = ['DAMAGED', 'POOR', 'UNUSABLE'];

      conditions.forEach((condition) => {
        const error = new EquipmentConditionUnacceptableError('E123', condition);
        expect(error.message).toContain(condition);
        expect(error.metadata?.currentCondition).toBe(condition);
      });
    });
  });

  describe('EquipmentRetiredError', () => {
    it('should create error with equipment ID', () => {
      const error = new EquipmentRetiredError('E123');

      expect(error.message).toBe('Equipment E123 has been retired and cannot be used');
      expect(error.code).toBe('EQUIPMENT_RETIRED');
    });

    it('should include equipment ID in metadata', () => {
      const error = new EquipmentRetiredError('E123');

      expect(error.metadata).toEqual({ equipmentId: 'E123' });
    });

    it('should support additional metadata', () => {
      const additionalMetadata = { retiredDate: '2023-12-31', reason: 'end of life' };
      const error = new EquipmentRetiredError('E123', additionalMetadata);

      expect(error.metadata).toEqual({
        equipmentId: 'E123',
        retiredDate: '2023-12-31',
        reason: 'end of life',
      });
    });

    it('should be an instance of DomainException', () => {
      const error = new EquipmentRetiredError('E123');

      expect(error).toBeInstanceOf(EquipmentRetiredError);
      expect(error).toBeInstanceOf(DomainException);
    });
  });

  describe('All Equipment Exceptions', () => {
    it('should all extend DomainException', () => {
      const exceptions = [
        new EquipmentNotAvailableError('E123', 'test'),
        new EquipmentNotFoundError('E123'),
        new EquipmentAlreadyRentedError('E123', 'R456'),
        new EquipmentInMaintenanceError('E123'),
        new EquipmentConditionUnacceptableError('E123', 'POOR'),
        new EquipmentRetiredError('E123'),
      ];

      exceptions.forEach((exception) => {
        expect(exception).toBeInstanceOf(DomainException);
        expect(exception).toBeInstanceOf(Error);
      });
    });

    it('should all have unique error codes', () => {
      const exceptions = [
        new EquipmentNotAvailableError('E123', 'test'),
        new EquipmentNotFoundError('E123'),
        new EquipmentAlreadyRentedError('E123', 'R456'),
        new EquipmentInMaintenanceError('E123'),
        new EquipmentConditionUnacceptableError('E123', 'POOR'),
        new EquipmentRetiredError('E123'),
      ];

      const codes = exceptions.map((e) => e.code);
      const uniqueCodes = new Set(codes);

      expect(uniqueCodes.size).toBe(codes.length);
    });

    it('should all have timestamps', () => {
      const exceptions = [
        new EquipmentNotAvailableError('E123', 'test'),
        new EquipmentNotFoundError('E123'),
        new EquipmentAlreadyRentedError('E123', 'R456'),
        new EquipmentInMaintenanceError('E123'),
        new EquipmentConditionUnacceptableError('E123', 'POOR'),
        new EquipmentRetiredError('E123'),
      ];

      exceptions.forEach((exception) => {
        expect(exception.timestamp).toBeInstanceOf(Date);
      });
    });

    it('should all include equipmentId in metadata', () => {
      const exceptions = [
        new EquipmentNotAvailableError('E123', 'test'),
        new EquipmentNotFoundError('E123'),
        new EquipmentAlreadyRentedError('E123', 'R456'),
        new EquipmentInMaintenanceError('E123'),
        new EquipmentConditionUnacceptableError('E123', 'POOR'),
        new EquipmentRetiredError('E123'),
      ];

      exceptions.forEach((exception) => {
        expect(exception.metadata?.equipmentId).toBe('E123');
      });
    });
  });
});
