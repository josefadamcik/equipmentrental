/**
 * Server Configuration
 * Handles HTTP server settings including port, host, and CORS
 */

export interface CorsConfig {
  enabled: boolean;
  origin: string | string[];
  credentials: boolean;
}

export interface ServerConfig {
  port: number;
  host: string;
  nodeEnv: 'development' | 'production' | 'test';
  cors: CorsConfig;
  trustProxy: boolean;
  requestTimeout: number;
  bodyLimit: string;
}

/**
 * Load server configuration from environment variables
 */
export function loadServerConfig(): ServerConfig {
  const nodeEnv = (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test';

  // Parse CORS origins
  let corsOrigin: string | string[] = '*';
  if (process.env.CORS_ORIGIN) {
    corsOrigin = process.env.CORS_ORIGIN.includes(',')
      ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
      : process.env.CORS_ORIGIN;
  }

  return {
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || '0.0.0.0',
    nodeEnv,
    cors: {
      enabled: process.env.CORS_ENABLED !== 'false',
      origin: corsOrigin,
      credentials: process.env.CORS_CREDENTIALS === 'true',
    },
    trustProxy: process.env.TRUST_PROXY === 'true',
    requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || '30000', 10),
    bodyLimit: process.env.BODY_LIMIT || '10mb',
  };
}

/**
 * Validate server configuration
 */
export function validateServerConfig(config: ServerConfig): void {
  if (config.port < 1 || config.port > 65535) {
    throw new Error('Server port must be between 1 and 65535');
  }

  if (!config.host) {
    throw new Error('Server host is required');
  }

  if (!['development', 'production', 'test'].includes(config.nodeEnv)) {
    throw new Error('NODE_ENV must be one of: development, production, test');
  }

  if (config.requestTimeout < 0) {
    throw new Error('Request timeout must be positive');
  }

  if (config.requestTimeout > 300000) {
    // 5 minutes
    throw new Error('Request timeout should not exceed 5 minutes (300000ms)');
  }
}
