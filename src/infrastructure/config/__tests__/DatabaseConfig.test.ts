import { loadDatabaseConfig, validateDatabaseConfig } from '../DatabaseConfig.js';

describe('DatabaseConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('loadDatabaseConfig', () => {
    it('should load database configuration from environment variables', () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb';
      process.env.DATABASE_LOG_QUERIES = 'true';
      process.env.DATABASE_CONNECTION_TIMEOUT = '10000';
      process.env.DATABASE_POOL_MIN = '5';
      process.env.DATABASE_POOL_MAX = '20';

      const config = loadDatabaseConfig();

      expect(config).toEqual({
        url: 'postgresql://user:pass@localhost:5432/testdb',
        logQueries: true,
        connectionTimeout: 10000,
        poolSize: {
          min: 5,
          max: 20,
        },
      });
    });

    it('should use default values when optional environment variables are not set', () => {
      process.env.DATABASE_URL = 'file:./test.db';

      const config = loadDatabaseConfig();

      expect(config).toEqual({
        url: 'file:./test.db',
        logQueries: false,
        connectionTimeout: 5000,
        poolSize: {
          min: 2,
          max: 10,
        },
      });
    });

    it('should throw error when DATABASE_URL is not set', () => {
      delete process.env.DATABASE_URL;

      expect(() => loadDatabaseConfig()).toThrow('DATABASE_URL environment variable is required');
    });

    it('should handle SQLite database URLs', () => {
      process.env.DATABASE_URL = 'file:./dev.db';

      const config = loadDatabaseConfig();

      expect(config.url).toBe('file:./dev.db');
    });

    it('should handle PostgreSQL database URLs', () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';

      const config = loadDatabaseConfig();

      expect(config.url).toBe('postgresql://user:pass@localhost:5432/db');
    });

    it('should handle MySQL database URLs', () => {
      process.env.DATABASE_URL = 'mysql://user:pass@localhost:3306/db';

      const config = loadDatabaseConfig();

      expect(config.url).toBe('mysql://user:pass@localhost:3306/db');
    });
  });

  describe('validateDatabaseConfig', () => {
    it('should validate a valid configuration', () => {
      const config = {
        url: 'postgresql://user:pass@localhost:5432/testdb',
        logQueries: true,
        connectionTimeout: 5000,
        poolSize: {
          min: 2,
          max: 10,
        },
      };

      expect(() => validateDatabaseConfig(config)).not.toThrow();
    });

    it('should throw error when url is empty', () => {
      const config = {
        url: '',
        logQueries: false,
        connectionTimeout: 5000,
        poolSize: {
          min: 2,
          max: 10,
        },
      };

      expect(() => validateDatabaseConfig(config)).toThrow('Database URL is required');
    });

    it('should throw error when connection timeout is negative', () => {
      const config = {
        url: 'file:./test.db',
        logQueries: false,
        connectionTimeout: -1000,
        poolSize: {
          min: 2,
          max: 10,
        },
      };

      expect(() => validateDatabaseConfig(config)).toThrow(
        'Database connection timeout must be positive',
      );
    });

    it('should throw error when pool min is negative', () => {
      const config = {
        url: 'file:./test.db',
        logQueries: false,
        connectionTimeout: 5000,
        poolSize: {
          min: -1,
          max: 10,
        },
      };

      expect(() => validateDatabaseConfig(config)).toThrow(
        'Database pool minimum size must be positive',
      );
    });

    it('should throw error when pool max is less than min', () => {
      const config = {
        url: 'file:./test.db',
        logQueries: false,
        connectionTimeout: 5000,
        poolSize: {
          min: 10,
          max: 5,
        },
      };

      expect(() => validateDatabaseConfig(config)).toThrow(
        'Database pool maximum size must be greater than or equal to minimum size',
      );
    });

    it('should throw error when pool max exceeds 100', () => {
      const config = {
        url: 'file:./test.db',
        logQueries: false,
        connectionTimeout: 5000,
        poolSize: {
          min: 2,
          max: 150,
        },
      };

      expect(() => validateDatabaseConfig(config)).toThrow(
        'Database pool maximum size should not exceed 100',
      );
    });

    it('should allow pool max of exactly 100', () => {
      const config = {
        url: 'file:./test.db',
        logQueries: false,
        connectionTimeout: 5000,
        poolSize: {
          min: 2,
          max: 100,
        },
      };

      expect(() => validateDatabaseConfig(config)).not.toThrow();
    });
  });
});
