import {
  MemberId,
  RentalId,
  EquipmentId,
  ReservationId,
} from '../../../domain/value-objects/identifiers.js';
import { Money } from '../../../domain/value-objects/Money.js';
import {
  NotificationService,
  NotificationChannel,
  NotificationPriority,
  NotificationResult,
} from '../../../domain/ports/NotificationService.js';

/**
 * Notification record for tracking sent notifications
 */
export interface NotificationRecord {
  id: string;
  recipientId: string;
  type: string;
  channel: NotificationChannel;
  priority: NotificationPriority;
  subject: string;
  message: string;
  sentAt: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Console-based notification service for development and testing
 * Logs all notifications to the console with structured formatting
 */
export class ConsoleNotificationService implements NotificationService {
  private notifications: NotificationRecord[] = [];
  private notificationCounter = 0;

  /**
   * Log a notification to the console with formatting
   */
  private logNotification(record: NotificationRecord): void {
    const timestamp = record.sentAt.toISOString();
    const channel = record.channel || 'CONSOLE';
    const priority = record.priority || 'NORMAL';

    console.log('\n' + '='.repeat(80));
    console.log(`📧 NOTIFICATION [${record.type}] - ${timestamp}`);
    console.log('='.repeat(80));
    console.log(`ID:        ${record.id}`);
    console.log(`Recipient: ${record.recipientId}`);
    console.log(`Channel:   ${channel}`);
    console.log(`Priority:  ${priority}`);
    console.log(`Subject:   ${record.subject}`);
    console.log('-'.repeat(80));
    console.log(record.message);
    if (record.metadata && Object.keys(record.metadata).length > 0) {
      console.log('-'.repeat(80));
      console.log('Metadata:', JSON.stringify(record.metadata, null, 2));
    }
    console.log('='.repeat(80) + '\n');
  }

  /**
   * Create and send a notification
   */
  private async sendNotification(
    recipientId: MemberId,
    type: string,
    subject: string,
    message: string,
    channel?: NotificationChannel,
    priority?: NotificationPriority,
    metadata?: Record<string, unknown>,
  ): Promise<NotificationResult> {
    const record: NotificationRecord = {
      id: `notif-${++this.notificationCounter}`,
      recipientId: recipientId.value,
      type,
      channel: channel || NotificationChannel.EMAIL,
      priority: priority || NotificationPriority.NORMAL,
      subject,
      message,
      sentAt: new Date(),
      metadata,
    };

    this.notifications.push(record);
    this.logNotification(record);

    return {
      success: true,
      channel: record.channel,
      sentAt: record.sentAt,
      messageId: record.id,
    };
  }

  async notifyRentalCreated(
    memberId: MemberId,
    rentalId: RentalId,
    equipmentName: string,
    startDate: Date,
    endDate: Date,
    totalCost: Money,
    channel?: NotificationChannel,
  ): Promise<NotificationResult> {
    const subject = 'Rental Confirmation';
    const message = `Your rental has been confirmed!

Equipment: ${equipmentName}
Rental ID: ${rentalId.value}
Start Date: ${startDate.toLocaleDateString()}
End Date: ${endDate.toLocaleDateString()}
Total Cost: ${totalCost.toString()}

Please pick up the equipment on or after the start date.
Remember to return it by the end date to avoid late fees.

Thank you for your business!`;

    return await this.sendNotification(
      memberId,
      'RENTAL_CREATED',
      subject,
      message,
      channel,
      NotificationPriority.NORMAL,
      {
        rentalId: rentalId.value,
        equipmentName,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        totalCost: totalCost.amount,
      },
    );
  }

  async notifyRentalReturned(
    memberId: MemberId,
    rentalId: RentalId,
    equipmentName: string,
    returnDate: Date,
    finalCost: Money,
    channel?: NotificationChannel,
  ): Promise<NotificationResult> {
    const subject = 'Rental Return Confirmed';
    const message = `Your rental return has been processed!

Equipment: ${equipmentName}
Rental ID: ${rentalId.value}
Return Date: ${returnDate.toLocaleDateString()}
Final Cost: ${finalCost.toString()}

Thank you for returning the equipment. We hope to serve you again soon!`;

    return await this.sendNotification(
      memberId,
      'RENTAL_RETURNED',
      subject,
      message,
      channel,
      NotificationPriority.NORMAL,
      {
        rentalId: rentalId.value,
        equipmentName,
        returnDate: returnDate.toISOString(),
        finalCost: finalCost.amount,
      },
    );
  }

