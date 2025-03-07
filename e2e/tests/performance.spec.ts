import { test, expect } from '@playwright/test';
import { measurePageLoad, PerformanceMetrics } from '../utils/performance-utils';

// Performance thresholds (in milliseconds)
const PERFORMANCE_THRESHOLDS: Partial<PerformanceMetrics> = {
  firstContentfulPaint: 1000,    // 1s
  largestContentfulPaint: 2500,  // 2.5s
  timeToInteractive: 3500,       // 3.5s
  totalBlockingTime: 300,        // 300ms
  cumulativeLayoutShift: 0.1,    // Core Web Vitals threshold
  memoryUsage: 50,              // 50MB
};

test.describe('Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure consistent test conditions
    await page.context().clearCookies();
  });

  test('Home page load performance', async ({ page }, testInfo) => {
    const metrics = await measurePageLoad(
      page,
      testInfo,
      '/',
      PERFORMANCE_THRESHOLDS
    );
    
    // Log metrics for baseline tracking
    console.log('Home page performance metrics:', metrics);
  });

  test('Login page load performance', async ({ page }, testInfo) => {
    const metrics = await measurePageLoad(
      page,
      testInfo,
      '/auth/login',
      PERFORMANCE_THRESHOLDS
    );
    
    console.log('Login page performance metrics:', metrics);
  });

  test('Dashboard load performance', async ({ page }, testInfo) => {
    // Login first
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Measure dashboard performance
    const metrics = await measurePageLoad(
      page,
      testInfo,
      '/dashboard',
      {
        ...PERFORMANCE_THRESHOLDS,
        // Allow slightly longer load time for dashboard due to data fetching
        timeToInteractive: 4000,
        totalBlockingTime: 400,
      }
    );
    
    console.log('Dashboard performance metrics:', metrics);
  });

  test('Weather alerts component performance', async ({ page }, testInfo) => {
    // Login and navigate to dashboard
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Start performance measurement
    const startTime = Date.now();
    
    // Trigger weather alerts update
    await page.click('[data-testid="refresh-weather"]');
    
    // Wait for weather data
    await page.waitForSelector('[data-testid="weather-alert"]');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(2000); // Weather update should be under 2s
    
    // Collect general metrics
    const metrics = await measurePageLoad(
      page,
      testInfo,
      '/dashboard',
      PERFORMANCE_THRESHOLDS
    );
    
    console.log('Weather alerts performance metrics:', {
      ...metrics,
      weatherUpdateTime: loadTime,
    });
  });
});