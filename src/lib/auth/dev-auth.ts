import { Session } from 'next-auth';

export const createDevSession = (): Session => {
  return {
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      image: null,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
};

export const isDevMode = () => process.env.NODE_ENV === 'development';

export const getDevUser = () => ({
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  image: null,
});