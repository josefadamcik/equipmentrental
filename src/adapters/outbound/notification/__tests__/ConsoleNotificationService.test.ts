import { ConsoleNotificationService } from '../ConsoleNotificationService.js';
import {
  MemberId,
  RentalId,
  EquipmentId,
  ReservationId,
} from '../../../../domain/value-objects/identifiers.js';
import { Money } from '../../../../domain/value-objects/Money.js';
import {
  NotificationChannel,
  NotificationPriority,
} from '../../../../domain/ports/NotificationService.js';

describe('ConsoleNotificationService', () => {
  let service: ConsoleNotificationService;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    service = new ConsoleNotificationService();
    // Spy on console.log to suppress output during tests
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('notifyRentalCreated', () => {
    it('should send rental created notification', async () => {
      const memberId = MemberId.generate();
      const rentalId = RentalId.generate();
      const equipmentName = 'Excavator';
      const startDate = new Date('2026-02-01');
      const endDate = new Date('2026-02-07');
      const totalCost = Money.dollars(350);

      await service.notifyRentalCreated(
        memberId,
        rentalId,
        equipmentName,
        startDate,
        endDate,
        totalCost,
      );

      const notifications = service.getSentNotifications();
      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe('RENTAL_CREATED');
      expect(notifications[0].recipientId).toBe(memberId.value);
      expect(notifications[0].subject).toBe('Rental Confirmation');
      expect(notifications[0].message).toContain(equipmentName);
      expect(notifications[0].message).toContain(rentalId.value);
      expect(notifications[0].priority).toBe(NotificationPriority.NORMAL);
    });

    it('should use specified notification channel', async () => {
      const memberId = MemberId.generate();
      const rentalId = RentalId.generate();
      const totalCost = Money.dollars(100);

      await service.notifyRentalCreated(
        memberId,
        rentalId,
        'Equipment',
        new Date(),
        new Date(),
        totalCost,
        NotificationChannel.SMS,
      );

      const notifications = service.getSentNotifications();
      expect(notifications[0].channel).toBe(NotificationChannel.SMS);
    });

    it('should include metadata', async () => {
      const memberId = MemberId.generate();
      const rentalId = RentalId.generate();
      const totalCost = Money.dollars(100);

      await service.notifyRentalCreated(
        memberId,
        rentalId,
        'Equipment',
        new Date(),
        new Date(),
        totalCost,
      );

      const notifications = service.getSentNotifications();
      expect(notifications[0].metadata).toBeDefined();
      expect(notifications[0].metadata?.rentalId).toBe(rentalId.value);
      expect(notifications[0].metadata?.totalCost).toBe(100);
    });
  });

  describe('notifyRentalReturned', () => {
    it('should send rental returned notification', async () => {
      const memberId = MemberId.generate();
      const rentalId = RentalId.generate();
      const returnDate = new Date();
      const finalCost = Money.dollars(400);

      await service.notifyRentalReturned(memberId, rentalId, 'Bulldozer', returnDate, finalCost);

      const notifications = service.getSentNotifications();
      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe('RENTAL_RETURNED');
      expect(notifications[0].message).toContain('Bulldozer');
      expect(notifications[0].message).toContain(finalCost.toString());
    });
  });

  describe('notifyRentalOverdue', () => {
    it('should send overdue notification with high priority', async () => {
      const memberId = MemberId.generate();
      const rentalId = RentalId.generate();
      const lateFee = Money.dollars(30);

      await service.notifyRentalOverdue(memberId, rentalId, 'Crane', 3, lateFee);

      const notifications = service.getSentNotifications();
      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe('RENTAL_OVERDUE');
      expect(notifications[0].priority).toBe(NotificationPriority.HIGH);
      expect(notifications[0].subject).toContain('URGENT');
      expect(notifications[0].message).toContain('3 days');
      expect(notifications[0].metadata?.daysOverdue).toBe(3);
    });

    it('should handle singular day correctly', async () => {
      const memberId = MemberId.generate();
      const rentalId = RentalId.generate();
      const lateFee = Money.dollars(10);

      await service.notifyRentalOverdue(memberId, rentalId, 'Equipment', 1, lateFee);

      const notifications = service.getSentNotifications();
      expect(notifications[0].message).toContain('1 day');
      expect(notifications[0].message).not.toContain('1 days');
    });
  });

  describe('notifyRentalDueSoon', () => {
    it('should send rental due soon reminder', async () => {
      const memberId = MemberId.generate();
      const rentalId = RentalId.generate();
      const dueDate = new Date('2026-02-10');

      await service.notifyRentalDueSoon(memberId, rentalId, 'Forklift', dueDate, 2);

      const notifications = service.getSentNotifications();
      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe('RENTAL_DUE_SOON');
      expect(notifications[0].message).toContain('2 days');
      expect(notifications[0].priority).toBe(NotificationPriority.NORMAL);
    });
  });

  describe('notifyReservationCreated', () => {
    it('should send reservation created notification', async () => {
      const memberId = MemberId.generate();
      const reservationId = ReservationId.generate();
      const startDate = new Date('2026-03-01');
      const endDate = new Date('2026-03-05');

      await service.notifyReservationCreated(
        memberId,
        reservationId,
        'Backhoe',
        startDate,
        endDate,
      );

      const notifications = service.getSentNotifications();
      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe('RESERVATION_CREATED');
      expect(notifications[0].message).toContain('Backhoe');
      expect(notifications[0].message).toContain(reservationId.value);
    });
  });

  describe('notifyReservationCancelled', () => {
    it('should send cancellation notification with reason', async () => {
      const memberId = MemberId.generate();
      const reservationId = ReservationId.generate();

      await service.notifyReservationCancelled(
        memberId,
        reservationId,
        'Loader',
        'Equipment under maintenance',
      );

      const notifications = service.getSentNotifications();
      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe('RESERVATION_CANCELLED');
      expect(notifications[0].message).toContain('Equipment under maintenance');
    });

    it('should send cancellation notification without reason', async () => {
      const memberId = MemberId.generate();
      const reservationId = ReservationId.generate();

      await service.notifyReservationCancelled(memberId, reservationId, 'Loader');

      const notifications = service.getSentNotifications();
      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe('RESERVATION_CANCELLED');
    });
  });

  describe('notifyReservationReminder', () => {
    it('should send reminder with normal priority for future dates', async () => {
      const memberId = MemberId.generate();
      const reservationId = ReservationId.generate();
      const startDate = new Date('2026-03-15');

      await service.notifyReservationReminder(memberId, reservationId, 'Compactor', startDate, 2);

      const notifications = service.getSentNotifications();
      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe('RESERVATION_REMINDER');
      expect(notifications[0].priority).toBe(NotificationPriority.NORMAL);
      expect(notifications[0].message).toContain('2 days');
    });

    it('should send high priority reminder for same-day reservation', async () => {
      const memberId = MemberId.generate();
      const reservationId = ReservationId.generate();
      const startDate = new Date();

      await service.notifyReservationReminder(memberId, reservationId, 'Compactor', startDate, 0);

      const notifications = service.getSentNotifications();
      expect(notifications[0].priority).toBe(NotificationPriority.HIGH);
      expect(notifications[0].message).toContain('TODAY');
    });
  });

  describe('notifyEquipmentDamaged', () => {
    it('should send damage notification with description', async () => {
      const memberId = MemberId.generate();
      const equipmentId = EquipmentId.generate();
      const damageFee = Money.dollars(250);

      await service.notifyEquipmentDamaged(
        memberId,
        equipmentId,
        'Jackhammer',
        damageFee,
        'Cracked handle and damaged power cord',
      );

      const notifications = service.getSentNotifications();
      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe('EQUIPMENT_DAMAGED');
      expect(notifications[0].message).toContain('Cracked handle');
      expect(notifications[0].message).toContain(damageFee.toString());
    });

    it('should send damage notification without description', async () => {
      const memberId = MemberId.generate();
      const equipmentId = EquipmentId.generate();
      const damageFee = Money.dollars(100);

      await service.notifyEquipmentDamaged(memberId, equipmentId, 'Jackhammer', damageFee);

      const notifications = service.getSentNotifications();
      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe('EQUIPMENT_DAMAGED');
    });
  });

  describe('notifyPaymentReceived', () => {
    it('should send payment received notification', async () => {
      const memberId = MemberId.generate();
      const amount = Money.dollars(500);

      await service.notifyPaymentReceived(
        memberId,
        'txn-12345',
        amount,
        'Rental payment for Crane',
      );

      const notifications = service.getSentNotifications();
      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe('PAYMENT_RECEIVED');
      expect(notifications[0].message).toContain('txn-12345');
      expect(notifications[0].message).toContain(amount.toString());
    });
  });

  describe('notifyPaymentFailed', () => {
    it('should send payment failed notification with high priority', async () => {
      const memberId = MemberId.generate();
      const amount = Money.dollars(300);

      await service.notifyPaymentFailed(memberId, amount, 'Insufficient funds');

      const notifications = service.getSentNotifications();
      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe('PAYMENT_FAILED');
      expect(notifications[0].priority).toBe(NotificationPriority.HIGH);
      expect(notifications[0].message).toContain('Insufficient funds');
    });
  });

  describe('sendCustomNotification', () => {
    it('should send custom notification', async () => {
      const memberId = MemberId.generate();

      await service.sendCustomNotification(
        memberId,
        'Custom Subject',
        'Custom message body',
        NotificationPriority.LOW,
        NotificationChannel.PUSH,
      );

      const notifications = service.getSentNotifications();
      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe('CUSTOM');
      expect(notifications[0].subject).toBe('Custom Subject');
      expect(notifications[0].message).toBe('Custom message body');
      expect(notifications[0].priority).toBe(NotificationPriority.LOW);
      expect(notifications[0].channel).toBe(NotificationChannel.PUSH);
    });
  });

  describe('notification tracking', () => {
    it('should track all sent notifications', async () => {
      const memberId = MemberId.generate();
      const rentalId = RentalId.generate();
      const reservationId = ReservationId.generate();

      await service.notifyRentalCreated(
        memberId,
        rentalId,
        'Equipment 1',
        new Date(),
        new Date(),
        Money.dollars(100),
      );

      await service.notifyReservationCreated(
        memberId,
        reservationId,
        'Equipment 2',
        new Date(),
        new Date(),
      );

      const notifications = service.getSentNotifications();
      expect(notifications).toHaveLength(2);
      expect(service.getNotificationCount()).toBe(2);
    });

    it('should filter notifications by member', async () => {
      const member1 = MemberId.generate();
      const member2 = MemberId.generate();
      const rentalId = RentalId.generate();

      await service.notifyRentalCreated(
        member1,
        rentalId,
        'Equipment',
        new Date(),
        new Date(),
        Money.dollars(100),
      );

      await service.notifyRentalCreated(
        member2,
        rentalId,
        'Equipment',
        new Date(),
        new Date(),
        Money.dollars(100),
      );

      const member1Notifications = service.getNotificationsForMember(member1.value);
      expect(member1Notifications).toHaveLength(1);
      expect(member1Notifications[0].recipientId).toBe(member1.value);
    });

    it('should filter notifications by type', async () => {
      const memberId = MemberId.generate();
      const rentalId = RentalId.generate();
      const reservationId = ReservationId.generate();

      await service.notifyRentalCreated(
        memberId,
        rentalId,
        'Equipment',
        new Date(),
        new Date(),
        Money.dollars(100),
      );

      await service.notifyReservationCreated(
        memberId,
        reservationId,
        'Equipment',
        new Date(),
        new Date(),
      );

      const rentalNotifications = service.getNotificationsByType('RENTAL_CREATED');
      expect(rentalNotifications).toHaveLength(1);
      expect(rentalNotifications[0].type).toBe('RENTAL_CREATED');
    });

    it('should generate unique notification IDs', async () => {
      const memberId = MemberId.generate();
      const rentalId = RentalId.generate();

      await service.notifyRentalCreated(
        memberId,
        rentalId,
        'Equipment',
        new Date(),
        new Date(),
        Money.dollars(100),
      );

      await service.notifyRentalCreated(
        memberId,
        rentalId,
        'Equipment',
        new Date(),
        new Date(),
        Money.dollars(100),
      );

      const notifications = service.getSentNotifications();
      expect(notifications[0].id).not.toBe(notifications[1].id);
    });
  });

  describe('clear', () => {
    it('should clear all notifications', async () => {
      const memberId = MemberId.generate();
      const rentalId = RentalId.generate();

      await service.notifyRentalCreated(
        memberId,
        rentalId,
        'Equipment',
        new Date(),
        new Date(),
        Money.dollars(100),
      );

      expect(service.getNotificationCount()).toBe(1);

      service.clear();

      expect(service.getNotificationCount()).toBe(0);
      expect(service.getSentNotifications()).toHaveLength(0);
    });

    it('should reset notification counter', async () => {
      const memberId = MemberId.generate();
      const rentalId = RentalId.generate();

      await service.notifyRentalCreated(
        memberId,
        rentalId,
        'Equipment',
        new Date(),
        new Date(),
        Money.dollars(100),
      );

      service.clear();

      await service.notifyRentalCreated(
        memberId,
        rentalId,
        'Equipment',
        new Date(),
        new Date(),
        Money.dollars(100),
      );

      const notifications = service.getSentNotifications();
      expect(notifications[0].id).toBe('notif-1');
    });
  });

  describe('console logging', () => {
    it('should log notifications to console', async () => {
      const memberId = MemberId.generate();
      const rentalId = RentalId.generate();

      await service.notifyRentalCreated(
        memberId,
        rentalId,
        'Equipment',
        new Date(),
        new Date(),
        Money.dollars(100),
      );

      expect(consoleLogSpy).toHaveBeenCalled();
      const logCalls = consoleLogSpy.mock.calls.map((call: unknown[]) => call.join(' '));
      const fullLog = logCalls.join('\n');
      expect(fullLog).toContain('NOTIFICATION');
      expect(fullLog).toContain('RENTAL_CREATED');
      expect(fullLog).toContain('Equipment');
    });
  });
});
