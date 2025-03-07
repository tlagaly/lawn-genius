import { appRouter } from '../root';
import { createContext } from '../context';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/auth-options';
import { headers } from 'next/headers';
import { createDevSession, isDevMode } from '../../auth/dev-auth';

export const createCaller = async () => {
  try {
    // Get real headers from next/headers
    const headersList = headers();
    
    // Get session with proper error handling
    let session = null;
    try {
      session = await getServerSession(authOptions);
    } catch (error) {
      console.error('Error getting server session:', error);
      // Don't throw here - let dev mode handle it
    }

    // Fall back to dev session if needed
    if (!session && isDevMode()) {
      console.log('Using development session');
      session = createDevSession();
    }

    // Create context with proper headers and session
    const context = await createContext({
      headers: headersList,
      session,
    });

    return appRouter.createCaller(context);
  } catch (error) {
    console.error('Error creating TRPC caller:', {
      error,
      headers: Object.fromEntries(headers().entries()),
    });
    throw error;
  }
};

/**
 * Server-side API helpers with enhanced error handling and logging
 */
export const api = {
  lawn: {
    getAll: async () => {
      try {
        const caller = await createCaller();
        return caller.lawn.getAll();
      } catch (error) {
        console.error('Error in lawn.getAll:', {
          error,
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV,
        });
        
        // Rethrow as TRPCError for consistent error handling
        if (!(error instanceof TRPCError)) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch lawn profiles',
            cause: error,
          });
        }
        throw error;
      }
    },
    getById: async (id: string) => {
      try {
        const caller = await createCaller();
        return caller.lawn.getById(id);
      } catch (error) {
        console.error('Error in lawn.getById:', {
          error,
          lawnId: id,
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV,
        });
        
        // Rethrow as TRPCError for consistent error handling
        if (!(error instanceof TRPCError)) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch lawn profile',
            cause: error,
          });
        }
        throw error;
      }
    },
  },
};