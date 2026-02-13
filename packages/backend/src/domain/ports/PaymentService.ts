import { Money } from '../value-objects/Money.js';
import { RentalId, MemberId } from '../value-objects/identifiers.js';

/**
 * Payment method types supported by the system
 */
export const PaymentMethod = {
  CREDIT_CARD: 'CREDIT_CARD',
  DEBIT_CARD: 'DEBIT_CARD',
  CASH: 'CASH',
  BANK_TRANSFER: 'BANK_TRANSFER',
} as const;

export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

/**
 * Payment status after processing
 */
export const PaymentStatus = {
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  PENDING: 'PENDING',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
} as const;

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

/**
 * Result of a payment operation
 */
export interface PaymentResult {
  /**
   * Unique transaction identifier from payment gateway
   */
  transactionId: string;

  /**
   * Status of the payment
   */
  status: PaymentStatus;

  /**
   * Amount that was processed
   */
  amount: Money;

  /**
   * Timestamp of the transaction
   */
  processedAt: Date;

  /**
   * Optional error message if payment failed
   */
  errorMessage?: string;

  /**
   * Additional metadata from payment gateway
   */
  metadata?: Record<string, unknown>;
}

/**
 * Payment service interface for handling payment operations
 * Abstracts payment gateway integration
 */
export interface PaymentService {
  /**
   * Process a payment for a rental
   * @param rentalId - The rental identifier
   * @param memberId - The member making the payment
   * @param amount - The amount to charge
   * @param method - The payment method to use
   * @param description - Optional description for the transaction
   * @returns Payment result with transaction details
   */
  processPayment(
    rentalId: RentalId,
    memberId: MemberId,
    amount: Money,
    method: PaymentMethod,
    description?: string,
  ): Promise<PaymentResult>;

  /**
   * Process a refund for a previous payment
   * @param transactionId - The original transaction identifier
   * @param amount - The amount to refund (can be partial)
   * @param reason - Reason for the refund
   * @returns Payment result with refund details
   */
  processRefund(transactionId: string, amount: Money, reason?: string): Promise<PaymentResult>;

  /**
   * Authorize a payment without capturing it
   * Useful for reservations where the charge happens later
   * @param memberId - The member to authorize
   * @param amount - The amount to authorize
   * @param method - The payment method to use
   * @returns Payment result with authorization details
   */
  authorizePayment(
    memberId: MemberId,
    amount: Money,
    method: PaymentMethod,
  ): Promise<PaymentResult>;

  /**
   * Capture a previously authorized payment
   * @param authorizationId - The authorization transaction identifier
   * @param amount - The amount to capture (can be less than authorized)
   * @returns Payment result with capture details
   */
  capturePayment(authorizationId: string, amount?: Money): Promise<PaymentResult>;

  /**
   * Cancel a previously authorized payment
   * @param authorizationId - The authorization transaction identifier
   * @returns Payment result with cancellation details
   */
  cancelAuthorization(authorizationId: string): Promise<PaymentResult>;

  /**
   * Get payment details by transaction ID
   * @param transactionId - The transaction identifier
   * @returns Payment result if found, undefined otherwise
   */
  getPaymentDetails(transactionId: string): Promise<PaymentResult | undefined>;

  /**
   * Verify if a payment method is valid and active
   * @param memberId - The member identifier
   * @param method - The payment method to verify
   * @returns True if payment method is valid, false otherwise
   */
  verifyPaymentMethod(memberId: MemberId, method: PaymentMethod): Promise<boolean>;

  /**
   * Calculate processing fees for a payment
   * Different payment methods may have different fees
   * @param amount - The payment amount
   * @param method - The payment method
   * @returns The processing fee amount
   */
  calculateProcessingFee(amount: Money, method: PaymentMethod): Promise<Money>;
}
