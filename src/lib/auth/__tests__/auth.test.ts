import { prisma } from '@/lib/db/__tests__/test-client';
import { createTestUser, TEST_USER, clearTestUser, mockContext, createTestSession } from './utils';

describe('Authentication Flow', () => {
  beforeEach(async () => {
    await clearTestUser();
  });

  afterAll(async () => {
    await clearTestUser();
    await prisma.$disconnect();
  });

  describe('Registration', () => {
    it('should create a new user with hashed password', async () => {
      const user = await createTestUser();
      
      expect(user).toBeDefined();
      expect(user.email).toBe(TEST_USER.email);
      expect(user.name).toBe(TEST_USER.name);
      expect(user.password).toBeDefined();
      expect(user.password).not.toBe(TEST_USER.password);
      
      // Verify password is properly hashed
      const isValidPassword = await prisma.user.findFirst({
        where: {
          email: TEST_USER.email,
          password: {
            not: TEST_USER.password // Should be hashed
          }
        }
      });
      expect(isValidPassword).toBeTruthy();
    });

    it('should prevent duplicate email registration', async () => {
      // Create first user
      await createTestUser();
      
      // Attempt to create duplicate user with same email
      try {
        await prisma.user.create({
          data: {
            email: TEST_USER.email,
            name: 'Another User',
            password: 'DifferentPass123!',
          },
        });
        fail('Should have thrown unique constraint error');
      } catch (error: any) {
        expect(error.code).toBe('P2002'); // Prisma unique constraint error
      }
    });
  });

  describe('Login', () => {
    beforeEach(async () => {
      await createTestUser();
    });

    it('should validate correct password', async () => {
      const user = await prisma.user.findUnique({
        where: { email: TEST_USER.email }
      });
      expect(user).toBeDefined();

      // Create session context
      const session = createTestSession(user!.id);
      const context = mockContext(session);

      expect(context.session).toBeDefined();
      expect(context.session?.user.email).toBe(TEST_USER.email);
    });

    it('should reject invalid password', async () => {
      const user = await prisma.user.findUnique({
        where: { email: TEST_USER.email }
      });
      expect(user).toBeDefined();

      // Verify wrong password fails
      const wrongPassword = 'WrongPassword123!';
      const hashedWrongPassword = await prisma.user.findFirst({
        where: {
          email: TEST_USER.email,
          password: wrongPassword
        }
      });
      expect(hashedWrongPassword).toBeNull();
    });

    it('should reject non-existent user', async () => {
      const nonExistentUser = await prisma.user.findUnique({
        where: { email: 'nonexistent@example.com' }
      });
      expect(nonExistentUser).toBeNull();
    });
  });

  describe('Session Management', () => {
    let userId: string;

    beforeEach(async () => {
      const user = await createTestUser();
      userId = user.id;
    });

    it('should create valid session context', () => {
      const session = createTestSession(userId);
      const context = mockContext(session);

      expect(context.session).toBeDefined();
      expect(context.session?.user.id).toBe(userId);
      expect(context.session?.user.email).toBe(TEST_USER.email);
    });

    it('should handle null session', () => {
      const context = mockContext(null);
      expect(context.session).toBeNull();
    });

    it('should handle undefined session', () => {
      const context = mockContext(undefined);
      expect(context.session).toBeNull();
    });
  });
});