import { initTRPC, TRPCError } from '@trpc/server';
import { Context } from './context';
import superjson from 'superjson';

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape;
  },
});

const isAuthed = t.middleware(async ({ ctx, next }) => {
  try {
    // Check if we have a valid session
    if (ctx.session?.user?.id) {
      return next({
        ctx: {
          ...ctx,
          session: ctx.session,
        },
      });
    }

    // Development mode handling
    if (process.env.NODE_ENV === 'development') {
      console.log('Using development test account');
      const devSession = {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User',
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      return next({
        ctx: {
          ...ctx,
          session: devSession,
        },
      });
    }

    // Production unauthorized handling
    console.warn('Unauthorized access attempt', {
      headers: Object.fromEntries(ctx.headers.entries()),
      path: ctx.headers.get('x-trpc-path'),
    });

    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  } catch (error) {
    // Log the error but throw a sanitized version
    console.error('Auth middleware error:', error);
    
    if (error instanceof TRPCError) {
      throw error;
    }
    
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred while checking authentication',
    });
  }
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthed);