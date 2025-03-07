import { prisma } from '@/lib/db/client';
import { hash, compare } from 'bcrypt';
import crypto from 'crypto';
import { sendEmail } from '@/lib/email/send-email';
import { TRPCError } from '@trpc/server';
import { PrismaClient, Prisma } from '@prisma/client';

const TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const MAX_RESET_ATTEMPTS = 5; // Maximum failed reset attempts before lockout
const LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes lockout
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour window for rate limiting
const MAX_RESET_REQUESTS = 3; // Maximum reset requests per window

interface ResetAttempts {
  count: number;
  firstAttempt: Date;
  locked: boolean;
  lockExpires?: Date;
}

const resetAttempts = new Map<string, ResetAttempts>();

function isRateLimited(email: string): boolean {
  const now = new Date();
  const attempts = resetAttempts.get(email);

  if (!attempts) {
    resetAttempts.set(email, {
      count: 1,
      firstAttempt: now,
      locked: false
    });
    return false;
  }

  // Check if in lockout period
  if (attempts.locked && attempts.lockExpires && attempts.lockExpires > now) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: 'Account is temporarily locked. Please try again later.'
    });
  }

  // Reset if outside rate limit window
  if (now.getTime() - attempts.firstAttempt.getTime() > RATE_LIMIT_WINDOW) {
    resetAttempts.set(email, {
      count: 1,
      firstAttempt: now,
      locked: false
    });
    return false;
  }

  // Increment attempt count
  attempts.count++;

  // Check for lockout threshold
  if (attempts.count >= MAX_RESET_ATTEMPTS) {
    attempts.locked = true;
    attempts.lockExpires = new Date(now.getTime() + LOCKOUT_DURATION);
    resetAttempts.set(email, attempts);
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many reset attempts. Account is temporarily locked.'
    });
  }

  // Check rate limit
  if (attempts.count > MAX_RESET_REQUESTS) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many reset requests. Please try again later.'
    });
  }

  resetAttempts.set(email, attempts);
  return false;
}

// Cleanup expired tokens periodically
setInterval(async () => {
  try {
    await prisma.passwordReset.deleteMany({
      where: {
        expires: {
          lt: new Date()
        }
      }
    });
  } catch (error) {
    console.error('Failed to cleanup expired tokens:', error);
  }
}, TOKEN_EXPIRY);

interface ResetTokenData {
  token: string;
  expires: Date;
}

export async function generateResetToken(email: string): Promise<ResetTokenData | null> {
  // Check rate limiting first
  isRateLimited(email);

  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + TOKEN_EXPIRY);

  // Add artificial delay to prevent user enumeration
  const startTime = Date.now();
  
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      // Still create a token to maintain consistent timing
      await new Promise(resolve => setTimeout(resolve, 1000));
      return null;
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Expire any existing tokens
      await tx.passwordReset.deleteMany({
        where: { userId: user.id }
      });

      // Create new token
      await tx.passwordReset.create({
        data: {
          userId: user.id,
          token: await hash(token, 10),
          expires
        }
      });
    });

    // Ensure consistent timing
    const elapsed = Date.now() - startTime;
    if (elapsed < 1000) {
      await new Promise(resolve => setTimeout(resolve, 1000 - elapsed));
    }

    return { token, expires };
  } catch (error) {
    console.error('Failed to generate reset token:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to process reset request'
    });
  }
}

export async function sendResetEmail(email: string, token: string | null) {
  // Always send an email to prevent user enumeration
  const resetUrl = token
    ? `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`
    : '#';
  
  if (process.env.NODE_ENV === 'test') {
    return; // Skip actual email sending in tests
  }

  try {
    const emailContent = token
      ? {
          subject: 'Reset Your Password',
          text: `Click the following link to reset your password: ${resetUrl}\n\nThis link will expire in 24 hours.\n\nIf you didn't request this reset, please ignore this email.`,
          html: `
            <p>Click the following link to reset your password:</p>
            <a href="${resetUrl}">${resetUrl}</a>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't request this reset, please ignore this email.</p>
            <p style="color: #666; font-size: 12px;">For security, this request was received from IP: [Request IP Address]</p>
          `
        }
      : {
          subject: 'Password Reset Request',
          text: 'A password reset was requested for this email address, but no account was found.',
          html: '<p>A password reset was requested for this email address, but no account was found.</p>'
        };

    await sendEmail({
      to: email,
      ...emailContent,
      headers: {
        'X-Priority': 'High',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'X-XSS-Protection': '1; mode=block'
      }
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
  const startTime = Date.now();

  try {
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

    // Add artificial delay to prevent timing attacks
    await new Promise(resolve => setTimeout(resolve, 500));

    if (!resetRecord) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'The password reset link has expired or is invalid. Please request a new one.'
      });
    }

    // Check rate limiting for this user
    isRateLimited(resetRecord.user.email);

    const isValidToken = await compare(token, resetRecord.token);
    if (!isValidToken) {
      // Track failed attempt
      const attempts = resetAttempts.get(resetRecord.user.email) || {
        count: 0,
        firstAttempt: new Date(),
        locked: false
      };
      attempts.count++;
      resetAttempts.set(resetRecord.user.email, attempts);

      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Invalid reset token. Please ensure you are using the most recent reset link.'
      });
    }

    // Ensure consistent timing
    const elapsed = Date.now() - startTime;
    if (elapsed < 1000) {
      await new Promise(resolve => setTimeout(resolve, 1000 - elapsed));
    }

    return resetRecord.userId;
  } catch (error) {
    // Ensure consistent timing even on errors
    const elapsed = Date.now() - startTime;
    if (elapsed < 1000) {
      await new Promise(resolve => setTimeout(resolve, 1000 - elapsed));
    }

    if (error instanceof TRPCError) {
      throw error;
    }

    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred while validating the reset token.'
    });
  }
}

export async function resetPassword(userId: string, newPassword: string) {
  const startTime = Date.now();

  try {
    // Validate password requirements
    if (newPassword.length < PASSWORD_MIN_LENGTH) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Password must be at least 8 characters long'
      });
    }

    if (!PASSWORD_REGEX.test(newPassword)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      });
    }

    // Get user email for rate limiting
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    });

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found'
      });
    }

    // Check rate limiting
    isRateLimited(user.email);

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

      // Clear rate limiting attempts for this user
      resetAttempts.delete(user.email);
    });

    // Ensure consistent timing
    const elapsed = Date.now() - startTime;
    if (elapsed < 1000) {
      await new Promise(resolve => setTimeout(resolve, 1000 - elapsed));
    }
  } catch (error) {
    // Ensure consistent timing even on errors
    const elapsed = Date.now() - startTime;
    if (elapsed < 1000) {
      await new Promise(resolve => setTimeout(resolve, 1000 - elapsed));
    }

    if (error instanceof TRPCError) {
      throw error;
    }

    console.error('Failed to reset password:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred while resetting your password'
    });
  }
}

// For testing purposes
export const mockSendEmail = jest.fn(async () => Promise.resolve());