  async notifyRentalOverdue(
    memberId: MemberId,
    rentalId: RentalId,
    equipmentName: string,
    daysOverdue: number,
    lateFee: Money,
    channel?: NotificationChannel,
  ): Promise<NotificationResult> {
    const subject = '⚠️ URGENT: Overdue Rental';
    const dayText = daysOverdue === 1 ? 'day' : 'days';
    const message = `Your rental is OVERDUE!

Equipment: ${equipmentName}
Rental ID: ${rentalId.value}
Days Overdue: ${daysOverdue} ${dayText}
Current Late Fee: ${lateFee.toString()}

Please return the equipment immediately to avoid additional fees.
Late fees continue to accrue daily until the equipment is returned.

Contact us if you need assistance.`;

    return await this.sendNotification(
      memberId,
      'RENTAL_OVERDUE',
      subject,
      message,
      channel,
      NotificationPriority.HIGH,
      {
        rentalId: rentalId.value,
        equipmentName,
        daysOverdue,
        lateFee: lateFee.amount,
      },
    );
  }

  async notifyRentalDueSoon(
    memberId: MemberId,
    rentalId: RentalId,
    equipmentName: string,
    dueDate: Date,
    daysUntilDue: number,
    channel?: NotificationChannel,
  ): Promise<NotificationResult> {
    const subject = 'Rental Due Soon - Reminder';
    const dayText = daysUntilDue === 1 ? 'day' : 'days';
    const message = `Friendly reminder: Your rental is due soon!

Equipment: ${equipmentName}
Rental ID: ${rentalId.value}
Due Date: ${dueDate.toLocaleDateString()}
Days Until Due: ${daysUntilDue} ${dayText}

Please plan to return the equipment by the due date to avoid late fees.
If you need to extend the rental, please contact us.

Thank you!`;

    return await this.sendNotification(
      memberId,
      'RENTAL_DUE_SOON',
      subject,
      message,
      channel,
      NotificationPriority.NORMAL,
      {
        rentalId: rentalId.value,
        equipmentName,
        dueDate: dueDate.toISOString(),
        daysUntilDue,
      },
    );
  }

