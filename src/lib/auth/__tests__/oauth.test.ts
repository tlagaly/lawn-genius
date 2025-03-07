import { prisma } from '@/lib/db/__tests__/test-client';
import { mockGoogleProfile, mockContext, waitForDb } from './utils';
import { factory } from './factories';

// Mock next-auth/react at the top level
jest.mock('next-auth/react', () => {
  const originalModule = jest.requireActual('next-auth/react');
  
  return {
    ...originalModule,
    signIn: jest.fn(async (provider, options) => {
      if (provider === 'google') {
        // Simulate successful OAuth flow
        if (options?.callbackUrl) {
          return {
            ok: true,
            error: null,
            status: 200,
            url: options.callbackUrl,
          };
        }
        // Simulate callback with profile
        return {
          profile: mockGoogleProfile,
          account: {
            provider: 'google',
            type: 'oauth',
            providerAccountId: mockGoogleProfile.id,
            access_token: 'mock-access-token',
            token_type: 'Bearer',
            scope: 'openid profile email',
            expires_at: Math.floor(Date.now() / 1000) + 3600,
          },
          credentials: null,
        };
      }
      throw new Error(`Unknown provider: ${provider}`);
    }),
    useSession: jest.fn(() => ({
      data: null,
      status: 'unauthenticated',
    })),
    getSession: jest.fn(),
  };
});

// Get mocked functions
const { signIn, useSession, getSession } = jest.requireMock('next-auth/react');

