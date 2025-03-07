import { inferAsyncReturnType } from '@trpc/server';
import { getServerSession, Session } from 'next-auth';
import { prisma } from '../db/prisma';
import { authOptions } from '../auth/auth-options';
import { headers as NextHeaders, type ReadonlyHeaders } from 'next/headers';
import { isDevMode, createDevSession } from '../auth/dev-auth';

interface CreateContextOptions {
  headers: ReadonlyHeaders | Headers;
  session: Session | null;
}

export async function createContext(opts: CreateContextOptions) {
  try {
    // Convert headers to a format we can work with
    const headers = new Headers();
    if (opts.headers instanceof Headers) {
      Array.from(opts.headers.entries()).forEach(([key, value]) => {
        headers.set(key, value);
      });
    } else {
      // Handle next/headers ReadonlyHeaders
      opts.headers.forEach((value: string, key: string) => {
        headers.set(key, value);
      });
    }

    // Handle development mode
    if (isDevMode()) {
      return {
        session: createDevSession(),
        headers,
        prisma,
      };
    }

    // Check for user token from middleware
    const userToken = headers.get('x-user-token');
    if (userToken) {
      try {
        const tokenData = JSON.parse(userToken);
        if (tokenData && tokenData.exp && tokenData.exp > Date.now() / 1000) {
          return {
            session: {
              user: {
                id: tokenData.sub,
                email: tokenData.email,
                name: tokenData.name,
                image: tokenData.picture,
              },
              expires: new Date(tokenData.exp * 1000).toISOString(),
            },
            headers,
            prisma,
          };
        }
      } catch (error) {
        console.warn('Error parsing user token:', error);
      }
    }

    // Validate session if present
    if (opts.session) {
      const now = Date.now();
      const expires = new Date(opts.session.expires).getTime();
      
      if (expires < now) {
        console.warn('Session has expired');
        return {
          session: null,
          headers,
          prisma,
        };
      }

      return {
        session: opts.session,
        headers,
        prisma,
      };
    }

    // No valid authentication found
    return {
      session: null,
      headers,
      prisma,
    };
  } catch (error) {
    console.error('Error creating context:', error);
    // Return a safe default context on error
    return {
      session: null,
      headers: new Headers(),
      prisma,
    };
  }
}

export type Context = inferAsyncReturnType<typeof createContext>;