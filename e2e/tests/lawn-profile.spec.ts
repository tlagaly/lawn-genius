import { test, expect } from '@playwright/test';
import { test as authTest } from '../fixtures/auth.fixture';
import { pageUtils, testData } from '../utils/test-utils';

test.describe('Lawn Profile Management', () => {
  authTest('should create a new lawn profile', async ({ page, testUser, createTestUser, loginUser }) => {
    await createTestUser();
    await loginUser(testUser);

    // Navigate to new lawn profile page
    await page.goto('/dashboard/lawn/new');
    await pageUtils.waitForLoadState(page);

    // Fill lawn profile form
    const lawnName = `Test Lawn ${testData.generateUsername()}`;
    await pageUtils.fillForm(page, {
      'name': lawnName,
      'size': '1000',
      'grassType': 'Bermuda',
      'sunExposure': 'Full Sun',
      'soilType': 'Clay',
    });

    // Submit form
    await page.click('button[type="submit"]');

    // Verify success message
    await pageUtils.waitForToast(page, 'Lawn profile created successfully');

    // Verify redirect to lawn profile list
    await expect(page).toHaveURL('/dashboard/lawn');

    // Verify lawn appears in list
    await expect(page.locator(`text=${lawnName}`)).toBeVisible();
  });

  authTest('should edit existing lawn profile', async ({ page, testUser, createTestUser, loginUser }) => {
    await createTestUser();
    await loginUser(testUser);

    // First create a lawn profile
    await page.goto('/dashboard/lawn/new');
    const originalName = `Test Lawn ${testData.generateUsername()}`;
    await pageUtils.fillForm(page, {
      'name': originalName,
      'size': '1000',
      'grassType': 'Bermuda',
      'sunExposure': 'Full Sun',
      'soilType': 'Clay',
    });
    await page.click('button[type="submit"]');
    await pageUtils.waitForToast(page, 'Lawn profile created successfully');

    // Navigate to edit page by clicking edit button
    await page.click(`[data-testid="edit-lawn-${originalName}"]`);
    await pageUtils.waitForLoadState(page);

    // Update lawn details
    const updatedName = `Updated ${originalName}`;
    await pageUtils.fillForm(page, {
      'name': updatedName,
      'size': '2000',
      'sunExposure': 'Partial Shade',
    });

    // Submit form
    await page.click('button[type="submit"]');

    // Verify success message
    await pageUtils.waitForToast(page, 'Lawn profile updated successfully');

    // Verify lawn details are updated
    await expect(page.locator(`text=${updatedName}`)).toBeVisible();
    await expect(page.locator('text=2000 sq ft')).toBeVisible();
    await expect(page.locator('text=Partial Shade')).toBeVisible();
  });

  authTest('should view lawn history', async ({ page, testUser, createTestUser, loginUser }) => {
    await createTestUser();
    await loginUser(testUser);

    // Create a lawn profile
    await page.goto('/dashboard/lawn/new');
    const lawnName = `Test Lawn ${testData.generateUsername()}`;
    await pageUtils.fillForm(page, {
      'name': lawnName,
      'size': '1000',
      'grassType': 'Bermuda',
      'sunExposure': 'Full Sun',
      'soilType': 'Clay',
    });
    await page.click('button[type="submit"]');

    // Navigate to lawn detail page
    await page.click(`[data-testid="view-lawn-${lawnName}"]`);
    await pageUtils.waitForLoadState(page);

    // Verify lawn history section exists
    await expect(page.locator('text=Lawn History')).toBeVisible();
    await expect(page.locator('text=Profile Created')).toBeVisible();
  });

  authTest('should delete lawn profile', async ({ page, testUser, createTestUser, loginUser }) => {
    await createTestUser();
    await loginUser(testUser);

    // Create a lawn profile
    await page.goto('/dashboard/lawn/new');
    const lawnName = `Test Lawn ${testData.generateUsername()}`;
    await pageUtils.fillForm(page, {
      'name': lawnName,
      'size': '1000',
      'grassType': 'Bermuda',
      'sunExposure': 'Full Sun',
      'soilType': 'Clay',
    });
    await page.click('button[type="submit"]');

    // Click delete button
    await page.click(`[data-testid="delete-lawn-${lawnName}"]`);

    // Confirm deletion in modal
    await page.click('button:text("Confirm Delete")');

    // Verify success message
    await pageUtils.waitForToast(page, 'Lawn profile deleted successfully');

    // Verify lawn is removed from list
    await expect(page.locator(`text=${lawnName}`)).not.toBeVisible();
  });

  authTest('should handle validation errors', async ({ page, testUser, createTestUser, loginUser }) => {
    await createTestUser();
    await loginUser(testUser);

    await page.goto('/dashboard/lawn/new');

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Verify validation errors
    await expect(page.locator('text=Name is required')).toBeVisible();
    await expect(page.locator('text=Size is required')).toBeVisible();
    await expect(page.locator('text=Grass type is required')).toBeVisible();

    // Try invalid size
    await pageUtils.fillForm(page, {
      'size': '-100',
    });
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Size must be a positive number')).toBeVisible();
  });
});