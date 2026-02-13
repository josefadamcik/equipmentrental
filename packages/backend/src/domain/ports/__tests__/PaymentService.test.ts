import { PaymentService, PaymentMethod, PaymentStatus, PaymentResult } from '../PaymentService';
import { Money } from '../../value-objects/Money';
import { RentalId, MemberId } from '../../value-objects/identifiers';

/**
 * Mock implementation of PaymentService for testing
 */
class MockPaymentService implements PaymentService {
  private transactions: Map<string, PaymentResult> = new Map();
  private transactionCounter = 0;

  async processPayment(
    rentalId: RentalId,
    memberId: MemberId,
    amount: Money,
    method: PaymentMethod,
    description?: string,
  ): Promise<PaymentResult> {
    const transactionId = `txn_${++this.transactionCounter}`;
    const result: PaymentResult = {
      transactionId,
      status: PaymentStatus.SUCCESS,
      amount,
      processedAt: new Date(),
      metadata: { rentalId: rentalId.value, memberId: memberId.value, description, method },
    };
    this.transactions.set(transactionId, result);
    return result;
  }

  async processRefund(
    transactionId: string,
    amount: Money,
    reason?: string,
  ): Promise<PaymentResult> {
    const original = this.transactions.get(transactionId);
    if (!original) {
      throw new Error('Transaction not found');
    }

    const refundId = `refund_${++this.transactionCounter}`;
    const result: PaymentResult = {
      transactionId: refundId,
      status: PaymentStatus.REFUNDED,
      amount,
      processedAt: new Date(),
      metadata: { originalTransactionId: transactionId, reason },
    };
    this.transactions.set(refundId, result);
    return result;
  }

  async authorizePayment(
    memberId: MemberId,
    amount: Money,
    method: PaymentMethod,
  ): Promise<PaymentResult> {
    const authId = `auth_${++this.transactionCounter}`;
    const result: PaymentResult = {
      transactionId: authId,
      status: PaymentStatus.PENDING,
      amount,
      processedAt: new Date(),
      metadata: { memberId: memberId.value, method, type: 'authorization' },
    };
    this.transactions.set(authId, result);
    return result;
  }

  async capturePayment(authorizationId: string, amount?: Money): Promise<PaymentResult> {
    const auth = this.transactions.get(authorizationId);
    if (!auth) {
      throw new Error('Authorization not found');
    }

    const captureAmount = amount || auth.amount;
    const captureId = `capture_${++this.transactionCounter}`;
    const result: PaymentResult = {
      transactionId: captureId,
      status: PaymentStatus.SUCCESS,
      amount: captureAmount,
      processedAt: new Date(),
      metadata: { authorizationId, type: 'capture' },
    };
    this.transactions.set(captureId, result);
    return result;
  }

  async cancelAuthorization(authorizationId: string): Promise<PaymentResult> {
    const auth = this.transactions.get(authorizationId);
    if (!auth) {
      throw new Error('Authorization not found');
    }

    const cancelId = `cancel_${++this.transactionCounter}`;
    const result: PaymentResult = {
      transactionId: cancelId,
      status: PaymentStatus.CANCELLED,
      amount: auth.amount,
      processedAt: new Date(),
      metadata: { authorizationId, type: 'cancellation' },
    };
    this.transactions.set(cancelId, result);
    return result;
  }

  async getPaymentDetails(transactionId: string): Promise<PaymentResult | undefined> {
    return this.transactions.get(transactionId);
  }

  async verifyPaymentMethod(): Promise<boolean> {
    return true;
  }

  async calculateProcessingFee(amount: Money, method: PaymentMethod): Promise<Money> {
    const feeRate = method === PaymentMethod.CREDIT_CARD ? 0.029 : 0.01;
    const feeAmount = Math.round(amount.amount * feeRate * 100) / 100;
    return Money.dollars(feeAmount);
  }

