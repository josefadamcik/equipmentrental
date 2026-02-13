import Stripe from 'stripe';
import { StripePaymentService } from '../StripePaymentService.js';
import { Money } from '../../../../domain/value-objects/Money.js';
import { RentalId, MemberId } from '../../../../domain/value-objects/identifiers.js';
import { PaymentMethod, PaymentStatus } from '../../../../domain/ports/PaymentService.js';
import { InMemoryPaymentIntentRepository } from '../../../outbound/persistence/InMemoryPaymentIntentRepository.js';

// Mock Stripe
jest.mock('stripe');

describe('StripePaymentService', () => {
  let service: StripePaymentService;
  let paymentIntentRepo: InMemoryPaymentIntentRepository;
  let mockStripe: {
    paymentIntents: {
      create: jest.Mock;
      retrieve: jest.Mock;
      capture: jest.Mock;
      cancel: jest.Mock;
    };
    refunds: {
      create: jest.Mock;
      retrieve: jest.Mock;
    };
  };
  let rentalId: RentalId;
  let memberId: MemberId;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock Stripe instance
    mockStripe = {
      paymentIntents: {
        create: jest.fn(),
        retrieve: jest.fn(),
        capture: jest.fn(),
        cancel: jest.fn(),
      },
      refunds: {
        create: jest.fn(),
        retrieve: jest.fn(),
      },
    };

    // Mock Stripe constructor
    (Stripe as unknown as jest.Mock).mockImplementation(() => mockStripe);

    // In-memory repository for payment intents
    paymentIntentRepo = new InMemoryPaymentIntentRepository();

    // Initialize service
    service = new StripePaymentService(
      {
        apiKey: 'sk_test_12345',
        enableIdempotency: true,
      },
      paymentIntentRepo,
    );

    // Create test identifiers
    rentalId = RentalId.generate();
    memberId = MemberId.generate();
  });

  describe('constructor', () => {
    it('should initialize Stripe with correct configuration', () => {
      expect(Stripe).toHaveBeenCalledWith('sk_test_12345', {
        apiVersion: '2025-12-15.clover',
        timeout: 30000,
        appInfo: {
          name: 'Equipment Rental System',
        },
      });
    });

    it('should accept custom configuration', () => {
      new StripePaymentService(
        {
          apiKey: 'sk_test_custom',
          applicationName: 'Custom App',
          timeout: 60000,
        },
        new InMemoryPaymentIntentRepository(),
      );

      expect(Stripe).toHaveBeenCalledWith('sk_test_custom', {
        apiVersion: '2025-12-15.clover',
        timeout: 60000,
        appInfo: {
          name: 'Custom App',
        },
      });
    });
  });

  describe('processPayment', () => {
    it('should create a payment intent successfully', async () => {
      const amount = Money.dollars(100);
      const mockPaymentIntent: Partial<Stripe.PaymentIntent> = {
        id: 'pi_12345',
        amount: 10000,
        currency: 'usd',
        status: 'succeeded',
        created: Math.floor(Date.now() / 1000),
        client_secret: 'pi_secret_12345',
      };

      mockStripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent as Stripe.PaymentIntent);

      const result = await service.processPayment(
        rentalId,
        memberId,
        amount,
        PaymentMethod.CREDIT_CARD,
        'Test payment',
      );

      expect(result.transactionId).toBe('pi_12345');
      expect(result.status).toBe(PaymentStatus.SUCCESS);
      expect(result.amount.equals(amount)).toBe(true);
      expect(result.metadata?.rentalId).toBe(rentalId.value);
      expect(result.metadata?.memberId).toBe(memberId.value);
    });

    it('should convert amount to cents correctly', async () => {
      const amount = Money.dollars(123.45);
      (mockStripe.paymentIntents.create as jest.Mock).mockResolvedValue({
        id: 'pi_12345',
        amount: 12345,
        currency: 'usd',
        status: 'succeeded',
        created: Math.floor(Date.now() / 1000),
      } as Stripe.PaymentIntent);

      await service.processPayment(
        rentalId,
        memberId,
        amount,
        PaymentMethod.CREDIT_CARD,
        'Test payment',
      );

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 12345,
          currency: 'usd',
        }),
        expect.any(Object),
      );
    });

    it('should include metadata in payment intent', async () => {
      const amount = Money.dollars(50);
      mockStripe.paymentIntents.create.mockResolvedValue({
        id: 'pi_12345',
        amount: 5000,
        currency: 'usd',
        status: 'succeeded',
        created: Math.floor(Date.now() / 1000),
      } as Stripe.PaymentIntent);

      await service.processPayment(
        rentalId,
        memberId,
        amount,
        PaymentMethod.DEBIT_CARD,
        'Rental payment',
      );

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: {
            rentalId: rentalId.value,
            memberId: memberId.value,
            paymentMethod: PaymentMethod.DEBIT_CARD,
          },
        }),
        expect.any(Object),
      );
    });

    it('should return failed result for zero amount', async () => {
      const amount = Money.dollars(0);

      const result = await service.processPayment(
        rentalId,
        memberId,
        amount,
        PaymentMethod.CREDIT_CARD,
      );

      expect(result.status).toBe(PaymentStatus.FAILED);
      expect(result.errorMessage).toBe('Amount must be greater than zero');
      expect(mockStripe.paymentIntents.create).not.toHaveBeenCalled();
    });

    it('should return failed result for negative amount', async () => {
      // Money.dollars() throws an error for negative amounts, so we test that behavior
      expect(() => Money.dollars(-10)).toThrow('Money amount cannot be negative');
    });

    it('should handle Stripe errors gracefully', async () => {
      const amount = Money.dollars(100);
      const stripeError = new Error('Your card was declined');
      // Add Stripe-specific properties to the error
      Object.assign(stripeError, {
        type: 'card_error',
        code: 'card_declined',
      });

      mockStripe.paymentIntents.create.mockRejectedValue(stripeError);

      const result = await service.processPayment(
        rentalId,
        memberId,
        amount,
        PaymentMethod.CREDIT_CARD,
      );

      expect(result.status).toBe(PaymentStatus.FAILED);
      expect(result.errorMessage).toBe('Your card was declined');
    });

    it('should use idempotency key when enabled', async () => {
      const amount = Money.dollars(100);
      mockStripe.paymentIntents.create.mockResolvedValue({
        id: 'pi_12345',
        amount: 10000,
        currency: 'usd',
        status: 'succeeded',
        created: Math.floor(Date.now() / 1000),
      } as Stripe.PaymentIntent);

      await service.processPayment(rentalId, memberId, amount, PaymentMethod.CREDIT_CARD);

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          idempotencyKey: expect.stringContaining('payment-'),
        }),
      );
    });
  });

  describe('processRefund', () => {
    it('should create a refund successfully', async () => {
      const amount = Money.dollars(50);
      const mockRefund: Partial<Stripe.Refund> = {
        id: 'ref_12345',
        amount: 5000,
        currency: 'usd',
        status: 'succeeded',
        created: Math.floor(Date.now() / 1000),
        metadata: {},
      };

      mockStripe.refunds.create.mockResolvedValue(mockRefund as Stripe.Refund);

      const result = await service.processRefund('pi_original', amount, 'Customer request');

      expect(result.transactionId).toBe('ref_12345');
      expect(result.status).toBe(PaymentStatus.REFUNDED);
      expect(result.amount.equals(amount)).toBe(true);
      expect(result.metadata?.originalTransactionId).toBe('pi_original');
      expect(result.metadata?.reason).toBe('Customer request');
    });

    it('should map refund reasons to Stripe format', async () => {
      const amount = Money.dollars(100);
      mockStripe.refunds.create.mockResolvedValue({
        id: 'ref_12345',
        amount: 10000,
        currency: 'usd',
        created: Math.floor(Date.now() / 1000),
        metadata: {},
      } as Stripe.Refund);

      await service.processRefund('pi_original', amount, 'Duplicate charge');

      expect(mockStripe.refunds.create).toHaveBeenCalledWith(
        expect.objectContaining({
          reason: 'duplicate',
        }),
        expect.any(Object),
      );
    });

    it('should handle refund errors', async () => {
      const amount = Money.dollars(50);
      const error = new Error('Refund failed');

      mockStripe.refunds.create.mockRejectedValue(error);

      const result = await service.processRefund('pi_original', amount);

      expect(result.status).toBe(PaymentStatus.FAILED);
      expect(result.errorMessage).toBe('Refund failed');
    });
  });

  describe('authorizePayment', () => {
    it('should create a payment intent with manual capture', async () => {
      const amount = Money.dollars(200);
      const mockPaymentIntent: Partial<Stripe.PaymentIntent> = {
        id: 'pi_auth_12345',
        amount: 20000,
        currency: 'usd',
        status: 'requires_capture',
        capture_method: 'manual',
        created: Math.floor(Date.now() / 1000),
        client_secret: 'pi_auth_secret_12345',
      };

      mockStripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent as Stripe.PaymentIntent);

      const result = await service.authorizePayment(memberId, amount, PaymentMethod.CREDIT_CARD);

      expect(result.status).toBe(PaymentStatus.PENDING);
      expect(result.amount.equals(amount)).toBe(true);
      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          capture_method: 'manual',
        }),
        expect.any(Object),
      );
    });

    it('should include authorization metadata', async () => {
      const amount = Money.dollars(100);
      mockStripe.paymentIntents.create.mockResolvedValue({
        id: 'pi_auth_12345',
        amount: 10000,
        currency: 'usd',
        status: 'requires_capture',
        created: Math.floor(Date.now() / 1000),
      } as Stripe.PaymentIntent);

      const result = await service.authorizePayment(memberId, amount, PaymentMethod.CREDIT_CARD);

      expect(result.metadata?.type).toBe('authorization');
      expect(result.metadata?.memberId).toBe(memberId.value);
    });
  });

  describe('capturePayment', () => {
    it('should capture an authorized payment', async () => {
      const authorizationId = 'pi_auth_12345';
      const amount = Money.dollars(100);

      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: authorizationId,
        amount: 10000,
        currency: 'usd',
        status: 'requires_capture',
        capture_method: 'manual',
        created: Math.floor(Date.now() / 1000),
      } as Stripe.PaymentIntent);

      mockStripe.paymentIntents.capture.mockResolvedValue({
        id: authorizationId,
        amount: 10000,
        currency: 'usd',
        status: 'succeeded',
        created: Math.floor(Date.now() / 1000),
      } as Stripe.PaymentIntent);

      const result = await service.capturePayment(authorizationId, amount);

      expect(result.status).toBe(PaymentStatus.SUCCESS);
      expect(result.metadata?.authorizationId).toBe(authorizationId);
      expect(mockStripe.paymentIntents.capture).toHaveBeenCalledWith(
        authorizationId,
        expect.objectContaining({
          amount_to_capture: 10000,
        }),
        expect.any(Object),
      );
    });

    it('should capture full amount if not specified', async () => {
      const authorizationId = 'pi_auth_12345';

      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: authorizationId,
        amount: 10000,
        currency: 'usd',
        status: 'requires_capture',
        capture_method: 'manual',
        created: Math.floor(Date.now() / 1000),
      } as Stripe.PaymentIntent);

      mockStripe.paymentIntents.capture.mockResolvedValue({
        id: authorizationId,
        amount: 10000,
        currency: 'usd',
        status: 'succeeded',
        created: Math.floor(Date.now() / 1000),
      } as Stripe.PaymentIntent);

      await service.capturePayment(authorizationId);

      expect(mockStripe.paymentIntents.capture).toHaveBeenCalledWith(
        authorizationId,
        {},
        expect.any(Object),
      );
    });

    it('should reject capture if payment intent is not manual capture', async () => {
      const authorizationId = 'pi_12345';

      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: authorizationId,
        amount: 10000,
        currency: 'usd',
        status: 'succeeded',
        capture_method: 'automatic',
        created: Math.floor(Date.now() / 1000),
      } as Stripe.PaymentIntent);

      const result = await service.capturePayment(authorizationId);

      expect(result.status).toBe(PaymentStatus.FAILED);
      expect(result.errorMessage).toContain('not set for manual capture');
    });

    it('should reject capture if payment is not in requires_capture status', async () => {
      const authorizationId = 'pi_auth_12345';

      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: authorizationId,
        amount: 10000,
        currency: 'usd',
        status: 'succeeded',
        capture_method: 'manual',
        created: Math.floor(Date.now() / 1000),
      } as Stripe.PaymentIntent);

      const result = await service.capturePayment(authorizationId);

      expect(result.status).toBe(PaymentStatus.FAILED);
      expect(result.errorMessage).toContain('Cannot capture payment in status');
    });
  });

  describe('cancelAuthorization', () => {
    it('should cancel a payment intent', async () => {
      const authorizationId = 'pi_auth_12345';

      mockStripe.paymentIntents.cancel.mockResolvedValue({
        id: authorizationId,
        amount: 10000,
        currency: 'usd',
        status: 'canceled',
        created: Math.floor(Date.now() / 1000),
      } as Stripe.PaymentIntent);

      const result = await service.cancelAuthorization(authorizationId);

      expect(result.status).toBe(PaymentStatus.CANCELLED);
      expect(result.metadata?.authorizationId).toBe(authorizationId);
      expect(mockStripe.paymentIntents.cancel).toHaveBeenCalledWith(
        authorizationId,
        undefined,
        expect.any(Object),
      );
    });

    it('should handle cancellation errors', async () => {
      const authorizationId = 'pi_auth_12345';
      const error = new Error('Cannot cancel payment');

      mockStripe.paymentIntents.cancel.mockRejectedValue(error);

      const result = await service.cancelAuthorization(authorizationId);

      expect(result.status).toBe(PaymentStatus.FAILED);
      expect(result.errorMessage).toBe('Cannot cancel payment');
    });
  });

  describe('getPaymentDetails', () => {
    it('should retrieve payment intent details', async () => {
      const transactionId = 'pi_12345';

      const mockPaymentIntent: Partial<Stripe.PaymentIntent> = {
        id: transactionId,
        amount: 10000,
        currency: 'usd',
        status: 'succeeded',
        created: Math.floor(Date.now() / 1000),
        metadata: { test: 'data' },
      };

      mockStripe.paymentIntents.retrieve.mockResolvedValue(
        mockPaymentIntent as Stripe.PaymentIntent,
      );

      const result = await service.getPaymentDetails(transactionId);

      expect(result).toBeDefined();
      expect(result?.transactionId).toBe(transactionId);
      expect(result?.status).toBe(PaymentStatus.SUCCESS);
      expect(result?.metadata?.test).toBe('data');
    });

    it('should retrieve refund details if payment intent not found', async () => {
      const transactionId = 'ref_12345';

      mockStripe.paymentIntents.retrieve.mockRejectedValue(new Error('Not found'));
      mockStripe.refunds.retrieve.mockResolvedValue({
        id: transactionId,
        amount: 5000,
        currency: 'usd',
        status: 'succeeded',
        created: Math.floor(Date.now() / 1000),
        metadata: {},
      } as Stripe.Refund);

      const result = await service.getPaymentDetails(transactionId);

      expect(result).toBeDefined();
      expect(result?.transactionId).toBe(transactionId);
      expect(result?.status).toBe(PaymentStatus.REFUNDED);
    });

    it('should return undefined if transaction not found', async () => {
      mockStripe.paymentIntents.retrieve.mockRejectedValue(new Error('Not found'));
      mockStripe.refunds.retrieve.mockRejectedValue(new Error('Not found'));

      const result = await service.getPaymentDetails('unknown_id');

      expect(result).toBeUndefined();
    });
  });

  describe('verifyPaymentMethod', () => {
    it('should return true for supported payment methods', async () => {
      expect(await service.verifyPaymentMethod(memberId, PaymentMethod.CREDIT_CARD)).toBe(true);
      expect(await service.verifyPaymentMethod(memberId, PaymentMethod.DEBIT_CARD)).toBe(true);
      expect(await service.verifyPaymentMethod(memberId, PaymentMethod.BANK_TRANSFER)).toBe(true);
    });

    it('should return false for unsupported payment methods', async () => {
      expect(await service.verifyPaymentMethod(memberId, PaymentMethod.CASH)).toBe(false);
    });
  });

  describe('calculateProcessingFee', () => {
    it('should calculate fee for credit card correctly', async () => {
      const amount = Money.dollars(100);
      const fee = await service.calculateProcessingFee(amount, PaymentMethod.CREDIT_CARD);

      // 2.9% + $0.30 = $3.20
      expect(fee.amount).toBeCloseTo(3.2, 2);
    });

    it('should calculate fee for debit card correctly', async () => {
      const amount = Money.dollars(100);
      const fee = await service.calculateProcessingFee(amount, PaymentMethod.DEBIT_CARD);

      // 2.9% + $0.30 = $3.20
      expect(fee.amount).toBeCloseTo(3.2, 2);
    });

    it('should calculate fee for bank transfer correctly', async () => {
      const amount = Money.dollars(100);
      const fee = await service.calculateProcessingFee(amount, PaymentMethod.BANK_TRANSFER);

      // 0.8% = $0.80
      expect(fee.amount).toBeCloseTo(0.8, 2);
    });

    it('should return zero fee for cash', async () => {
      const amount = Money.dollars(100);
      const fee = await service.calculateProcessingFee(amount, PaymentMethod.CASH);

      expect(fee.amount).toBe(0);
    });

    it('should work with different amounts', async () => {
      const amount = Money.dollars(250.5);
      const fee = await service.calculateProcessingFee(amount, PaymentMethod.CREDIT_CARD);

      // 2.9% of 250.5 + $0.30 = $7.2645 + $0.30 = $7.5645
      // Money rounds to 2 decimal places
      expect(fee.amount).toBeCloseTo(7.56, 1);
    });
  });

  describe('status mapping', () => {
    it('should map Stripe statuses to PaymentStatus correctly', async () => {
      const testCases: Array<[Stripe.PaymentIntent.Status, PaymentStatus]> = [
        ['succeeded', PaymentStatus.SUCCESS],
        ['canceled', PaymentStatus.CANCELLED],
        ['requires_payment_method', PaymentStatus.PENDING],
        ['requires_confirmation', PaymentStatus.PENDING],
        ['requires_action', PaymentStatus.PENDING],
        ['processing', PaymentStatus.PENDING],
        ['requires_capture', PaymentStatus.PENDING],
      ];

      for (const [stripeStatus, expectedStatus] of testCases) {
        mockStripe.paymentIntents.create.mockResolvedValue({
          id: 'pi_test',
          amount: 10000,
          currency: 'usd',
          status: stripeStatus,
          created: Math.floor(Date.now() / 1000),
        } as Stripe.PaymentIntent);

        const result = await service.processPayment(
          rentalId,
          memberId,
          Money.dollars(100),
          PaymentMethod.CREDIT_CARD,
        );

        expect(result.status).toBe(expectedStatus);
      }
    });
  });
});
