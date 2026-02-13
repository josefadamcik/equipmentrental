/**
 * Equipment Rental System
 * Entry point for the application
 *
 * This file bootstraps the entire application:
 * 1. Loads configuration from environment variables
 * 2. Initializes the dependency injection container
 * 3. Establishes database connections
 * 4. Starts the HTTP server
 * 5. Sets up graceful shutdown handlers
 */

import { loadConfig, getSafeConfig } from './infrastructure/config/Config.js';
import { Container } from './infrastructure/di/Container.js';
import { createServer } from './adapters/inbound/http/server.js';
import { DI_TOKENS } from './infrastructure/di/types.js';
import { RentalController } from './adapters/inbound/http/controllers/RentalController.js';
import { EquipmentController } from './adapters/inbound/http/controllers/EquipmentController.js';
import { MemberController } from './adapters/inbound/http/controllers/MemberController.js';
import { ReservationController } from './adapters/inbound/http/controllers/ReservationController.js';
import { ILogger } from './infrastructure/logging/Logger.js';
import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { Server } from 'http';

/**
 * Global references for cleanup during shutdown
 */
let container: Container | undefined;
let httpServer: Server | undefined;
let logger: ILogger | undefined;
let isShuttingDown = false;

/**
 * Bootstrap the application
 */
async function bootstrap(): Promise<void> {
  try {
    console.log('='.repeat(60));
    console.log('Equipment Rental System - Starting Application');
    console.log('='.repeat(60));

    // Step 1: Load configuration
    console.log('\n[1/5] Loading configuration...');
    const config = loadConfig();
    console.log('Configuration loaded successfully:');
    console.log(JSON.stringify(getSafeConfig(config), null, 2));

    // Step 2: Initialize dependency injection container
    console.log('\n[2/5] Initializing dependency injection container...');
    const useInMemoryAdapters = config.database.url === ':memory:';

    container = new Container({
      useInMemoryAdapters,
      useMockPayment: config.payment.provider === 'mock',
      useConsoleNotification: config.notification.provider === 'console',
      loggingConfig: config.logging,
      stripeConfig:
        config.payment.provider === 'stripe'
          ? {
              apiKey: config.payment.stripe.secretKey,
              apiVersion: '2024-12-18.acacia',
            }
          : undefined,
      emailConfig:
        config.notification.provider === 'email'
          ? {
              fromAddress: config.notification.email.from,
              fromName: 'Equipment Rental System',
              enableHtml: true,
            }
          : undefined,
      prismaClient: useInMemoryAdapters
        ? undefined
        : ((): PrismaClient => {
            const adapter = new PrismaLibSql({
              url: `file:${config.database.url.replace('file:', '')}`,
            });
            return new PrismaClient({
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              adapter: adapter as any,
              log: config.database.logQueries
                ? ['query', 'info', 'warn', 'error']
                : ['warn', 'error'],
            });
          })(),
    });

    await container.initialize();

    // Resolve logger from container
    logger = container.resolve<ILogger>(DI_TOKENS.Logger);

    logger.info('Dependency injection container initialized successfully', {
      repositories: useInMemoryAdapters ? 'in-memory' : 'Prisma',
      paymentService: config.payment.provider,
      notificationService: config.notification.provider,
    });

    // Step 3: Initialize database connections
    if (!useInMemoryAdapters) {
      logger.info('Connecting to database', {
        url: config.database.url.replace(/:[^:@]+@/, ':***@'),
      });
      logger.info('Database connection established successfully');
    } else {
      logger.info('Using in-memory storage (no database connection needed)');
    }

    // Step 4: Create and configure HTTP server
    logger.info('Creating HTTP server');
    const rentalController = container.resolve<RentalController>(DI_TOKENS.RentalController);
    const equipmentController = container.resolve<EquipmentController>(
      DI_TOKENS.EquipmentController,
    );
    const memberController = container.resolve<MemberController>(DI_TOKENS.MemberController);
    const reservationController = container.resolve<ReservationController>(
      DI_TOKENS.ReservationController,
    );

    const app = createServer({
      rentalController,
      equipmentController,
      memberController,
      reservationController,
      logger,
    });

    // Step 5: Start HTTP server
    logger.info('Starting HTTP server');
    httpServer = app.listen(config.server.port, () => {
      logger!.info('Application Started Successfully!', {
        environment: config.server.nodeEnv,
        serverUrl: `http://${config.server.host}:${config.server.port}`,
        healthCheckUrl: `http://${config.server.host}:${config.server.port}/health`,
        apiBaseUrl: `http://${config.server.host}:${config.server.port}/api`,
        availableEndpoints: [
          'GET    /health',
          'POST   /api/rentals',
          'GET    /api/rentals/:id',
          'PUT    /api/rentals/:id/return',
          'PUT    /api/rentals/:id/extend',
          'GET    /api/rentals/member/:memberId',
          'GET    /api/rentals/overdue',
          'GET    /api/equipment/available',
          'GET    /api/equipment/:id',
          'POST   /api/equipment',
          'PUT    /api/equipment/:id',
          'DELETE /api/equipment/:id',
          'POST   /api/members',
          'GET    /api/members/:id',
          'PUT    /api/members/:id',
          'GET    /api/members/:id/rentals',
          'POST   /api/reservations',
          'GET    /api/reservations/:id',
          'DELETE /api/reservations/:id',
        ],
      });
    });

    // Handle server errors
    httpServer.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        logger!.error(`Port ${config.server.port} is already in use`, error, {
          port: config.server.port,
          suggestion: 'Please stop the other application or change the PORT in your .env file',
        });
      } else {
        logger!.error('Failed to start HTTP server', error);
      }
      process.exit(1);
    });
  } catch (error) {
    // If logger is available, use it; otherwise fall back to console
    if (logger) {
      logger.error(
        'FATAL ERROR: Application failed to start',
        error instanceof Error ? error : new Error(String(error)),
      );
    } else {
      console.error('\n' + '='.repeat(60));
      console.error('FATAL ERROR: Application failed to start');
      console.error('='.repeat(60));
      if (error instanceof Error) {
        console.error(`\nError: ${error.message}`);
        if (error.stack) {
          console.error('\nStack trace:');
          console.error(error.stack);
        }
      } else {
        console.error(error);
      }
      console.error('\n' + '='.repeat(60));
    }
    process.exit(1);
  }
}

