import { useEffect, useCallback } from 'react';
import { monitoring } from '@/lib/monitoring';

export function useMonitoring() {
  // Track client-side errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      monitoring.trackError(event.error, {
        source: 'client',
        type: 'runtime',
        message: event.message,
        filename: event.filename,
        lineNumber: event.lineno,
        columnNumber: event.colno,
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      monitoring.trackError(event.reason, {
        source: 'client',
        type: 'unhandledRejection',
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Track performance metrics
  useEffect(() => {
    if ('performance' in window) {
      // Track page load performance
      window.addEventListener('load', () => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          monitoring.trackMetric({
            name: 'page_load',
            value: navigation.loadEventEnd - navigation.startTime,
            unit: 'ms',
            tags: {
              page: window.location.pathname,
              type: navigation.type,
            },
            timestamp: new Date().toISOString(),
          });
        }
      });

      // Track largest contentful paint
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        monitoring.trackMetric({
          name: 'largest_contentful_paint',
          value: lastEntry.startTime,
          unit: 'ms',
          tags: {
            page: window.location.pathname,
          },
          timestamp: new Date().toISOString(),
        });
      });

      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    }
  }, []);

  // Track client-side navigation
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      monitoring.logEvent({
        type: 'performance',
        severity: 'info',
        message: 'Client Navigation',
        metadata: {
          from: window.location.pathname,
          to: url,
        },
        timestamp: new Date().toISOString(),
      });
    };

    window.addEventListener('popstate', () => {
      handleRouteChange(window.location.pathname);
    });

    return () => {
      window.removeEventListener('popstate', () => {
        handleRouteChange(window.location.pathname);
      });
    };
  }, []);

  // Utility function to track component render time
  const trackRenderTime = useCallback((componentName: string, startTime: number) => {
    const renderTime = performance.now() - startTime;
    monitoring.trackMetric({
      name: 'component_render_time',
      value: renderTime,
      unit: 'ms',
      tags: {
        component: componentName,
        page: window.location.pathname,
      },
      timestamp: new Date().toISOString(),
    });
  }, []);

  // Utility function to track user interactions
  const trackInteraction = useCallback((action: string, details: Record<string, any> = {}) => {
    monitoring.logEvent({
      type: 'business',
      severity: 'info',
      message: `User Interaction: ${action}`,
      metadata: {
        ...details,
        page: window.location.pathname,
      },
      timestamp: new Date().toISOString(),
    });
  }, []);

  return {
    trackRenderTime,
    trackInteraction,
  };
}

export * from './withPerformanceTracking';