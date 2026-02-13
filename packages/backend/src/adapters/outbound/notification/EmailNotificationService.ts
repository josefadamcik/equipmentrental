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
 * Email message structure
 */
export interface EmailMessage {
  id: string;
  to: string;
  from: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  priority: NotificationPriority;
  sentAt: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Email configuration options
 */
export interface EmailConfig {
  fromAddress: string;
  fromName: string;
  replyTo?: string;
  bccAddresses?: string[];
  enableHtml: boolean;
}

/**
 * Simulated email notification service
 * In production, this would integrate with SendGrid, AWS SES, or similar
 */
export class EmailNotificationService implements NotificationService {
  private emails: EmailMessage[] = [];
  private emailCounter = 0;
  private config: EmailConfig;

  // Mock member email database (in production, this would come from member repository)
  private memberEmails: Map<string, string> = new Map();

  constructor(config?: Partial<EmailConfig>) {
    this.config = {
      fromAddress: config?.fromAddress || 'noreply@equipmentrental.com',
      fromName: config?.fromName || 'Equipment Rental System',
      replyTo: config?.replyTo || 'support@equipmentrental.com',
      bccAddresses: config?.bccAddresses || [],
      enableHtml: config?.enableHtml ?? true,
    };
  }

  /**
   * Register a member's email address (for testing)
   */
  registerMemberEmail(memberId: string, email: string): void {
    this.memberEmails.set(memberId, email);
  }

  /**
   * Get member email address
   */
  private getMemberEmail(memberId: MemberId): string {
    const email = this.memberEmails.get(memberId.value);
    return email || `member-${memberId.value}@example.com`;
  }

