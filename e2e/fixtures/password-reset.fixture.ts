import { test as base } from '@playwright/test';
import { prisma } from '@/lib/db/prisma';
import { hash } from 'bcrypt';
import { generateResetToken } from '@/lib/auth/password-reset';
import type { TestUser } from './auth.fixture';

export type PasswordResetFixtures = {
  generateResetTokenForUser: (user: TestUser) => Promise<string>;
  mockResetEmail: () => Promise<void>;
};

export const test = base.extend<PasswordResetFixtures>({
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