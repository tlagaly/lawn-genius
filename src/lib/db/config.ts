import { z } from 'zod';

// Database configuration schema
const DatabaseConfigSchema = z.object({
  url: z.string().url(),
  directUrl: z.string().url(),
  poolMin: z.coerce.number().int().min(1).default(2),
  poolMax: z.coerce.number().int().min(5).default(10),
  poolTimeout: z.coerce.number().int().min(5000).default(30000),
  idleTimeout: z.coerce.number().int().min(10000).default(60000),
  ssl: z.boolean().default(false),
  rejectUnauthorized: z.boolean().default(true),
  relationMode: z.enum(['prisma', 'foreignKeys']).default('prisma'),
});

export type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>;

// Environment-specific configurations
const envConfigs = {
  development: {
    poolMin: 2,
    poolMax: 10,
    ssl: false,
  },
  staging: {
    poolMin: 2,
    poolMax: 15,
    ssl: true,
  },
  production: {
    poolMin: 5,
    poolMax: 20,
    ssl: true,
  },
} as const;

/**
 * Validates and loads database configuration for the current environment
 */
export function loadDatabaseConfig(): DatabaseConfig {
  const env = process.env.NODE_ENV || 'development';
  const envConfig = envConfigs[env as keyof typeof envConfigs];

  try {
    const config = DatabaseConfigSchema.parse({
      url: process.env.DATABASE_URL,
      directUrl: process.env.DIRECT_DATABASE_URL,
      poolMin: process.env.DATABASE_POOL_MIN || envConfig.poolMin,
      poolMax: process.env.DATABASE_POOL_MAX || envConfig.poolMax,
      poolTimeout: process.env.DATABASE_POOL_TIMEOUT,
      idleTimeout: process.env.DATABASE_POOL_IDLE_TIMEOUT,
      ssl: process.env.DATABASE_SSL_ENABLED === 'true' || envConfig.ssl,
      rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'true',
      relationMode: process.env.DATABASE_RELATION_MODE,
    });

    validatePoolConfiguration(config);
    return config;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Database configuration error: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

/**
 * Validates pool configuration to ensure sensible values
 */
function validatePoolConfiguration(config: DatabaseConfig) {
  if (config.poolMin > config.poolMax) {
    throw new Error('Minimum pool size cannot be greater than maximum pool size');
  }

  if (config.idleTimeout < config.poolTimeout) {
    throw new Error('Idle timeout should be greater than pool timeout');
  }

  // Additional environment-specific validations
  const env = process.env.NODE_ENV || 'development';
  if (env === 'production') {
    if (!config.ssl) {
      throw new Error('SSL must be enabled in production');
    }
    if (config.poolMax < 10) {
      throw new Error('Production environment requires a minimum pool size of 10');
    }
  }
}

/**
 * Gets the connection URL with proper SSL configuration
 */
export function getConnectionUrl(config: DatabaseConfig): string {
  const baseUrl = config.url;
  if (!config.ssl) {
    return baseUrl;
  }

  const url = new URL(baseUrl);
  url.searchParams.set('sslmode', 'verify-full');
  if (!config.rejectUnauthorized) {
    url.searchParams.set('sslmode', 'require');
  }

  return url.toString();
}

/**
 * Gets the pool configuration for Prisma
 */
export function getPoolConfig(config: DatabaseConfig) {
  return {
    min: config.poolMin,
    max: config.poolMax,
    idleTimeout: config.idleTimeout,
    timeout: config.poolTimeout,
  };
}