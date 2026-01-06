import { Money } from '../../../domain/value-objects/Money.js';
import { RentalId, MemberId } from '../../../domain/value-objects/identifiers.js';
import {
  PaymentService,
  PaymentResult,
  PaymentMethod,
  PaymentStatus,
} from '../../../domain/ports/PaymentService.js';

/**
 * Configuration for mock payment behavior
 */
export interface MockPaymentConfig {
  /**
   * If true, all payments will fail
   */
  shouldFail?: boolean;

  /**
   * If true, payments will be pending instead of successful
   */
  shouldPend?: boolean;

  /**
   * Processing fee percentage (e.g., 2.5 for 2.5%)
   */
  processingFeePercentage?: number;

  /**
   * Fixed processing fee amount
   */
  fixedProcessingFee?: number;

  /**
   * Delay in milliseconds to simulate async processing
   */
  processingDelay?: number;
}

/**
 * Mock implementation of PaymentService for testing
 * Simulates payment processing with configurable behavior
 */
export class MockPaymentService implements PaymentService {
  private transactions: Map<string, PaymentResult> = new Map();
  private transactionCounter = 0;
  private config: MockPaymentConfig;

  constructor(config: MockPaymentConfig = {}) {
    this.config = {
      shouldFail: false,
      shouldPend: false,
      processingFeePercentage: 2.5,
      fixedProcessingFee: 0.3,
      processingDelay: 0,
      ...config,
    };
  }

  async processPayment(
    rentalId: RentalId,
    memberId: MemberId,
    amount: Money,
    method: PaymentMethod,
    description?: string,
  ): Promise<PaymentResult> {
    await this.delay();

    const transactionId = this.generateTransactionId();
    const result: PaymentResult = {
      transactionId,
      status: this.determineStatus(),
      amount,
      processedAt: new Date(),
      metadata: {
        rentalId: rentalId.value,
        memberId: memberId.value,
        method,
        description,
      },
    };

    if (result.status === PaymentStatus.FAILED) {
      result.errorMessage = 'Payment declined by mock gateway';
    }

    this.transactions.set(transactionId, result);
    return result;
  }