  clear(): void {
    this.transactions.clear();
    this.transactionCounter = 0;
  }
}

describe('PaymentService Port', () => {
  let service: MockPaymentService;
  const rentalId = RentalId.generate();
  const memberId = MemberId.generate();

  beforeEach(() => {
    service = new MockPaymentService();
  });

  describe('processPayment', () => {
    it('should process a payment successfully', async () => {
      const amount = Money.dollars(100);
      const result = await service.processPayment(
        rentalId,
        memberId,
        amount,
        PaymentMethod.CREDIT_CARD,
        'Rental payment',
      );

      expect(result.status).toBe(PaymentStatus.SUCCESS);
      expect(result.amount.equals(amount)).toBe(true);
      expect(result.transactionId).toBeDefined();
      expect(result.processedAt).toBeInstanceOf(Date);
    });

    it('should include metadata in payment result', async () => {
      const result = await service.processPayment(
        rentalId,
        memberId,
        Money.dollars(100),
        PaymentMethod.DEBIT_CARD,
        'Test payment',
      );

      expect(result.metadata).toBeDefined();
      expect(result.metadata?.rentalId).toBe(rentalId.value);
      expect(result.metadata?.memberId).toBe(memberId.value);
    });

    it('should support different payment methods', async () => {
      const methods = [
        PaymentMethod.CREDIT_CARD,
        PaymentMethod.DEBIT_CARD,
        PaymentMethod.CASH,
        PaymentMethod.BANK_TRANSFER,
      ];

      for (const method of methods) {
        const result = await service.processPayment(rentalId, memberId, Money.dollars(50), method);
        expect(result.status).toBe(PaymentStatus.SUCCESS);
      }
    });
  });

  describe('processRefund', () => {
    it('should process a refund for a previous payment', async () => {
      const payment = await service.processPayment(
        rentalId,
        memberId,
        Money.dollars(100),
        PaymentMethod.CREDIT_CARD,
      );

      const refundAmount = Money.dollars(50);
      const refund = await service.processRefund(
        payment.transactionId,
        refundAmount,
        'Partial refund',
      );

      expect(refund.status).toBe(PaymentStatus.REFUNDED);
      expect(refund.amount.equals(refundAmount)).toBe(true);
      expect(refund.transactionId).not.toBe(payment.transactionId);
    });

    it('should throw error for non-existent transaction', async () => {
      await expect(service.processRefund('invalid_txn', Money.dollars(50))).rejects.toThrow(
        'Transaction not found',
      );
    });
  });

  describe('authorizePayment', () => {
    it('should authorize a payment without capturing it', async () => {
      const amount = Money.dollars(200);
      const authorization = await service.authorizePayment(
        memberId,
        amount,
        PaymentMethod.CREDIT_CARD,
      );

      expect(authorization.status).toBe(PaymentStatus.PENDING);
      expect(authorization.amount.equals(amount)).toBe(true);
      expect(authorization.transactionId).toMatch(/^auth_/);
    });
  });

  describe('capturePayment', () => {
    it('should capture an authorized payment', async () => {
      const authorization = await service.authorizePayment(
        memberId,
        Money.dollars(200),
        PaymentMethod.CREDIT_CARD,
      );

      const capture = await service.capturePayment(authorization.transactionId);

      expect(capture.status).toBe(PaymentStatus.SUCCESS);
      expect(capture.amount.equals(authorization.amount)).toBe(true);
      expect(capture.metadata?.authorizationId).toBe(authorization.transactionId);
    });

    it('should support partial capture', async () => {
      const authorization = await service.authorizePayment(
        memberId,
        Money.dollars(200),
        PaymentMethod.CREDIT_CARD,
      );

      const partialAmount = Money.dollars(150);
      const capture = await service.capturePayment(authorization.transactionId, partialAmount);

      expect(capture.status).toBe(PaymentStatus.SUCCESS);
      expect(capture.amount.equals(partialAmount)).toBe(true);
    });

    it('should throw error for non-existent authorization', async () => {
      await expect(service.capturePayment('invalid_auth')).rejects.toThrow(
        'Authorization not found',
      );
    });
  });

  describe('cancelAuthorization', () => {
    it('should cancel an authorization', async () => {
      const authorization = await service.authorizePayment(
        memberId,
        Money.dollars(200),
        PaymentMethod.CREDIT_CARD,
      );

      const cancellation = await service.cancelAuthorization(authorization.transactionId);

      expect(cancellation.status).toBe(PaymentStatus.CANCELLED);
      expect(cancellation.metadata?.authorizationId).toBe(authorization.transactionId);
    });

    it('should throw error for non-existent authorization', async () => {
      await expect(service.cancelAuthorization('invalid_auth')).rejects.toThrow(
        'Authorization not found',
      );
    });
  });

  describe('getPaymentDetails', () => {
    it('should retrieve payment details by transaction ID', async () => {
      const payment = await service.processPayment(
        rentalId,
        memberId,
        Money.dollars(100),
        PaymentMethod.CREDIT_CARD,
      );

      const details = await service.getPaymentDetails(payment.transactionId);

      expect(details).toBeDefined();
      expect(details?.transactionId).toBe(payment.transactionId);
      expect(details?.amount.equals(payment.amount)).toBe(true);
    });

    it('should return undefined for non-existent transaction', async () => {
      const details = await service.getPaymentDetails('invalid_txn');
      expect(details).toBeUndefined();
    });
  });

  describe('verifyPaymentMethod', () => {
    it('should verify if a payment method is valid', async () => {
      const isValid = await service.verifyPaymentMethod();
      expect(typeof isValid).toBe('boolean');
    });
  });

  describe('calculateProcessingFee', () => {
    it('should calculate processing fee for credit card', async () => {
      const amount = Money.dollars(100);
      const fee = await service.calculateProcessingFee(amount, PaymentMethod.CREDIT_CARD);

      expect(fee.amount).toBe(2.9); // 2.9% of 100
    });

    it('should calculate processing fee for other methods', async () => {
      const amount = Money.dollars(100);
      const fee = await service.calculateProcessingFee(amount, PaymentMethod.BANK_TRANSFER);

      expect(fee.amount).toBe(1); // 1% of 100
    });
  });

  describe('type compliance', () => {
    it('should implement all required methods', () => {
      const svc: PaymentService = service;
      expect(typeof svc.processPayment).toBe('function');
      expect(typeof svc.processRefund).toBe('function');
      expect(typeof svc.authorizePayment).toBe('function');
      expect(typeof svc.capturePayment).toBe('function');
      expect(typeof svc.cancelAuthorization).toBe('function');
      expect(typeof svc.getPaymentDetails).toBe('function');
      expect(typeof svc.verifyPaymentMethod).toBe('function');
      expect(typeof svc.calculateProcessingFee).toBe('function');
    });
  });

  describe('PaymentMethod enum', () => {
    it('should have all payment method types', () => {
      expect(PaymentMethod.CREDIT_CARD).toBe('CREDIT_CARD');
      expect(PaymentMethod.DEBIT_CARD).toBe('DEBIT_CARD');
      expect(PaymentMethod.CASH).toBe('CASH');
      expect(PaymentMethod.BANK_TRANSFER).toBe('BANK_TRANSFER');
    });
  });

  describe('PaymentStatus enum', () => {
    it('should have all payment status types', () => {
      expect(PaymentStatus.SUCCESS).toBe('SUCCESS');
      expect(PaymentStatus.FAILED).toBe('FAILED');
      expect(PaymentStatus.PENDING).toBe('PENDING');
      expect(PaymentStatus.CANCELLED).toBe('CANCELLED');
      expect(PaymentStatus.REFUNDED).toBe('REFUNDED');
    });
  });
});
