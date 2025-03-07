import { Page, TestInfo } from '@playwright/test';

export interface PerformanceMetrics {
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  timeToInteractive: number;
  totalBlockingTime: number;
  cumulativeLayoutShift: number;
  memoryUsage: number;
}

export async function collectPerformanceMetrics(page: Page): Promise<PerformanceMetrics> {
  // Get core web vitals and performance metrics
  const metrics = await page.evaluate(() => ({
    // Navigation Timing API metrics
    ...performance.getEntriesByType('navigation')[0].toJSON(),
    // Paint Timing API metrics
    ...Object.fromEntries(
      performance.getEntriesByType('paint').map(entry => [entry.name, entry.startTime])
    ),
    // Layout Shift API
    cumulativeLayoutShift: performance.getEntriesByName('layout-shift', 'element').reduce(
      (sum, entry: any) => sum + entry.value,
      0
    ),
    // Memory API (Chrome only)
    ...(('memory' in performance) ? {
      memoryUsage: (performance as any).memory?.usedJSHeapSize / (1024 * 1024) || 0 // Convert to MB
    } : { memoryUsage: 0 }),
  }));

  return {
    firstContentfulPaint: metrics['first-contentful-paint'] || 0,
    largestContentfulPaint: metrics['largest-contentful-paint'] || 0,
    timeToInteractive: metrics.domInteractive || 0,
    totalBlockingTime: metrics.domContentLoadedEventEnd - metrics.domContentLoadedEventStart || 0,
    cumulativeLayoutShift: metrics.cumulativeLayoutShift || 0,
    memoryUsage: metrics.memoryUsage || 0,
  };
}

export async function assertPerformanceMetrics(
  metrics: PerformanceMetrics,
  thresholds: Partial<PerformanceMetrics>
) {
  Object.entries(thresholds).forEach(([metric, threshold]) => {
    const value = metrics[metric as keyof PerformanceMetrics];
    if (value > threshold!) {
      throw new Error(
        `Performance threshold exceeded for ${metric}: ${value} > ${threshold}`
      );
    }
  });
}

export async function measurePageLoad(
  page: Page,
  testInfo: TestInfo,
  url: string,
  thresholds?: Partial<PerformanceMetrics>
) {
  // Clear cache and metrics before measurement
  await page.context().clearCookies();
  
  // Enable performance metrics collection via CDP (Chromium only)
  if (page.context().browser()?.browserType().name() === 'chromium') {
    const client = await page.context().newCDPSession(page);
    await client.send('Performance.enable');
    // Reset metrics by disabling and re-enabling
    await client.send('Performance.disable');
    await client.send('Performance.enable');
  }

  // Navigate and collect metrics
  const startTime = Date.now();
  await page.goto(url);
  const metrics = await collectPerformanceMetrics(page);
  const loadTime = Date.now() - startTime;

  // Attach metrics to test results
  await testInfo.attach('performance-metrics', {
    body: JSON.stringify({ ...metrics, totalLoadTime: loadTime }, null, 2),
    contentType: 'application/json'
  });

  // Assert against thresholds if provided
  if (thresholds) {
    await assertPerformanceMetrics(metrics, thresholds);
  }

  return metrics;
}