import { PrismaClient } from '@prisma/client';
import { ExtendedPrismaClient } from './prisma-extensions';

// Use global type from global.d.ts
const prismaClient = new PrismaClient() as ExtendedPrismaClient;

if (process.env.NODE_ENV !== 'production') {
  if (!global.prisma) {
    global.prisma = prismaClient;
  }
}

export const prisma = global.prisma || prismaClient;