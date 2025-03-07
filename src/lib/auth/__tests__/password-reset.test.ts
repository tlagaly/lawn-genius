import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient, Prisma, User, PasswordReset } from '@prisma/client';
import { hash } from 'bcrypt';
import { mockSendEmail } from '@/lib/email/send-email';
import {
  generateResetToken,
  sendResetEmail,
  validateResetToken,
  resetPassword
} from '../password-reset';
import { TRPCError } from '@trpc/server';

// Mock prisma
jest.mock('@/lib/db/client', () => ({
  prisma: mockDeep<PrismaClient>()
}));

// Mock process.env
const originalEnv = process.env;
beforeEach(() => {
  jest.resetModules();
  process.env = { ...originalEnv };
});
afterAll(() => {
  process.env = originalEnv;
});

import { prisma } from '@/lib/db/client';
const mockPrisma = prisma as unknown as DeepMockProxy<PrismaClient>;

describe('Password Reset Flow', () => {
  // Define test data types
  type MockUser = Pick<User, 'id' | 'email' | 'password'>;
  type MockPasswordReset = Pick<PasswordReset, 'id' | 'token' | 'userId' | 'expires' | 'createdAt'>;
  type MockPasswordResetWithUser = MockPasswordReset & { user: MockUser };

  const mockUser: MockUser = {
    id: 'user-123',
    email: 'test@example.com',
    password: 'hashedPassword'
  };

  const mockToken: MockPasswordReset = {
    id: 'token-123',
    token: 'validToken',
    userId: mockUser.id,
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    createdAt: new Date()
  };

  beforeEach(() => {
    mockReset(mockPrisma);
    jest.clearAllMocks();

    // Setup default transaction mock with proper typing
    mockPrisma.$transaction.mockImplementation(async (
      args: Array<Prisma.PrismaPromise<any>> | ((prisma: Omit<PrismaClient, '$transaction'>) => Promise<any>)
    ) => {
      if (typeof args === 'function') {
        return args(mockPrisma);
      }
      return args;
    });
  });

  describe('Token Generation', () => {
    it('should generate reset token and expire old tokens', async () => {
      const result = await generateResetToken(mockUser.id);

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('expires');
      expect(mockPrisma.passwordReset.deleteMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id }
      });
      expect(mockPrisma.passwordReset.create).toHaveBeenCalled();
    });

    it('should handle transaction errors', async () => {
      mockPrisma.$transaction.mockRejectedValue(new Error('Database error'));

      await expect(generateResetToken(mockUser.id)).rejects.toThrow('Database error');
    });
  });

  describe('Email Sending', () => {
    const testEmail = 'test@example.com';
    const testToken = 'test-token';

    beforeEach(() => {
      process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    });

    it('should skip email sending in test environment', async () => {
      process.env = {
        ...process.env,
        NODE_ENV: 'test'
      };
      await sendResetEmail(testEmail, testToken);
      expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it('should send reset email in non-test environment', async () => {
      process.env = {
        ...process.env,
        NODE_ENV: 'development'
      };
      await sendResetEmail(testEmail, testToken);
      expect(mockSendEmail).toHaveBeenCalledWith(expect.objectContaining({
        to: testEmail,
        subject: 'Reset Your Password'
      }));
    });

    it('should handle email sending errors', async () => {
      process.env = {
        ...process.env,
        NODE_ENV: 'development'
      };
      mockSendEmail.mockRejectedValue(new Error('Email error'));

      await expect(sendResetEmail(testEmail, testToken))
        .rejects
        .toThrow(TRPCError);
    });
  });

  describe('Token Validation', () => {
    it('should validate valid token', async () => {
      const hashedToken = await hash('validToken', 10);
      const mockResetWithUser: MockPasswordResetWithUser = {
        ...mockToken,
        token: hashedToken,
        user: mockUser
      };
      mockPrisma.passwordReset.findFirst.mockResolvedValue(mockResetWithUser as any);

      const userId = await validateResetToken('validToken');
      expect(userId).toBe(mockUser.id);
    });

    it('should reject expired token', async () => {
      const expiredToken: MockPasswordReset = {
        ...mockToken,
        expires: new Date(Date.now() - 1000) // Expired
      };
      mockPrisma.passwordReset.findFirst.mockResolvedValue(expiredToken as any);

      await expect(validateResetToken('validToken'))
        .rejects
        .toThrow('Invalid or expired reset token');
    });

    it('should reject invalid token', async () => {
      const hashedToken = await hash('validToken', 10);
      const tokenRecord: MockPasswordReset = {
        ...mockToken,
        token: hashedToken
      };
      mockPrisma.passwordReset.findFirst.mockResolvedValue(tokenRecord as any);

      await expect(validateResetToken('invalidToken'))
        .rejects
        .toThrow('Invalid reset token');
    });

    it('should handle non-existent token', async () => {
      mockPrisma.passwordReset.findFirst.mockResolvedValue(null);

      await expect(validateResetToken('nonexistentToken'))
        .rejects
        .toThrow('Invalid or expired reset token');
    });
  });

  describe('Password Reset', () => {
    const newPassword = 'newPassword123';

    it('should reset password and delete token', async () => {
      await resetPassword(mockUser.id, newPassword);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: expect.objectContaining({
          password: expect.any(String)
        })
      });

      expect(mockPrisma.passwordReset.deleteMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id }
      });
    });

    it('should handle transaction errors during reset', async () => {
      mockPrisma.$transaction.mockRejectedValue(new Error('Database error'));

      await expect(resetPassword(mockUser.id, newPassword))
        .rejects
        .toThrow('Database error');
    });
  });
});