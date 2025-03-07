import { PrismaClient } from '@prisma/client';

// Extend PrismaClient to include WeatherTrainingData
declare global {
  namespace PrismaClient {
    interface WeatherTrainingData {
      id: string;
      weatherData: any; // JSON type in database
      treatmentType: string;
      effectiveness: number;
      timestamp: Date;
      dataQuality?: number;
      confidence?: number;
      validationScore?: number;
    }
  }
}

// Extend PrismaClient with WeatherTrainingData model
export interface PrismaClientWithWeatherTraining extends PrismaClient {
  weatherTrainingData: {
    create: (args: { data: Partial<PrismaClient.WeatherTrainingData> }) => Promise<PrismaClient.WeatherTrainingData>;
    findMany: (args?: {
      orderBy?: { [key: string]: 'asc' | 'desc' };
      take?: number;
      where?: any;
    }) => Promise<PrismaClient.WeatherTrainingData[]>;
  };
}

// Export the extended type
export type ExtendedPrismaClient = PrismaClientWithWeatherTraining;