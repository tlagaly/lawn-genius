import { test, expect } from '@playwright/test';
import { test as authTest } from '../fixtures/auth.fixture';
import { test as combinedTest } from '../fixtures/combined-auth.fixture';

test.describe('Authentication Flow', () => {
  test('should allow user registration', async ({ page }) => {
    await page.goto('/auth/register');
    
    // Fill registration form
    await page.fill('input[name="name"]', 'New Test User');
    await page.fill('input[name="email"]', 'newtest@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="confirmPassword"]', 'Password123!');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard after successful registration
    await expect(page).toHaveURL('/dashboard');
    
    // Verify welcome message
    await expect(page.locator('text=Welcome, New Test User')).toBeVisible();

    // Visual regression test
    await expect(page).toHaveScreenshot('dashboard-after-registration.png');
  });

  authTest('should handle login and logout', async ({ page, testUser, createTestUser, loginUser, logoutUser }) => {
    // Create test user
    await createTestUser();
    
    // Login
    await loginUser(testUser);
    
    // Verify successful login
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator(`text=Welcome, ${testUser.name}`)).toBeVisible();
    
    // Visual regression test for dashboard
    await expect(page).toHaveScreenshot('dashboard-after-login.png');
    
    // Logout
    await logoutUser();
    
    // Verify successful logout
    await expect(page).toHaveURL('/');
    
    // Verify protected route is inaccessible
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/auth/login');

    // Visual regression test for login page
    await expect(page).toHaveScreenshot('login-page.png');
  });

  authTest('should protect dashboard routes', async ({ page, testUser, createTestUser, loginUser }) => {
    // Try accessing protected route without auth
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/auth/login');
    
    // Login
    await createTestUser();
    await loginUser(testUser);
    
    // Should now have access to protected routes
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/dashboard');
    
    // Check other protected routes
    const protectedRoutes = [
      '/dashboard/lawn',
      '/dashboard/settings',
      '/dashboard/schedule',
    ];
    
    for (const route of protectedRoutes) {
      await page.goto(route);
      await expect(page).not.toHaveURL('/auth/login');
    }
  });

  test('should handle invalid login attempts', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Try invalid email format
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Invalid email format')).toBeVisible();
    
    // Visual regression test for validation error
    await expect(page).toHaveScreenshot('login-validation-error.png');
    
    // Try non-existent user
    await page.fill('input[name="email"]', 'nonexistent@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
    
    // Try wrong password for existing user
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });

  combinedTest('should handle complete password reset flow', async ({ 
    page, 
    testUser, 
    generateResetTokenForUser, 
    mockResetEmail 
  }) => {
    // Start password reset process
    await page.goto('/auth/forgot-password');
    await expect(page).toHaveScreenshot('forgot-password-page.png');
    
    // Request password reset
    await mockResetEmail();
    await page.fill('input[name="email"]', testUser.email);
    await page.click('button[type="submit"]');
    
    // Verify success message
    await expect(page.locator('text=Check your email')).toBeVisible();
    await expect(page).toHaveScreenshot('password-reset-requested.png');
    
    // Generate actual reset token
    const token = await generateResetTokenForUser(testUser);
    
    // Navigate to reset page with token
    await page.goto(`/auth/reset-password?token=${token}`);
    await expect(page).toHaveScreenshot('reset-password-page.png');
    
    // Set new password
    const newPassword = 'NewPassword123!';
    await page.fill('input[name="newPassword"]', newPassword);
    await page.fill('input[name="confirmPassword"]', newPassword);
    await page.click('button[type="submit"]');
    
    // Verify success and redirect to login
    await expect(page.locator('text=Password reset successful')).toBeVisible();
    await expect(page).toHaveURL('/auth/login');
    await expect(page).toHaveScreenshot('password-reset-success.png');
    
    // Try logging in with new password
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', newPassword);
    await page.click('button[type="submit"]');
    
    // Verify successful login with new password
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator(`text=Welcome, ${testUser.name}`)).toBeVisible();
  });

  combinedTest('should handle invalid reset token', async ({ page }) => {
    // Try invalid token
    await page.goto('/auth/reset-password?token=invalid-token');
    await page.fill('input[name="newPassword"]', 'NewPassword123!');
    await page.fill('input[name="confirmPassword"]', 'NewPassword123!');
    await page.click('button[type="submit"]');
    
    // Verify error message
    await expect(page.locator('text=Invalid or expired reset token')).toBeVisible();
    await expect(page).toHaveScreenshot('invalid-reset-token.png');
  });
});