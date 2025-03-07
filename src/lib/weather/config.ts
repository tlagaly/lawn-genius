import { WeatherMonitorConfig } from './types';

const MIN_CHECK_INTERVAL = 15; // 15 minutes
const MAX_CHECK_INTERVAL = 360; // 6 hours
const MIN_ALERT_THRESHOLD = 1;
const MAX_ALERT_THRESHOLD = 5;
const MIN_FORECAST_HOURS = 24; // 1 day
const MAX_FORECAST_HOURS = 168; // 7 days
const MIN_BATCH_WINDOW = 5; // 5 minutes
const MAX_BATCH_WINDOW = 60; // 1 hour
const MIN_ALERTS_PER_BATCH = 1;
const MAX_ALERTS_PER_BATCH = 20;
const MIN_ALERT_PRIORITY = 1;
const MAX_ALERT_PRIORITY = 5;

export function validateConfig(config: WeatherMonitorConfig): void {
  // Check interval validation
  if (config.checkInterval <= 0) {
    throw new Error('Check interval must be positive');
  }
  if (config.checkInterval < MIN_CHECK_INTERVAL) {
    throw new Error('Check interval must be at least 15 minutes');
  }
  if (config.checkInterval > MAX_CHECK_INTERVAL) {
    throw new Error('Check interval must not exceed 6 hours');
  }

  // Alert threshold validation
  if (config.alertThreshold < MIN_ALERT_THRESHOLD || config.alertThreshold > MAX_ALERT_THRESHOLD) {
    throw new Error('Alert threshold must be between 1 and 5');
  }

  // Forecast hours validation
  if (config.forecastHours < MIN_FORECAST_HOURS) {
    throw new Error('Forecast hours must be at least 24');
  }
  if (config.forecastHours > MAX_FORECAST_HOURS) {
    throw new Error('Forecast hours must not exceed 168');
  }

  // Batch window validation
  if (config.batchWindow < MIN_BATCH_WINDOW) {
    throw new Error('Batch window must be at least 5 minutes');
  }
  if (config.batchWindow > MAX_BATCH_WINDOW) {
    throw new Error('Batch window must not exceed 60 minutes');
  }

  // Max alerts per batch validation
  if (config.maxAlertsPerBatch < MIN_ALERTS_PER_BATCH) {
    throw new Error('Max alerts per batch must be at least 1');
  }
  if (config.maxAlertsPerBatch > MAX_ALERTS_PER_BATCH) {
    throw new Error('Max alerts per batch must not exceed 20');
  }

  // Min alert priority validation
  if (config.minAlertPriority < MIN_ALERT_PRIORITY || config.minAlertPriority > MAX_ALERT_PRIORITY) {
    throw new Error('Min alert priority must be between 1 and 5');
  }
}

export function createDefaultConfig(overrides?: Partial<WeatherMonitorConfig>): WeatherMonitorConfig {
  const defaultConfig: WeatherMonitorConfig = {
    checkInterval: 30, // 30 minutes
    alertThreshold: 3, // Alert when weather score is below 3
    forecastHours: 48, // Look ahead 48 hours
    batchWindow: 15, // 15 minutes
    maxAlertsPerBatch: 10, // Maximum 10 alerts per batch
    minAlertPriority: 2 // Minimum priority to generate alert
  };

  if (!overrides) {
    return defaultConfig;
  }

  const config = {
    ...defaultConfig,
    ...overrides,
  };

  validateConfig(config);
  return config;
}

export const DEFAULT_CONFIG = createDefaultConfig();

export function isValidCheckInterval(minutes: number): boolean {
  return minutes >= MIN_CHECK_INTERVAL && minutes <= MAX_CHECK_INTERVAL;
}

export function isValidAlertThreshold(threshold: number): boolean {
  return threshold >= MIN_ALERT_THRESHOLD && threshold <= MAX_ALERT_THRESHOLD;
}

export function isValidForecastHours(hours: number): boolean {
  return hours >= MIN_FORECAST_HOURS && hours <= MAX_FORECAST_HOURS;
}

export function isValidBatchWindow(minutes: number): boolean {
  return minutes >= MIN_BATCH_WINDOW && minutes <= MAX_BATCH_WINDOW;
}

export function isValidMaxAlertsPerBatch(count: number): boolean {
  return count >= MIN_ALERTS_PER_BATCH && count <= MAX_ALERTS_PER_BATCH;
}

export function isValidAlertPriority(priority: number): boolean {
  return priority >= MIN_ALERT_PRIORITY && priority <= MAX_ALERT_PRIORITY;
}