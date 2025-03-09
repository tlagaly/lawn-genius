import { Session } from 'next-auth';
import { JWT } from 'next-auth/jwt';

export const createDevSession = (): JWT => {
  const now = Math.floor(Date.now() / 1000);
  const id = 'test-user-id';
  return {
    id,
    name: 'Test User',
    email: 'test@example.com',
    sub: id,
    picture: null,
    role: 'USER',
    iat: now,
    exp: now + (24 * 60 * 60), // 24 hours
    jti: `dev-session-${now}`,
  };
};

export const isDevMode = () => process.env.NODE_ENV === 'development';

export const getDevUser = () => ({
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  image: null,
  role: 'USER',
});