import { appRouter } from './root';
import { createContext } from './context';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/auth-options';

export const createCaller = async () => {
  return appRouter.createCaller(
    await createContext({
      headers: new Headers(),
      session: await getServerSession(authOptions),
    })
  );
};

export const api = {
  lawn: {
    getAll: async () => {
      const caller = await createCaller();
      return caller.lawn.getAll();
    },
    getById: async (id: string) => {
      const caller = await createCaller();
      return caller.lawn.getById(id);
    },
  },
};