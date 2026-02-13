import { loadServerConfig, validateServerConfig } from '../ServerConfig.js';

describe('ServerConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('loadServerConfig', () => {
    it('should load server configuration from environment variables', () => {
      process.env.PORT = '8080';
      process.env.HOST = '127.0.0.1';
      process.env.NODE_ENV = 'production';
      process.env.CORS_ENABLED = 'true';
      process.env.CORS_ORIGIN = 'https://example.com';
      process.env.CORS_CREDENTIALS = 'true';
      process.env.TRUST_PROXY = 'true';
      process.env.REQUEST_TIMEOUT = '60000';
      process.env.BODY_LIMIT = '50mb';

      const config = loadServerConfig();

      expect(config).toEqual({
        port: 8080,
        host: '127.0.0.1',
        nodeEnv: 'production',
        cors: {
          enabled: true,
          origin: 'https://example.com',
          credentials: true,
        },
        trustProxy: true,
        requestTimeout: 60000,
        bodyLimit: '50mb',
      });
    });

    it('should use default values when environment variables are not set', () => {
      // Remove NODE_ENV to test default behavior
      delete process.env.NODE_ENV;

      const config = loadServerConfig();

      expect(config).toEqual({
        port: 3000,
        host: '0.0.0.0',
        nodeEnv: 'development',
        cors: {
          enabled: true,
          origin: '*',
          credentials: false,
        },
        trustProxy: false,
        requestTimeout: 30000,
        bodyLimit: '10mb',
      });
    });

    it('should parse multiple CORS origins from comma-separated string', () => {
      process.env.CORS_ORIGIN = 'https://example.com,https://app.example.com,http://localhost:3000';

      const config = loadServerConfig();

      expect(config.cors.origin).toEqual([
        'https://example.com',
        'https://app.example.com',
        'http://localhost:3000',
      ]);
    });

    it('should handle single CORS origin', () => {
      process.env.CORS_ORIGIN = 'https://example.com';

      const config = loadServerConfig();

      expect(config.cors.origin).toBe('https://example.com');
    });

    it('should disable CORS when CORS_ENABLED is false', () => {
      process.env.CORS_ENABLED = 'false';

      const config = loadServerConfig();

      expect(config.cors.enabled).toBe(false);
    });

    it('should handle development environment', () => {
      process.env.NODE_ENV = 'development';

      const config = loadServerConfig();

      expect(config.nodeEnv).toBe('development');
    });

    it('should handle test environment', () => {
      process.env.NODE_ENV = 'test';

      const config = loadServerConfig();

      expect(config.nodeEnv).toBe('test');
    });

    it('should handle production environment', () => {
      process.env.NODE_ENV = 'production';

      const config = loadServerConfig();

      expect(config.nodeEnv).toBe('production');
    });
  });

  describe('validateServerConfig', () => {
    it('should validate a valid configuration', () => {
      const config = {
        port: 3000,
        host: '0.0.0.0',
        nodeEnv: 'development' as const,
        cors: {
          enabled: true,
          origin: '*',
          credentials: false,
        },
        trustProxy: false,
        requestTimeout: 30000,
        bodyLimit: '10mb',
      };

      expect(() => validateServerConfig(config)).not.toThrow();
    });

    it('should throw error when port is less than 1', () => {
      const config = {
        port: 0,
        host: '0.0.0.0',
        nodeEnv: 'development' as const,
        cors: {
          enabled: true,
          origin: '*',
          credentials: false,
        },
        trustProxy: false,
        requestTimeout: 30000,
        bodyLimit: '10mb',
      };

      expect(() => validateServerConfig(config)).toThrow('Server port must be between 1 and 65535');
    });

    it('should throw error when port is greater than 65535', () => {
      const config = {
        port: 70000,
        host: '0.0.0.0',
        nodeEnv: 'development' as const,
        cors: {
          enabled: true,
          origin: '*',
          credentials: false,
        },
        trustProxy: false,
        requestTimeout: 30000,
        bodyLimit: '10mb',
      };

      expect(() => validateServerConfig(config)).toThrow('Server port must be between 1 and 65535');
    });

    it('should throw error when host is empty', () => {
      const config = {
        port: 3000,
        host: '',
        nodeEnv: 'development' as const,
        cors: {
          enabled: true,
          origin: '*',
          credentials: false,
        },
        trustProxy: false,
        requestTimeout: 30000,
        bodyLimit: '10mb',
      };

      expect(() => validateServerConfig(config)).toThrow('Server host is required');
    });

    it('should throw error when NODE_ENV is invalid', () => {
      const config = {
        port: 3000,
        host: '0.0.0.0',
        nodeEnv: 'staging' as any,
        cors: {
          enabled: true,
          origin: '*',
          credentials: false,
        },
        trustProxy: false,
        requestTimeout: 30000,
        bodyLimit: '10mb',
      };

      expect(() => validateServerConfig(config)).toThrow(
        'NODE_ENV must be one of: development, production, test',
      );
    });

    it('should throw error when request timeout is negative', () => {
      const config = {
        port: 3000,
        host: '0.0.0.0',
        nodeEnv: 'development' as const,
        cors: {
          enabled: true,
          origin: '*',
          credentials: false,
        },
        trustProxy: false,
        requestTimeout: -1000,
        bodyLimit: '10mb',
      };

      expect(() => validateServerConfig(config)).toThrow('Request timeout must be positive');
    });

    it('should throw error when request timeout exceeds 5 minutes', () => {
      const config = {
        port: 3000,
        host: '0.0.0.0',
        nodeEnv: 'development' as const,
        cors: {
          enabled: true,
          origin: '*',
          credentials: false,
        },
        trustProxy: false,
        requestTimeout: 400000, // More than 5 minutes
        bodyLimit: '10mb',
      };

      expect(() => validateServerConfig(config)).toThrow(
        'Request timeout should not exceed 5 minutes (300000ms)',
      );
    });

    it('should allow request timeout of exactly 5 minutes', () => {
      const config = {
        port: 3000,
        host: '0.0.0.0',
        nodeEnv: 'development' as const,
        cors: {
          enabled: true,
          origin: '*',
          credentials: false,
        },
        trustProxy: false,
        requestTimeout: 300000, // Exactly 5 minutes
        bodyLimit: '10mb',
      };

      expect(() => validateServerConfig(config)).not.toThrow();
    });
  });
});
