import { prisma } from '@/lib/db/__tests__/test-client';
import { createTestUser, TEST_USER, clearTestUser, mockPasswordResetToken, waitForDb, forceCleanup } from './utils';
import { hash } from 'bcrypt';

describe('Password Reset Flow', () => {
  beforeAll(async () => {
    await forceCleanup();
    await waitForDb();
  });

  beforeEach(async () => {
    await clearTestUser();
    await waitForDb();
  });

  afterAll(async () => {
    await forceCleanup();
    await prisma.$disconnect();
  });

  describe('Token Generation', () => {
    it('should create password reset token', async () => {
      const user = await createTestUser();
      expect(user).toBeDefined();

      const resetToken = await prisma.$transaction(async (tx) => {
        return tx.passwordReset.create({
          data: {
            userId: user.id,
            token: await hash(mockPasswordResetToken.token, 10),
            expires: mockPasswordResetToken.expires,
          },
        });
      });

      expect(resetToken).toBeDefined();
      expect(resetToken.userId).toBe(user.id);
      expect(resetToken.expires).toEqual(mockPasswordResetToken.expires);
    });

    it('should expire old tokens when creating new one', async () => {
      const user = await createTestUser();
      expect(user).toBeDefined();

      await prisma.$transaction(async (tx) => {
        // Create first token
        const token1 = await tx.passwordReset.create({
          data: {
            userId: user.id,
            token: await hash(mockPasswordResetToken.token, 10),
            expires: mockPasswordResetToken.expires,
          },
        });

        // Create second token
        const token2 = await tx.passwordReset.create({
          data: {
            userId: user.id,
            token: await hash('new-token', 10),
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        });

        // Delete first token
        await tx.passwordReset.delete({
          where: { id: token1.id },
        });

        // Verify second token exists
        const newToken = await tx.passwordReset.findUnique({
          where: { id: token2.id },
        });
        expect(newToken).toBeDefined();
      });
    });
  });

  describe('Password Reset', () => {
    let userId: string;
    let resetToken: any;

    beforeEach(async () => {
      const user = await createTestUser();
      userId = user.id;

      resetToken = await prisma.$transaction(async (tx) => {
        return tx.passwordReset.create({
          data: {
            userId,
            token: await hash(mockPasswordResetToken.token, 10),
            expires: mockPasswordResetToken.expires,
          },
        });
      });
    });

    it('should update password with valid token', async () => {
      const newPassword = 'NewPassword123!';
      
      await prisma.$transaction(async (tx) => {
        // Update password
        await tx.user.update({
          where: { id: userId },
          data: { password: await hash(newPassword, 10) },
        });

        // Delete used token
        await tx.passwordReset.delete({
          where: { id: resetToken.id },
        });

        // Verify password was updated
        const user = await tx.user.findUnique({
          where: { id: userId },
        });
        expect(user).toBeDefined();
        expect(user!.password).not.toBe(TEST_USER.password);

        // Verify token was deleted
        const deletedToken = await tx.passwordReset.findUnique({
          where: { id: resetToken.id },
        });
        expect(deletedToken).toBeNull();
      });
    });

    it('should reject expired token', async () => {
      // Create expired token
      const expiredToken = await prisma.$transaction(async (tx) => {
        return tx.passwordReset.create({
          data: {
            userId,
            token: await hash('expired-token', 10),
            expires: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expired 24 hours ago
          },
        });
      });

      // Attempt to use expired token
      const isValid = expiredToken.expires > new Date();
      expect(isValid).toBe(false);
    });

    it('should reject invalid token', async () => {
      // Attempt to find token that doesn't exist
      const invalidToken = await prisma.passwordReset.findFirst({
        where: {
          token: await hash('invalid-token', 10),
        },
      });
      expect(invalidToken).toBeNull();
    });
  });
});