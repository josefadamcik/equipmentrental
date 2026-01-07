import request from 'supertest';
import express, { Express } from 'express';
import { EquipmentController } from '../EquipmentController.js';
import { GetAvailableEquipmentQueryHandler } from '../../../../../application/queries/GetAvailableEquipmentQuery.js';
import { EquipmentRepository } from '../../../../../domain/ports/EquipmentRepository.js';
import { Equipment } from '../../../../../domain/entities/Equipment.js';
import { EquipmentId } from '../../../../../domain/value-objects/identifiers.js';
import { Money } from '../../../../../domain/value-objects/Money.js';
import { errorHandler } from '../../middleware/errorHandler.js';

describe('EquipmentController', () => {
  let app: Express;
  let getAvailableEquipmentQueryHandler: jest.Mocked<GetAvailableEquipmentQueryHandler>;
  let equipmentRepository: jest.Mocked<EquipmentRepository>;

  beforeEach(() => {
    // Create mock services
    getAvailableEquipmentQueryHandler = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetAvailableEquipmentQueryHandler>;

    equipmentRepository = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<EquipmentRepository>;

    // Create controller and app
    const controller = new EquipmentController(
      getAvailableEquipmentQueryHandler,
      equipmentRepository,
    );

    app = express();
    app.use(express.json());
    app.use('/api/equipment', controller.getRouter());
    app.use(errorHandler);
  });

  describe('GET /api/equipment', () => {
    it('should get all available equipment', async () => {
      const mockResults = [
        {
          equipmentId: 'eq-123',
          name: 'Drill',
          description: 'Power drill',
          category: 'Tools',
          dailyRate: 25,
          condition: 'EXCELLENT',
        },
        {
          equipmentId: 'eq-456',
          name: 'Ladder',
          description: 'Extension ladder',
          category: 'Ladders',
          dailyRate: 15,
          condition: 'GOOD',
        },
      ];

      getAvailableEquipmentQueryHandler.execute.mockResolvedValue(mockResults);

      const response = await request(app).get('/api/equipment');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResults);
      expect(getAvailableEquipmentQueryHandler.execute).toHaveBeenCalledWith({
        category: undefined,
      });
    });

    it('should get available equipment filtered by category', async () => {
      const mockResults = [
        {
          equipmentId: 'eq-123',
          name: 'Drill',
          description: 'Power drill',
          category: 'Tools',
          dailyRate: 25,
          condition: 'EXCELLENT',
        },
      ];

      getAvailableEquipmentQueryHandler.execute.mockResolvedValue(mockResults);

      const response = await request(app).get('/api/equipment?category=Tools');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResults);
      expect(getAvailableEquipmentQueryHandler.execute).toHaveBeenCalledWith({
        category: 'Tools',
      });
    });

    it('should return empty array when no equipment available', async () => {
      getAvailableEquipmentQueryHandler.execute.mockResolvedValue([]);

      const response = await request(app).get('/api/equipment');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('GET /api/equipment/:equipmentId', () => {
    it('should get equipment details successfully', async () => {
      const mockEquipment = Equipment.reconstitute({
        id: EquipmentId.create('eq-123'),
        name: 'Drill',
        description: 'Power drill',
        category: 'Tools',
        dailyRate: Money.dollars(25),
        condition: 'EXCELLENT',
        isAvailable: true,
        purchaseDate: new Date('2023-01-01'),
      });

      equipmentRepository.findById.mockResolvedValue(mockEquipment);

      const response = await request(app).get('/api/equipment/eq-123');

      expect(response.status).toBe(200);
      expect(response.body.equipmentId).toBe('eq-123');
      expect(response.body.name).toBe('Drill');
      expect(response.body.dailyRate).toBe(25);
      expect(response.body.isAvailable).toBe(true);
    });

    it('should return 404 for non-existent equipment', async () => {
      equipmentRepository.findById.mockResolvedValue(undefined);

      const response = await request(app).get('/api/equipment/non-existent');

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('EQUIPMENT_NOT_FOUND');
    });

    it('should return equipment without maintenance schedule', async () => {
      const mockEquipment = Equipment.reconstitute({
        id: EquipmentId.create('eq-123'),
        name: 'Drill',
        description: 'Power drill',
        category: 'Tools',
        dailyRate: Money.dollars(25),
        condition: 'EXCELLENT',
        isAvailable: true,
        purchaseDate: new Date('2023-01-01'),
      });

      equipmentRepository.findById.mockResolvedValue(mockEquipment);

      const response = await request(app).get('/api/equipment/eq-123');

      expect(response.status).toBe(200);
      expect(response.body.equipmentId).toBe('eq-123');
    });
  });
});
