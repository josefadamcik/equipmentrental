import express, { Express, json } from 'express';
import swaggerUi from 'swagger-ui-express';
import { RentalController } from './controllers/RentalController.js';
import { EquipmentController } from './controllers/EquipmentController.js';
import { MemberController } from './controllers/MemberController.js';
import { ReservationController } from './controllers/ReservationController.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { ILogger } from '../../../infrastructure/logging/Logger.js';
import { createRequestLogger } from '../../../infrastructure/logging/RequestLogger.js';
import { createSwaggerConfig } from '../../../infrastructure/swagger/swagger.config.js';

/**
 * Configuration for the HTTP server
 */
export interface ServerConfig {
  rentalController: RentalController;
  equipmentController: EquipmentController;
  memberController: MemberController;
  reservationController: ReservationController;
  logger: ILogger;
}

/**
 * Creates and configures an Express application with all routes and middleware
 */
export function createServer(config: ServerConfig): Express {
  const app = express();

  // Middleware
  app.use(json()); // Parse JSON request bodies

  // Request logging middleware
  app.use(
    createRequestLogger(config.logger, {
      excludePaths: ['/health'],
    }),
  );

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'Equipment Rental System',
    });
  });

  // API Documentation (Swagger UI)
  try {
    const swaggerConfig = createSwaggerConfig();
    app.use(
      swaggerConfig.path,
      swaggerUi.serve,
      swaggerUi.setup(swaggerConfig.spec, swaggerConfig.uiOptions),
    );
    config.logger.info('Swagger UI configured', { path: swaggerConfig.path });
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    config.logger.error('Failed to configure Swagger UI', error);
  }

  // API Routes
  app.use('/api/rentals', config.rentalController.getRouter());
  app.use('/api/equipment', config.equipmentController.getRouter());
  app.use('/api/members', config.memberController.getRouter());
  app.use('/api/reservations', config.reservationController.getRouter());

  // 404 Handler (must be after all routes)
  app.use(notFoundHandler);

  // Error Handler (must be last)
  app.use(errorHandler);

  return app;
}

/**
 * Starts the HTTP server on the specified port
 */
export function startServer(app: Express, port: number, logger: ILogger): void {
  app.listen(port, () => {
    logger.info('Equipment Rental System API server started', {
      port,
      healthCheckUrl: `http://localhost:${port}/health`,
      apiBaseUrl: `http://localhost:${port}/api`,
      apiDocsUrl: `http://localhost:${port}/api-docs`,
    });
  });
}