  /**
   * Convert text to HTML format
   */
  private textToHtml(text: string): string {
    return text
      .split('\n\n')
      .map((paragraph) => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
      .join('\n');
  }

  /**
   * Create HTML email wrapper
   */
  private wrapHtml(content: string, subject: string): string {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4a5568; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
    .content { background-color: #f7fafc; padding: 20px; border: 1px solid #e2e8f0; }
    .footer { background-color: #edf2f7; padding: 15px; text-align: center; font-size: 12px; color: #718096; border-radius: 0 0 5px 5px; }
    p { margin: 10px 0; }
    strong { color: #2d3748; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${this.config.fromName}</h1>
  </div>
  <div class="content">
    ${content}
  </div>
  <div class="footer">
    <p>This is an automated message from ${this.config.fromName}.</p>
    <p>Please do not reply to this email. For support, contact ${this.config.replyTo}</p>
  </div>
</body>
</html>`;
  }

  /**
   * Log email to console (simulates sending)
   */
  private logEmail(email: EmailMessage): void {
    console.log('\n' + '━'.repeat(80));
    console.log(`📨 EMAIL SENT - ${email.sentAt.toISOString()}`);
    console.log('━'.repeat(80));
    console.log(`ID:       ${email.id}`);
    console.log(`From:     ${this.config.fromName} <${email.from}>`);
    console.log(`To:       ${email.to}`);
    console.log(`Subject:  ${email.subject}`);
    console.log(`Priority: ${email.priority}`);
    console.log('─'.repeat(80));
    console.log(email.textBody);
    console.log('━'.repeat(80) + '\n');
  }

  /**
   * Send an email
   */
  private async sendEmail(
    recipientId: MemberId,
    subject: string,
    textBody: string,
    priority: NotificationPriority,
    metadata?: Record<string, unknown>,
  ): Promise<NotificationResult> {
    const email: EmailMessage = {
      id: `email-${++this.emailCounter}`,
      to: this.getMemberEmail(recipientId),
      from: this.config.fromAddress,
      subject,
      textBody,
      htmlBody: this.config.enableHtml ? this.wrapHtml(this.textToHtml(textBody), subject) : '',
      priority,
      sentAt: new Date(),
      metadata,
    };

    this.emails.push(email);
    this.logEmail(email);

    return {
      success: true,
      channel: NotificationChannel.EMAIL,
      sentAt: email.sentAt,
      messageId: email.id,
    };
  }

  async notifyRentalCreated(
    memberId: MemberId,
    rentalId: RentalId,
    equipmentName: string,
    startDate: Date,
    endDate: Date,
    totalCost: Money,
    _channel?: NotificationChannel,
  ): Promise<NotificationResult> {
    const subject = 'Rental Confirmation - ' + equipmentName;
    const textBody = `Dear Valued Customer,

Your rental has been confirmed! Here are the details:

Equipment: ${equipmentName}
Rental ID: ${rentalId.value}
Start Date: ${startDate.toLocaleDateString()}
End Date: ${endDate.toLocaleDateString()}
Total Cost: ${totalCost.toString()}

Please pick up the equipment on or after the start date. Make sure to bring your membership card and a valid ID.

Remember to return the equipment by ${endDate.toLocaleDateString()} to avoid late fees of $10 per day.

Thank you for choosing our service!

Best regards,
Equipment Rental Team`;

    return await this.sendEmail(memberId, subject, textBody, NotificationPriority.NORMAL, {
      rentalId: rentalId.value,
      equipmentName,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalCost: totalCost.amount,
    });
  }

  async notifyRentalReturned(
    memberId: MemberId,
    rentalId: RentalId,
    equipmentName: string,
    returnDate: Date,
    finalCost: Money,
    _channel?: NotificationChannel,
  ): Promise<NotificationResult> {
    const subject = 'Rental Return Confirmation - ' + equipmentName;
    const textBody = `Dear Valued Customer,

Thank you for returning the equipment! Your rental has been processed:

Equipment: ${equipmentName}
Rental ID: ${rentalId.value}
Return Date: ${returnDate.toLocaleDateString()}
Final Cost: ${finalCost.toString()}

A receipt has been sent to your email. You can view your rental history in your account dashboard.

We hope the equipment served you well and look forward to your next rental!

Best regards,
Equipment Rental Team`;

    return await this.sendEmail(memberId, subject, textBody, NotificationPriority.NORMAL, {
      rentalId: rentalId.value,
      equipmentName,
      returnDate: returnDate.toISOString(),
      finalCost: finalCost.amount,
    });
  }

  async notifyRentalOverdue(
    memberId: MemberId,
    rentalId: RentalId,
    equipmentName: string,
    daysOverdue: number,
    lateFee: Money,
    _channel?: NotificationChannel,
  ): Promise<NotificationResult> {
    const dayText = daysOverdue === 1 ? 'day' : 'days';
    const subject = '⚠️ URGENT: Overdue Rental - ' + equipmentName;
    const textBody = `Dear Customer,

URGENT: Your rental is now OVERDUE and requires immediate attention.

Equipment: ${equipmentName}
Rental ID: ${rentalId.value}
Days Overdue: ${daysOverdue} ${dayText}
Current Late Fee: ${lateFee.toString()}

IMPORTANT: Late fees continue to accrue at $10 per day until the equipment is returned.

Please return the equipment immediately to our nearest location. Our hours are:
Monday - Friday: 8:00 AM - 8:00 PM
Saturday - Sunday: 9:00 AM - 6:00 PM

If you are unable to return the equipment or need assistance, please contact us immediately at ${this.config.replyTo}

Thank you for your prompt attention to this matter.

Equipment Rental Team`;

    return await this.sendEmail(memberId, subject, textBody, NotificationPriority.HIGH, {
      rentalId: rentalId.value,
      equipmentName,
      daysOverdue,
      lateFee: lateFee.amount,
    });
  }

  async notifyRentalDueSoon(
    memberId: MemberId,
    rentalId: RentalId,
    equipmentName: string,
    dueDate: Date,
    daysUntilDue: number,
    _channel?: NotificationChannel,
  ): Promise<NotificationResult> {
    const dayText = daysUntilDue === 1 ? 'day' : 'days';
    const subject = 'Reminder: Rental Due Soon - ' + equipmentName;
    const textBody = `Dear Valued Customer,

This is a friendly reminder that your rental is due soon:

Equipment: ${equipmentName}
Rental ID: ${rentalId.value}
Due Date: ${dueDate.toLocaleDateString()}
Days Until Due: ${daysUntilDue} ${dayText}

Please plan to return the equipment by the due date to avoid late fees of $10 per day.

NEED MORE TIME?
If you'd like to extend your rental, simply contact us or visit our website. Extensions are subject to availability and member tier limits.

Our return locations are open:
Monday - Friday: 8:00 AM - 8:00 PM
Saturday - Sunday: 9:00 AM - 6:00 PM

Thank you for being a valued customer!

Best regards,
Equipment Rental Team`;

    return await this.sendEmail(memberId, subject, textBody, NotificationPriority.NORMAL, {
      rentalId: rentalId.value,
      equipmentName,
      dueDate: dueDate.toISOString(),
      daysUntilDue,
    });
  }

  async notifyReservationCreated(
    memberId: MemberId,
    reservationId: ReservationId,
    equipmentName: string,
    startDate: Date,
    endDate: Date,
    _channel?: NotificationChannel,
  ): Promise<NotificationResult> {
    const subject = 'Reservation Confirmed - ' + equipmentName;
    const textBody = `Dear Valued Customer,

Your reservation has been successfully confirmed!

Equipment: ${equipmentName}
Reservation ID: ${reservationId.value}
Start Date: ${startDate.toLocaleDateString()}
End Date: ${endDate.toLocaleDateString()}

We've reserved this equipment exclusively for you. You'll receive a reminder email before your reservation starts.

PICKUP INSTRUCTIONS:
Please arrive on or after ${startDate.toLocaleDateString()} to pick up the equipment. Bring your membership card and a valid ID.

CANCELLATION POLICY:
You can cancel your reservation up to 24 hours before the start date without penalty. After that, cancellation fees may apply.

If you have any questions, please contact us at ${this.config.replyTo}

Thank you!

Best regards,
Equipment Rental Team`;

    return await this.sendEmail(memberId, subject, textBody, NotificationPriority.NORMAL, {
      reservationId: reservationId.value,
      equipmentName,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
  }

  async notifyReservationCancelled(
    memberId: MemberId,
    reservationId: ReservationId,
    equipmentName: string,
    reason?: string,
    _channel?: NotificationChannel,
  ): Promise<NotificationResult> {
    const subject = 'Reservation Cancelled - ' + equipmentName;
    const reasonText = reason ? `\nReason: ${reason}\n` : '';
    const textBody = `Dear Customer,

Your reservation has been cancelled.

Equipment: ${equipmentName}
Reservation ID: ${reservationId.value}${reasonText}

Any payment authorizations have been released and should reflect in your account within 3-5 business days.

We're sorry if this causes any inconvenience. You're welcome to make a new reservation at any time.

If you have any questions or concerns, please contact us at ${this.config.replyTo}

Thank you,
Equipment Rental Team`;

    return await this.sendEmail(memberId, subject, textBody, NotificationPriority.NORMAL, {
      reservationId: reservationId.value,
      equipmentName,
      reason,
    });
  }

  async notifyReservationReminder(
    memberId: MemberId,
    reservationId: ReservationId,
    equipmentName: string,
    startDate: Date,
    daysUntilStart: number,
    _channel?: NotificationChannel,
  ): Promise<NotificationResult> {
    const dayText = daysUntilStart === 1 ? 'day' : 'days';
    const urgencyText =
      daysUntilStart === 0 ? 'STARTS TODAY!' : `starts in ${daysUntilStart} ${dayText}`;
    const subject = `Reservation Reminder: ${equipmentName} ${urgencyText}`;
    const textBody = `Dear Valued Customer,

Your reservation ${urgencyText}

Equipment: ${equipmentName}
Reservation ID: ${reservationId.value}
Start Date: ${startDate.toLocaleDateString()}

PICKUP CHECKLIST:
✓ Bring your membership card
✓ Bring a valid photo ID
✓ Arrive during business hours:
  Monday - Friday: 8:00 AM - 8:00 PM
  Saturday - Sunday: 9:00 AM - 6:00 PM

The equipment is ready and waiting for you!

If your plans have changed and you need to cancel, please let us know as soon as possible.

See you soon!

Best regards,
Equipment Rental Team`;

    return await this.sendEmail(
      memberId,
      subject,
      textBody,
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
    _channel?: NotificationChannel,
  ): Promise<NotificationResult> {
    const subject = 'Equipment Damage Assessment - ' + equipmentName;
    const descriptionText = description ? `\nDamage Description:\n${description}\n` : '';
    const textBody = `Dear Customer,

We have completed the inspection of the equipment you recently returned and found damage that requires repair.

Equipment: ${equipmentName}
Equipment ID: ${equipmentId.value}
Damage Fee: ${damageFee.toString()}${descriptionText}

The damage fee has been charged to your payment method on file. You'll receive a separate receipt for this transaction.

DISPUTE PROCESS:
If you believe this assessment is incorrect, please contact us within 7 days at ${this.config.replyTo} with your rental ID and any supporting documentation or photos.

We appreciate your understanding and cooperation in maintaining our equipment in good condition for all members.

Thank you,
Equipment Rental Team`;

    return await this.sendEmail(memberId, subject, textBody, NotificationPriority.NORMAL, {
      equipmentId: equipmentId.value,
      equipmentName,
      damageFee: damageFee.amount,
      description,
    });
  }

  async notifyPaymentReceived(
    memberId: MemberId,
    transactionId: string,
    amount: Money,
    description: string,
    _channel?: NotificationChannel,
  ): Promise<NotificationResult> {
    const subject = 'Payment Confirmation - ' + amount.toString();
    const textBody = `Dear Valued Customer,

Your payment has been processed successfully!

Transaction ID: ${transactionId}
Amount: ${amount.toString()}
Description: ${description}
Payment Date: ${new Date().toLocaleDateString()}

This is your receipt for the transaction. Please keep it for your records.

You can view all your transactions in your account dashboard at any time.

Thank you for your payment!

Best regards,
Equipment Rental Team`;

    return await this.sendEmail(memberId, subject, textBody, NotificationPriority.NORMAL, {
      transactionId,
      amount: amount.amount,
      description,
    });
  }

  async notifyPaymentFailed(
    memberId: MemberId,
    amount: Money,
    reason: string,
    _channel?: NotificationChannel,
  ): Promise<NotificationResult> {
    const subject = '❌ Payment Failed - Action Required';
    const textBody = `Dear Customer,

We were unable to process your recent payment.

Amount: ${amount.toString()}
Reason: ${reason}
Attempted: ${new Date().toLocaleDateString()}

ACTION REQUIRED:
Please update your payment method or try again with a different payment option. You can manage your payment methods in your account settings.

NEED HELP?
If you continue to experience issues or have questions about this failed payment, please contact us at ${this.config.replyTo}

We're here to help!

Equipment Rental Team`;

    return await this.sendEmail(memberId, subject, textBody, NotificationPriority.HIGH, {
      amount: amount.amount,
      reason,
    });
  }

  async sendCustomNotification(
    memberId: MemberId,
    subject: string,
    message: string,
    priority?: NotificationPriority,
    _channel?: NotificationChannel,
  ): Promise<NotificationResult> {
    return await this.sendEmail(
      memberId,
      subject,
      message,
      priority || NotificationPriority.NORMAL,
    );
  }

  /**
   * Get all sent emails (for testing and monitoring)
   */
  getSentEmails(): EmailMessage[] {
    return [...this.emails];
  }

  /**
   * Get emails for a specific recipient
   */
  getEmailsForRecipient(email: string): EmailMessage[] {
    return this.emails.filter((e) => e.to === email);
  }

  /**
   * Clear all emails (for testing)
   */
  clear(): void {
    this.emails = [];
    this.emailCounter = 0;
  }

  /**
   * Get email count
   */
  getEmailCount(): number {
    return this.emails.length;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<EmailConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
