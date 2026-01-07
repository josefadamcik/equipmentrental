import Stripe from 'stripe';
import { Money } from '../../../domain/value-objects/Money.js';
import { RentalId, MemberId } from '../../../domain/value-objects/identifiers.js';
import {
  PaymentService,
  PaymentResult,
  PaymentMethod,
  PaymentStatus,
} from '../../../domain/ports/PaymentService.js';

/**
 * Configuration for Stripe payment service
 */
export interface StripePaymentConfig {
  /**
   * Stripe secret API key
   */
  apiKey: string;

  /**
   * API version to use (defaults to latest)
   */
  apiVersion?: string;

  /**
   * Application name for Stripe metadata
   */
  applicationName?: string;

  /**
   * Enable idempotency keys for safe retries
   */
  enableIdempotency?: boolean;

  /**
   * Timeout for API requests in milliseconds
   */
  timeout?: number;
}

/**
 * Stripe payment service implementation
 * Integrates with Stripe API for real payment processing
 */
export class StripePaymentService implements PaymentService {
  private stripe: Stripe;
  private config: Required<StripePaymentConfig>;

  /**
   * In-memory store for payment intents and authorizations
   * In production, this should be persisted in a database
   */
  private paymentIntents: Map<string, Stripe.PaymentIntent> = new Map();

  constructor(config: StripePaymentConfig) {
    this.config = {
      apiVersion: '2025-12-15.clover',
      applicationName: 'Equipment Rental System',
      enableIdempotency: true,
      timeout: 30000,
      ...config,
    };

    this.stripe = new Stripe(this.config.apiKey, {
      apiVersion: this.config.apiVersion as Stripe.LatestApiVersion,
      timeout: this.config.timeout,
      appInfo: {
        name: this.config.applicationName,
      },
    });
  }

  async processPayment(
    rentalId: RentalId,
    memberId: MemberId,
    amount: Money,
    method: PaymentMethod,
    description?: string,
  ): Promise<PaymentResult> {
    try {
      // Validate amount
      if (amount.amount <= 0) {
        return this.createFailedResult(amount, 'Amount must be greater than zero');
      }

      // Convert amount to cents (Stripe uses smallest currency unit)
      const amountInCents = Math.round(amount.amount * 100);

      // Create payment intent
      const paymentIntent = await this.stripe.paymentIntents.create(
        {
          amount: amountInCents,
          currency: 'usd', // Default to USD
          description: description || `Rental payment for ${rentalId.value}`,
          metadata: {
            rentalId: rentalId.value,
            memberId: memberId.value,
            paymentMethod: method,
          },
          automatic_payment_methods: {
            enabled: true,
            allow_redirects: 'never',
          },
        },
        this.getIdempotencyOptions(`payment-${rentalId.value}-${Date.now()}`),
      );

      // Store payment intent
      this.paymentIntents.set(paymentIntent.id, paymentIntent);

      // For testing purposes, we'll consider the intent created as successful
      // In production, you would need to confirm the payment with a payment method
      const result: PaymentResult = {
        transactionId: paymentIntent.id,
        status: this.mapStripeStatus(paymentIntent.status),
        amount,
        processedAt: new Date(paymentIntent.created * 1000),
        metadata: {
          rentalId: rentalId.value,
          memberId: memberId.value,
          method,
          stripeIntentId: paymentIntent.id,
          clientSecret: paymentIntent.client_secret,
        },
      };

      return result;
    } catch (error) {
      return this.handleStripeError(error, amount);
    }
  }

  async processRefund(
    transactionId: string,
    amount: Money,
    reason?: string,
  ): Promise<PaymentResult> {
    try {
      const amountInCents = Math.round(amount.amount * 100);

      // Create refund
      const refund = await this.stripe.refunds.create(
        {
          payment_intent: transactionId,
          amount: amountInCents,
          reason: this.mapRefundReason(reason),
          metadata: {
            originalTransactionId: transactionId,
            refundReason: reason || 'No reason provided',
          },
        },
        this.getIdempotencyOptions(`refund-${transactionId}-${Date.now()}`),
      );

      return {
        transactionId: refund.id,
        status: PaymentStatus.REFUNDED,
        amount,
        processedAt: new Date(refund.created * 1000),
        metadata: {
          originalTransactionId: transactionId,
          reason,
          stripeRefundId: refund.id,
        },
      };
    } catch (error) {
      return this.handleStripeError(error, amount);
    }
  }

