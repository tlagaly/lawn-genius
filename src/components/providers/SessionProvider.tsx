import { FC, ReactNode, useEffect } from 'react';
import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { sessionEvents, sessionPersistence } from '@/lib/auth/session';
import { Session } from '@/lib/auth/types';

interface SessionProviderProps {
  children: ReactNode;
  session?: Session | null;
}

export const SessionProvider: FC<SessionProviderProps> = ({ children, session }) => {
  useEffect(() => {
    // Set up session change listener
    const handleStorageChange = async (event: StorageEvent) => {
      if (event.key === 'next-auth.session-token') {
        if (event.newValue) {
          // New session established
          if (session) {
            await sessionEvents.onSignIn(session);
            sessionPersistence.save(session);
          }
        } else {
          // Session ended
          await sessionEvents.onSignOut();
          sessionPersistence.clear();
        }
      }
    };

    // Clean up any orphaned session data on mount
    const storedSession = sessionPersistence.restore();
    if (storedSession && (!session || storedSession.userId !== session.user.id)) {
      sessionPersistence.clear();
    }

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [session]);

  return (
    <NextAuthSessionProvider
      session={session}
      refetchInterval={5 * 60} // Refetch session every 5 minutes
      refetchOnWindowFocus={true}
    >
      {children}
    </NextAuthSessionProvider>
  );
};

export default SessionProvider;