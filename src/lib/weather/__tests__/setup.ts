import { PrismaClient, Prisma } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { NotificationPayload } from '@/lib/notifications/types';
import { 
  MockTreatment, 
  MockLawnProfile, 
  MockSchedule, 
  MockWeatherAlert,
  MockWeatherData,
  MockNotification 
} from './types';

// Create mock client factory
function createMockPrismaClient() {
  return mockDeep<PrismaClient>({
    weatherAlert: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    treatment: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    lawnProfile: {
      findFirst: jest.fn(),
    },
    schedule: {
      findFirst: jest.fn(),
    },
  });
}

// Mock Prisma
export const prismaMock = createMockPrismaClient();

// Mock environment variables
process.env.WEATHER_API_URL = 'https://api.weather.test';
process.env.WEATHER_API_KEY = 'test-api-key';

// Reset all mocks before each test
beforeEach(() => {
  mockReset(prismaMock);
});

const now = new Date();

// Mock database data
export const mockTreatments: MockTreatment[] = [
  {
    id: 'treatment-1',
    type: 'Fertilization',
    date: new Date('2025-03-07T14:00:00Z'),
    completed: false,
    effectiveness: null,
    weatherScore: null,
    scheduleId: 'schedule-1',
    createdAt: now,
    updatedAt: now,
    actualDuration: null,
    notes: null
  },
  {
    id: 'treatment-2',
    type: 'Weed Control',
    date: new Date('2025-03-08T14:00:00Z'),
    completed: false,
    effectiveness: null,
    weatherScore: null,
    scheduleId: 'schedule-1',
    createdAt: now,
    updatedAt: now,
    actualDuration: null,
    notes: null
  }
];

export const mockLawnProfile: MockLawnProfile = {
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
  userId: 'user-1',
  createdAt: now,
  updatedAt: now,
  notes: null
};

export const mockSchedule: MockSchedule = {
  id: 'schedule-1',
  name: 'Test Schedule',
  startDate: new Date('2025-03-07T00:00:00Z'),
  endDate: new Date('2025-03-14T00:00:00Z'),
  userId: 'user-1',
  lawnProfileId: 'lawn-1',
  createdAt: now,
  updatedAt: now
};

export const mockWeatherData: MockWeatherData = {
  id: 'weather-1',
  treatmentId: 'treatment-1',
  temperature: 22,
  humidity: 65,
  precipitation: 0,
  windSpeed: 8,
  conditions: 'Clear',
  forecast: null,
  createdAt: now,
  updatedAt: now
};

// Mock weather alerts
export const mockWeatherAlerts: MockWeatherAlert[] = [
  {
    id: 'alert-1',
    type: 'temperature',
    treatmentId: 'treatment-1',
    severity: 'warning',
    message: 'High temperature expected',
    createdAt: new Date('2025-03-07T10:00:00Z'),
    updatedAt: new Date('2025-03-07T10:00:00Z'),
    suggestedDate: new Date('2025-03-09T14:00:00Z'),
    emailSent: false,
    emailSentAt: null,
    pushSent: false,
    pushSentAt: null,
    readAt: null,
    actionTaken: null
  },
  {
    id: 'alert-2',
    type: 'wind',
    treatmentId: 'treatment-2',
    severity: 'critical',
    message: 'High wind speeds expected',
    createdAt: new Date('2025-03-08T10:00:00Z'),
    updatedAt: new Date('2025-03-08T10:00:00Z'),
    suggestedDate: new Date('2025-03-10T14:00:00Z'),
    emailSent: false,
    emailSentAt: null,
    pushSent: false,
    pushSentAt: null,
    readAt: null,
    actionTaken: null
  }
];

// Add relations to mock objects
mockTreatments[0].schedule = mockSchedule;
mockTreatments[0].weatherData = mockWeatherData;
mockTreatments[0].weatherAlerts = [mockWeatherAlerts[0]];

mockTreatments[1].schedule = mockSchedule;
mockTreatments[1].weatherAlerts = [mockWeatherAlerts[1]];

mockSchedule.treatments = mockTreatments;
mockSchedule.lawnProfile = mockLawnProfile;

mockWeatherAlerts[0].treatment = mockTreatments[0];
mockWeatherAlerts[1].treatment = mockTreatments[1];

mockWeatherData.treatment = mockTreatments[0];

// Configure Prisma mock responses
export function setupPrismaMocks() {
  // Mock find operations
  prismaMock.treatment.findFirst.mockResolvedValue(mockTreatments[0] as any);
  prismaMock.treatment.findMany.mockResolvedValue(mockTreatments as any);
  prismaMock.lawnProfile.findFirst.mockResolvedValue(mockLawnProfile as any);
  prismaMock.schedule.findFirst.mockResolvedValue(mockSchedule as any);
  prismaMock.weatherAlert.findMany.mockResolvedValue(mockWeatherAlerts as any);
  
  // Mock create operations with Prisma client return types
  type WeatherAlertClient = Prisma.Prisma__WeatherAlertClient<any, never>;
  type TreatmentClient = Prisma.Prisma__TreatmentClient<any, never>;

  prismaMock.weatherAlert.create.mockImplementation((args: any) => {
    const data = args.data;
    const alert: MockWeatherAlert = {
      id: 'new-alert-1',
      type: data.type,
      treatmentId: data.treatmentId,
      severity: data.severity,
      message: data.message,
      suggestedDate: data.suggestedDate || null,
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date(),
      emailSent: false,
      emailSentAt: null,
      pushSent: false,
      pushSentAt: null,
      readAt: null,
      actionTaken: null,
      treatment: mockTreatments.find(t => t.id === data.treatmentId),
      notifications: []
    };

    const client = Promise.resolve(alert) as WeatherAlertClient;
    Object.assign(client, {
      treatment: () => Promise.resolve(alert.treatment),
      notifications: () => Promise.resolve(alert.notifications)
    });

    return client;
  });
  
  prismaMock.treatment.create.mockImplementation((args: any) => {
    const data = args.data;
    const treatment: MockTreatment = {
      id: 'new-treatment-1',
      type: data.type,
      date: data.date,
      completed: false,
      effectiveness: null,
      weatherScore: null,
      scheduleId: data.scheduleId,
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date(),
      actualDuration: null,
      notes: null,
      schedule: mockSchedule,
      weatherData: undefined,
      weatherAlerts: []
    };

    const client = Promise.resolve(treatment) as TreatmentClient;
    Object.assign(client, {
      schedule: () => Promise.resolve(treatment.schedule),
      weatherData: () => Promise.resolve(treatment.weatherData),
      weatherAlerts: () => Promise.resolve(treatment.weatherAlerts)
    });

    return client;
  });
}

// Export type for Prisma mock
export type PrismaMockType = DeepMockProxy<PrismaClient>;