import { ReservationService } from '../ReservationService.js';
import { EquipmentRepository } from '../../../domain/ports/EquipmentRepository.js';
import { MemberRepository } from '../../../domain/ports/MemberRepository.js';
import { RentalRepository } from '../../../domain/ports/RentalRepository.js';
import { ReservationRepository } from '../../../domain/ports/ReservationRepository.js';
import { PaymentService, PaymentResult } from '../../../domain/ports/PaymentService.js';
import {
  NotificationService,
  NotificationResult,
} from '../../../domain/ports/NotificationService.js';
import { EventPublisher } from '../../../domain/ports/EventPublisher.js';
import { Equipment } from '../../../domain/entities/Equipment.js';
import { Member } from '../../../domain/entities/Member.js';
import { Reservation } from '../../../domain/entities/Reservation.js';
import { Money } from '../../../domain/value-objects/Money.js';
import { DateRange } from '../../../domain/value-objects/DateRange.js';
import { EquipmentCondition } from '../../../domain/types/EquipmentCondition.js';
import { MembershipTier } from '../../../domain/types/MembershipTier.js';

describe('ReservationService', () => {
  let service: ReservationService;
  let equipmentRepository: jest.Mocked<EquipmentRepository>;
  let memberRepository: jest.Mocked<MemberRepository>;
  let rentalRepository: jest.Mocked<RentalRepository>;
  let reservationRepository: jest.Mocked<ReservationRepository>;
  let paymentService: jest.Mocked<PaymentService>;
  let notificationService: jest.Mocked<NotificationService>;
  let eventPublisher: jest.Mocked<EventPublisher>;

  // Test data
  let equipment: Equipment;
  let member: Member;
  let reservation: Reservation;

  beforeEach(() => {
    // Create mocked repositories and services
    equipmentRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findAvailable: jest.fn(),
      findByCondition: jest.fn(),
      findRequiringMaintenance: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<EquipmentRepository>;

    memberRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findActive: jest.fn(),
      findByTier: jest.fn(),
      findWithOverdueRentals: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<MemberRepository>;

    rentalRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findByMember: jest.fn(),
      findByMemberId: jest.fn(),
      findByEquipment: jest.fn(),
      findByEquipmentId: jest.fn(),
      findByStatus: jest.fn(),
      findActive: jest.fn(),
      findOverdue: jest.fn(),
      findByDateRange: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<RentalRepository>;

    reservationRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findByMember: jest.fn(),
      findByEquipment: jest.fn(),
      findByStatus: jest.fn(),
      findActive: jest.fn(),
      findConflicting: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<ReservationRepository>;

    paymentService = {
      charge: jest.fn(),
      refund: jest.fn(),
      authorizePayment: jest.fn(),
      capturePayment: jest.fn(),
      cancelAuthorization: jest.fn(),
      processPayment: jest.fn(),
      getPaymentStatus: jest.fn(),
      processRefund: jest.fn(),
      getPaymentDetails: jest.fn(),
      verifyPaymentMethod: jest.fn(),
      calculateProcessingFee: jest.fn(),
    } as unknown as jest.Mocked<PaymentService>;

    notificationService = {
      notifyRentalCreated: jest.fn(),
      notifyRentalReturned: jest.fn(),
      notifyRentalOverdue: jest.fn(),
      notifyRentalDueSoon: jest.fn(),
      notifyReservationCreated: jest.fn(),
      notifyReservationCancelled: jest.fn(),
      notifyReservationReminder: jest.fn(),
      notifyEquipmentDamaged: jest.fn(),
      notifyPaymentReceived: jest.fn(),
      notifyPaymentFailed: jest.fn(),
      sendCustomNotification: jest.fn(),
    } as unknown as jest.Mocked<NotificationService>;

    eventPublisher = {
      publish: jest.fn(),
      publishMany: jest.fn(),
      subscribe: jest.fn(),
      subscribeToAll: jest.fn(),
      unsubscribe: jest.fn(),
      clearAllHandlers: jest.fn(),
      getHandlerCount: jest.fn(),
      hasHandlers: jest.fn(),
    } as unknown as jest.Mocked<EventPublisher>;

    // Create service instance
    service = new ReservationService(
      equipmentRepository,
      memberRepository,
      rentalRepository,
      reservationRepository,
      paymentService,
      notificationService,
      eventPublisher,
    );

    // Set up test data
    equipment = Equipment.create({
      name: 'Test Equipment',
      description: 'A test equipment item',
      category: 'TEST',
      dailyRate: Money.dollars(50),
      condition: EquipmentCondition.EXCELLENT,
      purchaseDate: new Date('2023-01-01'),
    });

    member = Member.create({
      name: 'Test Member',
      email: 'test@example.com',
      tier: MembershipTier.GOLD,
      joinDate: new Date('2023-01-01'),
      isActive: true,
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const period = DateRange.create(tomorrow, nextWeek);

    reservation = Reservation.create({
      equipmentId: equipment.id,
      memberId: member.id,
      period,
    });
  });

  describe('createReservation', () => {
    it('should create reservation without payment authorization', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      equipmentRepository.findById.mockResolvedValue(equipment);
      memberRepository.findById.mockResolvedValue(member);
      rentalRepository.findByMemberId.mockResolvedValue([]);
      reservationRepository.findConflicting.mockResolvedValue([]);
      rentalRepository.findByEquipmentId.mockResolvedValue([]);

      const notificationResult: NotificationResult = {
        success: true,
        channel: 'EMAIL',
        sentAt: new Date(),
      };
      notificationService.notifyReservationCreated.mockResolvedValue(notificationResult);

      const result = await service.createReservation({
        equipmentId: equipment.id.value,
        memberId: member.id.value,
        startDate: tomorrow,
        endDate: nextWeek,
      });

      expect(result.reservationId).toBeDefined();
      expect(result.equipmentName).toBe('Test Equipment');
      expect(reservationRepository.save).toHaveBeenCalled();
      expect(eventPublisher.publish).toHaveBeenCalled();
      expect(notificationService.notifyReservationCreated).toHaveBeenCalled();
    });

    it('should create reservation with payment authorization', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      equipmentRepository.findById.mockResolvedValue(equipment);
      memberRepository.findById.mockResolvedValue(member);
      rentalRepository.findByMemberId.mockResolvedValue([]);
      reservationRepository.findConflicting.mockResolvedValue([]);
      rentalRepository.findByEquipmentId.mockResolvedValue([]);

      const paymentResult: PaymentResult = {
        status: 'SUCCESS',
        transactionId: 'auth-123',
        amount: Money.dollars(300),
        processedAt: new Date(),
      };
      paymentService.authorizePayment.mockResolvedValue(paymentResult);

      const notificationResult: NotificationResult = {
        success: true,
        channel: 'EMAIL',
        sentAt: new Date(),
      };
      notificationService.notifyReservationCreated.mockResolvedValue(notificationResult);

      const result = await service.createReservation({
        equipmentId: equipment.id.value,
        memberId: member.id.value,
        startDate: tomorrow,
        endDate: nextWeek,
        paymentMethod: 'CREDIT_CARD',
        authorizePayment: true,
      });

      expect(result.authorizationId).toBe('auth-123');
      expect(paymentService.authorizePayment).toHaveBeenCalled();
    });

    it('should throw error when equipment not found', async () => {
      equipmentRepository.findById.mockResolvedValue(undefined);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      await expect(
        service.createReservation({
          equipmentId: 'invalid-id',
          memberId: member.id.value,
          startDate: tomorrow,
          endDate: nextWeek,
        }),
      ).rejects.toThrow('Equipment not found');
    });

    it('should throw error when member has overdue rentals', async () => {
      const overdueRental = {
        isOverdue: jest.fn().mockReturnValue(true),
      };

      equipmentRepository.findById.mockResolvedValue(equipment);
      memberRepository.findById.mockResolvedValue(member);
      rentalRepository.findByMemberId.mockResolvedValue([overdueRental as any]);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      await expect(
        service.createReservation({
          equipmentId: equipment.id.value,
          memberId: member.id.value,
          startDate: tomorrow,
          endDate: nextWeek,
        }),
      ).rejects.toThrow();
    });

    it('should throw error when conflicting reservation exists', async () => {
      equipmentRepository.findById.mockResolvedValue(equipment);
      memberRepository.findById.mockResolvedValue(member);
      rentalRepository.findByMemberId.mockResolvedValue([]);
      reservationRepository.findConflicting.mockResolvedValue([reservation]);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      await expect(
        service.createReservation({
          equipmentId: equipment.id.value,
          memberId: member.id.value,
          startDate: tomorrow,
          endDate: nextWeek,
        }),
      ).rejects.toThrow('already reserved');
    });
  });

  describe('cancelReservation', () => {
    it('should cancel reservation without authorization', async () => {
      reservationRepository.findById.mockResolvedValue(reservation);
      equipmentRepository.findById.mockResolvedValue(equipment);

      const notificationResult: NotificationResult = {
        success: true,
        channel: 'EMAIL',
        sentAt: new Date(),
      };
      notificationService.notifyReservationCancelled.mockResolvedValue(notificationResult);

      const result = await service.cancelReservation({
        reservationId: reservation.id.value,
        reason: 'Changed plans',
      });

      expect(result.reservationId).toBe(reservation.id.value);
      expect(result.cancelledAt).toBeDefined();
      expect(reservationRepository.save).toHaveBeenCalled();
      expect(eventPublisher.publish).toHaveBeenCalled();
    });

    it('should cancel reservation with payment authorization cancellation', async () => {
      reservationRepository.findById.mockResolvedValue(reservation);
      equipmentRepository.findById.mockResolvedValue(equipment);

      const cancelResult: PaymentResult = {
        status: 'SUCCESS',
        transactionId: 'cancel-123',
        amount: Money.dollars(300),
        processedAt: new Date(),
      };
      paymentService.cancelAuthorization.mockResolvedValue(cancelResult);

      const notificationResult: NotificationResult = {
        success: true,
        channel: 'EMAIL',
        sentAt: new Date(),
      };
      notificationService.notifyReservationCancelled.mockResolvedValue(notificationResult);

      const result = await service.cancelReservation({
        reservationId: reservation.id.value,
        authorizationId: 'auth-123',
      });

      expect(result.refundTransactionId).toBe('cancel-123');
      expect(paymentService.cancelAuthorization).toHaveBeenCalled();
    });
  });

  describe('fulfillReservation', () => {
    it('should fulfill reservation and create rental', async () => {
      // Create a reservation with a period that has started
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      const startedReservation = Reservation.reconstitute({
        id: reservation.id,
        equipmentId: equipment.id,
        memberId: member.id,
        period: DateRange.create(yesterday, nextWeek),
        status: 'CONFIRMED',
        createdAt: new Date(),
        confirmedAt: new Date(),
      });

      reservationRepository.findById.mockResolvedValue(startedReservation);
      equipmentRepository.findById.mockResolvedValue(equipment);
      memberRepository.findById.mockResolvedValue(member);

      const paymentResult: PaymentResult = {
        status: 'SUCCESS',
        transactionId: 'txn-123',
        amount: Money.dollars(300),
        processedAt: new Date(),
      };
      paymentService.processPayment.mockResolvedValue(paymentResult);

      const notificationResult: NotificationResult = {
        success: true,
        channel: 'EMAIL',
        sentAt: new Date(),
      };
      notificationService.notifyRentalCreated.mockResolvedValue(notificationResult);
      notificationService.notifyPaymentReceived.mockResolvedValue(notificationResult);

      const result = await service.fulfillReservation({
        reservationId: reservation.id.value,
        paymentMethod: 'CREDIT_CARD',
      });

      expect(result.reservationId).toBe(reservation.id.value);
      expect(result.rentalId).toBeDefined();
      expect(result.transactionId).toBe('txn-123');
      expect(rentalRepository.save).toHaveBeenCalled();
      expect(reservationRepository.save).toHaveBeenCalled();
    });

    it('should fulfill reservation with payment authorization capture', async () => {
      // Create a reservation with a period that has started
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      const startedReservation = Reservation.reconstitute({
        id: reservation.id,
        equipmentId: equipment.id,
        memberId: member.id,
        period: DateRange.create(yesterday, nextWeek),
        status: 'CONFIRMED',
        createdAt: new Date(),
        confirmedAt: new Date(),
      });

      reservationRepository.findById.mockResolvedValue(startedReservation);
      equipmentRepository.findById.mockResolvedValue(equipment);
      memberRepository.findById.mockResolvedValue(member);

      const paymentResult: PaymentResult = {
        status: 'SUCCESS',
        transactionId: 'capture-123',
        amount: Money.dollars(300),
        processedAt: new Date(),
      };
      paymentService.capturePayment.mockResolvedValue(paymentResult);

      const notificationResult: NotificationResult = {
        success: true,
        channel: 'EMAIL',
        sentAt: new Date(),
      };
      notificationService.notifyRentalCreated.mockResolvedValue(notificationResult);
      notificationService.notifyPaymentReceived.mockResolvedValue(notificationResult);

      const result = await service.fulfillReservation({
        reservationId: reservation.id.value,
        paymentMethod: 'CREDIT_CARD',
        authorizationId: 'auth-123',
      });

      expect(result.transactionId).toBe('capture-123');
      expect(paymentService.capturePayment).toHaveBeenCalled();
    });

    it('should throw error when reservation is not confirmed', async () => {
      reservationRepository.findById.mockResolvedValue(reservation);

      await expect(
        service.fulfillReservation({
          reservationId: reservation.id.value,
          paymentMethod: 'CREDIT_CARD',
        }),
      ).rejects.toThrow('Only confirmed reservations can be fulfilled');
    });

    it('should throw error when payment fails', async () => {
      reservation.confirm();
      reservationRepository.findById.mockResolvedValue(reservation);
      equipmentRepository.findById.mockResolvedValue(equipment);
      memberRepository.findById.mockResolvedValue(member);

      const paymentResult: PaymentResult = {
        status: 'FAILED',
        transactionId: 'txn-failed',
        amount: Money.dollars(300),
        processedAt: new Date(),
        errorMessage: 'Insufficient funds',
      };
      paymentService.processPayment.mockResolvedValue(paymentResult);

      const notificationResult: NotificationResult = {
        success: true,
        channel: 'EMAIL',
        sentAt: new Date(),
      };
      notificationService.notifyPaymentFailed.mockResolvedValue(notificationResult);

      await expect(
        service.fulfillReservation({
          reservationId: reservation.id.value,
          paymentMethod: 'CREDIT_CARD',
        }),
      ).rejects.toThrow('Payment failed');
    });
  });

  describe('sendReservationReminders', () => {
    it('should send reminders for upcoming reservations', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 8);

      const upcomingReservation = Reservation.create({
        equipmentId: equipment.id,
        memberId: member.id,
        period: DateRange.create(tomorrow, nextWeek),
      });
      upcomingReservation.confirm();

      reservationRepository.findByStatus.mockResolvedValue([upcomingReservation]);
      equipmentRepository.findById.mockResolvedValue(equipment);

      const notificationResult: NotificationResult = {
        success: true,
        channel: 'EMAIL',
        sentAt: new Date(),
      };
      notificationService.notifyReservationReminder.mockResolvedValue(notificationResult);

      const results = await service.sendReservationReminders(2);

      expect(results.length).toBe(1);
      expect(notificationService.notifyReservationReminder).toHaveBeenCalled();
    });

    it('should not send reminders for reservations too far in future', async () => {
      const farFuture = new Date();
      farFuture.setDate(farFuture.getDate() + 10);
      const evenFarther = new Date();
      evenFarther.setDate(evenFarther.getDate() + 17);

      const futureReservation = Reservation.create({
        equipmentId: equipment.id,
        memberId: member.id,
        period: DateRange.create(farFuture, evenFarther),
      });
      futureReservation.confirm();

      reservationRepository.findByStatus.mockResolvedValue([futureReservation]);

      const results = await service.sendReservationReminders(2);

      expect(results.length).toBe(0);
      expect(notificationService.notifyReservationReminder).not.toHaveBeenCalled();
    });
  });

  describe('processExpiredReservations', () => {
    it('should mark expired reservations', async () => {
      // Create a reservation where both start and end are in the past
      // (started but was never fulfilled and has now ended)
      const pastStart = new Date();
      pastStart.setDate(pastStart.getDate() - 10);
      const pastEnd = new Date();
      pastEnd.setDate(pastEnd.getDate() - 2);

      const expiredReservation = Reservation.reconstitute({
        id: reservation.id,
        equipmentId: equipment.id,
        memberId: member.id,
        period: DateRange.create(pastStart, pastEnd),
        status: 'PENDING',
        createdAt: new Date(),
      });

      reservationRepository.findActive.mockResolvedValue([expiredReservation]);
      equipmentRepository.findById.mockResolvedValue(equipment);

      const notificationResult: NotificationResult = {
        success: true,
        channel: 'EMAIL',
        sentAt: new Date(),
      };
      notificationService.notifyReservationCancelled.mockResolvedValue(notificationResult);

      const results = await service.processExpiredReservations();

      expect(results.length).toBe(1);
      expect(reservationRepository.save).toHaveBeenCalled();
      expect(notificationService.notifyReservationCancelled).toHaveBeenCalled();
    });

    it('should not mark non-expired reservations', async () => {
      const futureStart = new Date();
      futureStart.setDate(futureStart.getDate() + 1);
      const futureEnd = new Date();
      futureEnd.setDate(futureEnd.getDate() + 7);

      const activeReservation = Reservation.create({
        equipmentId: equipment.id,
        memberId: member.id,
        period: DateRange.create(futureStart, futureEnd),
      });

      reservationRepository.findActive.mockResolvedValue([activeReservation]);

      const results = await service.processExpiredReservations();

      expect(results.length).toBe(0);
      expect(reservationRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('confirmReservation', () => {
    it('should confirm a pending reservation', async () => {
      reservationRepository.findById.mockResolvedValue(reservation);
      equipmentRepository.findById.mockResolvedValue(equipment);

      const notificationResult: NotificationResult = {
        success: true,
        channel: 'EMAIL',
        sentAt: new Date(),
      };
      notificationService.notifyReservationCreated.mockResolvedValue(notificationResult);

      const result = await service.confirmReservation({
        reservationId: reservation.id.value,
      });

      expect(result.reservationId).toBe(reservation.id.value);
      expect(result.confirmedAt).toBeDefined();
      expect(reservationRepository.save).toHaveBeenCalled();
    });
  });
});
