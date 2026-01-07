import { Request, Response, NextFunction } from 'express';
import { errorHandler, notFoundHandler } from '../errorHandler.js';
import { EquipmentNotFoundError } from '../../../../../domain/exceptions/EquipmentExceptions.js';
import { MemberSuspendedError } from '../../../../../domain/exceptions/MemberExceptions.js';
import { RentalNotAllowedError } from '../../../../../domain/exceptions/RentalExceptions.js';
import { DomainException } from '../../../../../domain/exceptions/DomainException.js';

describe('errorHandler middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockRequest = {
      method: 'GET',
      path: '/api/test',
    };

    mockResponse = {
      status: statusMock,
    };

    mockNext = jest.fn();

    // Suppress console.error for tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Not Found Errors', () => {
    it('should return 404 for EquipmentNotFoundError', () => {
      const error = new EquipmentNotFoundError('eq-123');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        error: {
          code: 'EQUIPMENT_NOT_FOUND',
          message: expect.stringContaining('eq-123'),
          details: {
            type: 'EquipmentNotFoundError',
          },
        },
      });
    });
  });

  describe('Forbidden Errors', () => {
    it('should return 403 for MemberSuspendedError', () => {
      const error = new MemberSuspendedError('mem-123', 'Account suspended for non-payment');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        error: {
          code: 'MEMBER_SUSPENDED',
          message: expect.any(String),
          details: {
            type: 'MemberSuspendedError',
          },
        },
      });
    });
  });

  describe('Conflict Errors', () => {
    it('should return 409 for RentalNotAllowedError', () => {
      const error = new RentalNotAllowedError('Equipment not available', {
        rentalId: 'rental-123',
      });

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith({
        error: {
          code: 'RENTAL_NOT_ALLOWED',
          message: expect.any(String),
          details: {
            type: 'RentalNotAllowedError',
          },
        },
      });
    });
  });

  describe('Generic Domain Exceptions', () => {
    it('should return 400 for unknown domain exceptions', () => {
      class CustomDomainError extends DomainException {
        constructor() {
          super('Custom domain error', 'CUSTOM_ERROR');
        }
      }

      const error = new CustomDomainError();

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: {
          code: 'CUSTOM_DOMAIN',
          message: 'Custom domain error',
          details: {
            type: 'CustomDomainError',
          },
        },
      });
    });
  });

  describe('Generic Errors', () => {
    it('should return 500 for unknown errors', () => {
      const error = new Error('Something went wrong');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Something went wrong',
        },
      });
    });
  });

  describe('Logging', () => {
    it('should log error details', () => {
      const error = new Error('Test error');
      const consoleSpy = jest.spyOn(console, 'error');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error handling request:',
        expect.objectContaining({
          method: 'GET',
          path: '/api/test',
          error: 'Test error',
        }),
      );
    });
  });
});

describe('notFoundHandler middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockRequest = {
      method: 'POST',
      path: '/api/unknown',
    };

    mockResponse = {
      status: statusMock,
    };
  });

  it('should return 404 with route information', () => {
    notFoundHandler(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: 'Route not found: POST /api/unknown',
      },
    });
  });
});
