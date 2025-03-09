import { PrismaClient } from '@prisma/client';
import { loadDatabaseConfig, getConnectionUrl } from './config';

// Declare global prisma instance type
declare global {
  var _prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  const config = loadDatabaseConfig();
  const url = getConnectionUrl(config);

  return new PrismaClient({
    datasources: {
      db: {
        url,
      },
    },
    // Log queries in development
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

// Use a single Prisma instance across the app
const prisma = globalThis._prisma ?? createPrismaClient();

// Set global instance in development for hot reloading
if (process.env.NODE_ENV !== 'production') {
  globalThis._prisma = prisma;
}

export { prisma };

/**
 * Ensures database connection is properly established
 */
export async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Failed to connect to database:', error);
    throw error;
  }
}

/**
 * Gracefully disconnects from the database
 */
export async function disconnectDatabase() {
  try {
    await prisma.$disconnect();
    console.log('Database disconnected successfully');
  } catch (error) {
    console.error('Error disconnecting from database:', error);
    throw error;
  }
}

// Handle cleanup on process termination
process.on('SIGINT', async () => {
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectDatabase();
  process.exit(0);
});