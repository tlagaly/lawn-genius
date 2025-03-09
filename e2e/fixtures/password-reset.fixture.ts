import { test as base } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';
import crypto from 'crypto';

// Extend base test fixture
export type PasswordResetFixture = {
  generateResetToken: (email: string) => Promise<string>;
  createExpiredToken: (email: string) => Promise<string>;
  simulateRateLimitExceeded: (email: string) => Promise<void>;
  simulateLockout: (email: string) => Promise<void>;
  validateResetToken: (token: string) => Promise<boolean>;
  cleanup: () => Promise<void>;
};

export const test = base.extend<PasswordResetFixture>({
  generateResetToken: async ({ }, use) => {
    const prisma = new PrismaClient();
    
    const generateToken = async (email: string) => {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) throw new Error('User not found');

      const token = crypto.randomBytes(32).toString('hex');
      const hashedToken = await hash(token, 10);
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await prisma.passwordReset.create({
        data: {
          userId: user.id,
          token: hashedToken,
          expires
        }
      });

      return token;
    };

    await use(generateToken);
    await prisma.$disconnect();
  },

  createExpiredToken: async ({ }, use) => {
    const prisma = new PrismaClient();
    
    const generateExpiredToken = async (email: string) => {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) throw new Error('User not found');

      const token = crypto.randomBytes(32).toString('hex');
      const hashedToken = await hash(token, 10);
      const expires = new Date(Date.now() - 1000); // Expired 1 second ago

      await prisma.passwordReset.create({
        data: {
          userId: user.id,
          token: hashedToken,
          expires
        }
      });

      return token;
    };

    await use(generateExpiredToken);
    await prisma.$disconnect();
  },

  simulateRateLimitExceeded: async ({ }, use) => {
    const prisma = new PrismaClient();
    
    const exceedRateLimit = async (email: string) => {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) throw new Error('User not found');

      // Create multiple reset tokens to simulate rate limit
      for (let i = 0; i < 4; i++) {
        const token = crypto.randomBytes(32).toString('hex');
        const hashedToken = await hash(token, 10);
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await prisma.passwordReset.create({
          data: {
            userId: user.id,
            token: hashedToken,
            expires
          }
        });
      }
    };

    await use(exceedRateLimit);
    await prisma.$disconnect();
  },

  simulateLockout: async ({ }, use) => {
    const prisma = new PrismaClient();
    
    const lockoutAccount = async (email: string) => {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) throw new Error('User not found');

      // Create multiple failed attempts to trigger lockout
      for (let i = 0; i < 6; i++) {
        const token = crypto.randomBytes(32).toString('hex');
        const hashedToken = await hash(token, 10);
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await prisma.passwordReset.create({
          data: {
            userId: user.id,
            token: hashedToken,
            expires
          }
        });
      }
    };

    await use(lockoutAccount);
    await prisma.$disconnect();
  },

  validateResetToken: async ({ }, use) => {
    const prisma = new PrismaClient();
    
    const validateToken = async (token: string) => {
      const resetRecord = await prisma.passwordReset.findFirst({
        where: {
          expires: {
            gt: new Date()
          }
        }
      });

      return !!resetRecord;
    };

    await use(validateToken);
    await prisma.$disconnect();
  },

  cleanup: async ({ }, use) => {
    const prisma = new PrismaClient();
    
    const cleanupTokens = async () => {
      await prisma.passwordReset.deleteMany({});
    };

    await use(cleanupTokens);
    await prisma.$disconnect();
  }
});

export { expect } from '@playwright/test';