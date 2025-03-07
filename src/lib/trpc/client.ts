import { createTRPCReact } from '@trpc/react-query';
import { type AppRouter } from '@/lib/trpc/root';

export const api = createTRPCReact<AppRouter>();

export const getBaseUrl = () => {
  if (typeof window !== 'undefined') return ''; // Browser should use relative URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`; // Dev SSR should use localhost
};

export const getUrl = () => {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/api/trpc`;
};

// Export config for consistent port usage
export const config = {
  defaultPort: 3000,
  apiPath: '/api/trpc',
  links: {
    maxRetries: 3,
    retryDelay: 500,
  },
};