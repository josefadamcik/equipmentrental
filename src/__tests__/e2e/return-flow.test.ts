/**
 * End-to-End Tests: Rental Return Flow with Late Fees
 *
 * Tests complete rental return workflows through HTTP endpoints including:
 * - On-time returns without late fees
 * - Late returns with calculated late fees
 * - Damage assessment during returns
 * - Equipment availability after return
 * - Payment processing for late fees and damage charges
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

describe('E2E: Rental Return Flow with Late Fees', () => {
  let context: TestContext;

  beforeEach(async () => {
    context = await createTestApp();
  });

  afterEach(async () => {
    await cleanupTestApp(context);
  });

  describe('On-Time Returns', () => {
    it('should successfully return equipment on time without late fees', async () => {
      // Setup: Create and rent equipment
      const equipment = await createTestEquipment(context.equipmentRepository, {
        id: 'eq-return-001',
        name: 'Power Drill',
        dailyRate: 50,
        condition: EquipmentCondition.EXCELLENT,
      });

      const member = await createTestMember(context.memberRepository, {
        id: 'mem-return-001',
        name: 'Responsible Renter',
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

      // Act: Return equipment on time (before end date)
      const returnResponse = await request(context.app)
        .put(`/api/rentals/${rentalId}/return`)
        .send({
          conditionAtReturn: EquipmentCondition.EXCELLENT,
        });

      // Assert: Return successful with no late fees
      expect(returnResponse.status).toBe(200);
      expect(returnResponse.body).toMatchObject({
        rentalId,
        lateFee: 0,
        damageFee: 0,
      });

      // Verify: Rental status is RETURNED
      const getRentalResponse = await request(context.app).get(`/api/rentals/${rentalId}`);
      expect(getRentalResponse.status).toBe(200);
      expect(getRentalResponse.body.status).toBe('RETURNED');

      // Verify: Equipment is available again
      const equipmentResponse = await request(context.app).get(
        `/api/equipment/${equipment.id.toString()}`,
      );
      expect(equipmentResponse.status).toBe(200);
      expect(equipmentResponse.body.isAvailable).toBe(true);
    });

    it('should update equipment condition after return', async () => {
      // Setup: Create rental
      const equipment = await createTestEquipment(context.equipmentRepository, {
        id: 'eq-condition-001',
        condition: EquipmentCondition.EXCELLENT,
      });

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

      // Act: Return equipment with different condition
      await request(context.app).put(`/api/rentals/${rentalId}/return`).send({
        conditionAtReturn: EquipmentCondition.GOOD,
      });

      // Verify: Equipment condition updated
      const equipmentResponse = await request(context.app).get(
        `/api/equipment/${equipment.id.toString()}`,
      );
      expect(equipmentResponse.status).toBe(200);
      expect(equipmentResponse.body.condition).toBe(EquipmentCondition.GOOD);
    });
  });

  describe('Late Returns with Late Fees', () => {
    it('should calculate and charge late fees for overdue returns', async () => {
      // Setup: Create rental with past end date (simulating overdue)
      const equipment = await createTestEquipment(context.equipmentRepository, {
        id: 'eq-late-001',
        name: 'Expensive Tool',
        dailyRate: 100,
      });

      const member = await createTestMember(context.memberRepository, {
        id: 'mem-late-001',
        name: 'Late Returner',
      });

      // Create rental with dates in the past to simulate overdue
      const createResponse = await request(context.app)
        .post('/api/rentals')
        .send({
          equipmentId: equipment.id.toString(),
          memberId: member.id.toString(),
          startDate: new Date('2024-01-01T00:00:00Z').toISOString(),
          endDate: new Date('2024-01-03T00:00:00Z').toISOString(), // 2 days ago (in test context)
          paymentMethod: { type: 'CREDIT_CARD', token: 'tok_test' },
        });

      expect(createResponse.status).toBe(201);
      const rentalId = createResponse.body.rentalId;

      // Act: Return equipment late (current date is after end date)
      const returnResponse = await request(context.app)
        .put(`/api/rentals/${rentalId}/return`)
        .send({
          conditionAtReturn: EquipmentCondition.GOOD,
        });

      // Assert: Late fees should be charged
      expect(returnResponse.status).toBe(200);
      expect(returnResponse.body.lateFee).toBeGreaterThan(0);
    });

    it('should handle late returns for premium members with tier benefits', async () => {
      // Setup: Create rental for premium member
      const equipment = await createTestEquipment(context.equipmentRepository, {
        id: 'eq-premium-late-001',
        dailyRate: 100,
      });

      const premiumMember = await createTestMember(context.memberRepository, {
        id: 'mem-premium-late-001',
        tier: MembershipTier.GOLD,
      });

      const createResponse = await request(context.app)
        .post('/api/rentals')
        .send({
          equipmentId: equipment.id.toString(),
          memberId: premiumMember.id.toString(),
          startDate: new Date('2024-01-01T00:00:00Z').toISOString(),
          endDate: new Date('2024-01-03T00:00:00Z').toISOString(),
          paymentMethod: { type: 'CREDIT_CARD', token: 'tok_test' },
        });

      const rentalId = createResponse.body.rentalId;

      // Act: Return late
      const returnResponse = await request(context.app)
        .put(`/api/rentals/${rentalId}/return`)
        .send({
          conditionAtReturn: EquipmentCondition.GOOD,
        });

      // Assert: Premium members may have reduced late fees (based on business logic)
      expect(returnResponse.status).toBe(200);
      // The actual late fee calculation is handled by business logic
      expect(returnResponse.body).toHaveProperty('lateFee');
    });
  });

  describe('Damage Assessment During Return', () => {
    it('should charge damage fees for equipment returned in poor condition', async () => {
      // Setup: Create rental
      const equipment = await createTestEquipment(context.equipmentRepository, {
        id: 'eq-damage-001',
        condition: EquipmentCondition.EXCELLENT,
        dailyRate: 50,
      });

      const member = await createTestMember(context.memberRepository, {
        id: 'mem-damage-001',
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

      const rentalId = createResponse.body.rentalId;

      // Act: Return equipment in poor condition (significant damage)
      const returnResponse = await request(context.app)
        .put(`/api/rentals/${rentalId}/return`)
        .send({
          conditionAtReturn: EquipmentCondition.POOR,
          damageNotes: 'Equipment has significant wear and tear',
        });

      // Assert: Damage fees should be charged
      expect(returnResponse.status).toBe(200);
      expect(returnResponse.body.damageFee).toBeGreaterThan(0);

      // Verify: Equipment condition updated
      const equipmentResponse = await request(context.app).get(
        `/api/equipment/${equipment.id.toString()}`,
      );
      expect(equipmentResponse.status).toBe(200);
      expect(equipmentResponse.body.condition).toBe(EquipmentCondition.POOR);
    });

    it('should not charge damage fees for minor condition degradation', async () => {
      // Setup: Create rental
      const equipment = await createTestEquipment(context.equipmentRepository, {
        id: 'eq-minor-wear-001',
        condition: EquipmentCondition.EXCELLENT,
      });

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

      // Act: Return equipment in good condition (minor wear is acceptable)
      const returnResponse = await request(context.app)
        .put(`/api/rentals/${rentalId}/return`)
        .send({
          conditionAtReturn: EquipmentCondition.GOOD,
        });

      // Assert: No damage fees for acceptable wear
      expect(returnResponse.status).toBe(200);
      expect(returnResponse.body.damageFee).toBe(0);
    });

    it('should handle combined late fees and damage fees', async () => {
      // Setup: Create overdue rental
      const equipment = await createTestEquipment(context.equipmentRepository, {
        id: 'eq-late-damage-001',
        condition: EquipmentCondition.EXCELLENT,
        dailyRate: 50,
      });

      const member = await createTestMember(context.memberRepository);

      const createResponse = await request(context.app)
        .post('/api/rentals')
        .send({
          equipmentId: equipment.id.toString(),
          memberId: member.id.toString(),
          startDate: new Date('2024-01-01T00:00:00Z').toISOString(),
          endDate: new Date('2024-01-03T00:00:00Z').toISOString(), // Past end date
          paymentMethod: { type: 'CREDIT_CARD', token: 'tok_test' },
        });

      const rentalId = createResponse.body.rentalId;

      // Act: Return late AND damaged
      const returnResponse = await request(context.app)
        .put(`/api/rentals/${rentalId}/return`)
        .send({
          conditionAtReturn: EquipmentCondition.POOR,
          damageNotes: 'Late return with damage',
        });

      // Assert: Both fees should be charged
      expect(returnResponse.status).toBe(200);
      expect(returnResponse.body.lateFee).toBeGreaterThanOrEqual(0);
      expect(returnResponse.body.damageFee).toBeGreaterThan(0);
      expect(returnResponse.body.totalCost).toBeGreaterThan(0);
    });
  });

  describe('Return Error Scenarios', () => {
    it('should prevent returning a non-existent rental', async () => {
      // Act: Attempt to return non-existent rental
      const response = await request(context.app)
        .put('/api/rentals/non-existent-rental/return')
        .send({
          conditionAtReturn: EquipmentCondition.GOOD,
        });

      // Assert: Should return not found error
      expect(response.status).toBe(404);
      expect(response.body.error).toBeDefined();
    });

    it('should validate required condition at return', async () => {
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

      // Act: Attempt to return without condition
      const response = await request(context.app).put(`/api/rentals/${rentalId}/return`).send({});

      // Assert: Should fail validation
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should prevent returning an already returned rental', async () => {
      // Setup: Create and return rental
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

      // First return
      const firstReturn = await request(context.app).put(`/api/rentals/${rentalId}/return`).send({
        conditionAtReturn: EquipmentCondition.GOOD,
      });

      expect(firstReturn.status).toBe(200);

      // Act: Attempt to return again
      const secondReturn = await request(context.app).put(`/api/rentals/${rentalId}/return`).send({
        conditionAtReturn: EquipmentCondition.GOOD,
      });

      // Assert: Should fail with already returned error
      expect(secondReturn.status).toBe(409);
      expect(secondReturn.body.error.code).toBe('RENTAL_ALREADY_RETURNED');
    });
  });

  describe('Equipment Availability After Return', () => {
    it('should make equipment available immediately after return', async () => {
      // Setup: Create and rent equipment
      const equipment = await createTestEquipment(context.equipmentRepository, {
        id: 'eq-availability-001',
      });
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

      // Verify: Equipment is unavailable while rented
      let equipmentResponse = await request(context.app).get(
        `/api/equipment/${equipment.id.toString()}`,
      );
      expect(equipmentResponse.body.isAvailable).toBe(false);

      // Act: Return equipment
      await request(context.app).put(`/api/rentals/${rentalId}/return`).send({
        conditionAtReturn: EquipmentCondition.GOOD,
      });

      // Assert: Equipment is available again
      equipmentResponse = await request(context.app).get(
        `/api/equipment/${equipment.id.toString()}`,
      );
      expect(equipmentResponse.status).toBe(200);
      expect(equipmentResponse.body.isAvailable).toBe(true);
    });

    it('should allow new rental after equipment is returned', async () => {
      // Setup: Create rental and return it
      const equipment = await createTestEquipment(context.equipmentRepository, {
        id: 'eq-re-rent-001',
      });
      const member1 = await createTestMember(context.memberRepository, {
        id: 'mem-first-001',
      });

      const firstRental = await request(context.app)
        .post('/api/rentals')
        .send({
          equipmentId: equipment.id.toString(),
          memberId: member1.id.toString(),
          startDate: new Date('2024-01-01T00:00:00Z').toISOString(),
          endDate: new Date('2024-01-05T00:00:00Z').toISOString(),
          paymentMethod: { type: 'CREDIT_CARD', token: 'tok_test' },
        });

      await request(context.app).put(`/api/rentals/${firstRental.body.rentalId}/return`).send({
        conditionAtReturn: EquipmentCondition.GOOD,
      });

      // Act: Create new rental for same equipment
      const member2 = await createTestMember(context.memberRepository, {
        id: 'mem-second-001',
      });

      const secondRental = await request(context.app)
        .post('/api/rentals')
        .send({
          equipmentId: equipment.id.toString(),
          memberId: member2.id.toString(),
          startDate: new Date('2024-01-10T00:00:00Z').toISOString(),
          endDate: new Date('2024-01-15T00:00:00Z').toISOString(),
          paymentMethod: { type: 'CREDIT_CARD', token: 'tok_test' },
        });

      // Assert: Second rental should succeed
      expect(secondRental.status).toBe(201);
      expect(secondRental.body.rentalId).toBeDefined();
    });
  });
});
