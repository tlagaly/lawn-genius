import { test, expect } from '@playwright/test';
import { test as authTest } from '../fixtures/auth.fixture';
import { pageUtils } from '../utils/test-utils';

test.describe('Visual Regression', () => {
  // Configure viewport sizes for responsive testing
  const viewports = [
    { width: 1920, height: 1080, name: 'desktop' },
    { width: 1024, height: 768, name: 'tablet' },
    { width: 375, height: 812, name: 'mobile' },
  ];

  authTest('should maintain dashboard layout consistency', async ({ page, testUser, createTestUser, loginUser }) => {
    await createTestUser();
    await loginUser(testUser);

    // Test layout across different viewport sizes
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('/dashboard');
      await pageUtils.waitForLoadState(page);

      // Take screenshot of dashboard layout
      await expect(page).toHaveScreenshot(`dashboard-layout-${viewport.name}.png`);

      // Verify key elements are visible and properly positioned
      await expect(page.locator('[data-testid="dashboard-nav"]')).toBeVisible();
      await expect(page.locator('[data-testid="weather-alerts"]')).toBeVisible();
      await expect(page.locator('[data-testid="lawn-profiles"]')).toBeVisible();

      // Check responsive navigation
      if (viewport.width < 768) {
        // Mobile menu should be collapsed
        await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
        await expect(page.locator('[data-testid="nav-links"]')).not.toBeVisible();
        
        // Test mobile menu interaction
        await page.click('[data-testid="mobile-menu-button"]');
        await expect(page.locator('[data-testid="nav-links"]')).toBeVisible();
      } else {
        // Desktop menu should be expanded
        await expect(page.locator('[data-testid="mobile-menu-button"]')).not.toBeVisible();
        await expect(page.locator('[data-testid="nav-links"]')).toBeVisible();
      }
    }
  });

  authTest('should handle theme switching correctly', async ({ page, testUser, createTestUser, loginUser }) => {
    await createTestUser();
    await loginUser(testUser);

    await page.goto('/dashboard/settings');
    await pageUtils.waitForLoadState(page);

    // Test light theme (default)
    await expect(page).toHaveScreenshot('theme-light.png');

    // Switch to dark theme
    await page.click('[data-testid="theme-toggle"]');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page).toHaveScreenshot('theme-dark.png');

    // Verify theme persistence
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    // Switch back to light theme
    await page.click('[data-testid="theme-toggle"]');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page).toHaveScreenshot('theme-light.png');
  });

  authTest('should test component state variations', async ({ page, testUser, createTestUser, loginUser }) => {
    await createTestUser();
    await loginUser(testUser);

    // Test form states
    await page.goto('/dashboard/lawn/new');
    await pageUtils.waitForLoadState(page);

    // Empty form state
    await expect(page).toHaveScreenshot('lawn-form-empty.png');

    // Invalid form state
    await page.click('button[type="submit"]');
    await expect(page).toHaveScreenshot('lawn-form-invalid.png');

    // Filled form state
    await pageUtils.fillForm(page, {
      'name': 'Test Lawn',
      'size': '1000',
      'grassType': 'Bermuda',
      'sunExposure': 'Full Sun',
      'soilType': 'Clay',
    });
    await expect(page).toHaveScreenshot('lawn-form-filled.png');

    // Test button states
    await page.goto('/dashboard/schedule');

    // Default button state
    await expect(page.locator('button:text("New Treatment")')).toHaveScreenshot('button-default.png');

    // Hover state
    await page.hover('button:text("New Treatment")');
    await expect(page.locator('button:text("New Treatment")')).toHaveScreenshot('button-hover.png');

    // Loading state
    await page.evaluate(() => {
      const button = document.querySelector('button:text("New Treatment")');
      button?.setAttribute('data-loading', 'true');
    });
    await expect(page.locator('button:text("New Treatment")')).toHaveScreenshot('button-loading.png');

    // Disabled state
    await page.evaluate(() => {
      const button = document.querySelector('button:text("New Treatment")');
      button?.setAttribute('disabled', 'true');
    });
    await expect(page.locator('button:text("New Treatment")')).toHaveScreenshot('button-disabled.png');
  });

  authTest('should verify toast notification styles', async ({ page, testUser, createTestUser, loginUser }) => {
    await createTestUser();
    await loginUser(testUser);

    await page.goto('/dashboard');

    // Test success toast
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('toast', {
        detail: {
          type: 'success',
          message: 'Test success message',
        }
      }));
    });
    await expect(page.locator('[role="alert"]')).toHaveScreenshot('toast-success.png');

    // Test error toast
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('toast', {
        detail: {
          type: 'error',
          message: 'Test error message',
        }
      }));
    });
    await expect(page.locator('[role="alert"]')).toHaveScreenshot('toast-error.png');

    // Test warning toast
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('toast', {
        detail: {
          type: 'warning',
          message: 'Test warning message',
        }
      }));
    });
    await expect(page.locator('[role="alert"]')).toHaveScreenshot('toast-warning.png');
  });

  authTest('should test loading states and skeletons', async ({ page, testUser, createTestUser, loginUser }) => {
    await createTestUser();
    await loginUser(testUser);

    // Intercept API calls to simulate loading
    await page.route('**/api/**', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.continue();
    });

    await page.goto('/dashboard');

    // Capture loading state
    await expect(page).toHaveScreenshot('dashboard-loading.png');

    // Verify skeleton components
    await expect(page.locator('[data-testid="weather-skeleton"]')).toBeVisible();
    await expect(page.locator('[data-testid="lawn-list-skeleton"]')).toBeVisible();

    // Wait for content to load
    await pageUtils.waitForLoadState(page);

    // Verify loaded state
    await expect(page).toHaveScreenshot('dashboard-loaded.png');
  });
});