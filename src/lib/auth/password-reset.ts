import { prisma } from '@/lib/db/client';
import { hash, compare } from 'bcrypt';
import crypto from 'crypto';
import { sendEmail } from '@/lib/email/send-email';
import { TRPCError } from '@trpc/server';
import { PrismaClient, Prisma } from '@prisma/client';

const TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

interface ResetTokenData {
  token: string;
  expires: Date;
}

export async function generateResetToken(userId: string): Promise<ResetTokenData> {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + TOKEN_EXPIRY);

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Expire any existing tokens
    await tx.passwordReset.deleteMany({
      where: { userId }
    });

    // Create new token
    await tx.passwordReset.create({
      data: {
        userId,
        token: await hash(token, 10),
        expires
      }
    });
  });

  return { token, expires };
}

export async function sendResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`;
  
  if (process.env.NODE_ENV === 'test') {
    return; // Skip actual email sending in tests
  }

  try {
    await sendEmail({
      to: email,
      subject: 'Reset Your Password',
      text: `Click the following link to reset your password: ${resetUrl}`,
      html: `
        <p>Click the following link to reset your password:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>This link will expire in 24 hours.</p>
      `
    });
  } catch (error) {
    console.error('Failed to send reset email:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to send reset email'
    });
  }
}

export async function validateResetToken(token: string): Promise<string> {
  const resetRecord = await prisma.passwordReset.findFirst({
    where: {
      expires: {
        gt: new Date()
      }
    },
    include: {
      user: true
    }
  });

  if (!resetRecord) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Invalid or expired reset token'
    });
  }

  const isValidToken = await compare(token, resetRecord.token);
  if (!isValidToken) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Invalid reset token'
    });
  }

  return resetRecord.userId;
}

export async function resetPassword(userId: string, newPassword: string) {
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Update password
    await tx.user.update({
      where: { id: userId },
      data: {
        password: await hash(newPassword, 10)
      }
    });

    // Delete used token
    await tx.passwordReset.deleteMany({
      where: { userId }
    });
  });
}

// For testing purposes
export const mockSendEmail = jest.fn(async () => Promise.resolve());