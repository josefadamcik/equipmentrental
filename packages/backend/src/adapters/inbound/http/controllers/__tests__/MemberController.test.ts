import request from 'supertest';
import express, { Express } from 'express';
import { MemberController } from '../MemberController.js';
import { GetMemberRentalsQueryHandler } from '../../../../../application/queries/GetMemberRentalsQuery.js';
import { MemberRepository } from '../../../../../domain/ports/MemberRepository.js';
import { EquipmentRepository } from '../../../../../domain/ports/EquipmentRepository.js';
import { Member } from '../../../../../domain/entities/Member.js';
import { Equipment } from '../../../../../domain/entities/Equipment.js';
import { MemberId, EquipmentId } from '../../../../../domain/value-objects/identifiers.js';
import { Money } from '../../../../../domain/value-objects/Money.js';
import { errorHandler } from '../../middleware/errorHandler.js';

describe('MemberController', () => {
  let app: Express;
  let memberRepository: jest.Mocked<MemberRepository>;
  let equipmentRepository: jest.Mocked<EquipmentRepository>;
  let getMemberRentalsQueryHandler: jest.Mocked<GetMemberRentalsQueryHandler>;

  beforeEach(() => {
    // Create mock services
    memberRepository = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<MemberRepository>;

    equipmentRepository = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<EquipmentRepository>;

    getMemberRentalsQueryHandler = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetMemberRentalsQueryHandler>;

    // Create controller and app
    const controller = new MemberController(
      memberRepository,
      equipmentRepository,
      getMemberRentalsQueryHandler,
    );

    app = express();
    app.use(express.json());
    app.use('/api/members', controller.getRouter());
    app.use(errorHandler);
  });

  describe('GET /api/members/:memberId', () => {
    it('should get member details successfully', async () => {
      const mockMember = Member.reconstitute({
        id: MemberId.create('mem-123'),
        name: 'John Doe',
        email: 'john@example.com',
        tier: 'GOLD',
        joinDate: new Date('2023-01-01'),
        isActive: true,
        activeRentalCount: 0,
        totalRentals: 0,
      });

      memberRepository.findById.mockResolvedValue(mockMember);

      const response = await request(app).get('/api/members/mem-123');

      expect(response.status).toBe(200);
      expect(response.body.memberId).toBe('mem-123');
      expect(response.body.name).toBe('John Doe');
      expect(response.body.email).toBe('john@example.com');
      expect(response.body.tier).toBe('GOLD');
      expect(response.body.isActive).toBe(true);
    });

    it('should return 404 for non-existent member', async () => {
      memberRepository.findById.mockResolvedValue(undefined);

      const response = await request(app).get('/api/members/non-existent');

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('MEMBER_NOT_FOUND');
    });
  });

  describe('GET /api/members/:memberId/rentals', () => {
    it('should get member rentals successfully', async () => {
      const mockRentals = [
        {
          rentalId: 'rental-123',
          equipmentId: 'eq-123',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-05'),
          status: 'ACTIVE',
          totalCost: 100,
          isOverdue: false,
        },
        {
          rentalId: 'rental-456',
          equipmentId: 'eq-456',
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-02-03'),
          status: 'RETURNED',
          totalCost: 50,
          isOverdue: false,
        },
      ];

      const mockEquipment1 = Equipment.reconstitute({
        id: EquipmentId.create('eq-123'),
        name: 'Drill',
        description: 'Power drill',
        category: 'Tools',
        dailyRate: Money.dollars(25),
        condition: 'EXCELLENT',
        isAvailable: true,
        purchaseDate: new Date('2023-01-01'),
      });

      const mockEquipment2 = Equipment.reconstitute({
        id: EquipmentId.create('eq-456'),
        name: 'Ladder',
        description: 'Extension ladder',
        category: 'Ladders',
        dailyRate: Money.dollars(15),
        condition: 'GOOD',
        isAvailable: true,
        purchaseDate: new Date('2023-01-01'),
      });

      getMemberRentalsQueryHandler.execute.mockResolvedValue(mockRentals);
      equipmentRepository.findById
        .mockResolvedValueOnce(mockEquipment1)
        .mockResolvedValueOnce(mockEquipment2);

      const response = await request(app).get('/api/members/mem-123/rentals');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].rentalId).toBe('rental-123');
      expect(response.body[0].equipmentName).toBe('Drill');
      expect(response.body[1].rentalId).toBe('rental-456');
      expect(response.body[1].equipmentName).toBe('Ladder');
    });

    it('should return empty array when member has no rentals', async () => {
      getMemberRentalsQueryHandler.execute.mockResolvedValue([]);

      const response = await request(app).get('/api/members/mem-123/rentals');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should handle missing equipment gracefully', async () => {
      const mockRentals = [
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

      getMemberRentalsQueryHandler.execute.mockResolvedValue(mockRentals);
      equipmentRepository.findById.mockResolvedValue(undefined);

      const response = await request(app).get('/api/members/mem-123/rentals');

      expect(response.status).toBe(200);
      expect(response.body[0].equipmentName).toBe('Unknown');
    });
  });
});
