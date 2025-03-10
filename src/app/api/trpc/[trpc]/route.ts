import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/server/api/root';
import { createContext } from '@/lib/trpc/context';
import { NextRequest } from 'next/server';
import { TRPCError } from '@trpc/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

const handler = (req: NextRequest) => {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: async () => {
      const session = await getServerSession(authOptions);
      return createContext({
        headers: req.headers,
        session,
      });
    },
    onError:
      process.env.NODE_ENV === 'development'
        ? ({ path, error }: { path: string | undefined; error: TRPCError }) => {
            console.error(
              `❌ tRPC failed on ${path ?? '<no-path>'}: ${error.message}`
            );
          }
        : undefined,
  });
};

export { handler as GET, handler as POST };