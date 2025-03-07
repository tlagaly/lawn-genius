import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

// Mock Prisma
export const prismaMock = mockDeep<PrismaClient>();

// Mock environment variables
process.env.WEATHER_API_URL = 'https://api.weather.test';
process.env.WEATHER_API_KEY = 'test-api-key';

// Reset all mocks before each test
beforeEach(() => {
  mockReset(prismaMock);
});

// Mock database data
export const mockTreatments = [
  {
    id: 'treatment-1',
    type: 'Fertilization',
    date: new Date('2025-03-07T14:00:00Z'),
    completed: false,
    effectiveness: null,
    weatherScore: null,
    scheduleId: 'schedule-1'
  },
  {
    id: 'treatment-2',
    type: 'Weed Control',
    date: new Date('2025-03-08T14:00:00Z'),
    completed: false,
    effectiveness: null,
    weatherScore: null,
    scheduleId: 'schedule-1'
  }
];

export const mockLawnProfile = {
  id: 'lawn-1',
  name: 'Test Lawn',
  size: 1000,
  grassType: 'Bermuda',
  soilType: 'Loam',
  sunExposure: 'Full Sun',
  irrigation: true,
  latitude: 30.2672,
  longitude: -97.7431,
  timezone: 'America/Chicago',
  userId: 'user-1'
};

export const mockSchedule = {
  id: 'schedule-1',
  name: 'Test Schedule',
  startDate: new Date('2025-03-07T00:00:00Z'),
  endDate: new Date('2025-03-14T00:00:00Z'),
  userId: 'user-1',
  lawnProfileId: 'lawn-1',
  treatments: mockTreatments,
  lawnProfile: mockLawnProfile
};

// Mock weather alerts
export const mockWeatherAlerts = [
  {
    id: 'alert-1',
    treatmentId: 'treatment-1',
    type: 'temperature' as const,
    severity: 'warning' as const,
    message: 'High temperature expected',
    createdAt: new Date('2025-03-07T10:00:00Z'),
    suggestedDate: new Date('2025-03-09T14:00:00Z')
  },
  {
    id: 'alert-2',
    treatmentId: 'treatment-2',
    type: 'wind' as const,
    severity: 'critical' as const,
    message: 'High wind speeds expected',
    createdAt: new Date('2025-03-08T10:00:00Z'),
    suggestedDate: new Date('2025-03-10T14:00:00Z')
  }
];

// Configure Prisma mock responses
export function setupPrismaMocks() {
  prismaMock.treatment.findFirst.mockResolvedValue(mockTreatments[0]);
  prismaMock.treatment.findMany.mockResolvedValue(mockTreatments);
  prismaMock.lawnProfile.findFirst.mockResolvedValue(mockLawnProfile);
  prismaMock.schedule.findFirst.mockResolvedValue(mockSchedule);
  prismaMock.weatherAlert.findMany.mockResolvedValue(mockWeatherAlerts);
  
  // Mock create operations
  prismaMock.weatherAlert.create.mockImplementation(async (args: { data: any }) => ({
    id: 'new-alert-1',
    ...args.data,
    createdAt: new Date()
  }));
  
  prismaMock.treatment.create.mockImplementation(async (args: { data: any }) => ({
    id: 'new-treatment-1',
    ...args.data,
    completed: false,
    effectiveness: null,
    weatherScore: null
  }));
}

// Export type for Prisma mock
export type PrismaMockType = DeepMockProxy<PrismaClient>;