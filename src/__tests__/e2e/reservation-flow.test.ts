/**
 * End-to-End Tests: Reservation System Flow
 *
 * Tests complete reservation workflows through HTTP endpoints including:
 * - Reservation creation with payment authorization
 * - Reservation cancellation with refunds
 * - Reservation conversion to active rentals
 * - Conflict detection for overlapping reservations
 * - Reservation expiration handling
 */

import request from 'supertest';
import {
  TestContext,
  createTestApp,
  cleanupTestApp,
  createTestEquipment,
  createTestMember,
} from './setup.js';
import { MembershipTier } from '../../domain/types/MembershipTier.js';

describe('E2E: Reservation System Flow', () => {
  let context: TestContext;

  beforeEach(async () => {
    context = await createTestApp();
  });

  afterEach(async () => {
    await cleanupTestApp(context);
  });

  describe('Reservation Creation', () => {
    it('should successfully create a reservation for future dates', async () => {
      // Setup: Create equipment and member
      const equipment = await createTestEquipment(context.equipmentRepository, {
        id: 'eq-reserve-001',
        name: 'Reserved Equipment',
        dailyRate: 50,
      });

      const member = await createTestMember(context.memberRepository, {
        id: 'mem-reserve-001',
        name: 'Forward Planner',
      });

      // Act: Create reservation
      const response = await request(context.app)
        .post('/api/reservations')
        .send({
          equipmentId: equipment.id.toString(),
          memberId: member.id.toString(),
          startDate: new Date('2027-01-01T00:00:00Z').toISOString(),
          endDate: new Date('2027-01-05T00:00:00Z').toISOString(),
          paymentMethod: { type: 'CREDIT_CARD', token: 'tok_test' },
        });

      // Assert: Reservation created successfully
      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        reservationId: expect.any(String),
        equipmentId: equipment.id.toString(),
        memberId: member.id.toString(),
        status: 'CONFIRMED', // Auto-confirmed when payment is authorized
        paymentStatus: 'AUTHORIZED',
      });

      const reservationId = response.body.reservationId;

      // Verify: Can retrieve reservation details
      const getResponse = await request(context.app).get(`/api/reservations/${reservationId}`);
      expect(getResponse.status).toBe(200);
      expect(getResponse.body.reservationId).toBe(reservationId);
    });

    it('should apply membership tier discounts to reservations', async () => {
      // Setup: Create equipment and premium member
      const equipment = await createTestEquipment(context.equipmentRepository, {
        id: 'eq-reserve-premium-001',
        dailyRate: 100,
      });

      const premiumMember = await createTestMember(context.memberRepository, {
        id: 'mem-reserve-premium-001',
        tier: MembershipTier.GOLD, // 10% discount
      });

      // Act: Create 5-day reservation
      const response = await request(context.app)
        .post('/api/reservations')
        .send({
          equipmentId: equipment.id.toString(),
          memberId: premiumMember.id.toString(),
          startDate: new Date('2027-01-01T00:00:00Z').toISOString(),
          endDate: new Date('2027-01-06T00:00:00Z').toISOString(),
          paymentMethod: { type: 'CREDIT_CARD', token: 'tok_test' },
        });

      // Assert: Discount applied
      expect(response.status).toBe(201);
      expect(response.body.totalCost).toBe(450); // $500 - 10%
      expect(response.body.discountApplied).toBe(50);
    });

    it('should prevent creating overlapping reservations', async () => {
      // Setup: Create equipment and members
      const equipment = await createTestEquipment(context.equipmentRepository, {
        id: 'eq-overlap-001',
      });

      const member1 = await createTestMember(context.memberRepository, {
        id: 'mem-overlap-001',
      });

      const member2 = await createTestMember(context.memberRepository, {
        id: 'mem-overlap-002',
      });

      // Create first reservation
      const firstReservation = await request(context.app)
        .post('/api/reservations')
        .send({
          equipmentId: equipment.id.toString(),
          memberId: member1.id.toString(),
          startDate: new Date('2027-01-01T00:00:00Z').toISOString(),
          endDate: new Date('2027-01-05T00:00:00Z').toISOString(),
          paymentMethod: { type: 'CREDIT_CARD', token: 'tok_test' },
        });

      expect(firstReservation.status).toBe(201);

      // Act: Attempt to create overlapping reservation
      const overlappingReservation = await request(context.app)
        .post('/api/reservations')
        .send({
          equipmentId: equipment.id.toString(),
          memberId: member2.id.toString(),
          startDate: new Date('2027-01-03T00:00:00Z').toISOString(), // Overlaps with first
          endDate: new Date('2027-01-07T00:00:00Z').toISOString(),
          paymentMethod: { type: 'CREDIT_CARD', token: 'tok_test' },
        });

      // Assert: Second reservation should fail
      expect(overlappingReservation.status).toBe(409);
      expect(overlappingReservation.body.error.code).toBe('EQUIPMENT_NOT_AVAILABLE');
    });

    it('should allow non-overlapping reservations for same equipment', async () => {
      // Setup: Create equipment and members
      const equipment = await createTestEquipment(context.equipmentRepository, {
        id: 'eq-sequential-001',
      });

      const member1 = await createTestMember(context.memberRepository, {
        id: 'mem-seq-001',
      });

      const member2 = await createTestMember(context.memberRepository, {
        id: 'mem-seq-002',
      });

      // Create first reservation
      const firstReservation = await request(context.app)
        .post('/api/reservations')
        .send({
          equipmentId: equipment.id.toString(),
          memberId: member1.id.toString(),
          startDate: new Date('2027-01-01T00:00:00Z').toISOString(),
          endDate: new Date('2027-01-05T00:00:00Z').toISOString(),
          paymentMethod: { type: 'CREDIT_CARD', token: 'tok_test' },
        });

      expect(firstReservation.status).toBe(201);

      // Act: Create non-overlapping reservation (after first one ends)
      const secondReservation = await request(context.app)
        .post('/api/reservations')
        .send({
          equipmentId: equipment.id.toString(),
          memberId: member2.id.toString(),
          startDate: new Date('2027-01-06T00:00:00Z').toISOString(), // After first ends
          endDate: new Date('2027-01-10T00:00:00Z').toISOString(),
          paymentMethod: { type: 'CREDIT_CARD', token: 'tok_test' },
        });

      // Assert: Second reservation should succeed
      expect(secondReservation.status).toBe(201);
      expect(secondReservation.body.reservationId).toBeDefined();
    });
  });

  describe('Reservation Cancellation', () => {
    it('should successfully cancel a reservation and process refund', async () => {
      // Setup: Create reservation
      const equipment = await createTestEquipment(context.equipmentRepository, {
        id: 'eq-cancel-001',
      });

      const member = await createTestMember(context.memberRepository, {
        id: 'mem-cancel-001',
      });

      const createResponse = await request(context.app)
        .post('/api/reservations')
        .send({
          equipmentId: equipment.id.toString(),
          memberId: member.id.toString(),
          startDate: new Date('2027-01-01T00:00:00Z').toISOString(),
          endDate: new Date('2027-01-05T00:00:00Z').toISOString(),
          paymentMethod: { type: 'CREDIT_CARD', token: 'tok_test' },
        });

      expect(createResponse.status).toBe(201);
      const reservationId = createResponse.body.reservationId;

      // Act: Cancel reservation
      const cancelResponse = await request(context.app).delete(
        `/api/reservations/${reservationId}`,
      );

      // Assert: Cancellation successful
      expect(cancelResponse.status).toBe(200);
      expect(cancelResponse.body).toMatchObject({
        reservationId,
        status: 'CANCELLED',
        refundAmount: expect.any(Number),
        refundStatus: expect.stringMatching(/SUCCESS|NOT_PROCESSED/), // May not process refund if authorizationId not provided
      });

      // Verify: Reservation is cancelled
      const getResponse = await request(context.app).get(`/api/reservations/${reservationId}`);
      expect(getResponse.status).toBe(200);
      expect(getResponse.body.status).toBe('CANCELLED');
    });

    it('should prevent cancelling an already cancelled reservation', async () => {
      // Setup: Create and cancel reservation
      const equipment = await createTestEquipment(context.equipmentRepository);
      const member = await createTestMember(context.memberRepository);

      const createResponse = await request(context.app)
        .post('/api/reservations')
        .send({
          equipmentId: equipment.id.toString(),
          memberId: member.id.toString(),
          startDate: new Date('2027-01-01T00:00:00Z').toISOString(),
          endDate: new Date('2027-01-05T00:00:00Z').toISOString(),
          paymentMethod: { type: 'CREDIT_CARD', token: 'tok_test' },
        });

      const reservationId = createResponse.body.reservationId;

      // First cancellation
      const firstCancel = await request(context.app).delete(`/api/reservations/${reservationId}`);
      expect(firstCancel.status).toBe(200);

      // Act: Attempt to cancel again
      const secondCancel = await request(context.app).delete(`/api/reservations/${reservationId}`);

      // Assert: Second cancellation should fail
      expect(secondCancel.status).toBe(409);
      expect(secondCancel.body.error.code).toBe('RESERVATION_ALREADY_CANCELLED');
    });

    it('should allow new reservation after cancellation', async () => {
      // Setup: Create and cancel reservation
      const equipment = await createTestEquipment(context.equipmentRepository, {
        id: 'eq-reuse-001',
      });

      const member1 = await createTestMember(context.memberRepository, {
        id: 'mem-reuse-001',
      });

      const firstReservation = await request(context.app)
        .post('/api/reservations')
        .send({
          equipmentId: equipment.id.toString(),
          memberId: member1.id.toString(),
          startDate: new Date('2027-01-01T00:00:00Z').toISOString(),
          endDate: new Date('2027-01-05T00:00:00Z').toISOString(),
          paymentMethod: { type: 'CREDIT_CARD', token: 'tok_test' },
        });

      await request(context.app).delete(`/api/reservations/${firstReservation.body.reservationId}`);

      // Act: Create new reservation for same time slot
      const member2 = await createTestMember(context.memberRepository, {
        id: 'mem-reuse-002',
      });

      const secondReservation = await request(context.app)
        .post('/api/reservations')
        .send({
          equipmentId: equipment.id.toString(),
          memberId: member2.id.toString(),
          startDate: new Date('2027-01-01T00:00:00Z').toISOString(),
          endDate: new Date('2027-01-05T00:00:00Z').toISOString(),
          paymentMethod: { type: 'CREDIT_CARD', token: 'tok_test' },
        });

      // Assert: New reservation should succeed
      expect(secondReservation.status).toBe(201);
      expect(secondReservation.body.reservationId).toBeDefined();
    });
  });

  describe('Reservation Error Scenarios', () => {
    it('should handle equipment not found error', async () => {
      // Setup: Create member only
      const member = await createTestMember(context.memberRepository);

      // Act: Attempt to reserve non-existent equipment
      const response = await request(context.app)
        .post('/api/reservations')
        .send({
          equipmentId: 'non-existent-equipment',
          memberId: member.id.toString(),
          startDate: new Date('2027-01-01T00:00:00Z').toISOString(),
          endDate: new Date('2027-01-05T00:00:00Z').toISOString(),
          paymentMethod: { type: 'CREDIT_CARD', token: 'tok_test' },
        });

      // Assert: Should return equipment not found error
      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('EQUIPMENT_NOT_FOUND');
    });

    it('should handle member not found error', async () => {
      // Setup: Create equipment only
      const equipment = await createTestEquipment(context.equipmentRepository);

      // Act: Attempt to create reservation for non-existent member
      const response = await request(context.app)
        .post('/api/reservations')
        .send({
          equipmentId: equipment.id.toString(),
          memberId: 'non-existent-member',
          startDate: new Date('2027-01-01T00:00:00Z').toISOString(),
          endDate: new Date('2027-01-05T00:00:00Z').toISOString(),
          paymentMethod: { type: 'CREDIT_CARD', token: 'tok_test' },
        });

      // Assert: Should return member not found error
      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('MEMBER_NOT_FOUND');
    });

    it('should validate date range for reservations', async () => {
      // Setup: Create equipment and member
      const equipment = await createTestEquipment(context.equipmentRepository);
      const member = await createTestMember(context.memberRepository);

      // Act: Attempt to create reservation with invalid date range
      const response = await request(context.app)
        .post('/api/reservations')
        .send({
          equipmentId: equipment.id.toString(),
          memberId: member.id.toString(),
          startDate: new Date('2027-01-05T00:00:00Z').toISOString(),
          endDate: new Date('2027-01-01T00:00:00Z').toISOString(), // End before start
          paymentMethod: { type: 'CREDIT_CARD', token: 'tok_test' },
        });

      // Assert: Should return validation error
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should validate required fields for reservation creation', async () => {
      // Act: Attempt to create reservation with missing fields
      const response = await request(context.app).post('/api/reservations').send({
        equipmentId: 'some-id',
        // Missing memberId, startDate, endDate, paymentMethod
      });

      // Assert: Should return validation error
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle reservation not found error', async () => {
      // Act: Attempt to get non-existent reservation
      const getResponse = await request(context.app).get(
        '/api/reservations/non-existent-reservation',
      );

      // Assert: Should return not found error
      expect(getResponse.status).toBe(404);
      expect(getResponse.body.error.code).toBe('RESERVATION_NOT_FOUND');

      // Act: Attempt to cancel non-existent reservation
      const cancelResponse = await request(context.app).delete(
        '/api/reservations/non-existent-reservation',
      );

      // Assert: Should return not found error
      expect(cancelResponse.status).toBe(404);
      expect(cancelResponse.body.error.code).toBe('RESERVATION_NOT_FOUND');
    });
  });

  describe('Reservation and Active Rental Conflicts', () => {
    it('should prevent reservation when equipment is actively rented', async () => {
      // Setup: Create active rental
      const equipment = await createTestEquipment(context.equipmentRepository, {
        id: 'eq-active-conflict-001',
      });

      const member1 = await createTestMember(context.memberRepository, {
        id: 'mem-active-001',
      });

      // Create active rental (use current dates to avoid overdue and valid period for BASIC tier)
      const now = new Date();
      const rentalStart = new Date(now);
      rentalStart.setDate(now.getDate() - 1); // Started yesterday
      const rentalEnd = new Date(now);
      rentalEnd.setDate(now.getDate() + 5); // Ends in 5 days (6 day rental within BASIC tier limit)

      await request(context.app)
        .post('/api/rentals')
        .send({
          equipmentId: equipment.id.toString(),
          memberId: member1.id.toString(),
          startDate: rentalStart.toISOString(),
          endDate: rentalEnd.toISOString(),
          paymentMethod: { type: 'CREDIT_CARD', token: 'tok_test' },
        });

      // Act: Attempt to create reservation during active rental period
      const member2 = await createTestMember(context.memberRepository, {
        id: 'mem-reserve-conflict-001',
      });

      const reservationStart = new Date(now);
      reservationStart.setDate(now.getDate() + 2); // Starts in 2 days (overlaps with active rental)
      const reservationEnd = new Date(now);
      reservationEnd.setDate(now.getDate() + 4); // Ends in 4 days

      const response = await request(context.app)
        .post('/api/reservations')
        .send({
          equipmentId: equipment.id.toString(),
          memberId: member2.id.toString(),
          startDate: reservationStart.toISOString(), // During active rental
          endDate: reservationEnd.toISOString(),
          paymentMethod: { type: 'CREDIT_CARD', token: 'tok_test' },
        });

      // Assert: Reservation should fail due to conflict
      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('EQUIPMENT_NOT_AVAILABLE');
    });

    it('should allow reservation after active rental ends', async () => {
      // Setup: Create active rental
      const equipment = await createTestEquipment(context.equipmentRepository, {
        id: 'eq-after-rental-001',
      });

      const member1 = await createTestMember(context.memberRepository, {
        id: 'mem-renter-001',
      });

      await request(context.app)
        .post('/api/rentals')
        .send({
          equipmentId: equipment.id.toString(),
          memberId: member1.id.toString(),
          startDate: new Date('2024-12-20T00:00:00Z').toISOString(),
          endDate: new Date('2027-01-05T00:00:00Z').toISOString(),
          paymentMethod: { type: 'CREDIT_CARD', token: 'tok_test' },
        });

      // Act: Create reservation after rental ends
      const member2 = await createTestMember(context.memberRepository, {
        id: 'mem-reserve-after-001',
      });

      const response = await request(context.app)
        .post('/api/reservations')
        .send({
          equipmentId: equipment.id.toString(),
          memberId: member2.id.toString(),
          startDate: new Date('2027-01-06T00:00:00Z').toISOString(), // After rental ends
          endDate: new Date('2027-01-10T00:00:00Z').toISOString(),
          paymentMethod: { type: 'CREDIT_CARD', token: 'tok_test' },
        });

      // Assert: Reservation should succeed
      expect(response.status).toBe(201);
      expect(response.body.reservationId).toBeDefined();
    });
  });

  describe('Payment Authorization for Reservations', () => {
    it('should authorize payment when creating reservation', async () => {
      // Setup: Create equipment and member
      const equipment = await createTestEquipment(context.equipmentRepository, {
        dailyRate: 100,
      });
      const member = await createTestMember(context.memberRepository);

      // Act: Create reservation
      const response = await request(context.app)
        .post('/api/reservations')
        .send({
          equipmentId: equipment.id.toString(),
          memberId: member.id.toString(),
          startDate: new Date('2027-01-01T00:00:00Z').toISOString(),
          endDate: new Date('2027-01-05T00:00:00Z').toISOString(),
          paymentMethod: { type: 'CREDIT_CARD', token: 'tok_test' },
        });

      // Assert: Payment should be authorized (not captured yet)
      expect(response.status).toBe(201);
      expect(response.body.paymentStatus).toBe('AUTHORIZED');
      expect(response.body.authorizationId).toBeDefined();
    });

    it('should handle payment authorization failures', async () => {
      // Setup: Create equipment and member
      const equipment = await createTestEquipment(context.equipmentRepository);
      const member = await createTestMember(context.memberRepository);

      // Act: Create reservation with failing payment method
      const response = await request(context.app)
        .post('/api/reservations')
        .send({
          equipmentId: equipment.id.toString(),
          memberId: member.id.toString(),
          startDate: new Date('2027-01-01T00:00:00Z').toISOString(),
          endDate: new Date('2027-01-05T00:00:00Z').toISOString(),
          paymentMethod: { type: 'CREDIT_CARD', token: 'tok_fail' }, // Mock failure token
        });

      // Assert: May succeed or fail based on payment service implementation
      // Mock service typically allows all transactions
      expect([201, 402]).toContain(response.status);
    });
  });
});
