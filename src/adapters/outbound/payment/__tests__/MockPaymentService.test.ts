import { MockPaymentService } from '../MockPaymentService.js';
import { Money } from '../../../../domain/value-objects/Money.js';
import { RentalId, MemberId } from '../../../../domain/value-objects/identifiers.js';
import { PaymentMethod, PaymentStatus } from '../../../../domain/ports/PaymentService.js';

describe('MockPaymentService', () => {
  let service: MockPaymentService;

  beforeEach(() => {
    service = new MockPaymentService();
  });

  describe('processPayment', () => {
    it('should process payment successfully by default', async () => {
      const rentalId = RentalId.generate();
      const memberId = MemberId.generate();
      const amount = Money.dollars(100);

      const result = await service.processPayment(
        rentalId,
        memberId,
        amount,
        PaymentMethod.CREDIT_CARD,
        'Test payment',
      );

      expect(result.status).toBe(PaymentStatus.SUCCESS);
      expect(result.amount.amount).toBe(100);
      expect(result.transactionId).toMatch(/^MOCK_TXN_/);
      expect(result.processedAt).toBeInstanceOf(Date);
      expect(result.metadata?.rentalId).toBe(rentalId.value);
      expect(result.metadata?.memberId).toBe(memberId.value);
    });

    it('should fail payments when configured to fail', async () => {
      service.setConfig({ shouldFail: true });

      const result = await service.processPayment(
        RentalId.generate(),
        MemberId.generate(),
        Money.dollars(100),
        PaymentMethod.CREDIT_CARD,
      );

      expect(result.status).toBe(PaymentStatus.FAILED);
      expect(result.errorMessage).toBeDefined();
    });

    it('should make payments pending when configured to pend', async () => {
      service.setConfig({ shouldPend: true });

      const result = await service.processPayment(
        RentalId.generate(),
        MemberId.generate(),
        Money.dollars(100),
        PaymentMethod.CREDIT_CARD,
      );

      expect(result.status).toBe(PaymentStatus.PENDING);
    });

    it('should generate unique transaction IDs', async () => {
      const result1 = await service.processPayment(
        RentalId.generate(),
        MemberId.generate(),
        Money.dollars(100),
        PaymentMethod.CREDIT_CARD,
      );

      const result2 = await service.processPayment(
        RentalId.generate(),
        MemberId.generate(),
        Money.dollars(50),
        PaymentMethod.DEBIT_CARD,
      );

      expect(result1.transactionId).not.toBe(result2.transactionId);
    });
  });

  describe('processRefund', () => {
    it('should refund successful transactions', async () => {
      const payment = await service.processPayment(
        RentalId.generate(),
        MemberId.generate(),
        Money.dollars(100),
        PaymentMethod.CREDIT_CARD,
      );

      const refund = await service.processRefund(
        payment.transactionId,
        Money.dollars(50),
        'Customer request',
      );

      expect(refund.status).toBe(PaymentStatus.REFUNDED);
      expect(refund.amount.amount).toBe(50);
      expect(refund.metadata?.originalTransactionId).toBe(payment.transactionId);
    });

    it('should reject refund for non-existent transaction', async () => {
      await expect(service.processRefund('INVALID_TXN', Money.dollars(50))).rejects.toThrow(
        'not found',
      );
    });

    it('should reject refund for failed transaction', async () => {
      service.setConfig({ shouldFail: true });
      const payment = await service.processPayment(
        RentalId.generate(),
        MemberId.generate(),
        Money.dollars(100),
        PaymentMethod.CREDIT_CARD,
      );

      await expect(service.processRefund(payment.transactionId, Money.dollars(50))).rejects.toThrow(
        'Can only refund successful transactions',
      );
    });

    it('should reject refund exceeding original amount', async () => {
      const payment = await service.processPayment(
        RentalId.generate(),
        MemberId.generate(),
        Money.dollars(100),
        PaymentMethod.CREDIT_CARD,
      );

      await expect(
        service.processRefund(payment.transactionId, Money.dollars(150)),
      ).rejects.toThrow('cannot exceed original transaction amount');
    });
  });

  describe('authorizePayment', () => {
    it('should authorize payment successfully', async () => {
      const memberId = MemberId.generate();
      const amount = Money.dollars(100);

      const result = await service.authorizePayment(memberId, amount, PaymentMethod.CREDIT_CARD);

      expect(result.status).toBe(PaymentStatus.PENDING);
      expect(result.amount.amount).toBe(100);
      expect(result.metadata?.type).toBe('authorization');
    });

    it('should fail authorization when configured to fail', async () => {
      service.setConfig({ shouldFail: true });

      const result = await service.authorizePayment(
        MemberId.generate(),
        Money.dollars(100),
        PaymentMethod.CREDIT_CARD,
      );

      expect(result.status).toBe(PaymentStatus.FAILED);
    });
  });

  describe('capturePayment', () => {
    it('should capture authorized payment', async () => {
      const authorization = await service.authorizePayment(
        MemberId.generate(),
        Money.dollars(100),
        PaymentMethod.CREDIT_CARD,
      );

      const capture = await service.capturePayment(authorization.transactionId);

      expect(capture.status).toBe(PaymentStatus.SUCCESS);
      expect(capture.amount.amount).toBe(100);
      expect(capture.metadata?.authorizationId).toBe(authorization.transactionId);
    });

    it('should capture partial amount', async () => {
      const authorization = await service.authorizePayment(
        MemberId.generate(),
        Money.dollars(100),
        PaymentMethod.CREDIT_CARD,
      );

      const capture = await service.capturePayment(authorization.transactionId, Money.dollars(75));

      expect(capture.amount.amount).toBe(75);
    });

    it('should reject capture for non-existent authorization', async () => {
      await expect(service.capturePayment('INVALID_AUTH')).rejects.toThrow('not found');
    });

    it('should reject capture exceeding authorized amount', async () => {
      const authorization = await service.authorizePayment(
        MemberId.generate(),
        Money.dollars(100),
        PaymentMethod.CREDIT_CARD,
      );

      await expect(
        service.capturePayment(authorization.transactionId, Money.dollars(150)),
      ).rejects.toThrow('cannot exceed authorized amount');
    });
  });

  describe('cancelAuthorization', () => {
    it('should cancel pending authorization', async () => {
      const authorization = await service.authorizePayment(
        MemberId.generate(),
        Money.dollars(100),
        PaymentMethod.CREDIT_CARD,
      );

      const cancellation = await service.cancelAuthorization(authorization.transactionId);

      expect(cancellation.status).toBe(PaymentStatus.CANCELLED);
      expect(cancellation.metadata?.authorizationId).toBe(authorization.transactionId);
    });

    it('should reject cancellation of non-existent authorization', async () => {
      await expect(service.cancelAuthorization('INVALID_AUTH')).rejects.toThrow('not found');
    });
  });

  describe('getPaymentDetails', () => {
    it('should retrieve payment details', async () => {
      const payment = await service.processPayment(
        RentalId.generate(),
        MemberId.generate(),
        Money.dollars(100),
        PaymentMethod.CREDIT_CARD,
      );

      const details = await service.getPaymentDetails(payment.transactionId);

      expect(details).toBeDefined();
      expect(details?.transactionId).toBe(payment.transactionId);
      expect(details?.amount.amount).toBe(100);
    });

    it('should return undefined for non-existent transaction', async () => {
      const details = await service.getPaymentDetails('INVALID_TXN');
      expect(details).toBeUndefined();
    });
  });

  describe('verifyPaymentMethod', () => {
    it('should verify payment method successfully by default', async () => {
      const result = await service.verifyPaymentMethod(
        MemberId.generate(),
        PaymentMethod.CREDIT_CARD,
      );
      expect(result).toBe(true);
    });

    it('should fail verification when configured to fail', async () => {
      service.setConfig({ shouldFail: true });

      const result = await service.verifyPaymentMethod(
        MemberId.generate(),
        PaymentMethod.CREDIT_CARD,
      );
      expect(result).toBe(false);
    });
  });

  describe('calculateProcessingFee', () => {
    it('should calculate fee for credit card', async () => {
      const fee = await service.calculateProcessingFee(
        Money.dollars(100),
        PaymentMethod.CREDIT_CARD,
      );
      // 2.9% + $0.30 = $3.20
      expect(fee.amount).toBeCloseTo(3.2, 2);
    });

    it('should calculate fee for debit card', async () => {
      const fee = await service.calculateProcessingFee(
        Money.dollars(100),
        PaymentMethod.DEBIT_CARD,
      );
      // 2.5% + $0.25 = $2.75
      expect(fee.amount).toBeCloseTo(2.75, 2);
    });

    it('should have no fee for cash', async () => {
      const fee = await service.calculateProcessingFee(Money.dollars(100), PaymentMethod.CASH);
      expect(fee.amount).toBe(0);
    });

    it('should calculate fee for bank transfer', async () => {
      const fee = await service.calculateProcessingFee(
        Money.dollars(100),
        PaymentMethod.BANK_TRANSFER,
      );
      // 0.8% + $0 = $0.80
      expect(fee.amount).toBeCloseTo(0.8, 2);
    });
  });

  describe('getAllTransactions', () => {
    it('should return all transactions', async () => {
      await service.processPayment(
        RentalId.generate(),
        MemberId.generate(),
        Money.dollars(100),
        PaymentMethod.CREDIT_CARD,
      );

      await service.processPayment(
        RentalId.generate(),
        MemberId.generate(),
        Money.dollars(50),
        PaymentMethod.DEBIT_CARD,
      );

      const transactions = service.getAllTransactions();
      expect(transactions).toHaveLength(2);
    });
  });

  describe('clear', () => {
    it('should clear all transactions and reset counter', async () => {
      await service.processPayment(
        RentalId.generate(),
        MemberId.generate(),
        Money.dollars(100),
        PaymentMethod.CREDIT_CARD,
      );

      service.clear();

      expect(service.getAllTransactions()).toHaveLength(0);

      // Transaction counter should be reset
      const result = await service.processPayment(
        RentalId.generate(),
        MemberId.generate(),
        Money.dollars(50),
        PaymentMethod.CASH,
      );

      expect(result.transactionId).toBe('MOCK_TXN_00000001');
    });
  });

  describe('configuration', () => {
    it('should allow updating configuration', async () => {
      service.setConfig({ shouldFail: true });

      let result = await service.processPayment(
        RentalId.generate(),
        MemberId.generate(),
        Money.dollars(100),
        PaymentMethod.CREDIT_CARD,
      );
      expect(result.status).toBe(PaymentStatus.FAILED);

      service.setConfig({ shouldFail: false });

      result = await service.processPayment(
        RentalId.generate(),
        MemberId.generate(),
        Money.dollars(100),
        PaymentMethod.CREDIT_CARD,
      );
      expect(result.status).toBe(PaymentStatus.SUCCESS);
    });
  });
});
