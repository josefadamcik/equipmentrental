/**
 * Database Configuration
 * Handles database connection settings and Prisma-specific configuration
 */

export interface DatabaseConfig {
  url: string;
  logQueries: boolean;
  connectionTimeout: number;
  poolSize: {
    min: number;
    max: number;
  };
}

/**
 * Load database configuration from environment variables
 */
export function loadDatabaseConfig(): DatabaseConfig {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  return {
    url,
    logQueries: process.env.DATABASE_LOG_QUERIES === 'true',
    connectionTimeout: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || '5000', 10),
    poolSize: {
      min: parseInt(process.env.DATABASE_POOL_MIN || '2', 10),
      max: parseInt(process.env.DATABASE_POOL_MAX || '10', 10),
    },
  };
}

/**
 * Validate database configuration
 */
export function validateDatabaseConfig(config: DatabaseConfig): void {
  if (!config.url) {
    throw new Error('Database URL is required');
  }

  if (config.connectionTimeout < 0) {
    throw new Error('Database connection timeout must be positive');
  }

  if (config.poolSize.min < 0) {
    throw new Error('Database pool minimum size must be positive');
  }

  if (config.poolSize.max < config.poolSize.min) {
    throw new Error('Database pool maximum size must be greater than or equal to minimum size');
  }

  if (config.poolSize.max > 100) {
    throw new Error('Database pool maximum size should not exceed 100');
  }
}
