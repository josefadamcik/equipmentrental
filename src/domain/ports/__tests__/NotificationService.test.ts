import {
  NotificationService,
  NotificationChannel,
  NotificationPriority,
  NotificationResult,
} from '../NotificationService';
import { Money } from '../../value-objects/Money';
import { RentalId, MemberId, EquipmentId, ReservationId } from '../../value-objects/identifiers';

/**
 * Mock implementation of NotificationService for testing
 */
class MockNotificationService implements NotificationService {
  private notifications: NotificationResult[] = [];

  private sendNotification(channel: NotificationChannel): NotificationResult {
    const result: NotificationResult = {
      success: true,
      channel,
      sentAt: new Date(),
      messageId: `msg_${Date.now()}_${Math.random()}`,
    };
    this.notifications.push(result);
    return result;
  }

  async notifyRentalCreated(
    _memberId: MemberId,
    _rentalId: RentalId,
    _equipmentName: string,
    _startDate: Date,
    _endDate: Date,
    _totalCost: Money,
    channel: NotificationChannel = NotificationChannel.EMAIL,
  ): Promise<NotificationResult> {
    return this.sendNotification(channel);
  }

  async notifyRentalReturned(
    _memberId: MemberId,
    _rentalId: RentalId,
    _equipmentName: string,
    _returnDate: Date,
    _totalCost: Money,
    channel: NotificationChannel = NotificationChannel.EMAIL,
  ): Promise<NotificationResult> {
    return this.sendNotification(channel);
  }

  async notifyRentalOverdue(
    _memberId: MemberId,
    _rentalId: RentalId,
    _equipmentName: string,
    _daysOverdue: number,
    _lateFees: Money,
    channel: NotificationChannel = NotificationChannel.EMAIL,
  ): Promise<NotificationResult> {
    return this.sendNotification(channel);
  }

  async notifyRentalDueSoon(
    _memberId: MemberId,
    _rentalId: RentalId,
    _equipmentName: string,
    _dueDate: Date,
    _daysUntilDue: number,
    channel: NotificationChannel = NotificationChannel.EMAIL,
  ): Promise<NotificationResult> {
    return this.sendNotification(channel);
  }

  async notifyReservationCreated(
    _memberId: MemberId,
    _reservationId: ReservationId,
    _equipmentName: string,
    _startDate: Date,
    _endDate: Date,
    channel: NotificationChannel = NotificationChannel.EMAIL,
  ): Promise<NotificationResult> {
    return this.sendNotification(channel);
  }

  async notifyReservationCancelled(
    _memberId: MemberId,
    _reservationId: ReservationId,
    _equipmentName: string,
    _reason?: string,
    channel: NotificationChannel = NotificationChannel.EMAIL,
  ): Promise<NotificationResult> {
    return this.sendNotification(channel);
  }

  async notifyReservationReminder(
    _memberId: MemberId,
    _reservationId: ReservationId,
    _equipmentName: string,
    _startDate: Date,
    _daysUntilStart: number,
    channel: NotificationChannel = NotificationChannel.EMAIL,
  ): Promise<NotificationResult> {
    return this.sendNotification(channel);
  }

  async notifyEquipmentDamaged(
    _memberId: MemberId,
    _equipmentId: EquipmentId,
    _equipmentName: string,
    _damageFee: Money,
    _description?: string,
    channel: NotificationChannel = NotificationChannel.EMAIL,
  ): Promise<NotificationResult> {
    return this.sendNotification(channel);
  }

  async notifyPaymentReceived(
    _memberId: MemberId,
    _transactionId: string,
    _amount: Money,
    _description: string,
    channel: NotificationChannel = NotificationChannel.EMAIL,
  ): Promise<NotificationResult> {
    return this.sendNotification(channel);
  }

  async notifyPaymentFailed(
    _memberId: MemberId,
    _amount: Money,
    _reason: string,
    channel: NotificationChannel = NotificationChannel.EMAIL,
  ): Promise<NotificationResult> {
    return this.sendNotification(channel);
  }