  async authorizePayment(
    memberId: MemberId,
    amount: Money,
    method: PaymentMethod,
  ): Promise<PaymentResult> {
    try {
      const amountInCents = Math.round(amount.amount * 100);

      // Create payment intent with manual capture
      const paymentIntent = await this.stripe.paymentIntents.create(
        {
          amount: amountInCents,
          currency: 'usd', // Default to USD
          capture_method: 'manual', // Authorization only, capture later
          description: `Authorization for member ${memberId.value}`,
          metadata: {
            memberId: memberId.value,
            paymentMethod: method,
            type: 'authorization',
          },
          automatic_payment_methods: {
            enabled: true,
            allow_redirects: 'never',
          },
        },
        this.getIdempotencyOptions(`auth-${memberId.value}-${Date.now()}`),
      );

      this.paymentIntents.set(paymentIntent.id, paymentIntent);

      return {
        transactionId: paymentIntent.id,
        status: PaymentStatus.PENDING,
        amount,
        processedAt: new Date(paymentIntent.created * 1000),
        metadata: {
          memberId: memberId.value,
          method,
          type: 'authorization',
          stripeIntentId: paymentIntent.id,
          clientSecret: paymentIntent.client_secret,
        },
      };
    } catch (error) {
      return this.handleStripeError(error, amount);
    }
  }

  async capturePayment(authorizationId: string, amount?: Money): Promise<PaymentResult> {
    try {
      // Retrieve the payment intent
      const paymentIntent = await this.stripe.paymentIntents.retrieve(authorizationId);

      if (paymentIntent.capture_method !== 'manual') {
        throw new Error('Payment intent is not set for manual capture');
      }

      if (paymentIntent.status !== 'requires_capture') {
        throw new Error(
          `Cannot capture payment in status: ${paymentIntent.status}. Must be in 'requires_capture' status.`,
        );
      }

      // Capture with optional amount
      const captureOptions: Stripe.PaymentIntentCaptureParams = {};
      if (amount) {
        captureOptions.amount_to_capture = Math.round(amount.amount * 100);
      }

      const captured = await this.stripe.paymentIntents.capture(
        authorizationId,
        captureOptions,
        this.getIdempotencyOptions(`capture-${authorizationId}-${Date.now()}`),
      );

      const capturedAmount = amount || Money.dollars(captured.amount / 100);

      return {
        transactionId: captured.id,
        status: this.mapStripeStatus(captured.status),
        amount: capturedAmount,
        processedAt: new Date(captured.created * 1000),
        metadata: {
          authorizationId,
          type: 'capture',
          stripeIntentId: captured.id,
        },
      };
    } catch (error) {
      return this.handleStripeError(error, amount || Money.dollars(0));
    }
  }

  async cancelAuthorization(authorizationId: string): Promise<PaymentResult> {
    try {
      const cancelled = await this.stripe.paymentIntents.cancel(
        authorizationId,
        undefined,
        this.getIdempotencyOptions(`cancel-${authorizationId}-${Date.now()}`),
      );

      const amount = Money.dollars(cancelled.amount / 100);

      return {
        transactionId: cancelled.id,
        status: PaymentStatus.CANCELLED,
        amount,
        processedAt: new Date(),
        metadata: {
          authorizationId,
          type: 'cancellation',
          stripeIntentId: cancelled.id,
        },
      };
    } catch (error) {
      return this.handleStripeError(error, Money.dollars(0));
    }
  }

  async getPaymentDetails(transactionId: string): Promise<PaymentResult | undefined> {
    try {
      // Try to retrieve as payment intent first
      const paymentIntent = await this.stripe.paymentIntents.retrieve(transactionId);

      if (paymentIntent) {
        const amount = Money.dollars(paymentIntent.amount / 100);
        return {
          transactionId: paymentIntent.id,
          status: this.mapStripeStatus(paymentIntent.status),
          amount,
          processedAt: new Date(paymentIntent.created * 1000),
          metadata: paymentIntent.metadata as Record<string, unknown>,
        };
      }
    } catch {
      // Try to retrieve as refund
      try {
        const refund = await this.stripe.refunds.retrieve(transactionId);
        if (refund) {
          const amount = Money.dollars(refund.amount / 100);
          return {
            transactionId: refund.id,
            status: PaymentStatus.REFUNDED,
            amount,
            processedAt: new Date(refund.created * 1000),
            metadata: refund.metadata as Record<string, unknown>,
          };
        }
      } catch {
        // Transaction not found
        return undefined;
      }
    }

    return undefined;
  }

