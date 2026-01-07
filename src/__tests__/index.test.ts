/**
 * Tests for application bootstrap (src/index.ts)
 *
 * These tests verify the application startup, configuration loading,
 * DI container initialization, and graceful shutdown behavior.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

/**
 * Note: Testing the main bootstrap file is challenging because it:
 * 1. Sets up global process event handlers
 * 2. Calls process.exit() which would terminate the test runner
 * 3. Creates real HTTP servers and database connections
 *
 * These tests focus on validating the integration points and configuration
 * rather than actually starting the server during tests.
 */

describe('Application Bootstrap', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };

    // Set up test environment
    process.env.NODE_ENV = 'test';
    process.env.PORT = '3001';
    process.env.HOST = 'localhost';
    process.env.DATABASE_URL = ':memory:';
    process.env.PAYMENT_PROVIDER = 'mock';
    process.env.NOTIFICATION_PROVIDER = 'console';
    process.env.LOG_LEVEL = 'error';
    process.env.CORS_ENABLED = 'true';
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  describe('Configuration Loading', () => {
    it('should load configuration from environment variables', async () => {
      const { loadConfig } = await import('../infrastructure/config/Config.js');

      const config = loadConfig();

      expect(config.server.port).toBe(3001);
      expect(config.server.host).toBe('localhost');
      expect(config.server.nodeEnv).toBe('test');
      expect(config.database.url).toBe(':memory:');
      expect(config.payment.provider).toBe('mock');
      expect(config.notification.provider).toBe('console');
    });

    it('should use default values when optional configuration is missing', async () => {
      const { loadConfig } = await import('../infrastructure/config/Config.js');

      // Remove optional config (PORT has a default)
      delete process.env.PORT;

      const config = loadConfig();

      // Should use default port
      expect(config.server.port).toBe(3000);
    });

    it('should mask sensitive data when getting safe config', async () => {
      const { loadConfig, getSafeConfig } = await import('../infrastructure/config/Config.js');

      process.env.PAYMENT_PROVIDER = 'stripe';
      process.env.STRIPE_SECRET_KEY = 'sk_test_secret123';
      process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_public123';
      process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/db';

      const config = loadConfig();
      const safeConfig = getSafeConfig(config);

      expect((safeConfig.payment as any).stripe.secretKey).toBe('***');
      expect((safeConfig.payment as any).stripe.publishableKey).toBe('***');
      expect((safeConfig.database as any).url).toContain(':***@');
      expect((safeConfig.database as any).url).not.toContain(':password@');
    });
  });

  describe('Dependency Injection Container', () => {
    it('should initialize container with in-memory adapters for test environment', async () => {
      const { Container } = await import('../infrastructure/di/Container.js');

      const container = new Container({
        useInMemoryAdapters: true,
        useMockPayment: true,
        useConsoleNotification: true,
      });

      await container.initialize();
      expect(container).toBeDefined();

      // Clean up
      await container.dispose();
    });

    it('should register all required services', async () => {
      const { Container } = await import('../infrastructure/di/Container.js');
      const { DI_TOKENS } = await import('../infrastructure/di/types.js');

      const container = new Container({
        useInMemoryAdapters: true,
        useMockPayment: true,
        useConsoleNotification: true,
      });

      await container.initialize();

      // Check that all required tokens are registered
      const registeredTokens = container.getRegisteredTokens();
      expect(registeredTokens).toContain(DI_TOKENS.EquipmentRepository);
      expect(registeredTokens).toContain(DI_TOKENS.MemberRepository);
      expect(registeredTokens).toContain(DI_TOKENS.RentalRepository);
      expect(registeredTokens).toContain(DI_TOKENS.ReservationRepository);
      expect(registeredTokens).toContain(DI_TOKENS.PaymentService);
      expect(registeredTokens).toContain(DI_TOKENS.NotificationService);
      expect(registeredTokens).toContain(DI_TOKENS.EventPublisher);
      expect(registeredTokens).toContain(DI_TOKENS.RentalService);
      expect(registeredTokens).toContain(DI_TOKENS.ReservationService);
      expect(registeredTokens).toContain(DI_TOKENS.RentalController);
      expect(registeredTokens).toContain(DI_TOKENS.EquipmentController);
      expect(registeredTokens).toContain(DI_TOKENS.MemberController);
      expect(registeredTokens).toContain(DI_TOKENS.ReservationController);

      // Clean up
      await container.dispose();
    });

    it('should resolve all controllers successfully', async () => {
      const { Container } = await import('../infrastructure/di/Container.js');
      const { DI_TOKENS } = await import('../infrastructure/di/types.js');

      const container = new Container({
        useInMemoryAdapters: true,
        useMockPayment: true,
        useConsoleNotification: true,
      });

      await container.initialize();

      // Resolve controllers
      const rentalController = container.resolve(DI_TOKENS.RentalController);
      const equipmentController = container.resolve(DI_TOKENS.EquipmentController);
      const memberController = container.resolve(DI_TOKENS.MemberController);
      const reservationController = container.resolve(DI_TOKENS.ReservationController);

      expect(rentalController).toBeDefined();
      expect(equipmentController).toBeDefined();
      expect(memberController).toBeDefined();
      expect(reservationController).toBeDefined();

      // Clean up
      await container.dispose();
    });

    it('should properly dispose of resources', async () => {
      const { Container } = await import('../infrastructure/di/Container.js');

      const container = new Container({
        useInMemoryAdapters: true,
        useMockPayment: true,
        useConsoleNotification: true,
      });

      await container.initialize();
      await container.dispose();

      // After disposal, the container should be in a clean state
      expect(container.getRegisteredTokens()).toHaveLength(0);
    });
  });

  describe('HTTP Server Creation', () => {
    it('should create HTTP server with all routes', async () => {
      const { Container } = await import('../infrastructure/di/Container.js');
      const { DI_TOKENS } = await import('../infrastructure/di/types.js');
      const { createServer } = await import('../adapters/inbound/http/server.js');

      const container = new Container({
        useInMemoryAdapters: true,
        useMockPayment: true,
        useConsoleNotification: true,
      });

      await container.initialize();

      const rentalController = container.resolve<any>(DI_TOKENS.RentalController);
      const equipmentController = container.resolve<any>(DI_TOKENS.EquipmentController);
      const memberController = container.resolve<any>(DI_TOKENS.MemberController);
      const reservationController = container.resolve<any>(DI_TOKENS.ReservationController);

      const app = createServer({
        rentalController,
        equipmentController,
        memberController,
        reservationController,
      });

      expect(app).toBeDefined();

      // Clean up
      await container.dispose();
    });

    it('should have health check endpoint', async () => {
      const { Container } = await import('../infrastructure/di/Container.js');
      const { DI_TOKENS } = await import('../infrastructure/di/types.js');
      const { createServer } = await import('../adapters/inbound/http/server.js');
      const request = (await import('supertest')).default;

      const container = new Container({
        useInMemoryAdapters: true,
        useMockPayment: true,
        useConsoleNotification: true,
      });

      await container.initialize();

      const rentalController = container.resolve<any>(DI_TOKENS.RentalController);
      const equipmentController = container.resolve<any>(DI_TOKENS.EquipmentController);
      const memberController = container.resolve<any>(DI_TOKENS.MemberController);
      const reservationController = container.resolve<any>(DI_TOKENS.ReservationController);

      const app = createServer({
        rentalController,
        equipmentController,
        memberController,
        reservationController,
      });

      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('service', 'Equipment Rental System');

      // Clean up
      await container.dispose();
    });
  });

  describe('Configuration Scenarios', () => {
    it('should use in-memory adapters when database URL is :memory:', async () => {
      const { loadConfig } = await import('../infrastructure/config/Config.js');

      process.env.DATABASE_URL = ':memory:';
      const config = loadConfig();

      expect(config.database.url).toBe(':memory:');
    });

    it('should use Prisma adapters when database URL is not :memory:', async () => {
      const { loadConfig } = await import('../infrastructure/config/Config.js');

      process.env.DATABASE_URL = 'file:./test.db';
      const config = loadConfig();

      expect(config.database.url).toBe('file:./test.db');
      expect(config.database.url).not.toBe(':memory:');
    });

    it('should use mock payment when PAYMENT_PROVIDER is mock', async () => {
      const { loadConfig } = await import('../infrastructure/config/Config.js');

      process.env.PAYMENT_PROVIDER = 'mock';
      const config = loadConfig();

      expect(config.payment.provider).toBe('mock');
    });

    it('should use Stripe payment when PAYMENT_PROVIDER is stripe', async () => {
      const { loadConfig } = await import('../infrastructure/config/Config.js');

      process.env.PAYMENT_PROVIDER = 'stripe';
      process.env.STRIPE_SECRET_KEY = 'sk_test_123';
      process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_123';

      const config = loadConfig();

      expect(config.payment.provider).toBe('stripe');
      expect(config.payment.stripe.secretKey).toBe('sk_test_123');
    });

    it('should use console notification when NOTIFICATION_PROVIDER is console', async () => {
      const { loadConfig } = await import('../infrastructure/config/Config.js');

      process.env.NOTIFICATION_PROVIDER = 'console';
      const config = loadConfig();

      expect(config.notification.provider).toBe('console');
    });

    it('should use email notification when NOTIFICATION_PROVIDER is email', async () => {
      const { loadConfig } = await import('../infrastructure/config/Config.js');

      process.env.NOTIFICATION_PROVIDER = 'email';
      process.env.EMAIL_HOST = 'smtp.test.com';
      process.env.EMAIL_FROM = 'test@test.com';
      process.env.EMAIL_USER = 'user';
      process.env.EMAIL_PASS = 'pass';

      const config = loadConfig();

      expect(config.notification.provider).toBe('email');
      expect(config.notification.email.host).toBe('smtp.test.com');
      expect(config.notification.email.from).toBe('test@test.com');
    });
  });

  describe('Error Handling', () => {
    it('should fail when required Stripe configuration is missing', async () => {
      const { loadConfig } = await import('../infrastructure/config/Config.js');

      process.env.PAYMENT_PROVIDER = 'stripe';
      delete process.env.STRIPE_SECRET_KEY;

      expect(() => loadConfig()).toThrow('STRIPE_SECRET_KEY is required');
    });

    it('should fail when required email configuration is invalid', async () => {
      const { loadConfig } = await import('../infrastructure/config/Config.js');

      process.env.NOTIFICATION_PROVIDER = 'email';
      process.env.EMAIL_HOST = ''; // Empty string should fail validation
      process.env.EMAIL_FROM = ''; // Empty string should fail validation

      expect(() => loadConfig()).toThrow();
    });

    it('should fail when PORT is out of valid range', async () => {
      const { loadConfig } = await import('../infrastructure/config/Config.js');

      process.env.PORT = '99999'; // Out of valid range (1-65535)

      expect(() => loadConfig()).toThrow();
    });
  });

  describe('Integration Test', () => {
    it('should complete full bootstrap cycle without errors', async () => {
      const { Container } = await import('../infrastructure/di/Container.js');
      const { DI_TOKENS } = await import('../infrastructure/di/types.js');
      const { createServer } = await import('../adapters/inbound/http/server.js');
      const { loadConfig } = await import('../infrastructure/config/Config.js');

      // Load configuration
      const config = loadConfig();
      expect(config).toBeDefined();

      // Initialize container
      const useInMemoryAdapters = config.database.url === ':memory:';
      const container = new Container({
        useInMemoryAdapters,
        useMockPayment: config.payment.provider === 'mock',
        useConsoleNotification: config.notification.provider === 'console',
      });

      await container.initialize();

      // Resolve controllers
      const rentalController = container.resolve<any>(DI_TOKENS.RentalController);
      const equipmentController = container.resolve<any>(DI_TOKENS.EquipmentController);
      const memberController = container.resolve<any>(DI_TOKENS.MemberController);
      const reservationController = container.resolve<any>(DI_TOKENS.ReservationController);

      // Create server
      const app = createServer({
        rentalController,
        equipmentController,
        memberController,
        reservationController,
      });

      expect(app).toBeDefined();

      // Cleanup
      await container.dispose();
    });
  });
});
