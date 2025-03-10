import { getSession, signOut } from "next-auth/react";
import { validateToken } from "./jwt";
import {
  ValidSession,
  toValidSession,
  ensureValidSession,
  ensureValidSessionUser
} from "./types";
import { createStorage } from "./storage";
import type { Session } from "next-auth";

export interface SessionStatus {
  isAuthenticated: boolean;
  isLoading: boolean;
  error?: string;
}

interface StoredSessionData {
  userId: string;
  expires: string;
}

interface ValidStoredSession extends StoredSessionData {
  userId: string;
  expires: string;
}

const storage = createStorage();

/**
 * Type guard for validating stored session data
 */
const isValidStoredSession = (data: unknown): data is ValidStoredSession => {
  if (!data || typeof data !== 'object') return false;
  
  const sessionData = data as Record<string, unknown>;
  return !!(
    'userId' in sessionData &&
    typeof sessionData.userId === 'string' &&
    'expires' in sessionData &&
    typeof sessionData.expires === 'string'
  );
};

/**
 * Ensure stored session data is valid
 */
const ensureValidStoredSession = (data: unknown): ValidStoredSession => {
  if (!isValidStoredSession(data)) {
    throw new Error('Invalid stored session data');
  }
  return data;
};

/**
 * Initialize and validate the current session
 */
export const initializeSession = async (): Promise<SessionStatus> => {
  try {
    const session = await getSession();
    const validSession = session && toValidSession(session);

    if (!validSession) {
      return {
        isAuthenticated: false,
        isLoading: false,
        error: "Invalid or missing session"
      };
    }

    ensureValidSessionUser(validSession);

    // Validate session expiration
    const expires = new Date(validSession.expires);
    if (expires < new Date()) {
      await signOut({ redirect: false });
      return {
        isAuthenticated: false,
        isLoading: false,
        error: "Session expired"
      };
    }

    // Validate session token
    const token = (session as any).token;
    if (token) {
      const validation = validateToken(token);
      if (!validation.isValid) {
        await signOut({ redirect: false });
        return {
          isAuthenticated: false,
          isLoading: false,
          error: validation.error
        };
      }
    }

    return {
      isAuthenticated: true,
      isLoading: false
    };
  } catch (error) {
    console.error("Session initialization error:", error);
    return {
      isAuthenticated: false,
      isLoading: false,
      error: error instanceof Error ? error.message : "Failed to initialize session"
    };
  }
};

/**
 * Session event handlers
 */
export const sessionEvents = {
  onSignIn: async (session: Session) => {
    try {
      // Clean up any existing session data first
      sessionPersistence.clear();

      // Validate new session
      const status = await initializeSession();
      if (!status.isAuthenticated) {
        throw new Error(status.error || "Session validation failed after sign in");
      }

      // Convert and validate session
      const validSession = toValidSession(session);
      if (!validSession) {
        throw new Error("Invalid session data");
      }

      ensureValidSessionUser(validSession);
      return sessionPersistence.save(validSession);
    } catch (error) {
      console.error("Sign in event handler error:", error);
      return false;
    }
  },

  onSignOut: async () => {
    try {
      // Clear all session data
      sessionPersistence.clear();
      
      // Clear any other auth-related state
      const authKeys = ["next-auth.callback-url", "next-auth.message"] as const;
      for (const key of authKeys) {
        storage.removeItem(key);
      }
      
      return true;
    } catch (error) {
      console.error("Sign out event handler error:", error);
      return false;
    }
  }
};

/**
 * Session persistence helpers
 */
export const sessionPersistence = {
  save: (session: ValidSession): boolean => {
    try {
      ensureValidSessionUser(session);

      const sessionData: ValidStoredSession = {
        userId: session.user.id,
        expires: session.expires
      };

      // Serialize and store data
      const serialized = JSON.stringify(sessionData);
      const success = storage.setItem("sessionState", serialized);

      if (!success) {
        throw new Error("Failed to save session state");
      }

      return true;
    } catch (error) {
      console.error("Failed to save session state:", error);
      return false;
    }
  },

  restore: (): ValidStoredSession | null => {
    try {
      const data = storage.getItem("sessionState");
      if (!data) return null;

      let parsedData: unknown;
      try {
        parsedData = JSON.parse(data);
      } catch {
        this.clear();
        return null;
      }

      // Validate and ensure type safety
      const validData = ensureValidStoredSession(parsedData);

      // Check expiration
      const expires = new Date(validData.expires);
      if (expires < new Date()) {
        this.clear();
        return null;
      }

      return validData;
    } catch (error) {
      console.error("Failed to restore session state:", error);
      this.clear();
      return null;
    }
  },

  clear: (): void => {
    if (storage) {
      storage.removeItem("sessionState");
    }
  }
};