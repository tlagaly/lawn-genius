import { test, expect } from '@playwright/test';
import { test as authTest } from '../fixtures/auth.fixture';
import { pageUtils, testData } from '../utils/test-utils';

test.describe('Schedule Management', () => {
  authTest('should create a one-time treatment schedule', async ({ page, testUser, createTestUser, loginUser }) => {
    await createTestUser();
    await loginUser(testUser);

    // Create a lawn profile first
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

    // Navigate to schedule page
    await page.goto('/dashboard/schedule');
    await pageUtils.waitForLoadState(page);

    // Click new treatment button
    await page.click('button:text("New Treatment")');

    // Fill treatment form
    const treatmentName = `Test Treatment ${Date.now()}`;
    await pageUtils.fillForm(page, {
      'name': treatmentName,
      'date': '2025-04-01',
      'type': 'Fertilization',
      'notes': 'Test treatment notes',
    });

    // Select lawn from dropdown
    await page.selectOption('select[name="lawnId"]', { label: lawnName });

    // Submit form
    await page.click('button[type="submit"]');

    // Verify success message
    await pageUtils.waitForToast(page, 'Treatment scheduled successfully');

    // Verify treatment appears in calendar
    await expect(page.locator(`text=${treatmentName}`)).toBeVisible();
  });

  authTest('should create recurring treatment schedule', async ({ page, testUser, createTestUser, loginUser }) => {
    await createTestUser();
    await loginUser(testUser);

    // Navigate to schedule page
    await page.goto('/dashboard/schedule');
    await page.click('button:text("New Treatment")');

    // Enable recurring schedule
    await page.click('input[name="isRecurring"]');

    // Fill recurring treatment details
    const treatmentName = `Recurring Treatment ${Date.now()}`;
    await pageUtils.fillForm(page, {
      'name': treatmentName,
      'startDate': '2025-04-01',
      'endDate': '2025-09-30',
      'frequency': 'monthly',
      'type': 'Mowing',
      'notes': 'Monthly mowing schedule',
    });

    // Submit form
    await page.click('button[type="submit"]');

    // Verify success message
    await pageUtils.waitForToast(page, 'Recurring treatment scheduled');

    // Switch to month view
    await page.click('button:text("Month")');

    // Verify multiple instances of treatment
    const treatmentInstances = await page.locator(`text=${treatmentName}`).count();
    expect(treatmentInstances).toBeGreaterThan(1);
  });

  authTest('should handle schedule conflicts', async ({ page, testUser, createTestUser, loginUser }) => {
    await createTestUser();
    await loginUser(testUser);

    // Create first treatment
    await page.goto('/dashboard/schedule');
    await page.click('button:text("New Treatment")');
    
    const treatment1 = `Treatment 1 ${Date.now()}`;
    await pageUtils.fillForm(page, {
      'name': treatment1,
      'date': '2025-04-01',
      'type': 'Fertilization',
    });
    await page.click('button[type="submit"]');

    // Try to create second treatment on same day
    await page.click('button:text("New Treatment")');
    const treatment2 = `Treatment 2 ${Date.now()}`;
    await pageUtils.fillForm(page, {
      'name': treatment2,
      'date': '2025-04-01',
      'type': 'Mowing',
    });
    await page.click('button[type="submit"]');

    // Verify conflict warning
    await expect(page.locator('text=Schedule Conflict Detected')).toBeVisible();
    await expect(page.locator(`text=Conflicts with: ${treatment1}`)).toBeVisible();

    // Should allow scheduling anyway after confirmation
    await page.click('button:text("Schedule Anyway")');
    await pageUtils.waitForToast(page, 'Treatment scheduled successfully');

    // Verify both treatments appear
    await expect(page.locator(`text=${treatment1}`)).toBeVisible();
    await expect(page.locator(`text=${treatment2}`)).toBeVisible();
  });

  authTest('should test calendar view interactions', async ({ page, testUser, createTestUser, loginUser }) => {
    await createTestUser();
    await loginUser(testUser);

    await page.goto('/dashboard/schedule');

    // Test view switching
    await page.click('button:text("Month")');
    await expect(page.locator('.fc-view-harness.fc-view-harness-active .fc-month-view')).toBeVisible();

    await page.click('button:text("Week")');
    await expect(page.locator('.fc-view-harness.fc-view-harness-active .fc-week-view')).toBeVisible();

    await page.click('button:text("Day")');
    await expect(page.locator('.fc-view-harness.fc-view-harness-active .fc-day-view')).toBeVisible();

    // Test navigation
    await page.click('button[aria-label="Next month"]');
    await page.click('button[aria-label="Previous month"]');

    // Test date selection
    await page.click('button:text("Today")');
    await expect(page.locator('.fc-day-today')).toBeVisible();

    // Test treatment click
    const treatmentName = `Click Test ${Date.now()}`;
    await page.click('button:text("New Treatment")');
    await pageUtils.fillForm(page, {
      'name': treatmentName,
      'date': '2025-04-01',
      'type': 'Fertilization',
    });
    await page.click('button[type="submit"]');

    // Click on treatment to view details
    await page.click(`text=${treatmentName}`);
    await expect(page.locator('text=Treatment Details')).toBeVisible();
    await expect(page.locator(`text=${treatmentName}`)).toBeVisible();
  });

  authTest('should manage treatment modifications', async ({ page, testUser, createTestUser, loginUser }) => {
    await createTestUser();
    await loginUser(testUser);

    // Create a treatment
    await page.goto('/dashboard/schedule');
    await page.click('button:text("New Treatment")');
    
    const treatmentName = `Edit Test ${Date.now()}`;
    await pageUtils.fillForm(page, {
      'name': treatmentName,
      'date': '2025-04-01',
      'type': 'Fertilization',
      'notes': 'Original notes',
    });
    await page.click('button[type="submit"]');

    // Click treatment to edit
    await page.click(`text=${treatmentName}`);
    await page.click('button:text("Edit")');

    // Modify treatment
    const updatedName = `Updated ${treatmentName}`;
    await pageUtils.fillForm(page, {
      'name': updatedName,
      'notes': 'Updated notes',
      'date': '2025-04-02',
    });
    await page.click('button[type="submit"]');

    // Verify updates
    await pageUtils.waitForToast(page, 'Treatment updated successfully');
    await expect(page.locator(`text=${updatedName}`)).toBeVisible();

    // Delete treatment
    await page.click(`text=${updatedName}`);
    await page.click('button:text("Delete")');
    await page.click('button:text("Confirm Delete")');

    // Verify deletion
    await pageUtils.waitForToast(page, 'Treatment deleted successfully');
    await expect(page.locator(`text=${updatedName}`)).not.toBeVisible();
  });
});