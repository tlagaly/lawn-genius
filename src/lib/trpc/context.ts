import { inferAsyncReturnType } from '@trpc/server';
import { CreateNextContextOptions } from '@trpc/server/adapters/next';
import { getServerSession } from 'next-auth';
import { prisma } from '../db/prisma';
import { authOptions } from '../auth/auth-options';

export async function createContext(opts: CreateNextContextOptions) {
  const session = await getServerSession(opts.req, opts.res, authOptions);

  return {
    session,
    prisma,
    // Add any other context properties here
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;