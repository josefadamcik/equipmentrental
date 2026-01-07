/**
 * Integration tests for application services using real in-memory adapters
 * Tests the full integration between application services and adapter layer
 */

import { RentalService } from '../../RentalService.js';
import { ReservationService } from '../../ReservationService.js';

// Use actual in-memory adapters
import { InMemoryEquipmentRepository } from '../../../../adapters/outbound/persistence/InMemoryEquipmentRepository.js';
import { InMemoryMemberRepository } from '../../../../adapters/outbound/persistence/InMemoryMemberRepository.js';
import { InMemoryRentalRepository } from '../../../../adapters/outbound/persistence/InMemoryRentalRepository.js';
import { InMemoryReservationRepository } from '../../../../adapters/outbound/persistence/InMemoryReservationRepository.js';
import { MockPaymentService } from '../../../../adapters/outbound/payment/MockPaymentService.js';
import { InMemoryEventPublisher } from '../../../../adapters/outbound/events/InMemoryEventPublisher.js';

// Create a simple in-memory notification service for testing
import {
  NotificationService,
  NotificationResult,
} from '../../../../domain/ports/NotificationService.js';

class InMemoryNotificationService implements NotificationService {
  private notifications: any[] = [];

  async notifyRentalCreated(): Promise<NotificationResult> {
    this.notifications.push({ type: 'rental_created' });
    return { success: true, channel: 'EMAIL', sentAt: new Date() };
  }

  async notifyRentalReturned(): Promise<NotificationResult> {
    this.notifications.push({ type: 'rental_returned' });
    return { success: true, channel: 'EMAIL', sentAt: new Date() };
  }

  async notifyRentalOverdue(): Promise<NotificationResult> {
    this.notifications.push({ type: 'rental_overdue' });
    return { success: true, channel: 'EMAIL', sentAt: new Date() };
  }

  async notifyRentalDueSoon(): Promise<NotificationResult> {
    this.notifications.push({ type: 'rental_due_soon' });
    return { success: true, channel: 'EMAIL', sentAt: new Date() };
  }

  async notifyReservationCreated(): Promise<NotificationResult> {
    this.notifications.push({ type: 'reservation_created' });
    return { success: true, channel: 'EMAIL', sentAt: new Date() };
  }

  async notifyReservationCancelled(): Promise<NotificationResult> {
    this.notifications.push({ type: 'reservation_cancelled' });
    return { success: true, channel: 'EMAIL', sentAt: new Date() };
  }

  async notifyReservationReminder(): Promise<NotificationResult> {
    this.notifications.push({ type: 'reservation_reminder' });
    return { success: true, channel: 'EMAIL', sentAt: new Date() };
  }

  async notifyEquipmentDamaged(): Promise<NotificationResult> {
    this.notifications.push({ type: 'equipment_damaged' });
    return { success: true, channel: 'EMAIL', sentAt: new Date() };
  }

  async notifyPaymentReceived(): Promise<NotificationResult> {
    this.notifications.push({ type: 'payment_received' });
    return { success: true, channel: 'EMAIL', sentAt: new Date() };
  }

  async notifyPaymentFailed(): Promise<NotificationResult> {
    this.notifications.push({ type: 'payment_failed' });
    return { success: true, channel: 'EMAIL', sentAt: new Date() };
  }

  async sendCustomNotification(): Promise<NotificationResult> {
    this.notifications.push({ type: 'custom' });
    return { success: true, channel: 'EMAIL', sentAt: new Date() };
  }

  getNotifications() {
    return this.notifications;
  }

  clearNotifications() {
    this.notifications = [];
  }
}

// Domain entities and value objects
import { Equipment } from '../../../../domain/entities/Equipment.js';
import { Member } from '../../../../domain/entities/Member.js';
import { Rental } from '../../../../domain/entities/Rental.js';
import { Reservation } from '../../../../domain/entities/Reservation.js';
import { Money } from '../../../../domain/value-objects/Money.js';
import { DateRange } from '../../../../domain/value-objects/DateRange.js';
import { EquipmentCondition } from '../../../../domain/types/EquipmentCondition.js';
import { MembershipTier } from '../../../../domain/types/MembershipTier.js';
import { RentalStatus } from '../../../../domain/types/RentalStatus.js';

