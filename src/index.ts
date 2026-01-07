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
import { PrismaClient } from '@prisma/client';
import { Server } from 'http';

/**
 * Global references for cleanup during shutdown
 */
let container: Container | undefined;
let httpServer: Server | undefined;
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
        : new PrismaClient({
            datasources: {
              db: {
                url: config.database.url,
              },
            },
            log: config.database.logQueries
              ? ['query', 'info', 'warn', 'error']
              : ['warn', 'error'],
          }),
    });

    await container.initialize();
    console.log('Dependency injection container initialized successfully');
    console.log(`- Using ${useInMemoryAdapters ? 'in-memory' : 'Prisma'} repositories`);
    console.log(`- Using ${config.payment.provider} payment service`);
    console.log(`- Using ${config.notification.provider} notification service`);

    // Step 3: Initialize database connections
    if (!useInMemoryAdapters) {
      console.log('\n[3/5] Connecting to database...');
      console.log(`Database URL: ${config.database.url.replace(/:[^:@]+@/, ':***@')}`);
      console.log('Database connection established successfully');
    } else {
      console.log('\n[3/5] Using in-memory storage (no database connection needed)');
    }

    // Step 4: Create and configure HTTP server
    console.log('\n[4/5] Creating HTTP server...');
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
    });

    // Step 5: Start HTTP server
    console.log('\n[5/5] Starting HTTP server...');
    httpServer = app.listen(config.server.port, () => {
      console.log('\n' + '='.repeat(60));
      console.log('Application Started Successfully!');
      console.log('='.repeat(60));
      console.log(`\nEnvironment: ${config.server.nodeEnv}`);
      console.log(`Server listening on: http://${config.server.host}:${config.server.port}`);
      console.log(`Health check: http://${config.server.host}:${config.server.port}/health`);
      console.log(`API Base URL: http://${config.server.host}:${config.server.port}/api`);
      console.log('\nAvailable endpoints:');
      console.log('  - GET    /health');
      console.log('  - POST   /api/rentals');
      console.log('  - GET    /api/rentals/:id');
      console.log('  - PUT    /api/rentals/:id/return');
      console.log('  - PUT    /api/rentals/:id/extend');
      console.log('  - GET    /api/rentals/member/:memberId');
      console.log('  - GET    /api/rentals/overdue');
      console.log('  - GET    /api/equipment/available');
      console.log('  - GET    /api/equipment/:id');
      console.log('  - POST   /api/equipment');
      console.log('  - PUT    /api/equipment/:id');
      console.log('  - DELETE /api/equipment/:id');
      console.log('  - POST   /api/members');
      console.log('  - GET    /api/members/:id');
      console.log('  - PUT    /api/members/:id');
      console.log('  - GET    /api/members/:id/rentals');
      console.log('  - POST   /api/reservations');
      console.log('  - GET    /api/reservations/:id');
      console.log('  - DELETE /api/reservations/:id');
      console.log('\nPress Ctrl+C to stop the server');
      console.log('='.repeat(60) + '\n');
    });

    // Handle server errors
    httpServer.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`\nERROR: Port ${config.server.port} is already in use`);
        console.error('Please stop the other application or change the PORT in your .env file');
      } else {
        console.error('\nERROR: Failed to start HTTP server:', error.message);
      }
      process.exit(1);
    });
  } catch (error) {
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
    process.exit(1);
  }
}

/**
 * Graceful shutdown handler
 */
async function shutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    console.log('\nForce shutdown detected. Exiting immediately...');
    process.exit(1);
  }

  isShuttingDown = true;

  console.log('\n' + '='.repeat(60));
  console.log(`Received ${signal} - Starting graceful shutdown...`);
  console.log('='.repeat(60));

  try {
    // Step 1: Stop accepting new connections
    if (httpServer) {
      console.log('\n[1/2] Closing HTTP server...');
      await new Promise<void>((resolve, reject) => {
        httpServer!.close((error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
      console.log('HTTP server closed successfully');
    }

    // Step 2: Close database connections and cleanup resources
    if (container) {
      console.log('\n[2/2] Disposing container and closing database connections...');
      await container.dispose();
      console.log('Container disposed successfully');
    }

    console.log('\n' + '='.repeat(60));
    console.log('Graceful shutdown completed successfully');
    console.log('='.repeat(60) + '\n');
    process.exit(0);
  } catch (error) {
    console.error('\nERROR during shutdown:');
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

/**
 * Global error handlers
 */
process.on('uncaughtException', (error: Error) => {
  console.error('\n' + '='.repeat(60));
  console.error('UNCAUGHT EXCEPTION - Application will terminate');
  console.error('='.repeat(60));
  console.error(`\nError: ${error.message}`);
  if (error.stack) {
    console.error('\nStack trace:');
    console.error(error.stack);
  }
  console.error('\n' + '='.repeat(60));
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
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
