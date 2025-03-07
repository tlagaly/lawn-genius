import { z } from 'zod';
import { publicProcedure, router } from '../trpc';
import { weatherService } from '@/lib/weather';
import { TRPCError } from '@trpc/server';
import { TREATMENT_CONDITIONS } from '@/lib/weather/types';
import { NotificationService } from '@/lib/notifications';
import { prisma } from '@/lib/db/prisma';

const locationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  timezone: z.string()
});

export const weatherRouter = router({
  getCurrentWeather: publicProcedure
    .input(locationSchema)
    .query(async ({ input }) => {
      try {
        return await weatherService.getCurrentWeather(input);
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch weather data',
          cause: error
        });
      }
    }),

  getForecast: publicProcedure
    .input(locationSchema.extend({
      days: z.number().min(1).max(5).optional()
    }))
    .query(async ({ input }) => {
      const { days, ...location } = input;
      try {
        return await weatherService.getForecast(location, days);
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch weather forecast',
          cause: error
        });
      }
    }),

  getOptimalTreatmentTime: publicProcedure
    .input(locationSchema.extend({
      treatmentType: z.string(),
      startDate: z.date(),
      endDate: z.date()
    }))
    .query(async ({ input }) => {
      const { treatmentType, startDate, endDate, ...location } = input;
      
      if (!TREATMENT_CONDITIONS[treatmentType]) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Invalid treatment type: ${treatmentType}`
        });
      }

      try {
        return await weatherService.findOptimalTreatmentTime(
          location,
          treatmentType,
          startDate,
          endDate
        );
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to find optimal treatment time',
          cause: error
        });
      }
    }),

  getTreatmentRecommendations: publicProcedure
    .input(z.object({
      treatmentType: z.string(),
      weather: z.object({
        temperature: z.number(),
        humidity: z.number(),
        precipitation: z.number(),
        windSpeed: z.number(),
        conditions: z.string()
      })
    }))
    .query(({ input }) => {
      const { treatmentType, weather } = input;

      if (!TREATMENT_CONDITIONS[treatmentType]) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Invalid treatment type: ${treatmentType}`
        });
      }

      return weatherService.getTreatmentRecommendations(weather, treatmentType);
    }),

  analyzeTreatmentEffectiveness: publicProcedure
    .input(z.object({
      treatmentType: z.string(),
      weatherData: z.object({
        temperature: z.number(),
        humidity: z.number(),
        precipitation: z.number(),
        windSpeed: z.number(),
        conditions: z.string()
      }),
      effectiveness: z.union([
        z.literal(1),
        z.literal(2),
        z.literal(3),
        z.literal(4),
        z.literal(5)
      ])
    }))
    .query(({ input }) => {
      const { treatmentType, weatherData, effectiveness } = input;

      if (!TREATMENT_CONDITIONS[treatmentType]) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Invalid treatment type: ${treatmentType}`
        });
      }

      return weatherService.analyzeTreatmentEffectiveness(
        treatmentType,
        weatherData,
        effectiveness
      );
    }),

  getRescheduleOptions: publicProcedure
    .input(z.object({
      treatmentId: z.string(),
      treatmentType: z.string(),
      location: locationSchema,
      originalDate: z.date(),
      daysToCheck: z.number().min(1).max(14).optional()
    }))
    .query(async ({ input }) => {
      const { treatmentId, treatmentType, location, originalDate, daysToCheck } = input;

      if (!TREATMENT_CONDITIONS[treatmentType]) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Invalid treatment type: ${treatmentType}`
        });
      }

      try {
        return await weatherService.findRescheduleOptions(
          treatmentId,
          treatmentType,
          location,
          originalDate,
          daysToCheck
        );
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to find reschedule options',
          cause: error
        });
      }
    }),

  startMonitoring: publicProcedure
    .input(z.object({
      treatmentId: z.string(),
      treatmentType: z.string(),
      location: locationSchema,
      scheduledDate: z.date(),
      config: z.object({
        checkInterval: z.number().min(5).max(120).optional(),
        alertThreshold: z.number().min(1).max(5).optional(),
        forecastHours: z.number().min(1).max(72).optional()
      }).optional()
    }))
    .mutation(async ({ input }) => {
      const { treatmentId, treatmentType, location, scheduledDate, config } = input;

      if (!TREATMENT_CONDITIONS[treatmentType]) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Invalid treatment type: ${treatmentType}`
        });
      }

      try {
        await weatherService.startMonitoring(
          treatmentId,
          treatmentType,
          location,
          scheduledDate,
          config
        );
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to start weather monitoring',
          cause: error
        });
      }
    }),

  stopMonitoring: publicProcedure
    .input(z.object({
      treatmentId: z.string()
    }))
    .mutation(({ input }) => {
      try {
        weatherService.stopMonitoring(input.treatmentId);
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to stop weather monitoring',
          cause: error
        });
      }
    }),

  testEmailNotification: publicProcedure
    .mutation(async () => {
      try {
        // 1. Create a test user if not exists
        const user = await prisma.user.upsert({
          where: { email: 'test@example.com' },
          update: {},
          create: {
            email: 'test@example.com',
            emailNotifications: true,
            notifyFrequency: 'immediate',
            monitoredConditions: ['temperature', 'wind', 'precipitation', 'conditions']
          }
        });

        // 2. Create a test lawn profile
        const lawnProfile = await prisma.lawnProfile.create({
          data: {
            userId: user.id,
            name: 'Test Lawn',
            size: 1000,
            grassType: 'Bermuda',
            soilType: 'Loam',
            sunExposure: 'Full Sun',
            irrigation: true,
            latitude: 30.2672,
            longitude: -97.7431,
            timezone: 'America/Chicago'
          }
        });

        // 3. Create a test schedule
        const schedule = await prisma.schedule.create({
          data: {
            userId: user.id,
            lawnProfileId: lawnProfile.id,
            name: 'Test Schedule',
            startDate: new Date(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
          }
        });

        // 4. Create a test treatment
        const treatment = await prisma.treatment.create({
          data: {
            scheduleId: schedule.id,
            type: 'Fertilization',
            date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
            weatherScore: 2 // Low score to trigger alert
          }
        });

        // 5. Create a test weather alert
        const alert = await prisma.weatherAlert.create({
          data: {
            treatmentId: treatment.id,
            type: 'temperature',
            severity: 'warning',
            message: 'Test Alert: High temperature expected tomorrow',
            suggestedDate: new Date(Date.now() + 48 * 60 * 60 * 1000), // Day after tomorrow
          }
        });

        // 6. Send test notification
        await NotificationService.sendEmailNotification(user.id, alert);

        return {
          success: true,
          alertId: alert.id,
          userId: user.id
        };
      } catch (error) {
        console.error('Error sending test notification:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send test notification',
          cause: error
        });
      }
    })
});