  async verifyPaymentMethod(_memberId: MemberId, method: PaymentMethod): Promise<boolean> {
    try {
      // In a real implementation, you would:
      // 1. Look up the customer in Stripe by memberId
      // 2. Check if they have valid payment methods on file
      // 3. Verify the specific payment method type

      // For now, we'll simulate this by checking if the method is supported
      const supportedMethods: PaymentMethod[] = [
        PaymentMethod.CREDIT_CARD,
        PaymentMethod.DEBIT_CARD,
        PaymentMethod.BANK_TRANSFER,
      ];

      return supportedMethods.includes(method);
    } catch (error) {
      console.error('Error verifying payment method:', error);
      return false;
    }
  }

  async calculateProcessingFee(amount: Money, method: PaymentMethod): Promise<Money> {
    // Stripe's standard processing fees
    // https://stripe.com/pricing
    let feePercentage = 2.9;
    let fixedFee = 0.3;

    switch (method) {
      case PaymentMethod.CREDIT_CARD:
        feePercentage = 2.9;
        fixedFee = 0.3;
        break;
      case PaymentMethod.DEBIT_CARD:
        feePercentage = 2.9;
        fixedFee = 0.3;
        break;
      case PaymentMethod.CASH:
        // Stripe doesn't process cash
        feePercentage = 0;
        fixedFee = 0;
        break;
      case PaymentMethod.BANK_TRANSFER:
        // ACH payments in Stripe
        feePercentage = 0.8;
        fixedFee = 0;
        break;
    }

    const percentageFee = amount.amount * (feePercentage / 100);
    const totalFee = percentageFee + fixedFee;

    // Round to 2 decimal places to match Money's precision requirements
    const roundedFee = Math.round(totalFee * 100) / 100;

    return Money.dollars(roundedFee);
  }

  /**
   * Map Stripe payment intent status to our PaymentStatus
   */
  private mapStripeStatus(status: Stripe.PaymentIntent.Status): PaymentStatus {
    switch (status) {
      case 'succeeded':
        return PaymentStatus.SUCCESS;
      case 'canceled':
        return PaymentStatus.CANCELLED;
      case 'requires_payment_method':
      case 'requires_confirmation':
      case 'requires_action':
      case 'processing':
      case 'requires_capture':
        return PaymentStatus.PENDING;
      default:
        return PaymentStatus.FAILED;
    }
  }

  /**
   * Map refund reason to Stripe's expected format
   */
  private mapRefundReason(reason?: string): Stripe.RefundCreateParams.Reason | undefined {
    if (!reason) return undefined;

    const lowerReason = reason.toLowerCase();
    if (lowerReason.includes('duplicate')) return 'duplicate';
    if (lowerReason.includes('fraud')) return 'fraudulent';
    if (lowerReason.includes('request')) return 'requested_by_customer';

    return undefined;
  }

  /**
   * Get idempotency options for Stripe requests
   */
  private getIdempotencyOptions(key: string): Stripe.RequestOptions | undefined {
    if (!this.config.enableIdempotency) return undefined;

    return {
      idempotencyKey: key,
    };
  }

  /**
   * Handle Stripe API errors
   */
  private handleStripeError(error: unknown, amount: Money): PaymentResult {
    let errorMessage = 'Unknown error occurred';

    if (error instanceof Stripe.errors.StripeError) {
      errorMessage = error.message;

      // Log detailed error for debugging
      console.error('Stripe error:', {
        type: error.type,
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
      });
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return this.createFailedResult(amount, errorMessage);
  }

  /**
   * Create a failed payment result
   */
  private createFailedResult(amount: Money, errorMessage: string): PaymentResult {
    return {
      transactionId: `FAILED_${Date.now()}`,
      status: PaymentStatus.FAILED,
      amount,
      processedAt: new Date(),
      errorMessage,
      metadata: {
        error: errorMessage,
      },
    };
  }
}
