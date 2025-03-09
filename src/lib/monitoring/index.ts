import { configManager } from '../config/deployment';

// Types for monitoring events
export type MonitoringEvent = {
  type: 'error' | 'performance' | 'security' | 'business';
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  metadata: Record<string, any>;
  timestamp: string;
};

// Types for performance metrics
export type PerformanceMetric = {
  name: string;
  value: number;
  unit: string;
  tags: Record<string, string>;
  timestamp: string;
};

class MonitoringService {
  private static instance: MonitoringService;
  private readonly environment: string;
  private readonly config: any;

  private constructor() {
    this.environment = process.env.NODE_ENV || 'development';
    this.config = configManager.getMonitoringConfig();
  }

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  // Log an event to the monitoring system
  public async logEvent(event: MonitoringEvent): Promise<void> {
    if (this.shouldLog(event.severity)) {
      const enrichedEvent = this.enrichEvent(event);
      await this.sendToMonitoring(enrichedEvent);
    }
  }

  // Track a performance metric
  public async trackMetric(metric: PerformanceMetric): Promise<void> {
    if (this.config.performanceMonitoring) {
      const enrichedMetric = this.enrichMetric(metric);
      await this.sendMetricToMonitoring(enrichedMetric);
    }
  }

  // Track API response times
  public async trackApiResponse(path: string, duration: number): Promise<void> {
    const metric: PerformanceMetric = {
      name: 'api_response_time',
      value: duration,
      unit: 'ms',
      tags: { path },
      timestamp: new Date().toISOString(),
    };
    await this.trackMetric(metric);

    // Check if we need to alert on slow responses
    if (duration > this.config.alerts.responseTimeThreshold) {
      await this.logEvent({
        type: 'performance',
        severity: 'warning',
        message: `Slow API response detected for ${path}`,
        metadata: { duration, threshold: this.config.alerts.responseTimeThreshold },
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Track error rates
  public async trackError(error: Error, context: Record<string, any> = {}): Promise<void> {
    await this.logEvent({
      type: 'error',
      severity: 'error',
      message: error.message,
      metadata: {
        ...context,
        stack: error.stack,
        name: error.name,
      },
      timestamp: new Date().toISOString(),
    });
  }

  // Track security events
  public async trackSecurityEvent(
    event: string,
    context: Record<string, any> = {},
    severity: MonitoringEvent['severity'] = 'warning'
  ): Promise<void> {
    await this.logEvent({
      type: 'security',
      severity,
      message: event,
      metadata: context,
      timestamp: new Date().toISOString(),
    });
  }

  private shouldLog(severity: MonitoringEvent['severity']): boolean {
    const levels = {
      info: 0,
      warning: 1,
      error: 2,
      critical: 3,
    };

    const configLevel = this.config.loggingLevel[this.environment];
    return levels[severity] >= levels[configLevel as keyof typeof levels];
  }

  private enrichEvent(event: MonitoringEvent): MonitoringEvent {
    return {
      ...event,
      metadata: {
        ...event.metadata,
        environment: this.environment,
        version: process.env.NEXT_PUBLIC_VERSION,
        nodeEnv: process.env.NODE_ENV,
      },
    };
  }

  private enrichMetric(metric: PerformanceMetric): PerformanceMetric {
    return {
      ...metric,
      tags: {
        ...metric.tags,
        environment: this.environment,
        version: process.env.NEXT_PUBLIC_VERSION || 'unknown',
      },
    };
  }

  private async sendToMonitoring(event: MonitoringEvent): Promise<void> {
    // In development, log to console
    if (this.environment === 'development') {
      console.log('[Monitoring]', event);
      return;
    }

    // In production/staging, send to monitoring service
    try {
      // TODO: Replace with actual monitoring service integration
      // Example: await fetch('/api/monitoring/events', {
      //   method: 'POST',
      //   body: JSON.stringify(event),
      // });
      console.log('[Monitoring] Event sent:', event);
    } catch (error) {
      console.error('Failed to send event to monitoring:', error);
    }
  }

  private async sendMetricToMonitoring(metric: PerformanceMetric): Promise<void> {
    // In development, log to console
    if (this.environment === 'development') {
      console.log('[Metrics]', metric);
      return;
    }

    // In production/staging, send to monitoring service
    try {
      // TODO: Replace with actual metrics service integration
      // Example: await fetch('/api/monitoring/metrics', {
      //   method: 'POST',
      //   body: JSON.stringify(metric),
      // });
      console.log('[Metrics] Metric sent:', metric);
    } catch (error) {
      console.error('Failed to send metric to monitoring:', error);
    }
  }
}

// Export singleton instance
export const monitoring = MonitoringService.getInstance();

// Export middleware for API route monitoring
export function withMonitoring(handler: Function) {
  return async (...args: any[]) => {
    const start = Date.now();
    try {
      const result = await handler(...args);
      const duration = Date.now() - start;
      await monitoring.trackApiResponse(args[0]?.url || 'unknown', duration);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      await monitoring.trackError(error as Error, { duration });
      throw error;
    }
  };
}