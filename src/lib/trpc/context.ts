import { inferAsyncReturnType } from '@trpc/server';
import { getServerSession, Session } from 'next-auth';
import { prisma } from '../db/prisma';
import { authOptions } from '../auth/auth-options';

interface CreateContextOptions {
  headers: Headers;
  session: Session | null;
}

export async function createContext(opts: CreateContextOptions) {
  return {
    session: opts.session,
    prisma,
    // Add any other context properties here
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;