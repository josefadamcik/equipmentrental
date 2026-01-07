import { loadConfig, getSafeConfig } from '../Config.js';

describe('Config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    // Set minimum required environment variables
    process.env.DATABASE_URL = 'file:./test.db';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('loadConfig', () => {
    it('should load complete application configuration', () => {
      process.env.NODE_ENV = 'development';
      process.env.PORT = '3000';
      process.env.DATABASE_URL = 'file:./test.db';
      process.env.PAYMENT_PROVIDER = 'mock';
      process.env.NOTIFICATION_PROVIDER = 'console';
      process.env.LOG_LEVEL = 'info';

      const config = loadConfig();

      expect(config).toHaveProperty('server');
      expect(config).toHaveProperty('database');
      expect(config).toHaveProperty('payment');
      expect(config).toHaveProperty('notification');
      expect(config).toHaveProperty('logging');
    });

    it('should load configuration with Stripe payment provider', () => {
      process.env.PAYMENT_PROVIDER = 'stripe';
      process.env.STRIPE_SECRET_KEY = 'sk_test_123';
      process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_123';
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_123';

      const config = loadConfig();

      expect(config.payment.provider).toBe('stripe');
      expect(config.payment.stripe.secretKey).toBe('sk_test_123');
      expect(config.payment.stripe.publishableKey).toBe('pk_test_123');
      expect(config.payment.stripe.webhookSecret).toBe('whsec_123');
    });

    it('should throw error when Stripe keys are missing', () => {
      process.env.PAYMENT_PROVIDER = 'stripe';
      delete process.env.STRIPE_SECRET_KEY;
      delete process.env.STRIPE_PUBLISHABLE_KEY;

      expect(() => loadConfig()).toThrow(
        'STRIPE_SECRET_KEY is required when using Stripe payment provider',
      );
    });

    it('should load configuration with email notification provider', () => {
      process.env.NOTIFICATION_PROVIDER = 'email';
      process.env.EMAIL_HOST = 'smtp.gmail.com';
      process.env.EMAIL_PORT = '587';
      process.env.EMAIL_USER = 'test@example.com';
      process.env.EMAIL_PASS = 'password123';
      process.env.EMAIL_FROM = 'noreply@example.com';

      const config = loadConfig();

      expect(config.notification.provider).toBe('email');
      expect(config.notification.email.host).toBe('smtp.gmail.com');
      expect(config.notification.email.port).toBe(587);
      expect(config.notification.email.auth.user).toBe('test@example.com');
      expect(config.notification.email.auth.pass).toBe('password123');
      expect(config.notification.email.from).toBe('noreply@example.com');
    });

    it('should throw error when email host is missing', () => {
      process.env.NOTIFICATION_PROVIDER = 'email';
      process.env.EMAIL_HOST = '';
      process.env.EMAIL_FROM = 'test@example.com';

      expect(() => loadConfig()).toThrow(
        'EMAIL_HOST is required when using email notification provider',
      );
    });

    it('should load logging configuration', () => {
      process.env.LOG_LEVEL = 'debug';
      process.env.LOG_FORMAT = 'json';
      process.env.LOG_DESTINATION = 'console';

      const config = loadConfig();

      expect(config.logging.level).toBe('debug');
      expect(config.logging.format).toBe('json');
      expect(config.logging.destination).toBe('console');
    });

    it('should throw error when log level is invalid', () => {
      process.env.LOG_LEVEL = 'invalid';

      expect(() => loadConfig()).toThrow('LOG_LEVEL must be one of: error, warn, info, debug');
    });

    it('should throw error when log file path is missing for file destination', () => {
      process.env.LOG_DESTINATION = 'file';
      delete process.env.LOG_FILE_PATH;

      expect(() => loadConfig()).toThrow(
        'LOG_FILE_PATH is required when LOG_DESTINATION is "file" or "both"',
      );
    });

    it('should allow file destination when log file path is provided', () => {
      process.env.LOG_DESTINATION = 'file';
      process.env.LOG_FILE_PATH = './logs/app.log';

      const config = loadConfig();

      expect(config.logging.destination).toBe('file');
      expect(config.logging.filePath).toBe('./logs/app.log');
    });

    it('should use default values for optional settings', () => {
      // Set NODE_ENV explicitly to test default behavior
      delete process.env.NODE_ENV;

      const config = loadConfig();

      expect(config.server.port).toBe(3000);
      expect(config.server.nodeEnv).toBe('development');
      expect(config.payment.provider).toBe('mock');
      expect(config.notification.provider).toBe('console');
      expect(config.logging.level).toBe('info');
    });

    it('should throw error when DATABASE_URL is missing', () => {
      // Clear DATABASE_URL after dotenv has loaded
      const savedUrl = process.env.DATABASE_URL;
      delete process.env.DATABASE_URL;

      try {
        expect(() => loadConfig('/nonexistent/path/.env')).toThrow(
          'DATABASE_URL environment variable is required',
        );
      } finally {
        // Restore for other tests
        if (savedUrl) {
          process.env.DATABASE_URL = savedUrl;
        }
      }
    });
  });

  describe('getSafeConfig', () => {
    it('should return configuration with masked sensitive data', () => {
      process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/db';
      process.env.PAYMENT_PROVIDER = 'stripe';
      process.env.STRIPE_SECRET_KEY = 'sk_test_secret';
      process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_public';
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_secret';
      process.env.NOTIFICATION_PROVIDER = 'email';
      process.env.EMAIL_HOST = 'smtp.gmail.com';
      process.env.EMAIL_PORT = '587';
      process.env.EMAIL_USER = 'test@example.com';
      process.env.EMAIL_PASS = 'password123';
      process.env.EMAIL_FROM = 'noreply@example.com';

      const config = loadConfig();
      const safeConfig = getSafeConfig(config);

      // Database password should be masked
      expect((safeConfig.database as any).url).toBe('postgresql://user:***@localhost:5432/db');

      // Stripe keys should be masked
      expect((safeConfig.payment as any).stripe.secretKey).toBe('***');
      expect((safeConfig.payment as any).stripe.publishableKey).toBe('***');
      expect((safeConfig.payment as any).stripe.webhookSecret).toBe('***');

      // Email password should be masked
      expect((safeConfig.notification as any).email.auth.pass).toBe('***');

      // Non-sensitive data should be visible
      expect((safeConfig.server as any).port).toBe(3000);
      expect((safeConfig.notification as any).email.host).toBe('smtp.gmail.com');
      expect((safeConfig.notification as any).email.auth.user).toBe('test@example.com');
    });

    it('should handle SQLite URLs without masking', () => {
      process.env.DATABASE_URL = 'file:./dev.db';

      const config = loadConfig();
      const safeConfig = getSafeConfig(config);

      // SQLite URLs don't have passwords to mask
      expect((safeConfig.database as any).url).toBe('file:./dev.db');
    });

    it('should handle empty Stripe keys', () => {
      process.env.PAYMENT_PROVIDER = 'mock';

      const config = loadConfig();
      const safeConfig = getSafeConfig(config);

      expect((safeConfig.payment as any).stripe.secretKey).toBe('');
      expect((safeConfig.payment as any).stripe.publishableKey).toBe('');
      expect((safeConfig.payment as any).stripe.webhookSecret).toBe('');
    });

    it('should preserve non-sensitive configuration values', () => {
      process.env.PORT = '8080';
      process.env.HOST = '127.0.0.1';
      process.env.NODE_ENV = 'production';
      process.env.LOG_LEVEL = 'debug';

      const config = loadConfig();
      const safeConfig = getSafeConfig(config);

      expect((safeConfig.server as any).port).toBe(8080);
      expect((safeConfig.server as any).host).toBe('127.0.0.1');
      expect((safeConfig.server as any).nodeEnv).toBe('production');
      expect((safeConfig.logging as any).level).toBe('debug');
    });
  });

  describe('Payment Configuration', () => {
    it('should validate payment provider', () => {
      process.env.PAYMENT_PROVIDER = 'invalid';

      expect(() => loadConfig()).toThrow('Payment provider must be either "stripe" or "mock"');
    });

    it('should allow mock payment provider without keys', () => {
      process.env.PAYMENT_PROVIDER = 'mock';

      const config = loadConfig();

      expect(config.payment.provider).toBe('mock');
      expect(config.payment.stripe.secretKey).toBe('');
    });
  });

  describe('Notification Configuration', () => {
    it('should validate notification provider', () => {
      process.env.NOTIFICATION_PROVIDER = 'invalid';

      expect(() => loadConfig()).toThrow(
        'Notification provider must be either "email" or "console"',
      );
    });

    it('should validate email port range', () => {
      process.env.NOTIFICATION_PROVIDER = 'email';
      process.env.EMAIL_HOST = 'smtp.example.com';
      process.env.EMAIL_PORT = '70000';
      process.env.EMAIL_FROM = 'test@example.com';

      expect(() => loadConfig()).toThrow('EMAIL_PORT must be between 1 and 65535');
    });

    it('should require EMAIL_FROM when using email provider', () => {
      process.env.NOTIFICATION_PROVIDER = 'email';
      process.env.EMAIL_HOST = 'smtp.example.com';
      process.env.EMAIL_PORT = '587';
      process.env.EMAIL_FROM = '';

      expect(() => loadConfig()).toThrow(
        'EMAIL_FROM is required when using email notification provider',
      );
    });

    it('should allow console notification provider', () => {
      process.env.NOTIFICATION_PROVIDER = 'console';

      const config = loadConfig();

      expect(config.notification.provider).toBe('console');
    });
  });

  describe('Logging Configuration', () => {
    it('should validate log format', () => {
      process.env.LOG_FORMAT = 'invalid';

      expect(() => loadConfig()).toThrow('LOG_FORMAT must be either "json" or "text"');
    });

    it('should validate log destination', () => {
      process.env.LOG_DESTINATION = 'invalid';

      expect(() => loadConfig()).toThrow('LOG_DESTINATION must be one of: console, file, both');
    });

    it('should require log file path for "both" destination', () => {
      process.env.LOG_DESTINATION = 'both';
      delete process.env.LOG_FILE_PATH;

      expect(() => loadConfig()).toThrow(
        'LOG_FILE_PATH is required when LOG_DESTINATION is "file" or "both"',
      );
    });

    it('should allow all valid log levels', () => {
      const levels = ['error', 'warn', 'info', 'debug'];

      levels.forEach((level) => {
        process.env.LOG_LEVEL = level;
        const config = loadConfig();
        expect(config.logging.level).toBe(level);
      });
    });
  });
});
