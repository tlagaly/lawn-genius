import { NextAuthOptions } from "next-auth";
import { AdapterUser } from "next-auth/adapters";
import CredentialsProvider from "next-auth/providers/credentials";
import { formatTokenData, validateToken, createExpiration } from "./jwt";
import { sessionEvents, sessionPersistence } from "./session";
import { Session, User, JWT, UserRole } from "./types";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        // TODO: Implement actual user authentication
        // This is a placeholder that should be replaced with your actual auth logic
        const user = {
          id: "1",
          email: credentials.email,
          name: "Test User",
          role: "USER" as UserRole
        };

        return user;
      }
    })
  ],

  // Session configuration
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 60 * 60, // 1 hour
  },

  // JWT configuration
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  },

  // Callbacks
  callbacks: {
    // Handle JWT token creation and updates
    async jwt({ token, user, account }): Promise<JWT> {
      // Initial sign in
      if (account && user) {
        const newToken: JWT = {
          ...token,
          sub: user.id,
          email: user.email || "",
          name: user.name,
          picture: user.image,
          role: (user as User).role || "USER",
          exp: createExpiration(24)
        };
        return newToken;
      }

      // Return previous token if not expired
      const validation = validateToken(token as JWT);
      if (validation.isValid) {
        return token as JWT;
      }

      // Token has expired, create new one with reduced data
      return {
        ...token,
        exp: createExpiration(24)
      } as JWT;
    },

    // Transform token into session
    async session({ session, token }): Promise<Session> {
      if (!token) {
        throw new Error("No token available");
      }

      // Validate token before creating session
      const validation = validateToken(token as JWT);
      if (!validation.isValid) {
        throw new Error(validation.error || "Invalid token");
      }

      // Format user data from token
      const userData = formatTokenData(token as JWT);
      
      // Update session with user data
      const updatedSession: Session = {
        ...session,
        user: {
          ...session.user,
          ...userData,
        },
      };

      // Save session state
      sessionPersistence.save(updatedSession);

      return updatedSession;
    },
  },

  // Event handlers
  events: {
    async signIn({ user }) {
      // Clean up any existing session data
      sessionPersistence.clear();
      
      // Initialize new session
      await sessionEvents.onSignIn({
        user: user as User,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
    },

    async signOut() {
      await sessionEvents.onSignOut();
    },

    async session({ session }) {
      // Verify and update session state
      const stored = sessionPersistence.restore();
      if (stored && stored.userId !== session.user.id) {
        // Session mismatch, force cleanup
        sessionPersistence.clear();
        throw new Error("Session mismatch detected");
      }
    },
  },

  pages: {
    signIn: "/auth/login",
    signOut: "/auth/logout",
    error: "/auth/error",
  },
};