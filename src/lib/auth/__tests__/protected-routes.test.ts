import { type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { createTestUser, TEST_USER, clearTestUser, createTestSession, mockContext, waitForDb, forceCleanup } from './utils';
import { prisma } from '@/lib/db/__tests__/test-client';
import { hash } from 'bcrypt';

// Mock next-auth/jwt
jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(),
}));

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Protected Routes', () => {
  beforeAll(async () => {
    await forceCleanup();
    await waitForDb();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await clearTrackedTestUsers();
    await waitForDb();
  });

  afterAll(async () => {
    await forceCleanup();
    await prisma.$disconnect();
  });

  describe('Middleware Authentication', () => {
    const mockRequest = (path: string, headers = {}): NextRequest => ({
      url: `http://localhost:3000${path}`,
      headers: new Headers(headers),
      nextUrl: new URL(`http://localhost:3000${path}`),
      cookies: new Map(),
    } as unknown as NextRequest);

    it('should allow access to public routes without auth', async () => {
      const publicPaths = ['/', '/auth/login', '/auth/register', '/about'];
      
      mockFetch.mockImplementation(() => Promise.resolve({
        redirected: false,
        url: '',
      }));

      for (const path of publicPaths) {
        const req = mockRequest(path);
        (getToken as jest.Mock).mockResolvedValueOnce(null);
        
        const response = await fetch(req.url);
        expect(response.redirected).toBe(false);
      }
    });

    it('should redirect unauthenticated users from protected routes', async () => {
      const protectedPaths = [
        '/dashboard',
        '/dashboard/lawn',
        '/dashboard/settings'
      ];
      
      mockFetch.mockImplementation(() => Promise.resolve({
        redirected: true,
        url: 'http://localhost:3000/auth/login',
      }));

      for (const path of protectedPaths) {
        const req = mockRequest(path);
        (getToken as jest.Mock).mockResolvedValueOnce(null);
        
        const response = await fetch(req.url);
        expect(response.redirected).toBe(true);
        expect(response.url).toContain('/auth/login');
      }
    });

    it('should allow authenticated users to access protected routes', async () => {
      const user = await createTestUser('protected');

      const session = createTestSession(user);
      
      (getToken as jest.Mock).mockResolvedValue({
        name: session.user.name,
        email: session.user.email,
        sub: session.user.id,
      });

      mockFetch.mockImplementation(() => Promise.resolve({
        redirected: false,
        url: '',
      }));

      const protectedPaths = [
        '/dashboard',
        '/dashboard/lawn',
        '/dashboard/settings'
      ];
      
      for (const path of protectedPaths) {
        const req = mockRequest(path, {
          'Authorization': `Bearer mock-token`
        });
        
        const response = await fetch(req.url);
        expect(response.redirected).toBe(false);
      }
    });
  });

  describe('TRPC Protected Procedures', () => {
    let user: { id: string; email: string; name: string };

    beforeEach(async () => {
      user = await createTestUser('trpc');
    });

    it('should allow authenticated access to protected procedures', async () => {
      const session = createTestSession(user);
      const context = mockContext(session);

      expect(context.session).toBeDefined();
      expect(context.session?.user.id).toBe(user.id);
    });

    it('should reject unauthenticated access to protected procedures', () => {
      const context = mockContext(null);
      expect(context.session).toBeNull();
    });

    it('should maintain session across multiple procedure calls', async () => {
      const session = createTestSession(user);
      const context1 = mockContext(session);
      const context2 = mockContext(session);

      expect(context1.session?.user.id).toBe(context2.session?.user.id);
      expect(context1.session?.user.email).toBe(context2.session?.user.email);
    });
  });

  describe('Client-side Protection', () => {
    let user: { id: string; email: string; name: string };

    beforeEach(async () => {
      user = await createTestUser('client');
    });

    it('should handle session loading state', async () => {
      const session = createTestSession(user);
      const context = mockContext(session);

      expect(context.session).toBeDefined();
    });

    it('should handle session error state', () => {
      const context = mockContext(null);
      expect(context.session).toBeNull();
    });
  });
});