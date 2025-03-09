import { test, expect } from '../../fixtures/combined-auth.fixture';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

test.describe('Password Reset Flow', () => {
  const testUser = {
    email: 'test-reset@example.com',
    password: 'OldP@ssw0rd'
  };

  test.beforeAll(async () => {
    // Create test user
    await prisma.user.create({
      data: {
        email: testUser.email,
        password: await hash(testUser.password, 10)
      }
    });
  });

  test.afterAll(async () => {
    // Cleanup test user and reset tokens
    await prisma.passwordReset.deleteMany({
      where: { user: { email: testUser.email } }
    });
    await prisma.user.delete({
      where: { email: testUser.email }
    });
    await prisma.$disconnect();
  });

  test.beforeEach(async ({ cleanup }) => {
    await cleanup(); // Clear any existing reset tokens
  });

  test('should generate and validate reset token', async ({ page, generateResetToken }) => {
    const token = await generateResetToken(testUser.email);
    
    // Navigate to reset page with token
    await page.goto(`/auth/reset-password?token=${token}`);
    
    // Should show reset form
    await expect(page.getByRole('heading', { name: 'Reset Password' })).toBeVisible();
    await expect(page.getByText('Invalid or expired token')).not.toBeVisible();
  });

  test('should reject expired token', async ({ page, createExpiredToken }) => {
    const token = await createExpiredToken(testUser.email);
    
    await page.goto(`/auth/reset-password?token=${token}`);
    
    await expect(page.getByText('The password reset link has expired')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reset Password' })).not.toBeVisible();
  });

  test('should enforce rate limiting', async ({ page, simulateRateLimitExceeded }) => {
    await simulateRateLimitExceeded(testUser.email);
    
    // Try to request another reset
    await page.goto('/auth/forgot-password');
    await page.getByLabel('Email').fill(testUser.email);
    await page.getByRole('button', { name: 'Send Reset Link' }).click();
    
    await expect(page.getByText('Too many reset requests')).toBeVisible();
  });

  test('should enforce account lockout', async ({ page, simulateLockout }) => {
    await simulateLockout(testUser.email);
    
    // Try to request another reset
    await page.goto('/auth/forgot-password');
    await page.getByLabel('Email').fill(testUser.email);
    await page.getByRole('button', { name: 'Send Reset Link' }).click();
    
    await expect(page.getByText('Account is temporarily locked')).toBeVisible();
  });

  test('should validate password requirements', async ({ page, generateResetToken }) => {
    const token = await generateResetToken(testUser.email);
    await page.goto(`/auth/reset-password?token=${token}`);

    // Test various invalid passwords
    const testCases = [
      { password: 'short', error: 'at least 8 characters' },
      { password: 'onlylowercase123!', error: 'uppercase letter' },
      { password: 'ONLYUPPERCASE123!', error: 'lowercase letter' },
      { password: 'NoSpecialChars123', error: 'special character' },
      { password: 'NoNumbers!@#$%', error: 'number' }
    ];

    for (const { password, error } of testCases) {
      await page.getByLabel('New Password').fill(password);
      await page.getByRole('button', { name: 'Reset Password' }).click();
      await expect(page.getByText(error, { exact: false })).toBeVisible();
    }
  });

  test('should successfully reset password', async ({ page, generateResetToken }) => {
    const token = await generateResetToken(testUser.email);
    const newPassword = 'NewP@ssw0rd123';
    
    await page.goto(`/auth/reset-password?token=${token}`);
    await page.getByLabel('New Password').fill(newPassword);
    await page.getByRole('button', { name: 'Reset Password' }).click();
    
    // Should redirect to login and show success message
    await expect(page.getByText('Password successfully reset')).toBeVisible();
    
    // Should be able to login with new password
    await page.getByLabel('Email').fill(testUser.email);
    await page.getByLabel('Password').fill(newPassword);
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    await expect(page.getByText('Successfully signed in')).toBeVisible();
  });

  test('should handle non-existent email consistently', async ({ page }) => {
    const nonExistentEmail = 'nonexistent@example.com';
    const startTime = Date.now();
    
    await page.goto('/auth/forgot-password');
    await page.getByLabel('Email').fill(nonExistentEmail);
    await page.getByRole('button', { name: 'Send Reset Link' }).click();
    
    // Should show same success message as existing email
    await expect(page.getByText('If an account exists')).toBeVisible();
    
    // Should take similar time as real email (prevent user enumeration)
    const endTime = Date.now();
    expect(endTime - startTime).toBeGreaterThanOrEqual(1000);
  });
});