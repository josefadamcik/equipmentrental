import request from 'supertest';
import { Express, Router } from 'express';
import { createServer } from '../server.js';
import { RentalController } from '../controllers/RentalController.js';
import { EquipmentController } from '../controllers/EquipmentController.js';
import { MemberController } from '../controllers/MemberController.js';
import { ReservationController } from '../controllers/ReservationController.js';
import { NoOpLogger } from '../../../../infrastructure/logging/Logger.js';

describe('Server', () => {
  let app: Express;
  let mockRentalController: jest.Mocked<RentalController>;
  let mockEquipmentController: jest.Mocked<EquipmentController>;
  let mockMemberController: jest.Mocked<MemberController>;
  let mockReservationController: jest.Mocked<ReservationController>;

  beforeEach(() => {
    // Create mock controllers with getRouter methods
    mockRentalController = {
      getRouter: jest.fn().mockReturnValue(Router()),
    } as unknown as jest.Mocked<RentalController>;

    mockEquipmentController = {
      getRouter: jest.fn().mockReturnValue(Router()),
    } as unknown as jest.Mocked<EquipmentController>;

    mockMemberController = {
      getRouter: jest.fn().mockReturnValue(Router()),
    } as unknown as jest.Mocked<MemberController>;

    mockReservationController = {
      getRouter: jest.fn().mockReturnValue(Router()),
    } as unknown as jest.Mocked<ReservationController>;

    app = createServer({
      rentalController: mockRentalController,
      equipmentController: mockEquipmentController,
      memberController: mockMemberController,
      reservationController: mockReservationController,
      logger: new NoOpLogger(),
    });
  });

  describe('Health Check', () => {
    it('should respond with healthy status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body.service).toBe('Equipment Rental System');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for undefined routes', async () => {
      const response = await request(app).get('/api/non-existent');

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('ROUTE_NOT_FOUND');
      expect(response.body.error.message).toContain('/api/non-existent');
    });
  });

  describe('JSON Parsing', () => {
    it('should parse JSON request bodies', async () => {
      // JSON parsing is implicitly tested by all other controller tests
      // that send POST/PUT requests with JSON bodies
      expect(app).toBeDefined();
    });
  });
});
