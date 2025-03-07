import { test as base } from '@playwright/test';
import { prisma } from '@/lib/db/prisma';
import { hash } from 'bcrypt';

export type TestUser = {
  email: string;
  password: string;
  name: string;
};

export type AuthFixtures = {
  testUser: TestUser;
  createTestUser: () => Promise<TestUser>;
  loginUser: (user: TestUser) => Promise<void>;
  logoutUser: () => Promise<void>;
};

// Extend base test with auth fixtures
export const test = base.extend<AuthFixtures>({
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
});