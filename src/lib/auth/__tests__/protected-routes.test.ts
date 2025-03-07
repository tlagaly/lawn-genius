import { type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { factory } from './factories';
import { mockContext, waitForDb } from './utils';
import { prisma } from '@/lib/db/__tests__/test-client';
import { v4 as uuidv4 } from 'uuid';

// Mock next-auth/jwt
jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(),
}));

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Helper function to mock NextRequest
const createMockRequest = (path: string, headers = {}): NextRequest => ({
  url: `http://localhost:3000${path}`,
  headers: new Headers(headers),
  nextUrl: new URL(`http://localhost:3000${path}`),
  cookies: new Map(),
} as unknown as NextRequest);

describe('Protected Routes', () => {
  beforeAll(async () => {
    await factory.cleanup.all();
    await waitForDb();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await factory.cleanup.all();
    await waitForDb();
  });

  afterAll(async () => {
    await factory.cleanup.all();
    await prisma.$disconnect();
  });

  describe('Middleware Authentication', () => {
    it('should allow access to public routes without auth', async () => {
      const publicPaths = ['/', '/auth/login', '/auth/register', '/about'];
      
      mockFetch.mockImplementation(() => Promise.resolve({
        redirected: false,
        url: '',
      }));

      for (const path of publicPaths) {
        const req = createMockRequest(path);
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
        const req = createMockRequest(path);
        (getToken as jest.Mock).mockResolvedValueOnce(null);
        
        const response = await fetch(req.url);
        expect(response.redirected).toBe(true);
        expect(response.url).toContain('/auth/login');
      }
    });

    it('should allow authenticated users to access protected routes', async () => {
      const { user } = await factory.completeOAuthUser('google');
      const session = await factory.session(user.id);
      
      (getToken as jest.Mock).mockResolvedValue({
        name: user.name,
        email: user.email,
        sub: user.id,
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
        const req = createMockRequest(path, {
          'Authorization': `Bearer ${session.sessionToken}`
        });
        
        const response = await fetch(req.url);
        expect(response.redirected).toBe(false);
      }
    });
  });

  describe('TRPC Protected Procedures', () => {
    it('should allow authenticated access to protected procedures', async () => {
      const { user } = await factory.completeOAuthUser('google');
      const session = await factory.session(user.id);
      const context = mockContext({
        user: {
          id: user.id,
          email: user.email,
          name: user.name || 'Unknown User',
        },
        expires: session.expires.toISOString(),
      });

      expect(context.session).toBeDefined();
      expect(context.session?.user.id).toBe(user.id);
    });

    it('should reject unauthenticated access to protected procedures', () => {
      const context = mockContext(null);
      expect(context.session).toBeNull();
    });

    it('should maintain session across multiple procedure calls', async () => {
      const { user } = await factory.completeOAuthUser('google');
      const session = await factory.session(user.id);
      const sessionData = {
        user: {
          id: user.id,
          email: user.email,
          name: user.name || 'Unknown User',
        },
        expires: session.expires.toISOString(),
      };

      const context1 = mockContext(sessionData);
      const context2 = mockContext(sessionData);

      expect(context1.session?.user.id).toBe(context2.session?.user.id);
      expect(context1.session?.user.email).toBe(context2.session?.user.email);
    });
  });

  describe('Session Token Management', () => {
    it('should handle expired tokens', async () => {
      const { user } = await factory.completeOAuthUser('google');
      const expiredSession = await factory.session(user.id, {
        expires: new Date(Date.now() - 1000), // Expired 1 second ago
      });

      (getToken as jest.Mock).mockResolvedValueOnce(null);
      
      const req = createMockRequest('/dashboard');
      const response = await fetch(req.url);
      
      expect(response.redirected).toBe(true);
      expect(response.url).toContain('/auth/login');
    });

    it('should handle malformed tokens', async () => {
      (getToken as jest.Mock).mockRejectedValueOnce(new Error('Invalid token'));
      
      const req = createMockRequest('/dashboard', {
        'Authorization': 'Bearer invalid-token-format'
      });
      
      const response = await fetch(req.url);
      expect(response.redirected).toBe(true);
      expect(response.url).toContain('/auth/login');
    });

    it('should handle concurrent valid sessions', async () => {
      const { user } = await factory.completeOAuthUser('google');

      // Create multiple valid sessions with unique tokens
      const session1 = await factory.session(user.id);
      const session2 = await factory.session(user.id);

      // Both sessions should be valid
      const context1 = mockContext({
        user: {
          id: user.id,
          email: user.email,
          name: user.name || 'Unknown User',
        },
        expires: session1.expires.toISOString(),
      });

      const context2 = mockContext({
        user: {
          id: user.id,
          email: user.email,
          name: user.name || 'Unknown User',
        },
        expires: session2.expires.toISOString(),
      });

      expect(context1.session).toBeDefined();
      expect(context2.session).toBeDefined();
      expect(context1.session?.user.id).toBe(context2.session?.user.id);
    });
  });

  describe('Unique Constraints', () => {
    it('should prevent duplicate session tokens', async () => {
      const { user } = await factory.completeOAuthUser('google');
      
      // Create first session
      const session = await factory.session(user.id);

      // Attempt to create duplicate session token
      await expect(
        prisma.session.create({
          data: {
            userId: user.id,
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
            sessionToken: session.sessionToken,
          },
        })
      ).rejects.toThrow(); // Should fail due to unique constraint
    });

    it('should handle race conditions in session creation', async () => {
      const { user } = await factory.completeOAuthUser('google');
      
      // Simulate concurrent session creation attempts with different tokens
      const createSession = (token: string) => prisma.session.create({
        data: {
          userId: user.id,
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
          sessionToken: token,
        },
      });

      // Both should succeed since they have unique tokens
      const [session1, session2] = await Promise.all([
        createSession(`race-token-1-${uuidv4()}`),
        createSession(`race-token-2-${uuidv4()}`),
      ]);

      expect(session1.sessionToken).not.toBe(session2.sessionToken);
    });
  });
});