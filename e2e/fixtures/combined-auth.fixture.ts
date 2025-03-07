import { test as base } from '@playwright/test';
import { AuthFixtures, TestUser } from './auth.fixture';
import { PasswordResetFixtures } from './password-reset.fixture';
import { prisma } from '@/lib/db/prisma';
import { hash } from 'bcrypt';
import { generateResetToken } from '@/lib/auth/password-reset';

type CombinedFixtures = AuthFixtures & PasswordResetFixtures;

// Extend base test with combined fixtures
export const test = base.extend<CombinedFixtures>({
  // Auth fixtures
  testUser: {
    email: 'test@example.com',
    password: 'Password123!',
    name: 'Test User',
  },

  createTestUser: async ({ testUser }, use) => {
    const createUser = async () => {
      const hashedPassword = await hash(testUser.password, 10);
      await prisma.user.create({
        data: {
          email: testUser.email,
          name: testUser.name,
          password: hashedPassword,
        },
      });
      return testUser;
    };

    await use(createUser);

    // Cleanup after test
    await prisma.user.deleteMany({
      where: { email: testUser.email },
    });
  },

  loginUser: async ({ page }, use) => {
    const login = async (user: TestUser) => {
      await page.goto('/auth/login');
      await page.fill('input[name="email"]', user.email);
      await page.fill('input[name="password"]', user.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');
    };

    await use(login);
  },

  logoutUser: async ({ page }, use) => {
    const logout = async () => {
      await page.goto('/dashboard');
      await page.click('[data-testid="user-menu"]');
      await page.click('[data-testid="logout-button"]');
      await page.waitForURL('/');
    };

    await use(logout);
  },

  // Password reset fixtures
  generateResetTokenForUser: async ({}, use) => {
    const generate = async (user: TestUser) => {
      // Create user if doesn't exist
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email }
      });

      const userId = existingUser?.id || (await prisma.user.create({
        data: {
          email: user.email,
          name: user.name,
          password: await hash(user.password, 10)
        }
      })).id;

      // Generate reset token
      const { token } = await generateResetToken(userId);
      return token;
    };

    await use(generate);

    // Cleanup
    await prisma.passwordReset.deleteMany();
  },

  mockResetEmail: async ({}, use) => {
    const mock = async () => {
      // Set environment variable for test-specific email handling
      process.env.SKIP_EMAIL_SENDING = 'true';
    };

    const originalSkipEmail = process.env.SKIP_EMAIL_SENDING;
    await use(mock);
    process.env.SKIP_EMAIL_SENDING = originalSkipEmail;
  }
});