import { FC, ReactNode, useEffect } from 'react';
import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';
import { initializeSession, sessionPersistence, sessionEvents } from '@/lib/auth/session';

interface SessionProviderProps {
  children: ReactNode;
  session?: Session | null;
}

export const SessionProvider: FC<SessionProviderProps> = ({ children, session }) => {
  useEffect(() => {
    const initSession = async () => {
      try {
        const status = await initializeSession();
        
        if (!status.isAuthenticated && status.error) {
          console.error('Session initialization failed:', status.error);
        }
      } catch (error) {
        console.error('Failed to initialize session:', error);
      }
    };

    initSession();

    // Set up session change listener
    const handleStorageChange = async (event: StorageEvent) => {
      if (event.key === 'next-auth.session-token') {
        const newSession = await initializeSession();
        
        if (newSession.isAuthenticated && session) {
          await sessionEvents.onSignIn(session);
          sessionPersistence.save(session);
        } else if (!newSession.isAuthenticated) {
          await sessionEvents.onSignOut();
          sessionPersistence.clear();
        }
      }
    };

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