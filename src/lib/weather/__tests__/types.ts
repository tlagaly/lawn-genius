import { Prisma } from '@prisma/client';

export interface MockTreatment {
  id: string;
  type: string;
  date: Date;
  completed: boolean;
  effectiveness: number | null;
  weatherScore: number | null;
  scheduleId: string;
  createdAt: Date;
  updatedAt: Date;
  actualDuration: number | null;
  notes: string | null;
  schedule?: MockSchedule;
  weatherData?: MockWeatherData;
  weatherAlerts?: MockWeatherAlert[];
}

export interface MockLawnProfile {
  id: string;
  name: string;
  size: number;
  grassType: string;
  soilType: string;
  sunExposure: string;
  irrigation: boolean;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  notes: string | null;
}

export interface MockSchedule {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date | null;
  userId: string;
  lawnProfileId: string;
  createdAt: Date;
  updatedAt: Date;
  treatments?: MockTreatment[];
  lawnProfile?: MockLawnProfile;
}

export interface MockWeatherAlert {
  id: string;
  type: string;
  treatmentId: string;
  severity: string;
  message: string;
  suggestedDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  emailSent: boolean;
  emailSentAt: Date | null;
  pushSent: boolean;
  pushSentAt: Date | null;
  readAt: Date | null;
  actionTaken: string | null;
  treatment?: MockTreatment;
  notifications?: MockNotification[];
}

export interface MockWeatherData {
  id: string;
  treatmentId: string;
  temperature: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  conditions: string;
  forecast: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
  treatment?: MockTreatment;
}

export interface MockNotification {
  id: string;
  alertId: string;
  type: string;
  status: string;
  error: string | null;
  sentAt: Date;
  deliveredAt: Date | null;
  alert?: MockWeatherAlert;
}