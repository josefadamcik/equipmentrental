/**
 * Swagger/OpenAPI configuration for API documentation
 *
 * This module sets up Swagger UI for interactive API documentation.
 * It loads the OpenAPI specification from a YAML file and provides
 * configuration for the Swagger UI interface.
 */

import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { readFileSync } from 'fs';
import { join } from 'path';
import { parse } from 'yaml';

/**
 * Swagger UI options for customizing the documentation interface
 */
export const swaggerUiOptions: swaggerUi.SwaggerUiOptions = {
  customCss: `
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info { margin: 50px 0; }
    .swagger-ui .info .title { font-size: 36px; }
  `,
  customSiteTitle: 'Equipment Rental System API',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true,
    docExpansion: 'list',
    defaultModelsExpandDepth: 3,
    defaultModelExpandDepth: 3,
  },
};

/**
 * Loads the OpenAPI specification from YAML file
 */
export function loadOpenApiSpec(): object {
  try {
    // Use relative path from project root
    const openApiPath = join(process.cwd(), 'src', 'infrastructure', 'swagger', 'openapi.yaml');
    const fileContents = readFileSync(openApiPath, 'utf8');
    return parse(fileContents);
  } catch (error) {
    console.error('Failed to load OpenAPI specification:', error);
    throw new Error('Unable to load OpenAPI specification file');
  }
}

/**
 * Alternative configuration using swagger-jsdoc for inline documentation
 * This is not actively used but provided as an alternative approach
 */
export const swaggerJsdocOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Equipment Rental System API',
      version: '1.0.0',
      description: 'A comprehensive API for managing equipment rentals, reservations, and members',
      contact: {
        name: 'Equipment Rental System',
        email: 'support@equipmentrental.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    tags: [
      { name: 'Equipment', description: 'Equipment management and availability' },
      { name: 'Members', description: 'Member management and rentals' },
      { name: 'Rentals', description: 'Rental lifecycle management' },
      { name: 'Reservations', description: 'Reservation system' },
      { name: 'Health', description: 'System health checks' },
    ],
  },
  apis: ['./src/adapters/inbound/http/controllers/*.ts'],
};

/**
 * Creates Swagger specification using swagger-jsdoc (alternative approach)
 */
export function createSwaggerSpec(): object {
  return swaggerJsdoc(swaggerJsdocOptions);
}

/**
 * Gets the OpenAPI specification (prioritizes YAML file)
 */
export function getOpenApiSpec(): object {
  try {
    return loadOpenApiSpec();
  } catch {
    console.warn('Falling back to swagger-jsdoc specification');
    return createSwaggerSpec();
  }
}

/**
 * Configuration object for Swagger setup
 */
export interface SwaggerConfig {
  spec: object;
  uiOptions: swaggerUi.SwaggerUiOptions;
  path: string;
}

/**
 * Creates complete Swagger configuration
 */
export function createSwaggerConfig(path = '/api-docs'): SwaggerConfig {
  return {
    spec: getOpenApiSpec(),
    uiOptions: swaggerUiOptions,
    path,
  };
}