  async sendCustomNotification(
    _memberId: MemberId,
    _subject: string,
    _message: string,
    _priority?: NotificationPriority,
    channel: NotificationChannel = NotificationChannel.EMAIL,
  ): Promise<NotificationResult> {
    return this.sendNotification(channel);
  }

  getNotifications(): NotificationResult[] {
    return [...this.notifications];
  }

  clear(): void {
    this.notifications = [];
  }
}

describe('NotificationService Port', () => {
  let service: MockNotificationService;
  const memberId = MemberId.generate();
  const rentalId = RentalId.generate();
  const equipmentId = EquipmentId.generate();
  const reservationId = ReservationId.generate();

  beforeEach(() => {
    service = new MockNotificationService();
  });

  describe('notifyRentalCreated', () => {
    it('should send rental creation notification', async () => {
      const result = await service.notifyRentalCreated(
        memberId,
        rentalId,
        'Power Drill',
        new Date('2024-01-01'),
        new Date('2024-01-10'),
        Money.dollars(100),
      );

      expect(result.success).toBe(true);
      expect(result.channel).toBe(NotificationChannel.EMAIL);
      expect(result.messageId).toBeDefined();
      expect(result.sentAt).toBeInstanceOf(Date);
    });

    it('should support different notification channels', async () => {
      const result = await service.notifyRentalCreated(
        memberId,
        rentalId,
        'Power Drill',
        new Date('2024-01-01'),
        new Date('2024-01-10'),
        Money.dollars(100),
        NotificationChannel.SMS,
      );

      expect(result.channel).toBe(NotificationChannel.SMS);
    });
  });

  describe('notifyRentalReturned', () => {
    it('should send rental return notification', async () => {
      const result = await service.notifyRentalReturned(
        memberId,
        rentalId,
        'Power Drill',
        new Date('2024-01-10'),
        Money.dollars(100),
      );

      expect(result.success).toBe(true);
      expect(result.channel).toBe(NotificationChannel.EMAIL);
    });
  });

  describe('notifyRentalOverdue', () => {
    it('should send overdue rental notification', async () => {
      const result = await service.notifyRentalOverdue(
        memberId,
        rentalId,
        'Power Drill',
        3,
        Money.dollars(30),
      );

      expect(result.success).toBe(true);
      expect(result.channel).toBe(NotificationChannel.EMAIL);
    });
  });

  describe('notifyRentalDueSoon', () => {
    it('should send rental due soon reminder', async () => {
      const result = await service.notifyRentalDueSoon(
        memberId,
        rentalId,
        'Power Drill',
        new Date('2024-01-10'),
        2,
      );

      expect(result.success).toBe(true);
      expect(result.channel).toBe(NotificationChannel.EMAIL);
    });
  });

  describe('notifyReservationCreated', () => {
    it('should send reservation confirmation notification', async () => {
      const result = await service.notifyReservationCreated(
        memberId,
        reservationId,
        'Power Drill',
        new Date('2024-02-01'),
        new Date('2024-02-10'),
      );

      expect(result.success).toBe(true);
      expect(result.channel).toBe(NotificationChannel.EMAIL);
    });
  });

  describe('notifyReservationCancelled', () => {
    it('should send reservation cancellation notification', async () => {
      const result = await service.notifyReservationCancelled(
        memberId,
        reservationId,
        'Power Drill',
        'Customer request',
      );

      expect(result.success).toBe(true);
      expect(result.channel).toBe(NotificationChannel.EMAIL);
    });

    it('should work without a reason', async () => {
      const result = await service.notifyReservationCancelled(
        memberId,
        reservationId,
        'Power Drill',
      );

      expect(result.success).toBe(true);
    });
  });

  describe('notifyReservationReminder', () => {
    it('should send reservation reminder notification', async () => {
      const result = await service.notifyReservationReminder(
        memberId,
        reservationId,
        'Power Drill',
        new Date('2024-02-01'),
        1,
      );

      expect(result.success).toBe(true);
      expect(result.channel).toBe(NotificationChannel.EMAIL);
    });
  });

  describe('notifyEquipmentDamaged', () => {
    it('should send equipment damage notification', async () => {
      const result = await service.notifyEquipmentDamaged(
        memberId,
        equipmentId,
        'Power Drill',
        Money.dollars(50),
        'Broken chuck',
      );

      expect(result.success).toBe(true);
      expect(result.channel).toBe(NotificationChannel.EMAIL);
    });

    it('should work without a description', async () => {
      const result = await service.notifyEquipmentDamaged(
        memberId,
        equipmentId,
        'Power Drill',
        Money.dollars(50),
      );

      expect(result.success).toBe(true);
    });
  });

  describe('notifyPaymentReceived', () => {
    it('should send payment confirmation notification', async () => {
      const result = await service.notifyPaymentReceived(
        memberId,
        'txn_123',
        Money.dollars(100),
        'Rental payment for Power Drill',
      );

      expect(result.success).toBe(true);
      expect(result.channel).toBe(NotificationChannel.EMAIL);
    });
  });

  describe('notifyPaymentFailed', () => {
    it('should send payment failure notification', async () => {
      const result = await service.notifyPaymentFailed(
        memberId,
        Money.dollars(100),
        'Insufficient funds',
      );

      expect(result.success).toBe(true);
      expect(result.channel).toBe(NotificationChannel.EMAIL);
    });
  });

  describe('sendCustomNotification', () => {
    it('should send custom notification', async () => {
      const result = await service.sendCustomNotification(
        memberId,
        'System Maintenance',
        'The system will be down for maintenance tonight.',
      );

      expect(result.success).toBe(true);
      expect(result.channel).toBe(NotificationChannel.EMAIL);
    });

    it('should support different priorities', async () => {
      const result = await service.sendCustomNotification(
        memberId,
        'Urgent Notice',
        'Immediate action required',
        NotificationPriority.URGENT,
      );

      expect(result.success).toBe(true);
    });

    it('should support different channels', async () => {
      const result = await service.sendCustomNotification(
        memberId,
        'Alert',
        'Test message',
        NotificationPriority.HIGH,
        NotificationChannel.PUSH,
      );

      expect(result.channel).toBe(NotificationChannel.PUSH);
    });
  });

  describe('notification tracking', () => {
    it('should track sent notifications', async () => {
      await service.notifyRentalCreated(
        memberId,
        rentalId,
        'Power Drill',
        new Date(),
        new Date(),
        Money.dollars(100),
      );

      await service.notifyRentalReturned(
        memberId,
        rentalId,
        'Power Drill',
        new Date(),
        Money.dollars(100),
      );

      const notifications = service.getNotifications();
      expect(notifications).toHaveLength(2);
    });
  });

  describe('type compliance', () => {
    it('should implement all required methods', () => {
      const svc: NotificationService = service;
      expect(typeof svc.notifyRentalCreated).toBe('function');
      expect(typeof svc.notifyRentalReturned).toBe('function');
      expect(typeof svc.notifyRentalOverdue).toBe('function');
      expect(typeof svc.notifyRentalDueSoon).toBe('function');
      expect(typeof svc.notifyReservationCreated).toBe('function');
      expect(typeof svc.notifyReservationCancelled).toBe('function');
      expect(typeof svc.notifyReservationReminder).toBe('function');
      expect(typeof svc.notifyEquipmentDamaged).toBe('function');
      expect(typeof svc.notifyPaymentReceived).toBe('function');
      expect(typeof svc.notifyPaymentFailed).toBe('function');
      expect(typeof svc.sendCustomNotification).toBe('function');
    });
  });

  describe('NotificationChannel enum', () => {
    it('should have all notification channel types', () => {
      expect(NotificationChannel.EMAIL).toBe('EMAIL');
      expect(NotificationChannel.SMS).toBe('SMS');
      expect(NotificationChannel.PUSH).toBe('PUSH');
      expect(NotificationChannel.IN_APP).toBe('IN_APP');
    });
  });

  describe('NotificationPriority enum', () => {
    it('should have all notification priority levels', () => {
      expect(NotificationPriority.LOW).toBe('LOW');
      expect(NotificationPriority.NORMAL).toBe('NORMAL');
      expect(NotificationPriority.HIGH).toBe('HIGH');
      expect(NotificationPriority.URGENT).toBe('URGENT');
    });
  });
});
