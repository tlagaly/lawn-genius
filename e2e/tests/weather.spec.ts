import { test, expect } from '@playwright/test';
import { test as authTest } from '../fixtures/auth.fixture';
import { pageUtils, errorUtils } from '../utils/test-utils';

test.describe('Weather Integration', () => {
  authTest('should display weather alerts on dashboard', async ({ page, testUser, createTestUser, loginUser }) => {
    await createTestUser();
    await loginUser(testUser);

    await page.goto('/dashboard');
    await pageUtils.waitForLoadState(page);

    // Verify weather alert section exists
    await expect(page.locator('[data-testid="weather-alerts"]')).toBeVisible();

    // Check alert components
    const alertSection = page.locator('[data-testid="weather-alerts"]');
    await expect(alertSection.locator('text=Weather Alerts')).toBeVisible();
    await expect(alertSection.locator('[data-testid="alert-list"]')).toBeVisible();
  });

  authTest('should handle weather alert notifications', async ({ page, testUser, createTestUser, loginUser }) => {
    await createTestUser();
    await loginUser(testUser);

    // Navigate to notification preferences
    await page.goto('/dashboard/settings');
    await pageUtils.waitForLoadState(page);

    // Enable weather notifications
    await page.click('text=Notification Preferences');
    await page.click('label:has-text("Weather Alerts")');
    await page.click('button:text("Save Preferences")');
    await pageUtils.waitForToast(page, 'Preferences updated successfully');

    // Navigate to dashboard
    await page.goto('/dashboard');

    // Mock a new weather alert
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('weather-alert', {
        detail: {
          type: 'severe',
          message: 'Test Severe Weather Alert',
          timestamp: new Date().toISOString(),
        }
      }));
    });

    // Verify alert appears in list
    await expect(page.locator('text=Test Severe Weather Alert')).toBeVisible();
    
    // Verify notification was triggered
    await expect(page.locator('[role="alert"]')).toBeVisible();
    await expect(page.locator('text=New weather alert')).toBeVisible();
  });

  authTest('should test weather-based schedule adjustments', async ({ page, testUser, createTestUser, loginUser }) => {
    await createTestUser();
    await loginUser(testUser);

    // Create a treatment schedule
    await page.goto('/dashboard/schedule');
    await page.click('button:text("New Treatment")');
    
    const treatmentName = `Weather Test ${Date.now()}`;
    await pageUtils.fillForm(page, {
      'name': treatmentName,
      'date': '2025-04-01',
      'type': 'Fertilization',
      'weatherSensitive': 'true',
    });
    await page.click('button[type="submit"]');

    // Mock severe weather forecast
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('weather-forecast', {
        detail: {
          date: '2025-04-01',
          conditions: 'severe_rain',
          probability: 90,
        }
      }));
    });

    // Verify weather warning appears
    await expect(page.locator('text=Weather Warning')).toBeVisible();
    await expect(page.locator('text=Treatment may need rescheduling')).toBeVisible();

    // Test rescheduling flow
    await page.click('button:text("Suggest New Date")');
    await expect(page.locator('text=Suggested Dates')).toBeVisible();

    // Select suggested date
    await page.click('button:text("2025-04-03")');
    await page.click('button:text("Confirm Reschedule")');

    // Verify rescheduling success
    await pageUtils.waitForToast(page, 'Treatment rescheduled successfully');
    await expect(page.locator(`text=${treatmentName}`)).toBeVisible();
  });

  authTest('should test ML prediction functionality', async ({ page, testUser, createTestUser, loginUser }) => {
    await createTestUser();
    await loginUser(testUser);

    // Create a lawn profile with ML predictions enabled
    await page.goto('/dashboard/lawn/new');
    const lawnName = `ML Test Lawn ${Date.now()}`;
    await pageUtils.fillForm(page, {
      'name': lawnName,
      'size': '1000',
      'grassType': 'Bermuda',
      'sunExposure': 'Full Sun',
      'soilType': 'Clay',
      'enableMLPredictions': 'true',
    });
    await page.click('button[type="submit"]');

    // Navigate to lawn details
    await page.click(`[data-testid="view-lawn-${lawnName}"]`);
    await pageUtils.waitForLoadState(page);

    // Verify ML prediction section exists
    await expect(page.locator('text=Growth Predictions')).toBeVisible();
    await expect(page.locator('[data-testid="ml-predictions"]')).toBeVisible();

    // Test prediction updates
    await page.click('button:text("Update Predictions")');
    await pageUtils.waitForLoadState(page);

    // Verify prediction data
    await expect(page.locator('text=Next Mowing Date')).toBeVisible();
    await expect(page.locator('text=Growth Rate')).toBeVisible();
    await expect(page.locator('text=Confidence Score')).toBeVisible();
  });

  authTest('should handle weather data loading errors', async ({ page, testUser, createTestUser, loginUser }) => {
    await createTestUser();
    await loginUser(testUser);

    // Simulate weather API failure
    await errorUtils.simulateNetworkError(page, '**/api/weather/**');

    await page.goto('/dashboard');
    await pageUtils.waitForLoadState(page);

    // Verify error state
    await expect(page.locator('text=Weather data unavailable')).toBeVisible();
    await expect(page.locator('button:text("Retry")')).toBeVisible();

    // Remove the network error simulation
    await page.unroute('**/api/weather/**');

    // Test retry functionality
    await page.click('button:text("Retry")');

    // Verify data loads after retry
    await expect(page.locator('text=Weather data unavailable')).not.toBeVisible();
    await expect(page.locator('[data-testid="weather-alerts"]')).toBeVisible();
  });

  authTest('should test weather data refresh', async ({ page, testUser, createTestUser, loginUser }) => {
    await createTestUser();
    await loginUser(testUser);

    await page.goto('/dashboard');

    // Mock initial weather data
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('weather-update', {
        detail: {
          temperature: 75,
          conditions: 'sunny',
          timestamp: new Date().toISOString(),
        }
      }));
    });

    // Verify initial data
    await expect(page.locator('text=75°')).toBeVisible();
    await expect(page.locator('text=Sunny')).toBeVisible();

    // Simulate data refresh
    await page.click('button[aria-label="Refresh weather data"]');
    
    // Mock updated data
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('weather-update', {
        detail: {
          temperature: 78,
          conditions: 'partly cloudy',
          timestamp: new Date().toISOString(),
        }
      }));
    });

    // Verify updated data
    await expect(page.locator('text=78°')).toBeVisible();
    await expect(page.locator('text=Partly Cloudy')).toBeVisible();
    await expect(page.locator('text=Updated just now')).toBeVisible();
  });
});