/**
 * Graceful shutdown handler
 */
async function shutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    if (logger) {
      logger.warn('Force shutdown detected. Exiting immediately...');
    } else {
      console.log('\nForce shutdown detected. Exiting immediately...');
    }
    process.exit(1);
  }

  isShuttingDown = true;

  if (logger) {
    logger.info(`Received ${signal} - Starting graceful shutdown...`);
  } else {
    console.log('\n' + '='.repeat(60));
    console.log(`Received ${signal} - Starting graceful shutdown...`);
    console.log('='.repeat(60));
  }

  try {
    // Step 1: Stop accepting new connections
    if (httpServer) {
      if (logger) {
        logger.info('Closing HTTP server');
      } else {
        console.log('\n[1/2] Closing HTTP server...');
      }
      await new Promise<void>((resolve, reject) => {
        httpServer!.close((error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
      if (logger) {
        logger.info('HTTP server closed successfully');
      } else {
        console.log('HTTP server closed successfully');
      }
    }

    // Step 2: Close database connections and cleanup resources
    if (container) {
      if (logger) {
        logger.info('Disposing container and closing database connections');
      } else {
        console.log('\n[2/2] Disposing container and closing database connections...');
      }
      await container.dispose();
      if (logger) {
        logger.info('Container disposed successfully');
      } else {
        console.log('Container disposed successfully');
      }
    }

    if (logger) {
      logger.info('Graceful shutdown completed successfully');
    } else {
      console.log('\n' + '='.repeat(60));
      console.log('Graceful shutdown completed successfully');
      console.log('='.repeat(60) + '\n');
    }
    process.exit(0);
  } catch (error) {
    if (logger) {
      logger.error(
        'ERROR during shutdown',
        error instanceof Error ? error : new Error(String(error)),
      );
    } else {
      console.error('\nERROR during shutdown:');
      if (error instanceof Error) {
        console.error(error.message);
      } else {
        console.error(error);
      }
    }
    process.exit(1);
  }
}

/**
 * Global error handlers
 */
process.on('uncaughtException', (error: Error) => {
  if (logger) {
    logger.error('UNCAUGHT EXCEPTION - Application will terminate', error);
  } else {
    console.error('\n' + '='.repeat(60));
    console.error('UNCAUGHT EXCEPTION - Application will terminate');
    console.error('='.repeat(60));
    console.error(`\nError: ${error.message}`);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    console.error('\n' + '='.repeat(60));
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  if (logger) {
    logger.error(
      'UNHANDLED PROMISE REJECTION - Application will terminate',
      reason instanceof Error ? reason : new Error(String(reason)),
    );
  } else {
    console.error('\n' + '='.repeat(60));
    console.error('UNHANDLED PROMISE REJECTION - Application will terminate');
    console.error('='.repeat(60));
    if (reason instanceof Error) {
      console.error(`\nError: ${reason.message}`);
      if (reason.stack) {
        console.error('\nStack trace:');
        console.error(reason.stack);
      }
    } else {
      console.error('\nReason:', reason);
    }
    console.error('\n' + '='.repeat(60));
  }
  process.exit(1);
});

/**
 * Graceful shutdown signals
 */
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

/**
 * Start the application
 */
bootstrap().catch((error) => {
  console.error('Bootstrap failed:', error);
  process.exit(1);
});
