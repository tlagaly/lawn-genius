import { DefaultSession, Session as NextAuthSession } from "next-auth";
import { JWT as NextAuthJWT } from "next-auth/jwt";

export type UserRole = "USER" | "ADMIN";

// Extend the built-in session type
declare module "next-auth" {
  interface Session extends DefaultSession {
    expires: string;
  }

  interface User {
    id: string;
    email: string;
    role?: UserRole;
  }
}

export interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  role?: UserRole;
}

export interface ValidSession {
  user: Required<Pick<SessionUser, 'id' | 'email'>> & Omit<SessionUser, 'id' | 'email'>;
  expires: string;
}

export interface JWT extends NextAuthJWT {
  role?: UserRole;
  exp: number;
}

export type { NextAuthSession };

/**
 * Session type guards and utilities
 */

// Type guard for session user
export const isSessionUser = (user: unknown): user is Required<Pick<SessionUser, 'id' | 'email'>> & Omit<SessionUser, 'id' | 'email'> => {
  if (!user || typeof user !== 'object') return false;
  
  const userObj = user as Record<string, unknown>;
  return !!(
    'id' in userObj &&
    typeof userObj.id === 'string' &&
    'email' in userObj &&
    typeof userObj.email === 'string'
  );
};

// Type guard for valid session
export const isValidSession = (session: unknown): session is ValidSession => {
  if (!session || typeof session !== 'object') return false;
  
  const sessionObj = session as Record<string, unknown>;
  if (!('user' in sessionObj && 'expires' in sessionObj)) return false;
  if (typeof sessionObj.expires !== 'string') return false;
  
  return isSessionUser(sessionObj.user);
};

// Convert NextAuth session to ValidSession
export const toValidSession = (session: NextAuthSession): ValidSession | null => {
  if (!session?.user?.email || !session?.user?.id) return null;

  const validSession: ValidSession = {
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name ?? null,
      image: session.user.image ?? null,
      role: (session.user as any).role
    },
    expires: session.expires
  };

  return validSession;
};

// Function to ensure session has required properties
export function ensureValidSession(session: unknown): ValidSession {
  if (!isValidSession(session)) {
    throw new Error('Invalid session data');
  }
  return session;
}

// Function to ensure session has required user properties
export function ensureValidSessionUser(session: ValidSession): asserts session is ValidSession & { user: Required<Pick<SessionUser, 'id' | 'email'>> } {
  if (!session.user?.id || !session.user?.email) {
    throw new Error('Session missing required user properties');
  }
}