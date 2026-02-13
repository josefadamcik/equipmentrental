import { MemberId, RentalId, EquipmentId, ReservationId } from '../value-objects/identifiers.js';
import { Money } from '../value-objects/Money.js';

/**
 * Notification channel types
 */
export const NotificationChannel = {
  EMAIL: 'EMAIL',
  SMS: 'SMS',
  PUSH: 'PUSH',
  IN_APP: 'IN_APP',
} as const;

export type NotificationChannel = (typeof NotificationChannel)[keyof typeof NotificationChannel];

/**
 * Notification priority levels
 */
export const NotificationPriority = {
  LOW: 'LOW',
  NORMAL: 'NORMAL',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;

export type NotificationPriority = (typeof NotificationPriority)[keyof typeof NotificationPriority];

/**
 * Result of a notification operation
 */
export interface NotificationResult {
  /**
   * Whether the notification was sent successfully
   */
  success: boolean;

  /**
   * Channel used for the notification
   */
  channel: NotificationChannel;

  /**
   * Timestamp when notification was sent
   */
  sentAt: Date;

  /**
   * Message ID from notification provider
   */
  messageId?: string;

  /**
   * Error message if notification failed
   */
  errorMessage?: string;
}

/**
 * Notification service interface for sending notifications to members
 * Abstracts notification delivery mechanism
 */
export interface NotificationService {
  /**
   * Send a rental confirmation notification
   * @param memberId - The member to notify
   * @param rentalId - The rental identifier
   * @param equipmentName - Name of the rented equipment
   * @param startDate - Rental start date
   * @param endDate - Rental end date
   * @param totalCost - Total rental cost
   * @param channel - Preferred notification channel
   * @returns Notification result
   */
  notifyRentalCreated(
    memberId: MemberId,
    rentalId: RentalId,
    equipmentName: string,
    startDate: Date,
    endDate: Date,
    totalCost: Money,
    channel?: NotificationChannel,
  ): Promise<NotificationResult>;

  /**
   * Send a rental return confirmation notification
   * @param memberId - The member to notify
   * @param rentalId - The rental identifier
   * @param equipmentName - Name of the returned equipment
   * @param returnDate - Date of return
   * @param totalCost - Final total cost (including late fees)
   * @param channel - Preferred notification channel
   * @returns Notification result
   */
  notifyRentalReturned(
    memberId: MemberId,
    rentalId: RentalId,
    equipmentName: string,
    returnDate: Date,
    totalCost: Money,
    channel?: NotificationChannel,
  ): Promise<NotificationResult>;

  /**
   * Send an overdue rental notification
   * @param memberId - The member to notify
   * @param rentalId - The rental identifier
   * @param equipmentName - Name of the overdue equipment
   * @param daysOverdue - Number of days overdue
   * @param lateFees - Accrued late fees
   * @param channel - Preferred notification channel
   * @returns Notification result
   */
  notifyRentalOverdue(
    memberId: MemberId,
    rentalId: RentalId,
    equipmentName: string,
    daysOverdue: number,
    lateFees: Money,
    channel?: NotificationChannel,
  ): Promise<NotificationResult>;

  /**
   * Send an upcoming rental due reminder
   * @param memberId - The member to notify
   * @param rentalId - The rental identifier
   * @param equipmentName - Name of the rented equipment
   * @param dueDate - When the rental is due
   * @param daysUntilDue - Number of days until due
   * @param channel - Preferred notification channel
   * @returns Notification result
   */
  notifyRentalDueSoon(
    memberId: MemberId,
    rentalId: RentalId,
    equipmentName: string,
    dueDate: Date,
    daysUntilDue: number,
    channel?: NotificationChannel,
  ): Promise<NotificationResult>;

  /**
   * Send a reservation confirmation notification
   * @param memberId - The member to notify
   * @param reservationId - The reservation identifier
   * @param equipmentName - Name of the reserved equipment
   * @param startDate - Reservation start date
   * @param endDate - Reservation end date
   * @param channel - Preferred notification channel
   * @returns Notification result
   */
  notifyReservationCreated(
    memberId: MemberId,
    reservationId: ReservationId,
    equipmentName: string,
    startDate: Date,
    endDate: Date,
    channel?: NotificationChannel,
  ): Promise<NotificationResult>;

  /**
   * Send a reservation cancellation notification
   * @param memberId - The member to notify
   * @param reservationId - The reservation identifier
   * @param equipmentName - Name of the reserved equipment
   * @param reason - Reason for cancellation
   * @param channel - Preferred notification channel
   * @returns Notification result
   */
  notifyReservationCancelled(
    memberId: MemberId,
    reservationId: ReservationId,
    equipmentName: string,
    reason?: string,
    channel?: NotificationChannel,
  ): Promise<NotificationResult>;

  /**
   * Send a reservation reminder (upcoming reservation)
   * @param memberId - The member to notify
   * @param reservationId - The reservation identifier
   * @param equipmentName - Name of the reserved equipment
   * @param startDate - When reservation starts
   * @param daysUntilStart - Number of days until start
   * @param channel - Preferred notification channel
   * @returns Notification result
   */
  notifyReservationReminder(
    memberId: MemberId,
    reservationId: ReservationId,
    equipmentName: string,
    startDate: Date,
    daysUntilStart: number,
    channel?: NotificationChannel,
  ): Promise<NotificationResult>;

  /**
   * Send equipment damage notification
   * @param memberId - The member to notify
   * @param equipmentId - The equipment identifier
   * @param equipmentName - Name of the damaged equipment
   * @param damageFee - Fee charged for damage
   * @param description - Description of damage
   * @param channel - Preferred notification channel
   * @returns Notification result
   */
  notifyEquipmentDamaged(
    memberId: MemberId,
    equipmentId: EquipmentId,
    equipmentName: string,
    damageFee: Money,
    description?: string,
    channel?: NotificationChannel,
  ): Promise<NotificationResult>;

  /**
   * Send a payment confirmation notification
   * @param memberId - The member to notify
   * @param transactionId - The payment transaction identifier
   * @param amount - Amount paid
   * @param description - Description of what was paid for
   * @param channel - Preferred notification channel
   * @returns Notification result
   */
  notifyPaymentReceived(
    memberId: MemberId,
    transactionId: string,
    amount: Money,
    description: string,
    channel?: NotificationChannel,
  ): Promise<NotificationResult>;

  /**
   * Send a payment failure notification
   * @param memberId - The member to notify
   * @param amount - Amount that failed to process
   * @param reason - Reason for failure
   * @param channel - Preferred notification channel
   * @returns Notification result
   */
  notifyPaymentFailed(
    memberId: MemberId,
    amount: Money,
    reason: string,
    channel?: NotificationChannel,
  ): Promise<NotificationResult>;

  /**
   * Send a custom notification
   * @param memberId - The member to notify
   * @param subject - Notification subject/title
   * @param message - Notification message
   * @param priority - Notification priority
   * @param channel - Preferred notification channel
   * @returns Notification result
   */
  sendCustomNotification(
    memberId: MemberId,
    subject: string,
    message: string,
    priority?: NotificationPriority,
    channel?: NotificationChannel,
  ): Promise<NotificationResult>;
}
