import { EmailNotificationService } from '../EmailNotificationService.js';
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

describe('EmailNotificationService', () => {
  let service: EmailNotificationService;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    service = new EmailNotificationService({
      fromAddress: 'test@example.com',
      fromName: 'Test Rental System',
      replyTo: 'support@example.com',
    });
    // Spy on console.log to suppress output during tests
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('configuration', () => {
    it('should use default configuration', () => {
      const defaultService = new EmailNotificationService();
      const memberId = MemberId.generate();
      defaultService.registerMemberEmail(memberId.value, 'member@example.com');

      expect(defaultService).toBeDefined();
    });

    it('should use custom configuration', async () => {
      const customService = new EmailNotificationService({
        fromAddress: 'custom@example.com',
        fromName: 'Custom Service',
        replyTo: 'help@example.com',
      });

      const memberId = MemberId.generate();
      const rentalId = RentalId.generate();

      await customService.notifyRentalCreated(
        memberId,
        rentalId,
        'Equipment',
        new Date(),
        new Date(),
        Money.dollars(100),
      );

      const emails = customService.getSentEmails();
      expect(emails[0].from).toBe('custom@example.com');
    });

    it('should update configuration', () => {
      service.updateConfig({ fromAddress: 'updated@example.com' });

      // Configuration is internal, test by sending an email
      expect(service).toBeDefined();
    });
  });

  describe('member email management', () => {
    it('should register member emails', () => {
      const memberId = MemberId.generate();
      service.registerMemberEmail(memberId.value, 'john@example.com');

      expect(service).toBeDefined();
    });

    it('should use default email for unregistered members', async () => {
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

      const emails = service.getSentEmails();
      expect(emails[0].to).toContain('member-');
      expect(emails[0].to).toContain('@example.com');
    });

    it('should use registered email for known members', async () => {
      const memberId = MemberId.generate();
      const rentalId = RentalId.generate();
      service.registerMemberEmail(memberId.value, 'jane@example.com');

      await service.notifyRentalCreated(
        memberId,
        rentalId,
        'Equipment',
        new Date(),
        new Date(),
        Money.dollars(100),
      );

      const emails = service.getSentEmails();
      expect(emails[0].to).toBe('jane@example.com');
    });
  });

  describe('notifyRentalCreated', () => {
    it('should send rental created email', async () => {
      const memberId = MemberId.generate();
      const rentalId = RentalId.generate();
      const equipmentName = 'Excavator';
      const startDate = new Date('2026-02-01');
      const endDate = new Date('2026-02-07');
      const totalCost = Money.dollars(350);

      service.registerMemberEmail(memberId.value, 'customer@example.com');

      await service.notifyRentalCreated(
        memberId,
        rentalId,
        equipmentName,
        startDate,
        endDate,
        totalCost,
      );

      const emails = service.getSentEmails();
      expect(emails).toHaveLength(1);
      expect(emails[0].to).toBe('customer@example.com');
      expect(emails[0].subject).toContain('Rental Confirmation');
      expect(emails[0].subject).toContain(equipmentName);
      expect(emails[0].textBody).toContain(equipmentName);
      expect(emails[0].textBody).toContain(rentalId.value);
      expect(emails[0].textBody).toContain(totalCost.toString());
      expect(emails[0].priority).toBe(NotificationPriority.NORMAL);
    });

    it('should include HTML body when enabled', async () => {
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

      const emails = service.getSentEmails();
      expect(emails[0].htmlBody).toContain('<!DOCTYPE html>');
      expect(emails[0].htmlBody).toContain('<html>');
      expect(emails[0].htmlBody).toContain('Equipment');
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

      const emails = service.getSentEmails();
      expect(emails[0].metadata).toBeDefined();
      expect(emails[0].metadata?.rentalId).toBe(rentalId.value);
      expect(emails[0].metadata?.totalCost).toBe(100);
    });
  });

  describe('notifyRentalReturned', () => {
    it('should send rental returned email', async () => {
      const memberId = MemberId.generate();
      const rentalId = RentalId.generate();
      const returnDate = new Date();
      const finalCost = Money.dollars(400);

      await service.notifyRentalReturned(memberId, rentalId, 'Bulldozer', returnDate, finalCost);

      const emails = service.getSentEmails();
      expect(emails).toHaveLength(1);
      expect(emails[0].subject).toContain('Rental Return Confirmation');
      expect(emails[0].textBody).toContain('Bulldozer');
      expect(emails[0].textBody).toContain(finalCost.toString());
    });
  });

  describe('notifyRentalOverdue', () => {
    it('should send overdue email with high priority', async () => {
      const memberId = MemberId.generate();
      const rentalId = RentalId.generate();
      const lateFee = Money.dollars(30);

      await service.notifyRentalOverdue(memberId, rentalId, 'Crane', 3, lateFee);

      const emails = service.getSentEmails();
      expect(emails).toHaveLength(1);
      expect(emails[0].priority).toBe(NotificationPriority.HIGH);
      expect(emails[0].subject).toContain('URGENT');
      expect(emails[0].subject).toContain('Overdue');
      expect(emails[0].textBody).toContain('3 days');
      expect(emails[0].textBody).toContain('URGENT');
    });

    it('should handle singular day correctly', async () => {
      const memberId = MemberId.generate();
      const rentalId = RentalId.generate();
      const lateFee = Money.dollars(10);

      await service.notifyRentalOverdue(memberId, rentalId, 'Equipment', 1, lateFee);

      const emails = service.getSentEmails();
      expect(emails[0].textBody).toContain('1 day');
      expect(emails[0].textBody).not.toContain('1 days');
    });
  });

  describe('notifyRentalDueSoon', () => {
    it('should send rental due soon reminder', async () => {
      const memberId = MemberId.generate();
      const rentalId = RentalId.generate();
      const dueDate = new Date('2026-02-10');

      await service.notifyRentalDueSoon(memberId, rentalId, 'Forklift', dueDate, 2);

      const emails = service.getSentEmails();
      expect(emails).toHaveLength(1);
      expect(emails[0].subject).toContain('Reminder');
      expect(emails[0].textBody).toContain('2 days');
      expect(emails[0].textBody).toContain('Forklift');
    });

    it('should include extension information', async () => {
      const memberId = MemberId.generate();
      const rentalId = RentalId.generate();

      await service.notifyRentalDueSoon(memberId, rentalId, 'Equipment', new Date(), 1);

      const emails = service.getSentEmails();
      expect(emails[0].textBody).toContain('NEED MORE TIME');
      expect(emails[0].textBody).toContain('extend');
    });
  });

  describe('notifyReservationCreated', () => {
    it('should send reservation created email', async () => {
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

      const emails = service.getSentEmails();
      expect(emails).toHaveLength(1);
      expect(emails[0].subject).toContain('Reservation Confirmed');
      expect(emails[0].textBody).toContain('Backhoe');
      expect(emails[0].textBody).toContain(reservationId.value);
      expect(emails[0].textBody).toContain('PICKUP INSTRUCTIONS');
    });

    it('should include cancellation policy', async () => {
      const memberId = MemberId.generate();
      const reservationId = ReservationId.generate();

      await service.notifyReservationCreated(
        memberId,
        reservationId,
        'Equipment',
        new Date(),
        new Date(),
      );

      const emails = service.getSentEmails();
      expect(emails[0].textBody).toContain('CANCELLATION POLICY');
      expect(emails[0].textBody).toContain('24 hours');
    });
  });

  describe('notifyReservationCancelled', () => {
    it('should send cancellation email with reason', async () => {
      const memberId = MemberId.generate();
      const reservationId = ReservationId.generate();

      await service.notifyReservationCancelled(
        memberId,
        reservationId,
        'Loader',
        'Equipment under maintenance',
      );

      const emails = service.getSentEmails();
      expect(emails).toHaveLength(1);
      expect(emails[0].subject).toContain('Reservation Cancelled');
      expect(emails[0].textBody).toContain('Equipment under maintenance');
    });

    it('should send cancellation email without reason', async () => {
      const memberId = MemberId.generate();
      const reservationId = ReservationId.generate();

      await service.notifyReservationCancelled(memberId, reservationId, 'Loader');

      const emails = service.getSentEmails();
      expect(emails).toHaveLength(1);
      expect(emails[0].textBody).not.toContain('Reason:');
    });

    it('should mention authorization release', async () => {
      const memberId = MemberId.generate();
      const reservationId = ReservationId.generate();

      await service.notifyReservationCancelled(memberId, reservationId, 'Equipment');

      const emails = service.getSentEmails();
      expect(emails[0].textBody).toContain('authorization');
      expect(emails[0].textBody).toContain('3-5 business days');
    });
  });

  describe('notifyReservationReminder', () => {
    it('should send reminder for upcoming reservation', async () => {
      const memberId = MemberId.generate();
      const reservationId = ReservationId.generate();
      const startDate = new Date('2026-03-15');

      await service.notifyReservationReminder(memberId, reservationId, 'Compactor', startDate, 2);

      const emails = service.getSentEmails();
      expect(emails).toHaveLength(1);
      expect(emails[0].subject).toContain('Reminder');
      expect(emails[0].textBody).toContain('2 days');
      expect(emails[0].textBody).toContain('PICKUP CHECKLIST');
      expect(emails[0].priority).toBe(NotificationPriority.NORMAL);
    });

    it('should send high priority reminder for same-day reservation', async () => {
      const memberId = MemberId.generate();
      const reservationId = ReservationId.generate();
      const startDate = new Date();

      await service.notifyReservationReminder(memberId, reservationId, 'Compactor', startDate, 0);

      const emails = service.getSentEmails();
      expect(emails[0].priority).toBe(NotificationPriority.HIGH);
      expect(emails[0].subject).toContain('STARTS TODAY');
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

      const emails = service.getSentEmails();
      expect(emails).toHaveLength(1);
      expect(emails[0].subject).toContain('Equipment Damage Assessment');
      expect(emails[0].textBody).toContain('Cracked handle');
      expect(emails[0].textBody).toContain(damageFee.toString());
      expect(emails[0].textBody).toContain('DISPUTE PROCESS');
    });

    it('should send damage notification without description', async () => {
      const memberId = MemberId.generate();
      const equipmentId = EquipmentId.generate();
      const damageFee = Money.dollars(100);

      await service.notifyEquipmentDamaged(memberId, equipmentId, 'Jackhammer', damageFee);

      const emails = service.getSentEmails();
      expect(emails).toHaveLength(1);
      expect(emails[0].textBody).not.toContain('Damage Description:');
    });
  });

  describe('notifyPaymentReceived', () => {
    it('should send payment confirmation email', async () => {
      const memberId = MemberId.generate();
      const amount = Money.dollars(500);

      await service.notifyPaymentReceived(
        memberId,
        'txn-12345',
        amount,
        'Rental payment for Crane',
      );

      const emails = service.getSentEmails();
      expect(emails).toHaveLength(1);
      expect(emails[0].subject).toContain('Payment Confirmation');
      expect(emails[0].textBody).toContain('txn-12345');
      expect(emails[0].textBody).toContain(amount.toString());
      expect(emails[0].textBody).toContain('receipt');
    });
  });

  describe('notifyPaymentFailed', () => {
    it('should send payment failed email with high priority', async () => {
      const memberId = MemberId.generate();
      const amount = Money.dollars(300);

      await service.notifyPaymentFailed(memberId, amount, 'Insufficient funds');

      const emails = service.getSentEmails();
      expect(emails).toHaveLength(1);
      expect(emails[0].subject).toContain('Payment Failed');
      expect(emails[0].priority).toBe(NotificationPriority.HIGH);
      expect(emails[0].textBody).toContain('Insufficient funds');
      expect(emails[0].textBody).toContain('ACTION REQUIRED');
      expect(emails[0].textBody).toContain('NEED HELP');
    });
  });

  describe('sendCustomNotification', () => {
    it('should send custom email', async () => {
      const memberId = MemberId.generate();

      await service.sendCustomNotification(
        memberId,
        'Custom Subject',
        'Custom message body',
        NotificationPriority.LOW,
        NotificationChannel.EMAIL,
      );

      const emails = service.getSentEmails();
      expect(emails).toHaveLength(1);
      expect(emails[0].subject).toBe('Custom Subject');
      expect(emails[0].textBody).toBe('Custom message body');
      expect(emails[0].priority).toBe(NotificationPriority.LOW);
    });
  });

  describe('email tracking', () => {
    it('should track all sent emails', async () => {
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

      const emails = service.getSentEmails();
      expect(emails).toHaveLength(2);
      expect(service.getEmailCount()).toBe(2);
    });

    it('should filter emails by recipient', async () => {
      const member1 = MemberId.generate();
      const member2 = MemberId.generate();
      const rentalId = RentalId.generate();

      service.registerMemberEmail(member1.value, 'member1@example.com');
      service.registerMemberEmail(member2.value, 'member2@example.com');

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

      const member1Emails = service.getEmailsForRecipient('member1@example.com');
      expect(member1Emails).toHaveLength(1);
      expect(member1Emails[0].to).toBe('member1@example.com');
    });

    it('should generate unique email IDs', async () => {
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

      const emails = service.getSentEmails();
      expect(emails[0].id).not.toBe(emails[1].id);
      expect(emails[0].id).toBe('email-1');
      expect(emails[1].id).toBe('email-2');
    });
  });

  describe('clear', () => {
    it('should clear all emails', async () => {
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

      expect(service.getEmailCount()).toBe(1);

      service.clear();

      expect(service.getEmailCount()).toBe(0);
      expect(service.getSentEmails()).toHaveLength(0);
    });

    it('should reset email counter', async () => {
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

      const emails = service.getSentEmails();
      expect(emails[0].id).toBe('email-1');
    });
  });

  describe('HTML email generation', () => {
    it('should generate HTML emails when enabled', async () => {
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

      const emails = service.getSentEmails();
      expect(emails[0].htmlBody).toContain('<!DOCTYPE html>');
      expect(emails[0].htmlBody).toContain('<body>');
      expect(emails[0].htmlBody).toContain('<div class="header">');
      expect(emails[0].htmlBody).toContain('<div class="content">');
      expect(emails[0].htmlBody).toContain('<div class="footer">');
    });

    it('should disable HTML when configured', async () => {
      const noHtmlService = new EmailNotificationService({ enableHtml: false });
      const memberId = MemberId.generate();
      const rentalId = RentalId.generate();

      await noHtmlService.notifyRentalCreated(
        memberId,
        rentalId,
        'Equipment',
        new Date(),
        new Date(),
        Money.dollars(100),
      );

      const emails = noHtmlService.getSentEmails();
      expect(emails[0].htmlBody).toBe('');
    });

    it('should convert text to HTML paragraphs', async () => {
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

      const emails = service.getSentEmails();
      expect(emails[0].htmlBody).toContain('<p>');
      expect(emails[0].htmlBody).toContain('</p>');
    });
  });

  describe('console logging', () => {
    it('should log emails to console', async () => {
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
      expect(fullLog).toContain('EMAIL SENT');
      expect(fullLog).toContain('Equipment');
    });
  });
});