  async notifyReservationCreated(
    memberId: MemberId,
    reservationId: ReservationId,
    equipmentName: string,
    startDate: Date,
    endDate: Date,
    channel?: NotificationChannel,
  ): Promise<NotificationResult> {
    const subject = 'Reservation Confirmed';
    const message = `Your reservation has been confirmed!

Equipment: ${equipmentName}
Reservation ID: ${reservationId.value}
Start Date: ${startDate.toLocaleDateString()}
End Date: ${endDate.toLocaleDateString()}

We'll send you a reminder before your reservation starts.
Please pick up the equipment on the start date.

Thank you!`;

    return await this.sendNotification(
      memberId,
      'RESERVATION_CREATED',
      subject,
      message,
      channel,
      NotificationPriority.NORMAL,
      {
        reservationId: reservationId.value,
        equipmentName,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    );
  }

  async notifyReservationCancelled(
    memberId: MemberId,
    reservationId: ReservationId,
    equipmentName: string,
    reason?: string,
    channel?: NotificationChannel,
  ): Promise<NotificationResult> {
    const subject = 'Reservation Cancelled';
    const reasonText = reason ? `\nReason: ${reason}` : '';
    const message = `Your reservation has been cancelled.

Equipment: ${equipmentName}
Reservation ID: ${reservationId.value}${reasonText}

If you have any questions, please contact us.

Thank you!`;

    return await this.sendNotification(
      memberId,
      'RESERVATION_CANCELLED',
      subject,
      message,
      channel,
      NotificationPriority.NORMAL,
      {
        reservationId: reservationId.value,
        equipmentName,
        reason,
      },
    );
  }

  async notifyReservationReminder(
    memberId: MemberId,
    reservationId: ReservationId,
    equipmentName: string,
    startDate: Date,
    daysUntilStart: number,
    channel?: NotificationChannel,
  ): Promise<NotificationResult> {
    const subject = 'Reservation Starting Soon';
    const dayText = daysUntilStart === 1 ? 'day' : 'days';
    const urgency = daysUntilStart === 0 ? 'TODAY!' : `in ${daysUntilStart} ${dayText}`;
    const message = `Your reservation starts ${urgency}

Equipment: ${equipmentName}
Reservation ID: ${reservationId.value}
Start Date: ${startDate.toLocaleDateString()}

Please plan to pick up the equipment on the start date.
Don't forget to bring your membership card!

See you soon!`;

    return await this.sendNotification(
      memberId,
      'RESERVATION_REMINDER',
      subject,
      message,
      channel,
      daysUntilStart === 0 ? NotificationPriority.HIGH : NotificationPriority.NORMAL,
      {
        reservationId: reservationId.value,
        equipmentName,
        startDate: startDate.toISOString(),
        daysUntilStart,
      },
    );
  }

  async notifyEquipmentDamaged(
    memberId: MemberId,
    equipmentId: EquipmentId,
    equipmentName: string,
    damageFee: Money,
    description?: string,
    channel?: NotificationChannel,
  ): Promise<NotificationResult> {
    const subject = 'Equipment Damage Assessment';
    const descriptionText = description ? `\nDescription: ${description}` : '';
    const message = `Equipment damage has been assessed for your recent rental.

Equipment: ${equipmentName}
Equipment ID: ${equipmentId.value}
Damage Fee: ${damageFee.toString()}${descriptionText}

The damage fee has been charged to your account.
If you have any questions about this assessment, please contact us.

Thank you for your understanding.`;

    return await this.sendNotification(
      memberId,
      'EQUIPMENT_DAMAGED',
      subject,
      message,
      channel,
      NotificationPriority.NORMAL,
      {
        equipmentId: equipmentId.value,
        equipmentName,
        damageFee: damageFee.amount,
        description,
      },
    );
  }

  async notifyPaymentReceived(
    memberId: MemberId,
    transactionId: string,
    amount: Money,
    description: string,
    channel?: NotificationChannel,
  ): Promise<NotificationResult> {
    const subject = 'Payment Received';
    const message = `Your payment has been processed successfully!

Transaction ID: ${transactionId}
Amount: ${amount.toString()}
Description: ${description}

Thank you for your payment!`;

    return await this.sendNotification(
      memberId,
      'PAYMENT_RECEIVED',
      subject,
      message,
      channel,
      NotificationPriority.NORMAL,
      {
        transactionId,
        amount: amount.amount,
        description,
      },
    );
  }

  async notifyPaymentFailed(
    memberId: MemberId,
    amount: Money,
    reason: string,
    channel?: NotificationChannel,
  ): Promise<NotificationResult> {
    const subject = '❌ Payment Failed';
    const message = `We were unable to process your payment.

Amount: ${amount.toString()}
Reason: ${reason}

Please check your payment method and try again.
If the problem persists, please contact us for assistance.`;

    return await this.sendNotification(
      memberId,
      'PAYMENT_FAILED',
      subject,
      message,
      channel,
      NotificationPriority.HIGH,
      {
        amount: amount.amount,
        reason,
      },
    );
  }

  async sendCustomNotification(
    memberId: MemberId,
    subject: string,
    message: string,
    priority?: NotificationPriority,
    channel?: NotificationChannel,
  ): Promise<NotificationResult> {
    return await this.sendNotification(memberId, 'CUSTOM', subject, message, channel, priority);
  }

  /**
   * Get all sent notifications (for testing and monitoring)
   */
  getSentNotifications(): NotificationRecord[] {
    return [...this.notifications];
  }

  /**
   * Get notifications for a specific member
   */
  getNotificationsForMember(memberId: string): NotificationRecord[] {
    return this.notifications.filter((n) => n.recipientId === memberId);
  }

  /**
   * Get notifications by type
   */
  getNotificationsByType(type: string): NotificationRecord[] {
    return this.notifications.filter((n) => n.type === type);
  }

  /**
   * Clear all notifications (for testing)
   */
  clear(): void {
    this.notifications = [];
    this.notificationCounter = 0;
  }

  /**
   * Get notification count
   */
  getNotificationCount(): number {
    return this.notifications.length;
  }
}
