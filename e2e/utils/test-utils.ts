import { prisma } from '@/lib/db/prisma';
import { Page } from '@playwright/test';

/**
 * Database cleanup utilities
 */
export const dbCleanup = {
  users: async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'test',
        },
      },
    });
  },

  sessions: async () => {
    await prisma.session.deleteMany({});
  },

  all: async () => {
    await dbCleanup.sessions();
    await dbCleanup.users();
  },
};

/**
 * Page interaction utilities
 */
export const pageUtils = {
  /**
   * Wait for navigation and network idle
   */
  waitForLoadState: async (page: Page) => {
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');
  },

  /**
   * Wait for toast notification and verify its content
   */
  waitForToast: async (page: Page, message: string) => {
    const toast = page.locator('[role="alert"]');
    await toast.waitFor({ state: 'visible' });
    await toast.textContent().then((text) => text?.includes(message));
  },

  /**
   * Fill form fields with provided data
   */
  fillForm: async (page: Page, formData: Record<string, string>) => {
    for (const [name, value] of Object.entries(formData)) {
      await page.fill(`input[name="${name}"]`, value);
    }
  },
};

/**
 * Test data generation utilities
 */
export const testData = {
  /**
   * Generate unique test email
   */
  generateEmail: (prefix = 'test') => {
    const timestamp = Date.now();
    return `${prefix}-${timestamp}@example.com`;
  },

  /**
   * Generate unique username
   */
  generateUsername: (prefix = 'test') => {
    const timestamp = Date.now();
    return `${prefix}-user-${timestamp}`;
  },
};

/**
 * Error simulation utilities
 */
export const errorUtils = {
  /**
   * Simulate network error by intercepting requests
   */
  simulateNetworkError: async (page: Page, url: string) => {
    await page.route(url, (route) => {
      route.abort('failed');
    });
  },

  /**
   * Simulate slow response
   */
  simulateSlowResponse: async (page: Page, url: string, delay = 5000) => {
    await page.route(url, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, delay));
      await route.continue();
    });
  },
};

/**
 * Session management utilities
 */
export const sessionUtils = {
  /**
   * Create test session
   */
  createSession: async (userId: string) => {
    return await prisma.session.create({
      data: {
        userId,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        sessionToken: `test-session-${Date.now()}`,
      },
    });
  },

  /**
   * Clear all test sessions
   */
  clearSessions: async () => {
    await prisma.session.deleteMany({
      where: {
        sessionToken: {
          startsWith: 'test-session-',
        },
      },
    });
  },
};

/**
 * Role-based test utilities
 */
export const roleUtils = {
  /**
   * Create user with specific role
   */
  createUserWithRole: async (role: string) => {
    return await prisma.user.create({
      data: {
        email: testData.generateEmail(role),
        name: testData.generateUsername(role),
        role,
      },
    });
  },

  /**
   * Verify user has required role
   */
  verifyUserRole: async (userId: string, expectedRole: string) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    return user?.role === expectedRole;
  },
};