// Mock environment variables
process.env.OPENWEATHER_API_KEY = 'test-api-key';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';

// Mock NextAuth session
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

// Mock TRPC context
jest.mock('@/lib/trpc/context', () => ({
  createContext: jest.fn(),
}));

// Reset all mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});

// Clean up after all tests
afterAll(() => {
  jest.resetAllMocks();
});