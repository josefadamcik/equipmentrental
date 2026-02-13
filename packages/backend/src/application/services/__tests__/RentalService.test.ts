import { RentalService } from '../RentalService.js';
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
import { Rental } from '../../../domain/entities/Rental.js';
import { Money } from '../../../domain/value-objects/Money.js';
import { DateRange } from '../../../domain/value-objects/DateRange.js';
import { EquipmentCondition } from '../../../domain/types/EquipmentCondition.js';
import { MembershipTier } from '../../../domain/types/MembershipTier.js';

describe('RentalService', () => {
  let service: RentalService;
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
  let rental: Rental;

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
    service = new RentalService(
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

    const period = DateRange.create(new Date('2024-01-01'), new Date('2024-01-05'));

    rental = Rental.create({
      equipmentId: equipment.id,
      memberId: member.id,
      period,
      baseCost: Money.dollars(200),
      conditionAtStart: EquipmentCondition.EXCELLENT,
    });
  });

  describe('createRentalWithPayment', () => {
    it('should create rental with successful payment', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-05');

      equipmentRepository.findById.mockResolvedValue(equipment);
      memberRepository.findById.mockResolvedValue(member);
      rentalRepository.findByMemberId.mockResolvedValue([]);
      reservationRepository.findConflicting.mockResolvedValue([]);

      const paymentResult: PaymentResult = {
        status: 'SUCCESS',
        transactionId: 'txn-123',
        amount: Money.dollars(200),
        processedAt: new Date(),
      };
      paymentService.processPayment.mockResolvedValue(paymentResult);

      const notificationResult: NotificationResult = {
        success: true,
        channel: 'EMAIL',
        sentAt: new Date(),
        messageId: 'msg-123',
      };
      notificationService.notifyRentalCreated.mockResolvedValue(notificationResult);
      notificationService.notifyPaymentReceived.mockResolvedValue(notificationResult);

      const result = await service.createRentalWithPayment({
        equipmentId: equipment.id.value,
        memberId: member.id.value,
        startDate,
        endDate,
        paymentMethod: 'CREDIT_CARD',
      });

      expect(result.rentalId).toBeDefined();
      expect(result.totalCost).toBeGreaterThan(0);
      expect(result.transactionId).toBe('txn-123');
      expect(result.paymentStatus).toBe('SUCCESS');
      expect(rentalRepository.save).toHaveBeenCalled();
      expect(equipmentRepository.save).toHaveBeenCalled();
      expect(memberRepository.save).toHaveBeenCalled();
      expect(eventPublisher.publish).toHaveBeenCalled();
    });

    it('should throw error when equipment not found', async () => {
      equipmentRepository.findById.mockResolvedValue(undefined);

      await expect(
        service.createRentalWithPayment({
          equipmentId: 'invalid-id',
          memberId: member.id.value,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-05'),
          paymentMethod: 'CREDIT_CARD',
        }),
      ).rejects.toThrow('Equipment not found');
    });

    it('should throw error when equipment is not available', async () => {
      equipment.markAsRented('rental-123');
      equipmentRepository.findById.mockResolvedValue(equipment);

      await expect(
        service.createRentalWithPayment({
          equipmentId: equipment.id.value,
          memberId: member.id.value,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-05'),
          paymentMethod: 'CREDIT_CARD',
        }),
      ).rejects.toThrow('Equipment is currently rented');
    });

    it('should throw error when payment fails', async () => {
      equipmentRepository.findById.mockResolvedValue(equipment);
      memberRepository.findById.mockResolvedValue(member);
      rentalRepository.findByMemberId.mockResolvedValue([]);
      reservationRepository.findConflicting.mockResolvedValue([]);

      const paymentResult: PaymentResult = {
        status: 'FAILED',
        transactionId: 'txn-456',
        amount: Money.dollars(200),
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
        service.createRentalWithPayment({
          equipmentId: equipment.id.value,
          memberId: member.id.value,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-05'),
          paymentMethod: 'CREDIT_CARD',
        }),
      ).rejects.toThrow('Payment failed');

      expect(notificationService.notifyPaymentFailed).toHaveBeenCalled();
    });
  });

  describe('returnRentalWithPayment', () => {
    it('should process rental return without fees', async () => {
      // Create fresh equipment for this test and mark as rented
      const testEquipment = Equipment.create({
        name: 'Test Equipment',
        description: 'A test equipment item',
        category: 'TEST',
        dailyRate: Money.dollars(50),
        condition: EquipmentCondition.EXCELLENT,
        purchaseDate: new Date('2023-01-01'),
      });
      testEquipment.markAsRented(rental.id.value);

      // Create member with active rental
      const testMember = Member.create({
        name: 'Test Member',
        email: 'test@example.com',
        tier: MembershipTier.GOLD,
        joinDate: new Date('2023-01-01'),
        isActive: true,
      });
      testMember.incrementActiveRentals();

      rentalRepository.findById.mockResolvedValue(rental);
      equipmentRepository.findById.mockResolvedValue(testEquipment);
      memberRepository.findById.mockResolvedValue(testMember);

      const notificationResult: NotificationResult = {
        success: true,
        channel: 'EMAIL',
        sentAt: new Date(),
      };
      notificationService.notifyRentalReturned.mockResolvedValue(notificationResult);

      const result = await service.returnRentalWithPayment({
        rentalId: rental.id.value,
        conditionAtReturn: EquipmentCondition.GOOD,
      });

      expect(result.rentalId).toBe(rental.id.value);
      expect(rentalRepository.save).toHaveBeenCalled();
      expect(equipmentRepository.save).toHaveBeenCalled();
      expect(memberRepository.save).toHaveBeenCalled();
      expect(eventPublisher.publish).toHaveBeenCalled();
    });

    it('should process rental return with damage fees', async () => {
      // Create fresh equipment for this test and mark as rented
      const testEquipment = Equipment.create({
        name: 'Test Equipment',
        description: 'A test equipment item',
        category: 'TEST',
        dailyRate: Money.dollars(50),
        condition: EquipmentCondition.EXCELLENT,
        purchaseDate: new Date('2023-01-01'),
      });
      testEquipment.markAsRented(rental.id.value);

      // Create member with active rental
      const testMember = Member.create({
        name: 'Test Member',
        email: 'test@example.com',
        tier: MembershipTier.GOLD,
        joinDate: new Date('2023-01-01'),
        isActive: true,
      });
      testMember.incrementActiveRentals();

      rentalRepository.findById.mockResolvedValue(rental);
      equipmentRepository.findById.mockResolvedValue(testEquipment);
      memberRepository.findById.mockResolvedValue(testMember);

      const paymentResult: PaymentResult = {
        status: 'SUCCESS',
        transactionId: 'txn-damage',
        amount: Money.dollars(100),
        processedAt: new Date(),
      };
      paymentService.processPayment.mockResolvedValue(paymentResult);

      const notificationResult: NotificationResult = {
        success: true,
        channel: 'EMAIL',
        sentAt: new Date(),
      };
      notificationService.notifyRentalReturned.mockResolvedValue(notificationResult);
      notificationService.notifyPaymentReceived.mockResolvedValue(notificationResult);
      notificationService.notifyEquipmentDamaged.mockResolvedValue(notificationResult);

      const result = await service.returnRentalWithPayment({
        rentalId: rental.id.value,
        conditionAtReturn: EquipmentCondition.DAMAGED,
        paymentMethod: 'CREDIT_CARD',
      });

      expect(result.damageFee).toBeGreaterThan(0);
      expect(notificationService.notifyEquipmentDamaged).toHaveBeenCalled();
    });
  });

  describe('processOverdueRentals', () => {
    it('should process overdue rentals and send notifications', async () => {
      const overdueRental = Rental.create({
        equipmentId: equipment.id,
        memberId: member.id,
        period: DateRange.create(new Date('2020-01-01'), new Date('2020-01-05')),
        baseCost: Money.dollars(200),
        conditionAtStart: EquipmentCondition.EXCELLENT,
      });

      rentalRepository.findActive.mockResolvedValue([overdueRental]);
      equipmentRepository.findById.mockResolvedValue(equipment);
      memberRepository.findById.mockResolvedValue(member);

      const notificationResult: NotificationResult = {
        success: true,
        channel: 'EMAIL',
        sentAt: new Date(),
      };
      notificationService.notifyRentalOverdue.mockResolvedValue(notificationResult);

      const results = await service.processOverdueRentals(Money.dollars(10));

      expect(results.length).toBe(1);
      expect(results[0].daysOverdue).toBeGreaterThan(0);
      expect(results[0].lateFee).toBeGreaterThan(0);
      expect(rentalRepository.save).toHaveBeenCalled();
      expect(notificationService.notifyRentalOverdue).toHaveBeenCalled();
      expect(eventPublisher.publish).toHaveBeenCalled();
    });

    it('should not process rentals that are not overdue', async () => {
      const futureRental = Rental.create({
        equipmentId: equipment.id,
        memberId: member.id,
        period: DateRange.create(new Date('2030-01-01'), new Date('2030-01-05')),
        baseCost: Money.dollars(200),
        conditionAtStart: EquipmentCondition.EXCELLENT,
      });

      rentalRepository.findActive.mockResolvedValue([futureRental]);

      const results = await service.processOverdueRentals(Money.dollars(10));

      expect(results.length).toBe(0);
      expect(rentalRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('sendRentalDueReminders', () => {
    it('should send reminders for rentals due soon', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

      const upcomingRental = Rental.create({
        equipmentId: equipment.id,
        memberId: member.id,
        period: DateRange.create(new Date(), tomorrow),
        baseCost: Money.dollars(200),
        conditionAtStart: EquipmentCondition.EXCELLENT,
      });

      rentalRepository.findActive.mockResolvedValue([upcomingRental]);
      equipmentRepository.findById.mockResolvedValue(equipment);

      const notificationResult: NotificationResult = {
        success: true,
        channel: 'EMAIL',
        sentAt: new Date(),
      };
      notificationService.notifyRentalDueSoon.mockResolvedValue(notificationResult);

      const results = await service.sendRentalDueReminders(2);

      expect(results.length).toBe(1);
      expect(notificationService.notifyRentalDueSoon).toHaveBeenCalled();
    });

    it('should not send reminders for rentals too far in future', async () => {
      const farFuture = new Date();
      farFuture.setDate(farFuture.getDate() + 10);

      const futureRental = Rental.create({
        equipmentId: equipment.id,
        memberId: member.id,
        period: DateRange.create(new Date(), farFuture),
        baseCost: Money.dollars(200),
        conditionAtStart: EquipmentCondition.EXCELLENT,
      });

      rentalRepository.findActive.mockResolvedValue([futureRental]);

      const results = await service.sendRentalDueReminders(2);

      expect(results.length).toBe(0);
      expect(notificationService.notifyRentalDueSoon).not.toHaveBeenCalled();
    });
  });

  describe('extendRental', () => {
    it('should extend rental with successful payment', async () => {
      rentalRepository.findById.mockResolvedValue(rental);
      equipmentRepository.findById.mockResolvedValue(equipment);
      memberRepository.findById.mockResolvedValue(member);

      const paymentResult: PaymentResult = {
        status: 'SUCCESS',
        transactionId: 'txn-extend',
        amount: Money.dollars(100),
        processedAt: new Date(),
      };
      paymentService.processPayment.mockResolvedValue(paymentResult);

      const notificationResult: NotificationResult = {
        success: true,
        channel: 'EMAIL',
        sentAt: new Date(),
      };
      notificationService.notifyPaymentReceived.mockResolvedValue(notificationResult);

      const result = await service.extendRental({
        rentalId: rental.id.value,
        additionalDays: 2,
        paymentMethod: 'CREDIT_CARD',
      });

      expect(result.rentalId).toBe(rental.id.value);
      expect(result.additionalCost).toBeGreaterThan(0);
      expect(result.transactionId).toBe('txn-extend');
      expect(rentalRepository.save).toHaveBeenCalled();
    });

    it('should throw error when payment fails', async () => {
      rentalRepository.findById.mockResolvedValue(rental);
      equipmentRepository.findById.mockResolvedValue(equipment);
      memberRepository.findById.mockResolvedValue(member);

      const paymentResult: PaymentResult = {
        status: 'FAILED',
        transactionId: 'txn-failed',
        amount: Money.dollars(100),
        processedAt: new Date(),
        errorMessage: 'Card declined',
      };
      paymentService.processPayment.mockResolvedValue(paymentResult);

      const notificationResult: NotificationResult = {
        success: true,
        channel: 'EMAIL',
        sentAt: new Date(),
      };
      notificationService.notifyPaymentFailed.mockResolvedValue(notificationResult);

      await expect(
        service.extendRental({
          rentalId: rental.id.value,
          additionalDays: 2,
          paymentMethod: 'CREDIT_CARD',
        }),
      ).rejects.toThrow('Payment failed');
    });
  });
});
