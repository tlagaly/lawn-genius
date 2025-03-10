import { NextAuthOptions, Session, User } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db/prisma";
import { PrismaClient, Prisma } from "@prisma/client";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { JWT } from "next-auth/jwt";

// Define custom types
interface CustomUser extends User {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
}

export interface CustomSession extends Session {
  user: {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
  };
}

// Extend JWT type to ensure exp is a number
declare module "next-auth/jwt" {
  interface JWT {
    exp: number;
  }
}

// Helper function to validate token
const isTokenValid = (token: JWT): boolean => {
  const now = Math.floor(Date.now() / 1000);
  return !!(token.sub && token.email && token.exp && token.exp > now);
};

// Helper function to clean up expired sessions
const cleanupExpiredSessions = async (userId: string) => {
  await prisma.session.deleteMany({
    where: {
      userId,
      expires: { lt: new Date() }
    }
  });
};

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error("NEXTAUTH_SECRET must be set");
}

export const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV === 'development',
  useSecureCookies: process.env.NODE_ENV === 'production',
  jwt: {
    encode: ({ secret, token }) => {
      const encodedToken = process.env.NODE_ENV === 'development'
        ? Buffer.from(JSON.stringify(token)).toString('base64')
        : token;
      return encodedToken as string;
    },
    decode: async ({ secret, token }) => {
      if (!token) return null;
      try {
        return process.env.NODE_ENV === 'development'
          ? JSON.parse(Buffer.from(token, 'base64').toString())
          : token;
      } catch {
        return null;
      }
    },
  },
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: process.env.NODE_ENV === "development" ? 30 * 24 * 60 * 60 : 24 * 60 * 60, // 30 days in dev, 24 hours in prod
    updateAge: 24 * 60 * 60, // 24 hours - Force token refresh
  },
  pages: {
    signIn: "/auth/login",
    newUser: "/auth/register",
    error: "/auth/error",
  },
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "Enter your email"
        },
        password: {
          label: "Password",
          type: "password",
          placeholder: "Enter your password"
        },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Email and password are required");
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            select: {
              id: true,
              email: true,
              name: true,
              image: true,
              password: true
            }
          });

          if (!user || !user.password) {
            throw new Error("Invalid email or password");
          }

          const isValid = await bcrypt.compare(credentials.password, user.password);

          if (!isValid) {
            throw new Error("Invalid email or password");
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role
          } as CustomUser;
        } catch (error) {
          console.error("Auth error:", error);
          throw error;
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture
        } as CustomUser;
      }
    }),
  ],
  callbacks: {
    async session({ token, session, trigger }): Promise<CustomSession> {
      try {
        // Validate token
        if (!isTokenValid(token)) {
          throw new Error("Invalid session token");
        }

        const now = Math.floor(Date.now() / 1000);
        const expiresAt = token.exp || now + (24 * 60 * 60);

        // Handle session update triggers
        if (trigger === "update") {
          // Verify user still exists and has active subscription
          const user = await prisma.user.findUnique({
            where: { id: token.sub },
            select: {
              id: true,
              subscription: {
                select: {
                  status: true,
                  endDate: true
                }
              }
            }
          });

          if (!user) {
            throw new Error("User no longer exists");
          }

          // Check subscription status
          if (user.subscription) {
            const subStatus = user.subscription.status;
            const subEndDate = user.subscription.endDate;
            
            if (subStatus === "canceled" || (subEndDate && new Date(subEndDate) < new Date())) {
              // Downgrade to basic access
              token.role = "USER";
            }
          }
        }

        // Clean up expired sessions periodically (1% chance per session call)
        if (Math.random() < 0.01) {
          await prisma.session.deleteMany({
            where: {
              userId: token.sub,
              expires: { lt: new Date() }
            }
          });
        }

        return {
          ...session,
          user: {
            id: token.sub!,
            name: token.name || null,
            email: token.email!,
            image: token.picture || null
          },
          expires: new Date(expiresAt * 1000).toISOString(),
        };
      } catch (error) {
        console.error("Session callback error:", error);
        // Return a minimal session on error to force re-authentication
        return {
          ...session,
          user: {
            id: token.sub!,
            email: token.email!,
            name: null,
            image: null
          },
          expires: new Date(Date.now()).toISOString(), // Immediate expiry
        };
      }
    },
    async jwt({ token, user, account, trigger }): Promise<JWT> {
      try {
        const now = Math.floor(Date.now() / 1000);

        // Handle initial sign in
        if (trigger === "signIn" || trigger === "signUp") {
          if (user) {
            const customUser = user as CustomUser;
            return {
              ...token,
              sub: customUser.id,
              name: customUser.name,
              email: customUser.email,
              picture: customUser.image,
              exp: now + (24 * 60 * 60), // 24 hours from now
            };
          }
        }

        // Handle token refresh with improved error handling and race condition prevention
        const refreshThreshold = token.exp - 60 * 60; // 1 hour before expiry
        if (now > refreshThreshold) {
          try {
            // Use a transaction to prevent race conditions
            const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
              const user = await tx.user.findUnique({
                where: { id: token.sub },
                select: {
                  id: true,
                  email: true,
                  name: true,
                  image: true,
                  sessions: {
                    where: {
                      expires: { gt: new Date() }
                    }
                  }
                }
              });

              if (!user) {
                throw new Error("User not found during token refresh");
              }

              // Cleanup expired sessions within transaction
              await tx.session.deleteMany({
                where: {
                  userId: user.id,
                  expires: { lt: new Date() }
                }
              });

              return user;
            });

            // Calculate new expiry outside transaction
            const newExp = Math.floor(Date.now() / 1000) + (24 * 60 * 60);
            
            return {
              ...token,
              name: result.name,
              email: result.email,
              picture: result.image,
              role: result.role || "USER",
              exp: newExp,
            };
          } catch (error) {
            console.error("Token refresh failed:", error);
            // On critical failure, invalidate the token to force re-login
            if (error instanceof Error && error.message === "User not found during token refresh") {
              return {
                ...token,
                exp: now, // Immediate expiry
              };
            }
            // For other errors, extend by 5 minutes to prevent login loops
            return {
              ...token,
              exp: now + (5 * 60),
            };
          }
        }

        // If no refresh needed, return existing token
        return token;
      } catch (error) {
        console.error("JWT callback error:", error);
        throw error;
      }
    },
  },
  events: {
    async signIn({ user }) {
      await cleanupExpiredSessions(user.id);
    },
    async signOut({ token }) {
      if (token.sub) {
        await cleanupExpiredSessions(token.sub);
      }
    }
  },
};