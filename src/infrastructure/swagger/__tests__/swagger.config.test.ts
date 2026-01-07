/**
 * Tests for Swagger configuration
 */

import {
  loadOpenApiSpec,
  getOpenApiSpec,
  createSwaggerConfig,
  swaggerUiOptions,
  createSwaggerSpec,
} from '../swagger.config.js';

describe('Swagger Configuration', () => {
  describe('loadOpenApiSpec', () => {
    it('should load and parse OpenAPI specification from YAML file', () => {
      // Act
      const spec = loadOpenApiSpec();

      // Assert
      expect(spec).toBeDefined();
      expect((spec as any).openapi).toBe('3.0.3');
      expect((spec as any).info).toBeDefined();
      expect((spec as any).info.title).toBe('Equipment Rental System API');
    });

    it('should have correct version in spec', () => {
      // Act
      const spec = loadOpenApiSpec();

      // Assert
      expect((spec as any).info.version).toBe('1.0.0');
    });

    it('should have all required paths', () => {
      // Act
      const spec = loadOpenApiSpec();

      // Assert
      expect((spec as any).paths).toBeDefined();
      expect((spec as any).paths['/health']).toBeDefined();
      expect((spec as any).paths['/api/equipment']).toBeDefined();
      expect((spec as any).paths['/api/members/{memberId}']).toBeDefined();
      expect((spec as any).paths['/api/rentals']).toBeDefined();
      expect((spec as any).paths['/api/reservations']).toBeDefined();
    });

    it('should have all required components', () => {
      // Act
      const spec = loadOpenApiSpec();

      // Assert
      expect((spec as any).components).toBeDefined();
      expect((spec as any).components.schemas).toBeDefined();
      expect((spec as any).components.parameters).toBeDefined();
      expect((spec as any).components.responses).toBeDefined();

      // Check key schemas
      const schemas = (spec as any).components.schemas;
      expect(schemas.Equipment).toBeDefined();
      expect(schemas.Member).toBeDefined();
      expect(schemas.Rental).toBeDefined();
      expect(schemas.Reservation).toBeDefined();
      expect(schemas.ErrorResponse).toBeDefined();
    });

    it('should have proper tags', () => {
      // Act
      const spec = loadOpenApiSpec();

      // Assert
      expect((spec as any).tags).toBeDefined();
      expect((spec as any).tags.length).toBeGreaterThan(0);

      const tagNames = (spec as any).tags.map((tag: any) => tag.name);
      expect(tagNames).toContain('Equipment');
      expect(tagNames).toContain('Members');
      expect(tagNames).toContain('Rentals');
      expect(tagNames).toContain('Reservations');
      expect(tagNames).toContain('Health');
    });
  });

  describe('createSwaggerSpec', () => {
    it('should create OpenAPI specification using swagger-jsdoc', () => {
      // Act
      const spec = createSwaggerSpec();

      // Assert
      expect(spec).toBeDefined();
      expect(spec).toHaveProperty('openapi');
      expect(spec).toHaveProperty('info');
      expect((spec as any).info.title).toBe('Equipment Rental System API');
    });

    it('should include correct server configuration', () => {
      // Act
      const spec = createSwaggerSpec();

      // Assert
      expect((spec as any).servers).toBeDefined();
      expect((spec as any).servers.length).toBeGreaterThan(0);
      expect((spec as any).servers[0]).toHaveProperty('url', 'http://localhost:3000');
    });

    it('should include all API tags', () => {
      // Act
      const spec = createSwaggerSpec();

      // Assert
      expect((spec as any).tags).toBeDefined();
      expect((spec as any).tags.length).toBe(5);
      const tagNames = (spec as any).tags.map((tag: any) => tag.name);
      expect(tagNames).toContain('Equipment');
      expect(tagNames).toContain('Members');
      expect(tagNames).toContain('Rentals');
      expect(tagNames).toContain('Reservations');
      expect(tagNames).toContain('Health');
    });
  });

  describe('getOpenApiSpec', () => {
    it('should return spec from YAML file when available', () => {
      // Act
      const spec = getOpenApiSpec();

      // Assert
      expect(spec).toBeDefined();
      expect((spec as any).info.title).toBe('Equipment Rental System API');
      expect((spec as any).openapi).toBe('3.0.3');
    });
  });

  describe('createSwaggerConfig', () => {
    it('should create complete swagger configuration with default path', () => {
      // Act
      const config = createSwaggerConfig();

      // Assert
      expect(config).toHaveProperty('spec');
      expect(config).toHaveProperty('uiOptions');
      expect(config).toHaveProperty('path', '/api-docs');
      expect(config.spec).toBeDefined();
      expect(config.uiOptions).toBe(swaggerUiOptions);
    });

    it('should create swagger configuration with custom path', () => {
      // Arrange
      const customPath = '/docs';

      // Act
      const config = createSwaggerConfig(customPath);

      // Assert
      expect(config.path).toBe(customPath);
    });

    it('should include spec from YAML file', () => {
      // Act
      const config = createSwaggerConfig();

      // Assert
      expect((config.spec as any).info.title).toBe('Equipment Rental System API');
      expect((config.spec as any).info.version).toBe('1.0.0');
    });
  });

  describe('swaggerUiOptions', () => {
    it('should have correct customization options', () => {
      // Assert
      expect(swaggerUiOptions).toHaveProperty('customCss');
      expect(swaggerUiOptions).toHaveProperty('customSiteTitle');
      expect(swaggerUiOptions).toHaveProperty('swaggerOptions');
      expect(swaggerUiOptions.customSiteTitle).toBe('Equipment Rental System API');
    });

    it('should enable key swagger UI features', () => {
      // Assert
      expect(swaggerUiOptions.swaggerOptions).toBeDefined();
      const options = swaggerUiOptions.swaggerOptions!;
      expect(options.persistAuthorization).toBe(true);
      expect(options.displayRequestDuration).toBe(true);
      expect(options.filter).toBe(true);
      expect(options.tryItOutEnabled).toBe(true);
    });

    it('should have proper expansion settings', () => {
      // Assert
      const options = swaggerUiOptions.swaggerOptions!;
      expect(options.docExpansion).toBe('list');
      expect(options.defaultModelsExpandDepth).toBe(3);
      expect(options.defaultModelExpandDepth).toBe(3);
    });

    it('should include custom CSS for UI styling', () => {
      // Assert
      expect(swaggerUiOptions.customCss).toBeDefined();
      expect(swaggerUiOptions.customCss).toContain('.swagger-ui');
      expect(swaggerUiOptions.customCss).toContain('.topbar');
    });
  });

  describe('OpenAPI Specification Content', () => {
    let spec: any;

    beforeAll(() => {
      spec = loadOpenApiSpec();
    });

    it('should have health check endpoint', () => {
      expect(spec.paths['/health']).toBeDefined();
      expect(spec.paths['/health'].get).toBeDefined();
    });

    it('should have equipment endpoints', () => {
      expect(spec.paths['/api/equipment']).toBeDefined();
      expect(spec.paths['/api/equipment/{equipmentId}']).toBeDefined();
    });

    it('should have member endpoints', () => {
      expect(spec.paths['/api/members/{memberId}']).toBeDefined();
      expect(spec.paths['/api/members/{memberId}/rentals']).toBeDefined();
    });

    it('should have rental endpoints', () => {
      expect(spec.paths['/api/rentals']).toBeDefined();
      expect(spec.paths['/api/rentals/{rentalId}']).toBeDefined();
      expect(spec.paths['/api/rentals/{rentalId}/return']).toBeDefined();
      expect(spec.paths['/api/rentals/{rentalId}/extend']).toBeDefined();
      expect(spec.paths['/api/rentals/status/overdue']).toBeDefined();
    });

    it('should have reservation endpoints', () => {
      expect(spec.paths['/api/reservations']).toBeDefined();
      expect(spec.paths['/api/reservations/{reservationId}']).toBeDefined();
      expect(spec.paths['/api/reservations/{reservationId}/cancel']).toBeDefined();
      expect(spec.paths['/api/reservations/{reservationId}/confirm']).toBeDefined();
      expect(spec.paths['/api/reservations/{reservationId}/fulfill']).toBeDefined();
    });

    it('should have all required schema components', () => {
      const schemas = spec.components.schemas;
      expect(schemas.Equipment).toBeDefined();
      expect(schemas.AvailableEquipment).toBeDefined();
      expect(schemas.Member).toBeDefined();
      expect(schemas.Rental).toBeDefined();
      expect(schemas.Reservation).toBeDefined();
      expect(schemas.CreateRentalRequest).toBeDefined();
      expect(schemas.CreateRentalResponse).toBeDefined();
      expect(schemas.ReturnRentalRequest).toBeDefined();
      expect(schemas.ReturnRentalResponse).toBeDefined();
      expect(schemas.ErrorResponse).toBeDefined();
      expect(schemas.ValidationErrorResponse).toBeDefined();
    });

    it('should have all required parameter components', () => {
      const parameters = spec.components.parameters;
      expect(parameters.EquipmentId).toBeDefined();
      expect(parameters.MemberId).toBeDefined();
      expect(parameters.RentalId).toBeDefined();
      expect(parameters.ReservationId).toBeDefined();
    });

    it('should have all required response components', () => {
      const responses = spec.components.responses;
      expect(responses.BadRequest).toBeDefined();
      expect(responses.NotFound).toBeDefined();
      expect(responses.Conflict).toBeDefined();
      expect(responses.Forbidden).toBeDefined();
      expect(responses.InternalServerError).toBeDefined();
    });
  });
});