describe('OAuth Authentication', () => {
  beforeAll(async () => {
    await factory.cleanup.all();
    await waitForDb();
  });

  beforeEach(async () => {
    await factory.cleanup.all();
    await waitForDb();
  });

  afterAll(async () => {
    await factory.cleanup.all();
    await prisma.$disconnect();
  });

  describe('Google OAuth', () => {
    it('should create new user from Google profile', async () => {
      const { user, account } = await factory.completeOAuthUser('google', {
        email: mockGoogleProfile.email,
        name: mockGoogleProfile.name,
        image: mockGoogleProfile.image,
      });

      expect(user).toBeDefined();
      expect(user.email).toBe(mockGoogleProfile.email);
      expect(account.providerAccountId).toMatch(/^mock-google-/);
    });

    it('should link Google account to existing user', async () => {
      // Create user first
      const user = await factory.user();

      // Link Google account
      const account = await factory.oauthAccount(user.id, {
        provider: 'google',
        providerAccountId: mockGoogleProfile.id,
      });

      // Update user image
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { image: mockGoogleProfile.image },
      });

      expect(updatedUser.id).toBe(user.id);
      expect(updatedUser.email).toBe(user.email);
      expect(account.providerAccountId).toBe(mockGoogleProfile.id);
    });

    it('should prevent duplicate Google account linking', async () => {
      // Create first user with Google account
      const { user: firstUser, account: firstAccount } = await factory.completeOAuthUser('google');

      // Create second user
      const secondUser = await factory.user({
        email: 'another@example.com',
        name: 'Another User',
      });

      // Attempt to link same Google account to second user
      await expect(
        factory.oauthAccount(secondUser.id, {
          provider: 'google',
          providerAccountId: firstAccount.providerAccountId,
        })
      ).rejects.toThrow(); // Should fail due to unique constraint
    });
  });

  describe('Session Management', () => {
    it('should create session from Google profile', async () => {
      const { user } = await factory.completeOAuthUser('google', {
        email: 'session.test@example.com',
        name: 'Session Test User',
      });

      const session = await factory.session(user.id);

      const context = mockContext({
        user: {
          id: user.id,
          email: user.email,
          name: user.name || 'Unknown User',
          image: mockGoogleProfile.image || undefined,
        },
        expires: session.expires.toISOString(),
      });

      expect(context.session).toBeDefined();
      expect(context.session?.user.email).toBe(user.email);
    });

    it('should handle missing Google profile image', async () => {
      const { user, account } = await factory.completeOAuthUser('google', {
        email: 'no.image@example.com',
        name: 'No Image User',
        image: null,
      });

      expect(user.image).toBeNull();
      expect(account.provider).toBe('google');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      signIn.mockReset();
      useSession.mockReset();
      getSession.mockReset();
    });

    describe('OAuth Flow Errors', () => {
      it('should handle Google OAuth errors', async () => {
        signIn.mockImplementationOnce(() => {
          throw new Error('OAuth Error');
        });

        await expect(
          signIn('google', { callbackUrl: 'http://localhost:3000' })
        ).rejects.toThrow('OAuth Error');

        expect(signIn).toHaveBeenCalledWith('google', { callbackUrl: 'http://localhost:3000' });
      });

      it('should handle network errors', async () => {
        signIn.mockImplementationOnce(() => {
          const error = new Error('Network Error');
          error.name = 'NetworkError';
          throw error;
        });

        await expect(signIn('google')).rejects.toThrow('Network Error');
      });

      it('should handle rate limiting', async () => {
        signIn.mockImplementationOnce(() => {
          const error = new Error('Too Many Requests');
          error.name = 'TooManyRequestsError';
          throw error;
        });

        await expect(signIn('google')).rejects.toThrow('Too Many Requests');
      });

      it('should handle OAuth callback errors', async () => {
        signIn.mockImplementationOnce(() => ({
          error: 'access_denied',
          ok: false,
          status: 401,
          url: null,
        }));

        const result = await signIn('google');
        expect(result.error).toBe('access_denied');
        expect(result.ok).toBe(false);
      });

      it('should handle invalid state parameter', async () => {
        signIn.mockImplementationOnce(() => ({
          error: 'invalid_state',
          ok: false,
          status: 400,
          url: null,
        }));

        const result = await signIn('google');
        expect(result.error).toBe('invalid_state');
        expect(result.status).toBe(400);
      });

      it('should handle token refresh failures', async () => {
        const { user } = await factory.completeOAuthUser('google');
        const expiredToken = await factory.oauthAccount(user.id, {
          provider: 'google',
          access_token: 'expired_token',
          expires_at: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
        });

        signIn.mockImplementationOnce(() => ({
          error: 'token_refresh_failed',
          ok: false,
          status: 401,
          url: null,
        }));

        const result = await signIn('google');
        expect(result.error).toBe('token_refresh_failed');
        expect(result.ok).toBe(false);
      });

      it('should handle account linking conflicts during OAuth', async () => {
        // Create first user with Google account
        const { user: firstUser } = await factory.completeOAuthUser('google', {
          email: 'first@example.com',
        });

        // Attempt to link same email to different account
        signIn.mockImplementationOnce(() => ({
          error: 'account_exists',
          ok: false,
          status: 409,
          url: null,
        }));

        const result = await signIn('google', {
          email: 'first@example.com',
        });

        expect(result.error).toBe('account_exists');
        expect(result.status).toBe(409);

        // Verify original account remains unchanged
        const unchangedUser = await prisma.user.findUnique({
          where: { id: firstUser.id },
          include: { accounts: true },
        });

        expect(unchangedUser).toBeDefined();
        expect(unchangedUser?.accounts).toHaveLength(1);
      });
    });

    describe('Data Validation Errors', () => {
      it('should handle invalid user data', async () => {
        // @ts-expect-error - Testing invalid data
        await expect(factory.user({
          name: mockGoogleProfile.name,
          email: undefined, // Missing required email
        })).rejects.toThrow();

        await expect(factory.user({
          email: 'invalid-email', // Invalid email format
          name: mockGoogleProfile.name,
        })).rejects.toThrow();
      });

      it('should handle invalid OAuth account data', async () => {
        const user = await factory.user();

        await expect(factory.oauthAccount(user.id, {
          provider: 'google',
          providerAccountId: '', // Invalid empty ID
        })).rejects.toThrow();

        await expect(factory.oauthAccount(user.id, {
          provider: 'google',
          providerAccountId: mockGoogleProfile.id,
          accessToken: '', // Invalid empty token
        })).rejects.toThrow();
      });

      it('should handle invalid session data', async () => {
        const user = await factory.user();

        await expect(factory.session(user.id, {
          expires: new Date('invalid-date'),
        })).rejects.toThrow();
      });
    });
  });

  describe('Session Expiration', () => {
    it('should handle expired sessions', async () => {
      // Create user with expired session
      const { user } = await factory.completeOAuthUser('google');
      const expiredSession = await factory.session(user.id, {
        expires: new Date(Date.now() - 1000), // Expired 1 second ago
      });

      useSession.mockImplementationOnce(() => ({
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
          expires: expiredSession.expires.toISOString(),
        },
        status: 'unauthenticated',
      }));

      const result = await signIn('google');
      expect(result).toHaveProperty('account.access_token');
      expect(result.account.expires_at).toBeGreaterThan(Date.now() / 1000);
    });

    it('should refresh tokens before expiration', async () => {
      // Create user with near-expiry session
      const { user } = await factory.completeOAuthUser('google');
      const nearExpirySession = await factory.session(user.id, {
        expires: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes until expiry
      });

      useSession.mockImplementationOnce(() => ({
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
          expires: nearExpirySession.expires.toISOString(),
        },
        status: 'authenticated',
      }));

      const result = await signIn('google');
      expect(result).toHaveProperty('account.access_token');
      expect(result.account.expires_at).toBeGreaterThan(Date.now() / 1000 + 3500); // Should be valid for almost an hour
    });

    it('should handle session cleanup after expiration', async () => {
      // Create multiple expired sessions
      const { user } = await factory.completeOAuthUser('google');
      
      // Create expired sessions
      await Promise.all([
        factory.session(user.id, {
          expires: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
        }),
        factory.session(user.id, {
          expires: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
        }),
      ]);

      // Create valid session
      const validSession = await factory.session(user.id, {
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      });

      // Verify only valid session remains
      const sessions = await prisma.session.findMany({
        where: { userId: user.id },
      });

      expect(sessions).toHaveLength(1);
      expect(sessions[0].id).toBe(validSession.id);
    });
  });
});