import { createTRPCReact } from '@trpc/react-query';
import { type AppRouter } from '@/lib/trpc/root';

export const api = createTRPCReact<AppRouter>();

export const getBaseUrl = () => {
  if (typeof window !== 'undefined') return '';
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
};

export const getUrl = () => {
  return `${getBaseUrl()}/api/trpc`;
};