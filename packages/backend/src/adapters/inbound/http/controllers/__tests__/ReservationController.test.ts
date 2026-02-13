import request from 'supertest';
import express, { Express } from 'express';
import { ReservationController } from '../ReservationController.js';
import { ReservationService } from '../../../../../application/services/ReservationService.js';
import { ReservationRepository } from '../../../../../domain/ports/ReservationRepository.js';
import { Reservation } from '../../../../../domain/entities/Reservation.js';
import {
  ReservationId,
  EquipmentId,
  MemberId,
} from '../../../../../domain/value-objects/identifiers.js';
import { DateRange } from '../../../../../domain/value-objects/DateRange.js';
import { errorHandler } from '../../middleware/errorHandler.js';

describe('ReservationController', () => {
  let app: Express;
  let reservationService: jest.Mocked<ReservationService>;
  let reservationRepository: jest.Mocked<ReservationRepository>;

  beforeEach(() => {
    // Create mock services
    reservationService = {
      createReservation: jest.fn(),
      cancelReservation: jest.fn(),
      confirmReservation: jest.fn(),
      fulfillReservation: jest.fn(),
    } as unknown as jest.Mocked<ReservationService>;

    reservationRepository = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<ReservationRepository>;

    // Create controller and app
    const controller = new ReservationController(reservationService, reservationRepository);

    app = express();
    app.use(express.json());
    app.use('/api/reservations', controller.getRouter());
    app.use(errorHandler);
  });

  describe('POST /api/reservations', () => {
    it('should create a reservation successfully', async () => {
      const mockResult = {
        reservationId: 'res-123',
        equipmentName: 'Drill',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-05'),
        totalCost: 100,
        discountApplied: 0,
      };

      const mockReservation = Reservation.reconstitute({
        id: ReservationId.create('res-123'),
        equipmentId: EquipmentId.create('eq-123'),
        memberId: MemberId.create('mem-123'),
        period: DateRange.create(new Date('2024-01-01'), new Date('2024-01-05')),
        status: 'PENDING',
        createdAt: new Date(),
      });

      reservationService.createReservation.mockResolvedValue(mockResult);
      reservationRepository.findById.mockResolvedValue(mockReservation);

      const response = await request(app).post('/api/reservations').send({
        equipmentId: 'eq-123',
        memberId: 'mem-123',
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-05T00:00:00Z',
      });

      expect(response.status).toBe(201);
      expect(response.body.reservationId).toBe('res-123');
      expect(response.body.equipmentName).toBe('Drill');
    });

    it('should create a reservation with payment authorization', async () => {
      const mockResult = {
        reservationId: 'res-123',
        equipmentName: 'Drill',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-05'),
        authorizationId: 'auth-123',
        totalCost: 100,
        discountApplied: 0,
      };

      const mockReservation = Reservation.reconstitute({
        id: ReservationId.create('res-123'),
        equipmentId: EquipmentId.create('eq-123'),
        memberId: MemberId.create('mem-123'),
        period: DateRange.create(new Date('2024-01-01'), new Date('2024-01-05')),
        status: 'CONFIRMED',
        createdAt: new Date(),
      });

      reservationService.createReservation.mockResolvedValue(mockResult);
      reservationRepository.findById.mockResolvedValue(mockReservation);

      const response = await request(app)
        .post('/api/reservations')
        .send({
          equipmentId: 'eq-123',
          memberId: 'mem-123',
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-01-05T00:00:00Z',
          paymentMethod: { type: 'CREDIT_CARD', token: 'tok-123' },
          authorizePayment: true,
        });

      expect(response.status).toBe(201);
      expect(response.body.authorizationId).toBe('auth-123');
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app).post('/api/reservations').send({
        equipmentId: 'eq-123',
        // Missing memberId, startDate, endDate
      });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid date format', async () => {
      const response = await request(app).post('/api/reservations').send({
        equipmentId: 'eq-123',
        memberId: 'mem-123',
        startDate: 'invalid-date',
        endDate: '2024-01-05T00:00:00Z',
      });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/reservations/:reservationId', () => {
    it('should get reservation details successfully', async () => {
      const mockReservation = Reservation.reconstitute({
        id: ReservationId.create('res-123'),
        equipmentId: EquipmentId.create('eq-123'),
        memberId: MemberId.create('mem-123'),
        period: DateRange.create(new Date('2024-01-01'), new Date('2024-01-05')),
        status: 'PENDING',
        createdAt: new Date('2023-12-01'),
      });

      reservationRepository.findById.mockResolvedValue(mockReservation);

      const response = await request(app).get('/api/reservations/res-123');

      expect(response.status).toBe(200);
      expect(response.body.reservationId).toBe('res-123');
      expect(response.body.equipmentId).toBe('eq-123');
      expect(response.body.memberId).toBe('mem-123');
    });

    it('should return 404 for non-existent reservation', async () => {
      reservationRepository.findById.mockResolvedValue(undefined);

      const response = await request(app).get('/api/reservations/non-existent');

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('RESERVATION_NOT_FOUND');
    });
  });

  describe('PUT /api/reservations/:reservationId/cancel', () => {
    it('should cancel a reservation successfully', async () => {
      const mockResult = {
        reservationId: 'res-123',
        cancelledAt: new Date('2024-01-01'),
      };

      reservationService.cancelReservation.mockResolvedValue(mockResult);

      const response = await request(app).put('/api/reservations/res-123/cancel').send({
        reason: 'Changed plans',
      });

      expect(response.status).toBe(200);
      expect(response.body.reservationId).toBe('res-123');
    });

    it('should cancel reservation with refund', async () => {
      const mockResult = {
        reservationId: 'res-123',
        cancelledAt: new Date('2024-01-01'),
        refundAmount: 50,
        refundTransactionId: 'refund-123',
      };

      reservationService.cancelReservation.mockResolvedValue(mockResult);

      const response = await request(app).put('/api/reservations/res-123/cancel').send({
        authorizationId: 'auth-123',
      });

      expect(response.status).toBe(200);
      expect(response.body.refundAmount).toBe(50);
      expect(response.body.refundTransactionId).toBe('refund-123');
    });
  });

  describe('PUT /api/reservations/:reservationId/confirm', () => {
    it('should confirm a reservation successfully', async () => {
      const mockResult = {
        reservationId: 'res-123',
        confirmedAt: new Date('2024-01-01'),
      };

      reservationService.confirmReservation.mockResolvedValue(mockResult);

      const response = await request(app).put('/api/reservations/res-123/confirm').send({});

      expect(response.status).toBe(200);
      expect(response.body.reservationId).toBe('res-123');
    });
  });

  describe('POST /api/reservations/:reservationId/fulfill', () => {
    it('should fulfill a reservation successfully', async () => {
      const mockResult = {
        reservationId: 'res-123',
        rentalId: 'rental-123',
        totalCost: 100,
        transactionId: 'txn-123',
        paymentStatus: 'SUCCESS',
      };

      reservationService.fulfillReservation.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/reservations/res-123/fulfill')
        .send({
          paymentMethod: { type: 'CREDIT_CARD', token: 'tok-123' },
        });

      expect(response.status).toBe(201);
      expect(response.body.reservationId).toBe('res-123');
      expect(response.body.rentalId).toBe('rental-123');
    });

    it('should fulfill reservation with captured authorization', async () => {
      const mockResult = {
        reservationId: 'res-123',
        rentalId: 'rental-123',
        totalCost: 100,
        transactionId: 'txn-123',
        paymentStatus: 'SUCCESS',
      };

      reservationService.fulfillReservation.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/reservations/res-123/fulfill')
        .send({
          paymentMethod: { type: 'CREDIT_CARD' },
          authorizationId: 'auth-123',
        });

      expect(response.status).toBe(201);
      expect(response.body.transactionId).toBe('txn-123');
    });

    it('should return 400 for missing payment method', async () => {
      const response = await request(app).post('/api/reservations/res-123/fulfill').send({});

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
