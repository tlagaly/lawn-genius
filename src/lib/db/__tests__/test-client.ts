import { PrismaClient } from '@prisma/client';

// Create a test-specific client without weather extensions
const testPrismaClient = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['error'],
});

// Initialize database state
async function initializeTestDb() {
  try {
    // Clean up any existing data
    await testPrismaClient.$transaction(async (tx) => {
      await tx.account.deleteMany();
      await tx.session.deleteMany();
      await tx.passwordReset.deleteMany();
      await tx.user.deleteMany();
    });

    // Wait for cleanup to complete
    await new Promise(resolve => setTimeout(resolve, 1000));
  } catch (error) {
    console.error('Error initializing test database:', error);
    throw error;
  }
}

// Initialize on import
initializeTestDb().catch(error => {
  console.error('Failed to initialize test database:', error);
  process.exit(1);
});

// Ensure clean shutdown
process.on('beforeExit', async () => {
  await testPrismaClient.$disconnect();
});

export { testPrismaClient as prisma };