  async processRefund(
    transactionId: string,
    amount: Money,
    reason?: string,
  ): Promise<PaymentResult> {
    await this.delay();

    const originalTransaction = this.transactions.get(transactionId);
    if (!originalTransaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    if (originalTransaction.status !== PaymentStatus.SUCCESS) {
      throw new Error('Can only refund successful transactions');
    }

    if (amount.amount > originalTransaction.amount.amount) {
      throw new Error('Refund amount cannot exceed original transaction amount');
    }

    const refundTransactionId = this.generateTransactionId();
    const result: PaymentResult = {
      transactionId: refundTransactionId,
      status: PaymentStatus.REFUNDED,
      amount,
      processedAt: new Date(),
      metadata: {
        originalTransactionId: transactionId,
        reason,
      },
    };

    this.transactions.set(refundTransactionId, result);
    return result;
  }

  async authorizePayment(
    memberId: MemberId,
    amount: Money,
    method: PaymentMethod,
  ): Promise<PaymentResult> {
    await this.delay();

    const authorizationId = this.generateTransactionId();
    const result: PaymentResult = {
      transactionId: authorizationId,
      status: this.config.shouldFail ? PaymentStatus.FAILED : PaymentStatus.PENDING,
      amount,
      processedAt: new Date(),
      metadata: {
        memberId: memberId.value,
        method,
        type: 'authorization',
      },
    };

    if (result.status === PaymentStatus.FAILED) {
      result.errorMessage = 'Authorization declined by mock gateway';
    }

    this.transactions.set(authorizationId, result);
    return result;
  }

  async capturePayment(authorizationId: string, amount?: Money): Promise<PaymentResult> {
    await this.delay();

    const authorization = this.transactions.get(authorizationId);
    if (!authorization) {
      throw new Error(`Authorization ${authorizationId} not found`);
    }

    if (authorization.status !== PaymentStatus.PENDING) {
      throw new Error('Can only capture pending authorizations');
    }

    const captureAmount = amount || authorization.amount;
    if (captureAmount.amount > authorization.amount.amount) {
      throw new Error('Capture amount cannot exceed authorized amount');
    }

    const captureId = this.generateTransactionId();
    const result: PaymentResult = {
      transactionId: captureId,
      status: this.config.shouldFail ? PaymentStatus.FAILED : PaymentStatus.SUCCESS,
      amount: captureAmount,
      processedAt: new Date(),
      metadata: {
        authorizationId,
        type: 'capture',
      },
    };

    if (result.status === PaymentStatus.FAILED) {
      result.errorMessage = 'Capture failed by mock gateway';
    }

    this.transactions.set(captureId, result);
    return result;
  }

  async cancelAuthorization(authorizationId: string): Promise<PaymentResult> {
    await this.delay();

    const authorization = this.transactions.get(authorizationId);
    if (!authorization) {
      throw new Error(`Authorization ${authorizationId} not found`);
    }

    if (authorization.status !== PaymentStatus.PENDING) {
      throw new Error('Can only cancel pending authorizations');
    }

    const result: PaymentResult = {
      transactionId: this.generateTransactionId(),
      status: PaymentStatus.CANCELLED,
      amount: authorization.amount,
      processedAt: new Date(),
      metadata: {
        authorizationId,
        type: 'cancellation',
      },
    };

    this.transactions.set(result.transactionId, result);
    return result;
  }

  async getPaymentDetails(transactionId: string): Promise<PaymentResult | undefined> {
    return this.transactions.get(transactionId);
  }

  async verifyPaymentMethod(_memberId: MemberId, _method: PaymentMethod): Promise<boolean> {
    await this.delay();

    // Mock implementation always returns true unless configured to fail
    return !this.config.shouldFail;
  }

  async calculateProcessingFee(amount: Money, method: PaymentMethod): Promise<Money> {
    // Different fees for different payment methods
    let feePercentage = this.config.processingFeePercentage || 2.5;
    let fixedFee = this.config.fixedProcessingFee || 0.3;

    switch (method) {
      case PaymentMethod.CREDIT_CARD:
        feePercentage = 2.9;
        fixedFee = 0.3;
        break;
      case PaymentMethod.DEBIT_CARD:
        feePercentage = 2.5;
        fixedFee = 0.25;
        break;
      case PaymentMethod.CASH:
        feePercentage = 0;
        fixedFee = 0;
        break;
      case PaymentMethod.BANK_TRANSFER:
        feePercentage = 0.8;
        fixedFee = 0;
        break;
    }

    const percentageFee = amount.amount * (feePercentage / 100);
    const totalFee = percentageFee + fixedFee;

    return Money.dollars(totalFee);
  }

  /**
   * Configure mock behavior
   */
  setConfig(config: Partial<MockPaymentConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get all transactions
   * Useful for testing and debugging
   */
  getAllTransactions(): PaymentResult[] {
    return Array.from(this.transactions.values());
  }

  /**
   * Clear all transactions
   * Useful for testing
   */
  clear(): void {
    this.transactions.clear();
    this.transactionCounter = 0;
  }

  /**
   * Generate a unique transaction ID
   */
  private generateTransactionId(): string {
    this.transactionCounter += 1;
    return `MOCK_TXN_${this.transactionCounter.toString().padStart(8, '0')}`;
  }

  /**
   * Determine payment status based on config
   */
  private determineStatus(): PaymentStatus {
    if (this.config.shouldFail) {
      return PaymentStatus.FAILED;
    }
    if (this.config.shouldPend) {
      return PaymentStatus.PENDING;
    }
    return PaymentStatus.SUCCESS;
  }

  /**
   * Simulate processing delay
   */
  private async delay(): Promise<void> {
    if (this.config.processingDelay && this.config.processingDelay > 0) {
      // In a real environment, we would use setTimeout
      // For testing, we just resolve immediately
      await new Promise((resolve) => resolve(undefined));
    }
  }
}
