import { type Session, type DefaultSession } from 'next-auth';
import { type inferAsyncReturnType } from '@trpc/server';
import { type CreateNextContextOptions } from '@trpc/server/adapters/next';
import { type createContext } from '@/lib/trpc/context';
import { prisma } from '@/lib/db/__tests__/test-client';
import { hash } from 'bcrypt';

export type Context = inferAsyncReturnType<typeof createContext>;

type SessionUser = {
  id: string;
  email: string;
  name: string;
  image?: string | null;
} & DefaultSession['user'];

type ExtendedSession = {
  user: SessionUser;
  expires: string;
};

// Generate unique test data
export const generateUniqueEmail = (prefix: string = 'test') => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `${prefix}.${timestamp}.${random}@example.com`;
};

export const TEST_USER = {
  password: 'TestPassword123!',
  name: 'Test User',
};

// Track created test emails for cleanup
const testEmails = new Set<string>();

export const createTestUser = async (prefix?: string) => {
  const email = generateUniqueEmail(prefix);
  testEmails.add(email); // Track for cleanup
  
  const hashedPassword = await hash(TEST_USER.password, 10);
  return prisma.$transaction(async (tx) => {
    return tx.user.create({
      data: {
        email,
        name: TEST_USER.name,
        password: hashedPassword,
      },
    });
  });
};

export const createTestSession = (user: { id: string; email: string; name: string }): ExtendedSession => ({
  user: {
    id: user.id,
    email: user.email,
    name: user.name,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
});

export const mockContext = (session?: ExtendedSession | null): Context => ({
  session: session === undefined ? null : session,
  headers: new Headers(),
  prisma,
});

export const mockNextContext = (session?: ExtendedSession): CreateNextContextOptions => ({
  req: {
    headers: {
      'content-type': 'application/json',
    },
    method: 'POST',
    cookies: session ? {
      'next-auth.session-token': 'mock-session-token',
    } : {},
  } as any,
  res: {
    setHeader: jest.fn(),
    status: jest.fn(() => ({ json: jest.fn() })),
  } as any,
});

// Clear specific test user and related data
export const clearTestUser = async (email: string) => {
  try {
    await prisma.$transaction(async (tx) => {
      // Delete all related records in correct order
      await tx.account.deleteMany({
        where: { user: { email } }
      });
      await tx.session.deleteMany({
        where: { user: { email } }
      });
      await tx.passwordReset.deleteMany({
        where: { user: { email } }
      });
      await tx.user.deleteMany({
        where: { email }
      });
    });
    testEmails.delete(email); // Remove from tracking
  } catch (error) {
    console.error(`Error cleaning up test user ${email}:`, error);
  }
};

// Clear all tracked test users
export const clearTrackedTestUsers = async () => {
  try {
    for (const email of testEmails) {
      await clearTestUser(email);
    }
    testEmails.clear();
  } catch (error) {
    console.error('Error clearing tracked test users:', error);
  }
};

// Force cleanup of all test data
export const forceCleanup = async () => {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.account.deleteMany();
      await tx.session.deleteMany();
      await tx.passwordReset.deleteMany();
      await tx.user.deleteMany();
    });
    testEmails.clear(); // Clear tracking
    await waitForDb();
  } catch (error) {
    console.error('Error forcing cleanup:', error);
  }
};

export const validatePasswordHash = async (hash: string, password: string): Promise<boolean> => {
  const bcrypt = require('bcrypt');
  return bcrypt.compare(password, hash);
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

export const mockGoogleProfile = {
  id: 'mock-google-id',
  email: 'test.google@example.com',
  name: 'Test Google User',
  image: 'https://example.com/avatar.jpg',
};

export const mockPasswordResetToken = {
  token: 'mock-reset-token',
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
};

// Helper to wait for database operations
export const waitForDb = async () => {
  await new Promise(resolve => setTimeout(resolve, 1000));
};

// Clean up function to run after tests
export const cleanupTestData = async () => {
  await forceCleanup();
  await waitForDb();
  await prisma.$disconnect();
};

// Mock fetch for middleware tests
export const mockFetch = (redirected = false, redirectUrl = '') => {
  return jest.fn().mockImplementation(() => Promise.resolve({
    redirected,
    url: redirectUrl,
  }));
};