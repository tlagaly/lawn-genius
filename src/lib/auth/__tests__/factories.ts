import { prisma } from '@/lib/db/__tests__/test-client';
import { type User, type Session, type Account } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

interface UserData {
  email?: string;
  name?: string;
  image?: string | null;
}

interface SessionData {
  expires?: Date;
}

interface OAuthAccountData {
  provider: string;
  providerAccountId: string;
  access_token?: string;
  expires_at?: number;
}

class TestFactory {
  private trackedUsers: Set<string> = new Set();
  private trackedSessions: Set<string> = new Set();
  private trackedAccounts: Set<string> = new Set();

  async user(data: UserData = {}): Promise<User> {
    const userId = uuidv4();
    const email = data.email || `test.${userId}@example.com`;
    const name = data.name || `Test User ${userId}`;

    const user = await prisma.user.create({
      data: {
        id: userId,
        email,
        name,
        image: data.image,
        emailNotifications: true,
        pushNotifications: false,
        notifyFrequency: 'immediate'
      },
    });

    this.trackedUsers.add(user.id);
    return user;
  }

  async session(userId: string, data: SessionData = {}): Promise<Session> {
    const sessionToken = `session-${uuidv4()}`;
    const expires = data.expires || new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    const session = await prisma.session.create({
      data: {
        userId,
        sessionToken,
        expires,
      },
    });

    this.trackedSessions.add(session.id);
    return session;
  }

  async oauthAccount(userId: string, data: OAuthAccountData): Promise<Account> {
    const account = await prisma.account.create({
      data: {
        userId,
        type: 'oauth',
        provider: data.provider,
        providerAccountId: data.providerAccountId,
        access_token: data.access_token || 'mock-access-token',
        token_type: 'Bearer',
        scope: 'openid profile email',
        expires_at: data.expires_at || Math.floor(Date.now() / 1000) + 3600,
      },
    });

    this.trackedAccounts.add(account.id);
    return account;
  }

  async completeOAuthUser(provider: string, userData: UserData = {}) {
    const user = await this.user(userData);
    const account = await this.oauthAccount(user.id, {
      provider,
      providerAccountId: `mock-${provider}-${uuidv4()}`,
    });
    return { user, account };
  }

  cleanup = {
    users: async () => {
      if (this.trackedUsers.size > 0) {
        await prisma.user.deleteMany({
          where: { id: { in: Array.from(this.trackedUsers) } },
        });
        this.trackedUsers.clear();
      }
    },

    sessions: async () => {
      if (this.trackedSessions.size > 0) {
        await prisma.session.deleteMany({
          where: { id: { in: Array.from(this.trackedSessions) } },
        });
        this.trackedSessions.clear();
      }
    },

    accounts: async () => {
      if (this.trackedAccounts.size > 0) {
        await prisma.account.deleteMany({
          where: { id: { in: Array.from(this.trackedAccounts) } },
        });
        this.trackedAccounts.clear();
      }
    },

    all: async () => {
      await Promise.all([
        this.cleanup.sessions(),
        this.cleanup.accounts(),
        this.cleanup.users(),
      ]);
    },
  };
}

export const factory = new TestFactory();