import { z } from 'zod';
import configData from '../../../config/deployment.json';

// Zod schemas for type validation
const DatabaseConfigSchema = z.object({
  poolSize: z.number(),
  ssl: z.boolean()
});

const FeaturesConfigSchema = z.object({
  debugMode: z.boolean(),
  mockServices: z.boolean()
});

const EnvironmentConfigSchema = z.object({
  url: z.string().url(),
  database: DatabaseConfigSchema,
  features: FeaturesConfigSchema
});

const DeploymentSettingsSchema = z.object({
  requiredChecks: z.array(z.string()),
  autoDeployBranches: z.array(z.string()),
  deploymentDelay: z.string(),
  rollbackEnabled: z.boolean(),
  requiredApprovals: z.number().optional()
});

const LoggingLevelSchema = z.enum(['debug', 'info', 'warn', 'error']);

const MonitoringConfigSchema = z.object({
  errorTracking: z.boolean(),
  performanceMonitoring: z.boolean(),
  loggingLevel: z.record(LoggingLevelSchema),
  alerts: z.object({
    errorThreshold: z.number(),
    responseTimeThreshold: z.number(),
    uptimeCheck: z.string()
  })
});

const RateLimitingConfigSchema = z.object({
  enabled: z.boolean(),
  maxRequests: z.number().optional(),
  timeWindow: z.number().optional()
});

const SecurityHeadersConfigSchema = z.object({
  strictTransportSecurity: z.boolean(),
  contentSecurityPolicy: z.boolean().optional(),
  xFrameOptions: z.string().optional()
});

const SecurityConfigSchema = z.object({
  rateLimiting: z.record(RateLimitingConfigSchema),
  headers: z.record(SecurityHeadersConfigSchema)
});

const DeploymentConfigSchema = z.object({
  environments: z.record(EnvironmentConfigSchema),
  deployment: z.record(DeploymentSettingsSchema),
  monitoring: MonitoringConfigSchema,
  security: SecurityConfigSchema
});

// Type definitions based on schemas
export type EnvironmentConfig = z.infer<typeof EnvironmentConfigSchema>;
export type DeploymentSettings = z.infer<typeof DeploymentSettingsSchema>;
export type MonitoringConfig = z.infer<typeof MonitoringConfigSchema>;
export type SecurityConfig = z.infer<typeof SecurityConfigSchema>;

export class DeploymentConfigManager {
  private static instance: DeploymentConfigManager;
  private config: z.infer<typeof DeploymentConfigSchema>;
  private currentEnv: string;

  private constructor() {
    this.config = DeploymentConfigSchema.parse(configData);
    this.currentEnv = process.env.NODE_ENV || 'development';
  }

  public static getInstance(): DeploymentConfigManager {
    if (!DeploymentConfigManager.instance) {
      DeploymentConfigManager.instance = new DeploymentConfigManager();
    }
    return DeploymentConfigManager.instance;
  }

  public getCurrentEnvironment(): string {
    return this.currentEnv;
  }

  public getEnvironmentConfig(): EnvironmentConfig {
    return this.config.environments[this.currentEnv];
  }

  public getDeploymentSettings(): DeploymentSettings {
    return this.config.deployment[this.currentEnv];
  }

  public getMonitoringConfig(): MonitoringConfig {
    return this.config.monitoring;
  }

  public getSecurityConfig(): SecurityConfig {
    return this.config.security;
  }

  public getLoggingLevel(): string {
    return this.config.monitoring.loggingLevel[this.currentEnv];
  }

  public getRateLimitingConfig() {
    return this.config.security.rateLimiting[this.currentEnv];
  }

  public getSecurityHeaders() {
    return this.config.security.headers[this.currentEnv];
  }

  public validateEnvironment(): boolean {
    try {
      const envConfig = this.getEnvironmentConfig();
      const deploySettings = this.getDeploymentSettings();
      return !!(envConfig && deploySettings);
    } catch (error) {
      console.error('Environment validation failed:', error);
      return false;
    }
  }
}

// Export a singleton instance
export const configManager = DeploymentConfigManager.getInstance();

// Helper function to ensure environment is properly configured
export function validateDeploymentConfig() {
  const config = DeploymentConfigManager.getInstance();
  if (!config.validateEnvironment()) {
    throw new Error(`Invalid deployment configuration for environment: ${config.getCurrentEnvironment()}`);
  }
}