import dotenv from 'dotenv';
import { DatabaseConfig, loadDatabaseConfig, validateDatabaseConfig } from './DatabaseConfig.js';
import { ServerConfig, loadServerConfig, validateServerConfig } from './ServerConfig.js';

/**
 * Payment service configuration
 */
export interface PaymentConfig {
  provider: 'stripe' | 'mock';
  stripe: {
    secretKey: string;
    publishableKey: string;
    webhookSecret: string;
  };
}

/**
 * Notification service configuration
 */
export interface NotificationConfig {
  provider: 'email' | 'console';
  email: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
    from: string;
  };
}

/**
 * Logging configuration
 */
export interface LoggingConfig {
  level: 'error' | 'warn' | 'info' | 'debug';
  format: 'json' | 'text';
  destination: 'console' | 'file' | 'both';
  filePath?: string;
}

/**
 * Application-wide configuration
 */
export interface AppConfig {
  server: ServerConfig;
  database: DatabaseConfig;
  payment: PaymentConfig;
  notification: NotificationConfig;
  logging: LoggingConfig;
}

/**
 * Load payment configuration from environment variables
 */
function loadPaymentConfig(): PaymentConfig {
  const provider = (process.env.PAYMENT_PROVIDER || 'mock') as 'stripe' | 'mock';

  return {
    provider,
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY || '',
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    },
  };
}

/**
 * Validate payment configuration
 */
function validatePaymentConfig(config: PaymentConfig): void {
  if (!['stripe', 'mock'].includes(config.provider)) {
    throw new Error('Payment provider must be either "stripe" or "mock"');
  }

  if (config.provider === 'stripe') {
    if (!config.stripe.secretKey) {
      throw new Error('STRIPE_SECRET_KEY is required when using Stripe payment provider');
    }
    if (!config.stripe.publishableKey) {
      throw new Error('STRIPE_PUBLISHABLE_KEY is required when using Stripe payment provider');
    }
  }
}

/**
 * Load notification configuration from environment variables
 */
function loadNotificationConfig(): NotificationConfig {
  const provider = (process.env.NOTIFICATION_PROVIDER || 'console') as 'email' | 'console';

  // Use default only if env var is undefined, not if it's empty string
  const emailHost =
    process.env.EMAIL_HOST !== undefined ? process.env.EMAIL_HOST : 'smtp.example.com';
  const emailFrom =
    process.env.EMAIL_FROM !== undefined ? process.env.EMAIL_FROM : 'noreply@equipmentrental.com';

  return {
    provider,
    email: {
      host: emailHost,
      port: parseInt(process.env.EMAIL_PORT || '587', 10),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASS || '',
      },
      from: emailFrom,
    },
  };
}

/**
 * Validate notification configuration
 */
function validateNotificationConfig(config: NotificationConfig): void {
  if (!['email', 'console'].includes(config.provider)) {
    throw new Error('Notification provider must be either "email" or "console"');
  }

  if (config.provider === 'email') {
    if (!config.email.host || config.email.host.trim() === '') {
      throw new Error('EMAIL_HOST is required when using email notification provider');
    }
    if (config.email.port < 1 || config.email.port > 65535) {
      throw new Error('EMAIL_PORT must be between 1 and 65535');
    }
    if (!config.email.from || config.email.from.trim() === '') {
      throw new Error('EMAIL_FROM is required when using email notification provider');
    }
  }
}

/**
 * Load logging configuration from environment variables
 */
function loadLoggingConfig(): LoggingConfig {
  const level = (process.env.LOG_LEVEL || 'info') as 'error' | 'warn' | 'info' | 'debug';
  const format = (process.env.LOG_FORMAT || 'text') as 'json' | 'text';
  const destination = (process.env.LOG_DESTINATION || 'console') as 'console' | 'file' | 'both';

  return {
    level,
    format,
    destination,
    filePath: process.env.LOG_FILE_PATH,
  };
}

/**
 * Validate logging configuration
 */
function validateLoggingConfig(config: LoggingConfig): void {
  if (!['error', 'warn', 'info', 'debug'].includes(config.level)) {
    throw new Error('LOG_LEVEL must be one of: error, warn, info, debug');
  }

  if (!['json', 'text'].includes(config.format)) {
    throw new Error('LOG_FORMAT must be either "json" or "text"');
  }

  if (!['console', 'file', 'both'].includes(config.destination)) {
    throw new Error('LOG_DESTINATION must be one of: console, file, both');
  }

  if ((config.destination === 'file' || config.destination === 'both') && !config.filePath) {
    throw new Error('LOG_FILE_PATH is required when LOG_DESTINATION is "file" or "both"');
  }
}

/**
 * Load and validate all application configuration
 * Call this once at application startup
 */
export function loadConfig(envFilePath?: string): AppConfig {
  // Load environment variables from .env file
  if (envFilePath) {
    dotenv.config({ path: envFilePath });
  } else {
    dotenv.config();
  }

  // Load all configuration sections
  const server = loadServerConfig();
  const database = loadDatabaseConfig();
  const payment = loadPaymentConfig();
  const notification = loadNotificationConfig();
  const logging = loadLoggingConfig();

  // Validate all configuration sections
  validateServerConfig(server);
  validateDatabaseConfig(database);
  validatePaymentConfig(payment);
  validateNotificationConfig(notification);
  validateLoggingConfig(logging);

  return {
    server,
    database,
    payment,
    notification,
    logging,
  };
}

/**
 * Get a safe configuration object for logging (without sensitive data)
 */
export function getSafeConfig(config: AppConfig): Record<string, unknown> {
  return {
    server: {
      port: config.server.port,
      host: config.server.host,
      nodeEnv: config.server.nodeEnv,
      cors: config.server.cors,
    },
    database: {
      url: config.database.url.replace(/:[^:@]+@/, ':***@'), // Mask password
      logQueries: config.database.logQueries,
      connectionTimeout: config.database.connectionTimeout,
      poolSize: config.database.poolSize,
    },
    payment: {
      provider: config.payment.provider,
      stripe: {
        secretKey: config.payment.stripe.secretKey ? '***' : '',
        publishableKey: config.payment.stripe.publishableKey ? '***' : '',
        webhookSecret: config.payment.stripe.webhookSecret ? '***' : '',
      },
    },
    notification: {
      provider: config.notification.provider,
      email: {
        host: config.notification.email.host,
        port: config.notification.email.port,
        secure: config.notification.email.secure,
        from: config.notification.email.from,
        auth: {
          user: config.notification.email.auth.user,
          pass: config.notification.email.auth.pass ? '***' : '',
        },
      },
    },
    logging: config.logging,
  };
}
