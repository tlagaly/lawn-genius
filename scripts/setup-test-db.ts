const { PrismaClient: TestPrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

async function setupTestDb() {
  // Drop and recreate test database
  try {
    execSync(`
      psql -U postgres -c "DROP DATABASE IF EXISTS test;"
      psql -U postgres -c "DROP USER IF EXISTS test;"
      psql -U postgres -c "CREATE USER test WITH PASSWORD 'test';"
      psql -U postgres -c "CREATE DATABASE test OWNER test;"
      psql -U postgres -d test -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO test;"
      psql -U postgres -d test -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO test;"
      psql -U postgres -d test -c "GRANT ALL PRIVILEGES ON SCHEMA public TO test;"
    `);
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }

  // Initialize Prisma client with test database
  const prisma = new TestPrismaClient({
    datasources: {
      db: {
        url: 'postgresql://test:test@localhost:5432/test'
      }
    }
  });

  try {
    // Push the schema to test database
    execSync('npx prisma db push --schema=./prisma/schema.prisma --force-reset', {
      env: {
        ...process.env,
        DATABASE_URL: 'postgresql://test:test@localhost:5432/test'
      }
    });

    console.log('Test database setup complete!');
  } catch (error) {
    console.error('Error pushing schema:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupTestDb().catch(error => {
  console.error('Setup failed:', error);
  process.exit(1);
});