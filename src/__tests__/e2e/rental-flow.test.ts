/**
 * End-to-End Tests: Rental Creation and Management Flow
 *
 * Tests complete rental workflows through HTTP endpoints including:
 * - Rental creation with payment processing
 * - Rental retrieval and status checking
 * - Rental extension with additional payments
 * - Equipment availability during active rentals
 */

import request from 'supertest';
import {
  TestContext,
  createTestApp,
  cleanupTestApp,
  createTestEquipment,
  createTestMember,
} from './setup.js';
import { EquipmentCondition } from '../../domain/types/EquipmentCondition.js';
import { MembershipTier } from '../../domain/types/MembershipTier.js';

describe('E2E: Rental Creation and Management Flow', () => {
  let context: TestContext;

  beforeEach(async () => {
    context = await createTestApp();
  });

  afterEach(async () => {
    await cleanupTestApp(context);
  });

  describe('Complete Rental Creation Flow', () => {
    it('should successfully create a rental through the entire flow', async () => {
      // Setup: Create equipment and member
      const equipment = await createTestEquipment(context.equipmentRepository, {
        id: 'eq-drill-001',
        name: 'Professional Drill',
        category: 'Power Tools',
        dailyRate: 25,
        condition: EquipmentCondition.EXCELLENT,
        isAvailable: true,
      });

      const member = await createTestMember(context.memberRepository, {
        id: 'mem-john-001',
        name: 'John Doe',
        email: 'john@example.com',
        tier: MembershipTier.BASIC,
      });

      // Act: Create rental via API
      const createResponse = await request(context.app)
        .post('/api/rentals')
        .send({
          equipmentId: equipment.id.toString(),
          memberId: member.id.toString(),
          startDate: new Date('2024-01-01T00:00:00Z').toISOString(),
          endDate: new Date('2024-01-05T00:00:00Z').toISOString(),
          paymentMethod: { type: 'CREDIT_CARD', token: 'tok_test' },
        });

      // Assert: Rental created successfully
      expect(createResponse.status).toBe(201);
      expect(createResponse.body).toMatchObject({
        rentalId: expect.any(String),
        totalCost: expect.any(Number),
        transactionId: expect.any(String),
        paymentStatus: 'SUCCESS',
      });

      const rentalId = createResponse.body.rentalId;

      // Verify: Get rental details
      const getRentalResponse = await request(context.app).get(`/api/rentals/${rentalId}`);

      expect(getRentalResponse.status).toBe(200);
      expect(getRentalResponse.body).toMatchObject({
        rentalId,
        equipmentId: equipment.id.toString(),
        memberId: member.id.toString(),
        status: 'ACTIVE',
      });

      // Verify: Equipment is no longer available
      const equipmentResponse = await request(context.app).get(
        `/api/equipment/${equipment.id.toString()}`,
      );

      expect(equipmentResponse.status).toBe(200);
      expect(equipmentResponse.body.isAvailable).toBe(false);

      // Verify: Member's rental shows in their rental list
      const memberRentalsResponse = await request(context.app).get(
        `/api/rentals/member/${member.id.toString()}`,
      );

      expect(memberRentalsResponse.status).toBe(200);
      expect(memberRentalsResponse.body).toHaveLength(1);
      expect(memberRentalsResponse.body[0].rentalId).toBe(rentalId);
    });

    it('should prevent renting unavailable equipment', async () => {
      // Setup: Create unavailable equipment and member
      const equipment = await createTestEquipment(context.equipmentRepository, {
        id: 'eq-unavailable-001',
        name: 'Unavailable Drill',
        isAvailable: false,
      });

      const member = await createTestMember(context.memberRepository, {
        id: 'mem-jane-001',
        name: 'Jane Smith',
      });

      // Act: Attempt to create rental
      const response = await request(context.app)
        .post('/api/rentals')
        .send({
          equipmentId: equipment.id.toString(),
          memberId: member.id.toString(),
          startDate: new Date('2024-01-01T00:00:00Z').toISOString(),
          endDate: new Date('2024-01-05T00:00:00Z').toISOString(),
          paymentMethod: { type: 'CREDIT_CARD', token: 'tok_test' },
        });

      // Assert: Rental creation should fail
      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('EQUIPMENT_NOT_AVAILABLE');
    });

    it('should apply membership tier discounts correctly', async () => {
      // Setup: Create equipment and premium member
      const equipment = await createTestEquipment(context.equipmentRepository, {
        id: 'eq-drill-002',
        name: 'Premium Drill',
        dailyRate: 100, // $100/day
      });

      const premiumMember = await createTestMember(context.memberRepository, {
        id: 'mem-premium-001',
        name: 'Premium Member',
        tier: MembershipTier.GOLD, // Premium gets 10% discount
      });

      // Act: Create 5-day rental (should be $500 - 10% = $450)
      const response = await request(context.app)
        .post('/api/rentals')
        .send({
          equipmentId: equipment.id.toString(),
          memberId: premiumMember.id.toString(),
          startDate: new Date('2024-01-01T00:00:00Z').toISOString(),
          endDate: new Date('2024-01-06T00:00:00Z').toISOString(), // 5 days
          paymentMethod: { type: 'CREDIT_CARD', token: 'tok_test' },
        });

      // Assert: Correct discount applied
      expect(response.status).toBe(201);
      expect(response.body.totalCost).toBe(450); // $500 - 10%
      expect(response.body.discountApplied).toBe(50); // 10% of $500
    });

    it('should handle equipment not found error', async () => {
      // Setup: Create member only
      const member = await createTestMember(context.memberRepository, {
        id: 'mem-test-001',
        name: 'Test Member',
      });

      // Act: Attempt to rent non-existent equipment
      const response = await request(context.app)
        .post('/api/rentals')
        .send({
          equipmentId: 'non-existent-equipment',
          memberId: member.id.toString(),
          startDate: new Date('2024-01-01T00:00:00Z').toISOString(),
          endDate: new Date('2024-01-05T00:00:00Z').toISOString(),
          paymentMethod: { type: 'CREDIT_CARD', token: 'tok_test' },
        });

      // Assert: Should return equipment not found error
      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('EQUIPMENT_NOT_FOUND');
    });

    it('should handle member not found error', async () => {
      // Setup: Create equipment only
      const equipment = await createTestEquipment(context.equipmentRepository, {
        id: 'eq-test-001',
        name: 'Test Equipment',
      });

      // Act: Attempt to create rental for non-existent member
      const response = await request(context.app)
        .post('/api/rentals')
        .send({
          equipmentId: equipment.id.toString(),
          memberId: 'non-existent-member',
          startDate: new Date('2024-01-01T00:00:00Z').toISOString(),
          endDate: new Date('2024-01-05T00:00:00Z').toISOString(),
          paymentMethod: { type: 'CREDIT_CARD', token: 'tok_test' },
        });

      // Assert: Should return member not found error
      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('MEMBER_NOT_FOUND');
    });

    it('should validate date range (end date must be after start date)', async () => {
      // Setup: Create equipment and member
      const equipment = await createTestEquipment(context.equipmentRepository);
      const member = await createTestMember(context.memberRepository);

      // Act: Attempt to create rental with invalid date range
      const response = await request(context.app)
        .post('/api/rentals')
        .send({
          equipmentId: equipment.id.toString(),
          memberId: member.id.toString(),
          startDate: new Date('2024-01-05T00:00:00Z').toISOString(),
          endDate: new Date('2024-01-01T00:00:00Z').toISOString(), // End before start
          paymentMethod: { type: 'CREDIT_CARD', token: 'tok_test' },
        });

      // Assert: Should return validation error
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Rental Extension Flow', () => {
    it('should successfully extend an active rental', async () => {
      // Setup: Create rental
      const equipment = await createTestEquipment(context.equipmentRepository, {
        id: 'eq-extend-001',
        dailyRate: 50,
      });
      const member = await createTestMember(context.memberRepository, {
        id: 'mem-extend-001',
      });

      const createResponse = await request(context.app)
        .post('/api/rentals')
        .send({
          equipmentId: equipment.id.toString(),
          memberId: member.id.toString(),
          startDate: new Date('2024-01-01T00:00:00Z').toISOString(),
          endDate: new Date('2024-01-05T00:00:00Z').toISOString(),
          paymentMethod: { type: 'CREDIT_CARD', token: 'tok_test' },
        });

      expect(createResponse.status).toBe(201);
      const rentalId = createResponse.body.rentalId;

      // Act: Extend rental by 3 days
      const extendResponse = await request(context.app)
        .put(`/api/rentals/${rentalId}/extend`)
        .send({
          additionalDays: 3,
          paymentMethod: { type: 'CREDIT_CARD', token: 'tok_test' },
        });

      // Assert: Extension successful
      expect(extendResponse.status).toBe(200);
      expect(extendResponse.body).toMatchObject({
        rentalId,
        additionalCost: 150, // 3 days * $50/day
        paymentStatus: 'SUCCESS',
      });

      // Verify: Rental has new end date
      const getRentalResponse = await request(context.app).get(`/api/rentals/${rentalId}`);
      expect(getRentalResponse.status).toBe(200);
      expect(new Date(getRentalResponse.body.endDate)).toEqual(new Date('2024-01-08T00:00:00Z'));
    });

    it('should reject extension with invalid days', async () => {
      // Setup: Create rental
      const equipment = await createTestEquipment(context.equipmentRepository);
      const member = await createTestMember(context.memberRepository);

      const createResponse = await request(context.app)
        .post('/api/rentals')
        .send({
          equipmentId: equipment.id.toString(),
          memberId: member.id.toString(),
          startDate: new Date('2024-01-01T00:00:00Z').toISOString(),
          endDate: new Date('2024-01-05T00:00:00Z').toISOString(),
          paymentMethod: { type: 'CREDIT_CARD', token: 'tok_test' },
        });

      const rentalId = createResponse.body.rentalId;

      // Act: Attempt to extend with invalid days
      const extendResponse = await request(context.app)
        .put(`/api/rentals/${rentalId}/extend`)
        .send({
          additionalDays: -1, // Invalid
          paymentMethod: { type: 'CREDIT_CARD', token: 'tok_test' },
        });

      // Assert: Should fail validation
      expect(extendResponse.status).toBe(400);
      expect(extendResponse.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Rental Query Operations', () => {
    it('should retrieve overdue rentals', async () => {
      // Setup: Create rental with past end date
      const equipment = await createTestEquipment(context.equipmentRepository, {
        id: 'eq-overdue-001',
      });
      const member = await createTestMember(context.memberRepository, {
        id: 'mem-overdue-001',
      });

      await request(context.app)
        .post('/api/rentals')
        .send({
          equipmentId: equipment.id.toString(),
          memberId: member.id.toString(),
          startDate: new Date('2024-01-01T00:00:00Z').toISOString(),
          endDate: new Date('2024-01-03T00:00:00Z').toISOString(), // Past end date
          paymentMethod: { type: 'CREDIT_CARD', token: 'tok_test' },
        });

      // Act: Query for overdue rentals
      const overdueResponse = await request(context.app).get('/api/rentals/status/overdue');

      // Assert: Should include the overdue rental
      expect(overdueResponse.status).toBe(200);
      expect(overdueResponse.body.length).toBeGreaterThan(0);
      const overdueRental = overdueResponse.body.find(
        (r: any) => r.equipmentId === equipment.id.toString(),
      );
      expect(overdueRental).toBeDefined();
      expect(overdueRental.daysOverdue).toBeGreaterThan(0);
    });

    it('should retrieve all rentals for a specific member', async () => {
      // Setup: Create multiple rentals for same member
      const member = await createTestMember(context.memberRepository, {
        id: 'mem-multi-001',
      });

      const equipment1 = await createTestEquipment(context.equipmentRepository, {
        id: 'eq-multi-001',
      });
      const equipment2 = await createTestEquipment(context.equipmentRepository, {
        id: 'eq-multi-002',
      });

      // Use current dates to avoid overdue status blocking second rental
      const now = new Date();
      const rental1Start = new Date(now);
      rental1Start.setDate(now.getDate() - 2); // Started 2 days ago
      const rental1End = new Date(now);
      rental1End.setDate(now.getDate() + 3); // Ends in 3 days

      const rental2Start = new Date(now);
      rental2Start.setDate(now.getDate() + 10); // Starts in 10 days
      const rental2End = new Date(now);
      rental2End.setDate(now.getDate() + 15); // Ends in 15 days

      await request(context.app)
        .post('/api/rentals')
        .send({
          equipmentId: equipment1.id.toString(),
          memberId: member.id.toString(),
          startDate: rental1Start.toISOString(),
          endDate: rental1End.toISOString(),
          paymentMethod: { type: 'CREDIT_CARD', token: 'tok_test' },
        });

      await request(context.app)
        .post('/api/rentals')
        .send({
          equipmentId: equipment2.id.toString(),
          memberId: member.id.toString(),
          startDate: rental2Start.toISOString(),
          endDate: rental2End.toISOString(),
          paymentMethod: { type: 'CREDIT_CARD', token: 'tok_test' },
        });

      // Act: Get member's rentals
      const memberRentalsResponse = await request(context.app).get(
        `/api/rentals/member/${member.id.toString()}`,
      );

      // Assert: Should return all member's rentals
      expect(memberRentalsResponse.status).toBe(200);
      expect(memberRentalsResponse.body).toHaveLength(2);
    });
  });
});
