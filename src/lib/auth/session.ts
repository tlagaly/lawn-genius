import { Session } from "next-auth";
import { getSession, signOut } from "next-auth/react";
import { validateToken, needsRefresh } from "./jwt";

export interface SessionStatus {
  isAuthenticated: boolean;
  isLoading: boolean;
  error?: string;
}

/**
 * Session management utilities
 */

/**
 * Initialize and validate the current session
 */
export const initializeSession = async (): Promise<SessionStatus> => {
  try {
    const session = await getSession();

    if (!session) {
      return {
        isAuthenticated: false,
        isLoading: false,
        error: "No session found"
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

      // Check if token needs refresh
      if (needsRefresh(token)) {
        // Token will be refreshed automatically by NextAuth on next request
        return {
          isAuthenticated: true,
          isLoading: true
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
      error: "Failed to initialize session"
    };
  }
};

/**
 * Session event handlers
 */
export const sessionEvents = {
  onSignIn: async (session: Session) => {
    try {
      // Validate new session
      const status = await initializeSession();
      if (!status.isAuthenticated) {
        throw new Error(status.error || "Session validation failed after sign in");
      }

      // Update any necessary UI state or perform post-sign-in tasks
      return true;
    } catch (error) {
      console.error("Sign in event handler error:", error);
      return false;
    }
  },

  onSignOut: async () => {
    try {
      // Clear any persistent session data
      window.sessionStorage.removeItem("sessionState");
      window.localStorage.removeItem("sessionState");
      
      // Perform any additional cleanup
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
  save: (session: Session) => {
    try {
      // Save minimal session data
      const sessionData = {
        userId: session.user.id,
        expires: session.expires
      };
      
      // Save to both storage types for resilience
      window.sessionStorage.setItem("sessionState", JSON.stringify(sessionData));
      window.localStorage.setItem("sessionState", JSON.stringify(sessionData));
      
      return true;
    } catch (error) {
      console.error("Failed to save session state:", error);
      return false;
    }
  },

  restore: function(): { userId: string; expires: string } | null {
    try {
      // Try session storage first, fall back to local storage
      const data = window.sessionStorage.getItem("sessionState") ||
                   window.localStorage.getItem("sessionState");
      if (!data) return null;

      const sessionData = JSON.parse(data);
      
      // Validate restored data
      if (!sessionData.userId || !sessionData.expires) {
        return null;
      }

      // Check if expired
      if (new Date(sessionData.expires) < new Date()) {
        this.clear();
        return null;
      }

      return sessionData;
    } catch (error) {
      console.error("Failed to restore session state:", error);
      return null;
    }
  },

  clear: () => {
    window.sessionStorage.removeItem("sessionState");
    window.localStorage.removeItem("sessionState");
  }
};