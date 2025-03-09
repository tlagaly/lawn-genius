import { defineConfig } from 'cypress';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3001',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    setupNodeEvents(on, config) {
      on('task', {
        async 'db:reset'() {
          try {
            // Clean up the database
            await prisma.$transaction([
              prisma.user.deleteMany(),
              // Add other model cleanups here as needed
            ]);
            
            return null;
          } catch (error) {
            console.error('Error resetting database:', error);
            throw error;
          }
        },
        
        async 'db:seed:test'() {
          try {
            // Add any test data seeding here
            return null;
          } catch (error) {
            console.error('Error seeding test data:', error);
            throw error;
          }
        },

        async 'db:createUser'({ email, password }) {
          try {
            const user = await prisma.user.create({
              data: {
                email,
                password, // Note: In real implementation, this should be hashed
              },
            });
            return user;
          } catch (error) {
            console.error('Error creating test user:', error);
            throw error;
          }
        }
      });
      
      return config;
    },
  },
  retries: {
    runMode: 2,
    openMode: 0
  },
  env: {
    apiUrl: 'http://localhost:3001/api',
  }
});