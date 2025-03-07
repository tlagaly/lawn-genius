import { PrismaClient } from '@prisma/client';
import { ExtendedPrismaClient } from '@/lib/db/prisma-extensions';

declare global {
  namespace NodeJS {
    interface Global {
      prisma: ExtendedPrismaClient | undefined;
    }
  }

  // For non-NodeJS environments
  var prisma: ExtendedPrismaClient | undefined;
}

export {};