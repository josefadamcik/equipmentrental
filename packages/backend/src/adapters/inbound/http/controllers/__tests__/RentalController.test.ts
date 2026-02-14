import request from 'supertest';
import express, { Express } from 'express';
import { RentalController } from '../RentalController.js';
import { RentalService } from '../../../../../application/services/RentalService.js';
import { GetRentalQueryHandler } from '../../../../../application/queries/GetRentalQuery.js';
import { GetMemberRentalsQueryHandler } from '../../../../../application/queries/GetMemberRentalsQuery.js';
import { GetOverdueRentalsQueryHandler } from '../../../../../application/queries/GetOverdueRentalsQuery.js';
import { RentalRepository } from '../../../../../domain/ports/RentalRepository.js';
import { errorHandler } from '../../middleware/errorHandler.js';
import { EquipmentNotFoundError } from '../../../../../domain/exceptions/EquipmentExceptions.js';

describe('RentalController', () => {
  let app: Express;
  let rentalService: jest.Mocked<RentalService>;
  let getRentalQueryHandler: jest.Mocked<GetRentalQueryHandler>;
  let getMemberRentalsQueryHandler: jest.Mocked<GetMemberRentalsQueryHandler>;
  let getOverdueRentalsQueryHandler: jest.Mocked<GetOverdueRentalsQueryHandler>;
  let rentalRepository: jest.Mocked<RentalRepository>;

  beforeEach(() => {
    // Create mock services
    rentalService = {
      createRentalWithPayment: jest.fn(),
      returnRentalWithPayment: jest.fn(),
      extendRental: jest.fn(),
    } as unknown as jest.Mocked<RentalService>;

    getRentalQueryHandler = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetRentalQueryHandler>;

    getMemberRentalsQueryHandler = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetMemberRentalsQueryHandler>;

    getOverdueRentalsQueryHandler = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetOverdueRentalsQueryHandler>;

    rentalRepository = {
      findAll: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<RentalRepository>;

    // Create controller and app
    const controller = new RentalController(
      rentalService,
      getRentalQueryHandler,
      getMemberRentalsQueryHandler,
      getOverdueRentalsQueryHandler,
      rentalRepository,
    );

    app = express();
    app.use(express.json());
    app.use('/api/rentals', controller.getRouter());
    app.use(errorHandler);
  });

  describe('POST /api/rentals', () => {
    it('should create a rental successfully', async () => {
      const mockResult = {
        rentalId: 'rental-123',
        totalCost: 100,
        discountApplied: 10,
        transactionId: 'txn-123',
        paymentStatus: 'SUCCESS',
      };

      rentalService.createRentalWithPayment.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/rentals')
        .send({
          equipmentId: 'eq-123',
          memberId: 'mem-123',
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-01-05T00:00:00Z',
          paymentMethod: { type: 'CREDIT_CARD', token: 'tok-123' },
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockResult);
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app).post('/api/rentals').send({
        equipmentId: 'eq-123',
        // Missing memberId, startDate, endDate, paymentMethod
      });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid date format', async () => {
      const response = await request(app)
        .post('/api/rentals')
        .send({
          equipmentId: 'eq-123',
          memberId: 'mem-123',
          startDate: 'invalid-date',
          endDate: '2024-01-05T00:00:00Z',
          paymentMethod: { type: 'CREDIT_CARD' },
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle equipment not found error', async () => {
      rentalService.createRentalWithPayment.mockRejectedValue(new EquipmentNotFoundError('eq-123'));

      const response = await request(app)
        .post('/api/rentals')
        .send({
          equipmentId: 'eq-123',
          memberId: 'mem-123',
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-01-05T00:00:00Z',
          paymentMethod: { type: 'CREDIT_CARD' },
        });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('EQUIPMENT_NOT_FOUND');
    });
  });

  describe('GET /api/rentals/:rentalId', () => {
    it('should get rental details successfully', async () => {
      const mockRental = {
        rentalId: 'rental-123',
        equipmentId: 'eq-123',
        memberId: 'mem-123',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-05'),
        status: 'ACTIVE',
        totalCost: 100,
        conditionAtStart: 'EXCELLENT',
        lateFee: 0,
      };

      getRentalQueryHandler.execute.mockResolvedValue(mockRental);

      const response = await request(app).get('/api/rentals/rental-123');

      expect(response.status).toBe(200);
      expect(response.body.rentalId).toBe('rental-123');
      expect(response.body.equipmentId).toBe('eq-123');
    });

    it('should return 404 for non-existent rental', async () => {
      getRentalQueryHandler.execute.mockResolvedValue(undefined);

      const response = await request(app).get('/api/rentals/non-existent');

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('RENTAL_NOT_FOUND');
    });
  });

  describe('PUT /api/rentals/:rentalId/return', () => {
    it('should return a rental successfully', async () => {
      const mockResult = {
        rentalId: 'rental-123',
        totalCost: 100,
        lateFee: 0,
        damageFee: 0,
      };

      rentalService.returnRentalWithPayment.mockResolvedValue(mockResult);

      const response = await request(app).put('/api/rentals/rental-123/return').send({
        conditionAtReturn: 'GOOD',
      });

      expect(response.status).toBe(200);
      expect(response.body.rentalId).toBe('rental-123');
    });

    it('should return 400 for missing condition', async () => {
      const response = await request(app).put('/api/rentals/rental-123/return').send({});

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PUT /api/rentals/:rentalId/extend', () => {
    it('should extend a rental successfully', async () => {
      const mockResult = {
        rentalId: 'rental-123',
        newEndDate: new Date('2024-01-10'),
        additionalCost: 50,
        transactionId: 'txn-456',
        paymentStatus: 'SUCCESS',
      };

      rentalService.extendRental.mockResolvedValue(mockResult);

      const response = await request(app)
        .put('/api/rentals/rental-123/extend')
        .send({
          additionalDays: 5,
          paymentMethod: { type: 'CREDIT_CARD' },
        });

      expect(response.status).toBe(200);
      expect(response.body.rentalId).toBe('rental-123');
    });

    it('should return 400 for invalid additionalDays', async () => {
      const response = await request(app)
        .put('/api/rentals/rental-123/extend')
        .send({
          additionalDays: -1,
          paymentMethod: { type: 'CREDIT_CARD' },
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/rentals/status/overdue', () => {
    it('should get overdue rentals successfully', async () => {
      const mockResults = [
        {
          rentalId: 'rental-123',
          equipmentId: 'eq-123',
          memberId: 'mem-123',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-05'),
          totalCost: 100,
          lateFee: 30,
          daysOverdue: 3,
        },
      ];

      getOverdueRentalsQueryHandler.execute.mockResolvedValue(mockResults);

      const response = await request(app).get('/api/rentals/status/overdue');

      expect(response.status).toBe(200);
      // Dates are serialized to ISO strings by Express
      expect(response.body).toEqual([
        {
          ...mockResults[0],
          startDate: '2024-01-01T00:00:00.000Z',
          endDate: '2024-01-05T00:00:00.000Z',
        },
      ]);
    });
  });

  describe('GET /api/rentals/member/:memberId', () => {
    it('should get member rentals successfully', async () => {
      const mockResults = [
        {
          rentalId: 'rental-123',
          equipmentId: 'eq-123',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-05'),
          status: 'ACTIVE',
          totalCost: 100,
          isOverdue: false,
        },
      ];

      getMemberRentalsQueryHandler.execute.mockResolvedValue(mockResults);

      const response = await request(app).get('/api/rentals/member/mem-123');

      expect(response.status).toBe(200);
      // Dates are serialized to ISO strings by Express
      expect(response.body).toEqual([
        {
          ...mockResults[0],
          startDate: '2024-01-01T00:00:00.000Z',
          endDate: '2024-01-05T00:00:00.000Z',
        },
      ]);
    });
  });
});