describe('Application Services Integration Tests', () => {
  let equipmentRepo: InMemoryEquipmentRepository;
  let memberRepo: InMemoryMemberRepository;
  let rentalRepo: InMemoryRentalRepository;
  let reservationRepo: InMemoryReservationRepository;
  let paymentService: MockPaymentService;
  let notificationService: InMemoryNotificationService;
  let eventPublisher: InMemoryEventPublisher;

  beforeEach(() => {
    // Create fresh instances of all adapters
    equipmentRepo = new InMemoryEquipmentRepository();
    memberRepo = new InMemoryMemberRepository();
    rentalRepo = new InMemoryRentalRepository();
    reservationRepo = new InMemoryReservationRepository();
    paymentService = new MockPaymentService();
    notificationService = new InMemoryNotificationService();
    eventPublisher = new InMemoryEventPublisher();
  });

  describe('RentalService Integration', () => {
    let service: RentalService;

    beforeEach(() => {
      service = new RentalService(
        equipmentRepo,
        memberRepo,
        rentalRepo,
        reservationRepo,
        paymentService,
        notificationService,
        eventPublisher,
      );
    });

    describe('createRentalWithPayment', () => {
      it('should create rental with payment and persist all changes', async () => {
        // Setup
        const equipment = Equipment.create({
          name: 'Power Drill',
          description: 'Professional drill',
          category: 'Tools',
          dailyRate: Money.dollars(50),
          condition: EquipmentCondition.EXCELLENT,
          purchaseDate: new Date(),
        });
        await equipmentRepo.save(equipment);

        const member = Member.create({
          name: 'John Doe',
          email: 'john@example.com',
          tier: MembershipTier.GOLD,
          joinDate: new Date(),
          isActive: true,
        });
        await memberRepo.save(member);

        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 3);

        // Execute
        const result = await service.createRentalWithPayment({
          equipmentId: equipment.id.value,
          memberId: member.id.value,
          startDate,
          endDate,
          paymentMethod: 'CREDIT_CARD',
        });

        // Verify result
        expect(result.rentalId).toBeDefined();
        expect(result.totalCost).toBeGreaterThan(0);
        expect(result.transactionId).toBeDefined();
        expect(result.paymentStatus).toBe('SUCCESS');

        // Verify all entities persisted correctly
        const savedRental = await rentalRepo.findById({ value: result.rentalId } as any);
        expect(savedRental).toBeDefined();
        expect(savedRental!.status).toBe(RentalStatus.ACTIVE);

        const updatedEquipment = await equipmentRepo.findById(equipment.id);
        expect(updatedEquipment!.isAvailable).toBe(false);

        const updatedMember = await memberRepo.findById(member.id);
        expect(updatedMember!.activeRentalCount).toBe(1);

        // Verify notifications sent
        const notifications = notificationService.getNotifications();
        expect(notifications.some((n) => n.type === 'rental_created')).toBe(true);
        expect(notifications.some((n) => n.type === 'payment_received')).toBe(true);
      });

      it('should handle payment failure and not create rental', async () => {
        const equipment = Equipment.create({
          name: 'Drill',
          description: 'Power drill',
          category: 'Tools',
          dailyRate: Money.dollars(50),
          condition: EquipmentCondition.EXCELLENT,
          purchaseDate: new Date(),
        });
        await equipmentRepo.save(equipment);

        const member = Member.create({
          name: 'John Doe',
          email: 'john@example.com',
          tier: MembershipTier.BASIC,
          joinDate: new Date(),
          isActive: true,
        });
        await memberRepo.save(member);

        // Configure payment service to fail by setting config flag
        (paymentService as any).config.shouldFail = true;

        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 2);

        // Execute and expect failure
        await expect(
          service.createRentalWithPayment({
            equipmentId: equipment.id.value,
            memberId: member.id.value,
            startDate,
            endDate,
            paymentMethod: 'CREDIT_CARD',
          }),
        ).rejects.toThrow('Payment failed');

        // Verify rental was not created
        const allRentals = await rentalRepo.findAll();
        expect(allRentals).toHaveLength(0);

        // Verify equipment still available
        const updatedEquipment = await equipmentRepo.findById(equipment.id);
        expect(updatedEquipment!.isAvailable).toBe(true);

        // Verify member rental count not incremented
        const updatedMember = await memberRepo.findById(member.id);
        expect(updatedMember!.activeRentalCount).toBe(0);
      });
    });

    describe('returnRentalWithPayment', () => {
      it('should return rental without fees and update all repositories', async () => {
        // Setup
        const equipment = Equipment.create({
          name: 'Drill',
          description: 'Power drill',
          category: 'Tools',
          dailyRate: Money.dollars(50),
          condition: EquipmentCondition.EXCELLENT,
          purchaseDate: new Date(),
        });
        await equipmentRepo.save(equipment);

        const member = Member.create({
          name: 'John Doe',
          email: 'john@example.com',
          tier: MembershipTier.GOLD,
          joinDate: new Date(),
          isActive: true,
        });
        member.incrementActiveRentals();
        await memberRepo.save(member);

        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 3);

        const rental = Rental.create({
          equipmentId: equipment.id,
          memberId: member.id,
          period: DateRange.create(startDate, endDate),
          baseCost: Money.dollars(135),
          conditionAtStart: EquipmentCondition.EXCELLENT,
        });
        equipment.markAsRented(rental.id.value);
        await rentalRepo.save(rental);
        await equipmentRepo.save(equipment);

        // Execute
        const result = await service.returnRentalWithPayment({
          rentalId: rental.id.value,
          conditionAtReturn: EquipmentCondition.EXCELLENT,
        });

        // Verify result
        expect(result.rentalId).toBe(rental.id.value);
        expect(result.lateFee).toBe(0);
        expect(result.damageFee).toBe(0);

        // Verify persistence
        const updatedRental = await rentalRepo.findById(rental.id);
        expect(updatedRental!.status).toBe(RentalStatus.RETURNED);

        const updatedEquipment = await equipmentRepo.findById(equipment.id);
        expect(updatedEquipment!.isAvailable).toBe(true);

        const updatedMember = await memberRepo.findById(member.id);
        expect(updatedMember!.activeRentalCount).toBe(0);
      });

      it('should process damage fees on return', async () => {
        const equipment = Equipment.create({
          name: 'Drill',
          description: 'Power drill',
          category: 'Tools',
          dailyRate: Money.dollars(50),
          condition: EquipmentCondition.EXCELLENT,
          purchaseDate: new Date(),
        });
        await equipmentRepo.save(equipment);

        const member = Member.create({
          name: 'John Doe',
          email: 'john@example.com',
          tier: MembershipTier.BASIC,
          joinDate: new Date(),
          isActive: true,
        });
        member.incrementActiveRentals();
        await memberRepo.save(member);

        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 1);

        const rental = Rental.create({
          equipmentId: equipment.id,
          memberId: member.id,
          period: DateRange.create(startDate, endDate),
          baseCost: Money.dollars(50),
          conditionAtStart: EquipmentCondition.EXCELLENT,
        });
        equipment.markAsRented(rental.id.value);
        await rentalRepo.save(rental);
        await equipmentRepo.save(equipment);

        // Return in damaged condition
        const result = await service.returnRentalWithPayment({
          rentalId: rental.id.value,
          conditionAtReturn: EquipmentCondition.DAMAGED,
          paymentMethod: 'CREDIT_CARD',
        });

        // Verify damage fees charged
        expect(result.damageFee).toBeGreaterThan(0);

        // Verify equipment condition updated
        const updatedEquipment = await equipmentRepo.findById(equipment.id);
        expect(updatedEquipment!.condition).toBe(EquipmentCondition.DAMAGED);
      });
    });

    describe('processOverdueRentals', () => {
      it('should identify and process overdue rentals', async () => {
        // Setup overdue rental
        const equipment = Equipment.create({
          name: 'Drill',
          description: 'Power drill',
          category: 'Tools',
          dailyRate: Money.dollars(50),
          condition: EquipmentCondition.EXCELLENT,
          purchaseDate: new Date(),
        });
        await equipmentRepo.save(equipment);

        const member = Member.create({
          name: 'John Doe',
          email: 'john@example.com',
          tier: MembershipTier.BASIC,
          joinDate: new Date(),
          isActive: true,
        });
        await memberRepo.save(member);

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 10);
        const endDate = new Date();
        endDate.setDate(endDate.getDate() - 3); // Ended 3 days ago

        const rental = Rental.create({
          equipmentId: equipment.id,
          memberId: member.id,
          period: DateRange.create(startDate, endDate),
          baseCost: Money.dollars(350),
          conditionAtStart: EquipmentCondition.EXCELLENT,
        });
        await rentalRepo.save(rental);

        // Execute
        const dailyLateFee = Money.dollars(10);
        const results = await service.processOverdueRentals(dailyLateFee);

        // Verify
        expect(results).toHaveLength(1);
        expect(results[0].rentalId).toBe(rental.id.value);
        expect(results[0].daysOverdue).toBeGreaterThan(0);
        expect(results[0].lateFee).toBeGreaterThan(0);

        // Verify rental updated with late fees
        const updatedRental = await rentalRepo.findById(rental.id);
        expect(updatedRental!.lateFee.amount).toBeGreaterThan(0);

        // Verify notification sent
        const notifications = notificationService.getNotifications();
        expect(notifications.some((n) => n.type === 'rental_overdue')).toBe(true);
      });
    });

    describe('sendRentalDueReminders', () => {
      it('should send reminders for rentals due soon', async () => {
        const equipment = Equipment.create({
          name: 'Drill',
          description: 'Power drill',
          category: 'Tools',
          dailyRate: Money.dollars(50),
          condition: EquipmentCondition.EXCELLENT,
          purchaseDate: new Date(),
        });
        await equipmentRepo.save(equipment);

        const member = Member.create({
          name: 'John Doe',
          email: 'john@example.com',
          tier: MembershipTier.BASIC,
          joinDate: new Date(),
          isActive: true,
        });
        await memberRepo.save(member);

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        const rental = Rental.create({
          equipmentId: equipment.id,
          memberId: member.id,
          period: DateRange.create(new Date(), tomorrow),
          baseCost: Money.dollars(50),
          conditionAtStart: EquipmentCondition.EXCELLENT,
        });
        await rentalRepo.save(rental);

        // Execute
        const results = await service.sendRentalDueReminders(2);

        // Verify
        expect(results).toHaveLength(1);
        expect(results[0].rentalId).toBe(rental.id.value);

        // Verify notification sent
        const notifications = notificationService.getNotifications();
        expect(notifications.some((n) => n.type === 'rental_due_soon')).toBe(true);
      });
    });

    describe('extendRental', () => {
      it('should extend rental period and charge additional cost', async () => {
        const equipment = Equipment.create({
          name: 'Drill',
          description: 'Power drill',
          category: 'Tools',
          dailyRate: Money.dollars(50),
          condition: EquipmentCondition.EXCELLENT,
          purchaseDate: new Date(),
        });
        await equipmentRepo.save(equipment);

        const member = Member.create({
          name: 'John Doe',
          email: 'john@example.com',
          tier: MembershipTier.GOLD,
          joinDate: new Date(),
          isActive: true,
        });
        await memberRepo.save(member);

        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 1);

        const rental = Rental.create({
          equipmentId: equipment.id,
          memberId: member.id,
          period: DateRange.create(startDate, endDate),
          baseCost: Money.dollars(45),
          conditionAtStart: EquipmentCondition.EXCELLENT,
        });
        await rentalRepo.save(rental);

        // Execute
        const result = await service.extendRental({
          rentalId: rental.id.value,
          additionalDays: 2,
          paymentMethod: 'CREDIT_CARD',
        });

        // Verify
        expect(result.rentalId).toBe(rental.id.value);
        expect(result.additionalCost).toBeGreaterThan(0);
        expect(result.transactionId).toBeDefined();

        // Verify rental extended in repository
        const updatedRental = await rentalRepo.findById(rental.id);
        expect(updatedRental!.totalCost.amount).toBeGreaterThan(45);
      });
    });
  });

  describe('ReservationService Integration', () => {
    let service: ReservationService;

    beforeEach(() => {
      service = new ReservationService(
        equipmentRepo,
        memberRepo,
        rentalRepo,
        reservationRepo,
        paymentService,
        notificationService,
        eventPublisher,
      );
    });

    describe('createReservation', () => {
      it('should create reservation and persist to repository', async () => {
        const equipment = Equipment.create({
          name: 'Excavator',
          description: 'Heavy equipment',
          category: 'Heavy Machinery',
          dailyRate: Money.dollars(500),
          condition: EquipmentCondition.EXCELLENT,
          purchaseDate: new Date(),
        });
        await equipmentRepo.save(equipment);

        const member = Member.create({
          name: 'Jane Smith',
          email: 'jane@example.com',
          tier: MembershipTier.PLATINUM,
          joinDate: new Date(),
          isActive: true,
        });
        await memberRepo.save(member);

        const startDate = new Date();
        startDate.setDate(startDate.getDate() + 5);
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 8);

        // Execute
        const result = await service.createReservation({
          equipmentId: equipment.id.value,
          memberId: member.id.value,
          startDate,
          endDate,
        });

        // Verify
        expect(result.reservationId).toBeDefined();
        expect(result.equipmentName).toBe('Excavator');

        // Verify persistence
        const savedReservation = await reservationRepo.findById({
          value: result.reservationId,
        } as any);
        expect(savedReservation).toBeDefined();

        // Verify notification sent
        const notifications = notificationService.getNotifications();
        expect(notifications.some((n) => n.type === 'reservation_created')).toBe(true);
      });

      it('should reject reservation with conflicting existing reservation', async () => {
        const equipment = Equipment.create({
          name: 'Drill',
          description: 'Power drill',
          category: 'Tools',
          dailyRate: Money.dollars(50),
          condition: EquipmentCondition.EXCELLENT,
          purchaseDate: new Date(),
        });
        await equipmentRepo.save(equipment);

        const member = Member.create({
          name: 'John Doe',
          email: 'john@example.com',
          tier: MembershipTier.GOLD,
          joinDate: new Date(),
          isActive: true,
        });
        await memberRepo.save(member);

        // Create existing reservation
        const existingStartDate = new Date();
        existingStartDate.setDate(existingStartDate.getDate() + 2);
        const existingEndDate = new Date();
        existingEndDate.setDate(existingEndDate.getDate() + 5);

        const existingReservation = Reservation.create({
          equipmentId: equipment.id,
          memberId: member.id,
          period: DateRange.create(existingStartDate, existingEndDate),
        });
        existingReservation.confirm();
        await reservationRepo.save(existingReservation);

        // Try conflicting reservation
        const newStartDate = new Date();
        newStartDate.setDate(newStartDate.getDate() + 3);
        const newEndDate = new Date();
        newEndDate.setDate(newEndDate.getDate() + 4);

        await expect(
          service.createReservation({
            equipmentId: equipment.id.value,
            memberId: member.id.value,
            startDate: newStartDate,
            endDate: newEndDate,
          }),
        ).rejects.toThrow(/already reserved/);
      });
    });

    describe('cancelReservation', () => {
      it('should cancel reservation and update repository', async () => {
        const equipment = Equipment.create({
          name: 'Drill',
          description: 'Power drill',
          category: 'Tools',
          dailyRate: Money.dollars(50),
          condition: EquipmentCondition.EXCELLENT,
          purchaseDate: new Date(),
        });
        await equipmentRepo.save(equipment);

        const member = Member.create({
          name: 'John Doe',
          email: 'john@example.com',
          tier: MembershipTier.GOLD,
          joinDate: new Date(),
          isActive: true,
        });
        await memberRepo.save(member);

        const startDate = new Date();
        startDate.setDate(startDate.getDate() + 5);
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 8);

        const reservation = Reservation.create({
          equipmentId: equipment.id,
          memberId: member.id,
          period: DateRange.create(startDate, endDate),
        });
        reservation.confirm();
        await reservationRepo.save(reservation);

        // Execute
        const result = await service.cancelReservation({
          reservationId: reservation.id.value,
          reason: 'Customer request',
        });

        // Verify
        expect(result.reservationId).toBe(reservation.id.value);
        expect(result.cancelledAt).toBeDefined();

        // Verify persistence
        const updatedReservation = await reservationRepo.findById(reservation.id);
        expect(updatedReservation!.cancelledAt).toBeDefined();

        // Verify notification sent
        const notifications = notificationService.getNotifications();
        expect(notifications.some((n) => n.type === 'reservation_cancelled')).toBe(true);
      });
    });

    describe('fulfillReservation', () => {
      it('should convert reservation to rental with payment', async () => {
        const equipment = Equipment.create({
          name: 'Drill',
          description: 'Power drill',
          category: 'Tools',
          dailyRate: Money.dollars(50),
          condition: EquipmentCondition.EXCELLENT,
          purchaseDate: new Date(),
        });
        await equipmentRepo.save(equipment);

        const member = Member.create({
          name: 'John Doe',
          email: 'john@example.com',
          tier: MembershipTier.GOLD,
          joinDate: new Date(),
          isActive: true,
        });
        await memberRepo.save(member);

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 1); // Started yesterday
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 3);

        // Create reservation with past start date using internal constructor
        const reservation = new (Reservation as any)({
          id: { value: `reservation-${Date.now()}` },
          equipmentId: equipment.id,
          memberId: member.id,
          period: DateRange.create(startDate, endDate),
          status: 'CONFIRMED',
          confirmedAt: new Date(),
        });
        await reservationRepo.save(reservation);

        // Execute
        const result = await service.fulfillReservation({
          reservationId: reservation.id.value,
          paymentMethod: 'CREDIT_CARD',
        });

        // Verify
        expect(result.reservationId).toBe(reservation.id.value);
        expect(result.rentalId).toBeDefined();
        expect(result.transactionId).toBeDefined();
        expect(result.paymentStatus).toBe('SUCCESS');

        // Verify rental created
        const rental = await rentalRepo.findById({ value: result.rentalId } as any);
        expect(rental).toBeDefined();
        expect(rental!.status).toBe(RentalStatus.ACTIVE);

        // Verify equipment marked as rented
        const updatedEquipment = await equipmentRepo.findById(equipment.id);
        expect(updatedEquipment!.isAvailable).toBe(false);

        // Verify member rental count incremented
        const updatedMember = await memberRepo.findById(member.id);
        expect(updatedMember!.activeRentalCount).toBe(1);

        // Verify reservation marked as fulfilled
        const updatedReservation = await reservationRepo.findById(reservation.id);
        expect(updatedReservation!.fulfilledAt).toBeDefined();
      });
    });

    describe('sendReservationReminders', () => {
      it('should send reminders for upcoming reservations', async () => {
        const equipment = Equipment.create({
          name: 'Drill',
          description: 'Power drill',
          category: 'Tools',
          dailyRate: Money.dollars(50),
          condition: EquipmentCondition.EXCELLENT,
          purchaseDate: new Date(),
        });
        await equipmentRepo.save(equipment);

        const member = Member.create({
          name: 'John Doe',
          email: 'john@example.com',
          tier: MembershipTier.GOLD,
          joinDate: new Date(),
          isActive: true,
        });
        await memberRepo.save(member);

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayAfter = new Date();
        dayAfter.setDate(dayAfter.getDate() + 2);

        const reservation = Reservation.create({
          equipmentId: equipment.id,
          memberId: member.id,
          period: DateRange.create(tomorrow, dayAfter),
        });
        reservation.confirm();
        await reservationRepo.save(reservation);

        // Execute
        const results = await service.sendReservationReminders(2);

        // Verify
        expect(results).toHaveLength(1);
        expect(results[0].reservationId).toBe(reservation.id.value);

        // Verify notification sent
        const notifications = notificationService.getNotifications();
        expect(notifications.some((n) => n.type === 'reservation_reminder')).toBe(true);
      });
    });
  });
});
