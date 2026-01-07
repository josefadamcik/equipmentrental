/**
 * End-to-End Tests: Error Scenarios and Edge Cases
 *
 * Tests comprehensive error handling and edge cases across the system including:
 * - HTTP error responses and status codes
 * - Validation errors with detailed messages
 * - Business rule violation errors
 * - Concurrent operation handling
 * - Edge cases and boundary conditions
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

describe('E2E: Error Scenarios and Edge Cases', () => {
  let context: TestContext;

  beforeEach(async () => {
    context = await createTestApp();
  });

  afterEach(async () => {
    await cleanupTestApp(context);
  });

  describe('HTTP Error Responses', () => {
    it('should return 404 for non-existent endpoints', async () => {
      const response = await request(context.app).get('/api/non-existent-endpoint');

      expect(response.status).toBe(404);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.message).toContain('not found');
    });

    it('should return 400 for malformed JSON in request body', async () => {
      const response = await request(context.app)
        .post('/api/rentals')
        .set('Content-Type', 'application/json')
        .send('{"invalid json}');

      expect(response.status).toBe(400);
    });

    it('should return 404 for all not-found resources with consistent format', async () => {
      const responses = await Promise.all([
        request(context.app).get('/api/rentals/non-existent'),
        request(context.app).get('/api/equipment/non-existent'),
        request(context.app).get('/api/members/non-existent'),
        request(context.app).get('/api/reservations/non-existent'),
      ]);

      responses.forEach((response) => {
        expect(response.status).toBe(404);
        expect(response.body.error).toBeDefined();
        expect(response.body.error.code).toBeDefined();
      });
    });

    it('should handle health check endpoint', async () => {
      const response = await request(context.app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: 'healthy',
        timestamp: expect.any(String),
        service: 'Equipment Rental System',
      });
    });
  });

  describe('Validation Errors', () => {
    it('should validate required fields for rental creation', async () => {
      const response = await request(context.app).post('/api/rentals').send({});

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toBeDefined();
    });

    it('should validate date formats', async () => {
      const equipment = await createTestEquipment(context.equipmentRepository);
      const member = await createTestMember(context.memberRepository);

      const response = await request(context.app)
        .post('/api/rentals')
        .send({
          equipmentId: equipment.id.toString(),
          memberId: member.id.toString(),
          startDate: 'invalid-date',
          endDate: 'invalid-date',
          paymentMethod: { type: 'CREDIT_CARD' },
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should validate payment method structure', async () => {
      const equipment = await createTestEquipment(context.equipmentRepository);
      const member = await createTestMember(context.memberRepository);

      const response = await request(context.app)
        .post('/api/rentals')
        .send({
          equipmentId: equipment.id.toString(),
          memberId: member.id.toString(),
          startDate: new Date('2024-01-01T00:00:00Z').toISOString(),
          endDate: new Date('2024-01-05T00:00:00Z').toISOString(),
          paymentMethod: 'invalid-payment-method', // Should be an object
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should validate positive values for amounts', async () => {
      const equipment = await createTestEquipment(context.equipmentRepository);
      const member = await createTestMember(context.memberRepository);

      const createResponse = await request(context.app)
        .post('/api/rentals')
        .send({
          equipmentId: equipment.id.toString(),
          memberId: member.id.toString(),
          startDate: new Date('2024-01-01T00:00:00Z').toISOString(),
          endDate: new Date('2024-01-05T00:00:00Z').toISOString(),
          paymentMethod: { type: 'CREDIT_CARD' },
        });

      const rentalId = createResponse.body.rentalId;

      const response = await request(context.app)
        .put(`/api/rentals/${rentalId}/extend`)
        .send({
          additionalDays: 0, // Invalid: must be positive
          paymentMethod: { type: 'CREDIT_CARD' },
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Business Rule Violations', () => {
    it('should prevent inactive members from creating rentals', async () => {
      const equipment = await createTestEquipment(context.equipmentRepository);
      const inactiveMember = await createTestMember(context.memberRepository, {
        id: 'mem-inactive-001',
        isActive: false,
      });

      const response = await request(context.app)
        .post('/api/rentals')
        .send({
          equipmentId: equipment.id.toString(),
          memberId: inactiveMember.id.toString(),
          startDate: new Date('2024-01-01T00:00:00Z').toISOString(),
          endDate: new Date('2024-01-05T00:00:00Z').toISOString(),
          paymentMethod: { type: 'CREDIT_CARD' },
        });

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('MEMBER_INACTIVE');
    });

    it('should prevent renting equipment in poor condition', async () => {
      const poorEquipment = await createTestEquipment(context.equipmentRepository, {
        id: 'eq-poor-001',
        condition: EquipmentCondition.POOR,
      });

      const member = await createTestMember(context.memberRepository);

      const response = await request(context.app)
        .post('/api/rentals')
        .send({
          equipmentId: poorEquipment.id.toString(),
          memberId: member.id.toString(),
          startDate: new Date('2024-01-01T00:00:00Z').toISOString(),
          endDate: new Date('2024-01-05T00:00:00Z').toISOString(),
          paymentMethod: { type: 'CREDIT_CARD' },
        });

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('EQUIPMENT_CONDITION_UNACCEPTABLE');
    });

    it('should prevent creating rentals with start date in the past', async () => {
      const equipment = await createTestEquipment(context.equipmentRepository);
      const member = await createTestMember(context.memberRepository);

      const response = await request(context.app)
        .post('/api/rentals')
        .send({
          equipmentId: equipment.id.toString(),
          memberId: member.id.toString(),
          startDate: new Date('2020-01-01T00:00:00Z').toISOString(), // Far in the past
          endDate: new Date('2020-01-05T00:00:00Z').toISOString(),
          paymentMethod: { type: 'CREDIT_CARD' },
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent rental creation attempts for same equipment', async () => {
      const equipment = await createTestEquipment(context.equipmentRepository, {
        id: 'eq-concurrent-001',
      });

      const member1 = await createTestMember(context.memberRepository, {
        id: 'mem-concurrent-001',
      });

      const member2 = await createTestMember(context.memberRepository, {
        id: 'mem-concurrent-002',
      });

      // Act: Send concurrent requests
      const [response1, response2] = await Promise.all([
        request(context.app)
          .post('/api/rentals')
          .send({
            equipmentId: equipment.id.toString(),
            memberId: member1.id.toString(),
            startDate: new Date('2024-01-01T00:00:00Z').toISOString(),
            endDate: new Date('2024-01-05T00:00:00Z').toISOString(),
            paymentMethod: { type: 'CREDIT_CARD' },
          }),
        request(context.app)
          .post('/api/rentals')
          .send({
            equipmentId: equipment.id.toString(),
            memberId: member2.id.toString(),
            startDate: new Date('2024-01-01T00:00:00Z').toISOString(),
            endDate: new Date('2024-01-05T00:00:00Z').toISOString(),
            paymentMethod: { type: 'CREDIT_CARD' },
          }),
      ]);

      // Assert: One should succeed, one should fail
      const statuses = [response1.status, response2.status].sort();
      expect(statuses).toEqual([201, 409]); // One success, one conflict
    });

    it('should handle concurrent reservation attempts for overlapping periods', async () => {
      const equipment = await createTestEquipment(context.equipmentRepository, {
        id: 'eq-reservation-concurrent-001',
      });

      const member1 = await createTestMember(context.memberRepository, {
        id: 'mem-res-concurrent-001',
      });

      const member2 = await createTestMember(context.memberRepository, {
        id: 'mem-res-concurrent-002',
      });

      // Act: Send concurrent reservation requests
      const [response1, response2] = await Promise.all([
        request(context.app)
          .post('/api/reservations')
          .send({
            equipmentId: equipment.id.toString(),
            memberId: member1.id.toString(),
            startDate: new Date('2025-01-01T00:00:00Z').toISOString(),
            endDate: new Date('2025-01-05T00:00:00Z').toISOString(),
            paymentMethod: { type: 'CREDIT_CARD' },
          }),
        request(context.app)
          .post('/api/reservations')
          .send({
            equipmentId: equipment.id.toString(),
            memberId: member2.id.toString(),
            startDate: new Date('2025-01-03T00:00:00Z').toISOString(),
            endDate: new Date('2025-01-07T00:00:00Z').toISOString(),
            paymentMethod: { type: 'CREDIT_CARD' },
          }),
      ]);

      // Assert: One should succeed, one should fail due to overlap
      const statuses = [response1.status, response2.status].sort();
      expect(statuses).toEqual([201, 409]);
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle minimum rental period (1 day)', async () => {
      const equipment = await createTestEquipment(context.equipmentRepository, {
        dailyRate: 50,
      });
      const member = await createTestMember(context.memberRepository);

      const response = await request(context.app)
        .post('/api/rentals')
        .send({
          equipmentId: equipment.id.toString(),
          memberId: member.id.toString(),
          startDate: new Date('2024-01-01T00:00:00Z').toISOString(),
          endDate: new Date('2024-01-02T00:00:00Z').toISOString(), // 1 day
          paymentMethod: { type: 'CREDIT_CARD' },
        });

      expect(response.status).toBe(201);
      expect(response.body.totalCost).toBeGreaterThan(0);
    });

    it('should handle long rental periods', async () => {
      const equipment = await createTestEquipment(context.equipmentRepository, {
        dailyRate: 50,
      });
      const member = await createTestMember(context.memberRepository);

      const response = await request(context.app)
        .post('/api/rentals')
        .send({
          equipmentId: equipment.id.toString(),
          memberId: member.id.toString(),
          startDate: new Date('2024-01-01T00:00:00Z').toISOString(),
          endDate: new Date('2024-02-01T00:00:00Z').toISOString(), // 31 days
          paymentMethod: { type: 'CREDIT_CARD' },
        });

      expect(response.status).toBe(201);
      expect(response.body.totalCost).toBeGreaterThan(1000); // At least 30 days worth
    });

    it('should handle zero-cost rentals (free tier or promotional)', async () => {
      const equipment = await createTestEquipment(context.equipmentRepository, {
        dailyRate: 0, // Free equipment
      });
      const member = await createTestMember(context.memberRepository);

      const response = await request(context.app)
        .post('/api/rentals')
        .send({
          equipmentId: equipment.id.toString(),
          memberId: member.id.toString(),
          startDate: new Date('2024-01-01T00:00:00Z').toISOString(),
          endDate: new Date('2024-01-05T00:00:00Z').toISOString(),
          paymentMethod: { type: 'CREDIT_CARD' },
        });

      expect(response.status).toBe(201);
      expect(response.body.totalCost).toBe(0);
    });

    it('should handle equipment with very high daily rates', async () => {
      const equipment = await createTestEquipment(context.equipmentRepository, {
        dailyRate: 10000, // Very expensive equipment
      });
      const member = await createTestMember(context.memberRepository);

      const response = await request(context.app)
        .post('/api/rentals')
        .send({
          equipmentId: equipment.id.toString(),
          memberId: member.id.toString(),
          startDate: new Date('2024-01-01T00:00:00Z').toISOString(),
          endDate: new Date('2024-01-05T00:00:00Z').toISOString(),
          paymentMethod: { type: 'CREDIT_CARD' },
        });

      expect(response.status).toBe(201);
      expect(response.body.totalCost).toBeGreaterThan(30000); // 4+ days
    });

    it('should handle members with different tier levels correctly', async () => {
      // Test each tier
      const basicMember = await createTestMember(context.memberRepository, {
        id: 'mem-basic-tier',
        tier: MembershipTier.BASIC,
      });

      const standardMember = await createTestMember(context.memberRepository, {
        id: 'mem-standard-tier',
        tier: MembershipTier.BASIC,
      });

      const premiumMember = await createTestMember(context.memberRepository, {
        id: 'mem-premium-tier',
        tier: MembershipTier.GOLD,
      });

      // Create equipment copies for concurrent testing
      const eq1 = await createTestEquipment(context.equipmentRepository, {
        id: 'eq-tier-basic',
        dailyRate: 100,
      });
      const eq2 = await createTestEquipment(context.equipmentRepository, {
        id: 'eq-tier-standard',
        dailyRate: 100,
      });
      const eq3 = await createTestEquipment(context.equipmentRepository, {
        id: 'eq-tier-premium',
        dailyRate: 100,
      });

      const [basicResponse, standardResponse, premiumResponse] = await Promise.all([
        request(context.app)
          .post('/api/rentals')
          .send({
            equipmentId: eq1.getId().toString(),
            memberId: basicMember.getId().toString(),
            startDate: new Date('2024-01-01T00:00:00Z').toISOString(),
            endDate: new Date('2024-01-06T00:00:00Z').toISOString(), // 5 days
            paymentMethod: { type: 'CREDIT_CARD' },
          }),
        request(context.app)
          .post('/api/rentals')
          .send({
            equipmentId: eq2.getId().toString(),
            memberId: standardMember.getId().toString(),
            startDate: new Date('2024-01-01T00:00:00Z').toISOString(),
            endDate: new Date('2024-01-06T00:00:00Z').toISOString(),
            paymentMethod: { type: 'CREDIT_CARD' },
          }),
        request(context.app)
          .post('/api/rentals')
          .send({
            equipmentId: eq3.getId().toString(),
            memberId: premiumMember.getId().toString(),
            startDate: new Date('2024-01-01T00:00:00Z').toISOString(),
            endDate: new Date('2024-01-06T00:00:00Z').toISOString(),
            paymentMethod: { type: 'CREDIT_CARD' },
          }),
      ]);

      // All should succeed
      expect(basicResponse.status).toBe(201);
      expect(standardResponse.status).toBe(201);
      expect(premiumResponse.status).toBe(201);

      // Premium should have lowest cost due to discount
      expect(premiumResponse.body.totalCost).toBeLessThan(standardResponse.body.totalCost);
      expect(standardResponse.body.totalCost).toBeLessThan(basicResponse.body.totalCost);
    });

    it('should handle equipment at various condition levels', async () => {
      const conditions = [
        EquipmentCondition.EXCELLENT,
        EquipmentCondition.GOOD,
        EquipmentCondition.FAIR,
      ];

      const member = await createTestMember(context.memberRepository);

      for (const condition of conditions) {
        const equipment = await createTestEquipment(context.equipmentRepository, {
          id: `eq-condition-${condition}`,
          condition,
        });

        const response = await request(context.app)
          .post('/api/rentals')
          .send({
            equipmentId: equipment.id.toString(),
            memberId: member.id.toString(),
            startDate: new Date('2024-01-01T00:00:00Z').toISOString(),
            endDate: new Date('2024-01-05T00:00:00Z').toISOString(),
            paymentMethod: { type: 'CREDIT_CARD' },
          });

        // Should succeed for acceptable conditions
        expect(response.status).toBe(201);
      }
    });
  });

  describe('System Integration Scenarios', () => {
    it('should handle complete rental lifecycle end-to-end', async () => {
      // Create equipment and member
      const equipment = await createTestEquipment(context.equipmentRepository, {
        id: 'eq-lifecycle-001',
        dailyRate: 50,
      });
      const member = await createTestMember(context.memberRepository, {
        id: 'mem-lifecycle-001',
      });

      // 1. Create rental
      const createResponse = await request(context.app)
        .post('/api/rentals')
        .send({
          equipmentId: equipment.id.toString(),
          memberId: member.id.toString(),
          startDate: new Date('2024-01-01T00:00:00Z').toISOString(),
          endDate: new Date('2024-01-05T00:00:00Z').toISOString(),
          paymentMethod: { type: 'CREDIT_CARD' },
        });
      expect(createResponse.status).toBe(201);
      const rentalId = createResponse.body.rentalId;

      // 2. Extend rental
      const extendResponse = await request(context.app)
        .put(`/api/rentals/${rentalId}/extend`)
        .send({
          additionalDays: 2,
          paymentMethod: { type: 'CREDIT_CARD' },
        });
      expect(extendResponse.status).toBe(200);

      // 3. Return rental
      const returnResponse = await request(context.app)
        .put(`/api/rentals/${rentalId}/return`)
        .send({
          conditionAtReturn: EquipmentCondition.GOOD,
        });
      expect(returnResponse.status).toBe(200);

      // 4. Verify final state
      const finalRental = await request(context.app).get(`/api/rentals/${rentalId}`);
      expect(finalRental.body.status).toBe('RETURNED');

      const finalEquipment = await request(context.app).get(
        `/api/equipment/${equipment.id.toString()}`,
      );
      expect(finalEquipment.body.isAvailable).toBe(true);
    });
  });
});
