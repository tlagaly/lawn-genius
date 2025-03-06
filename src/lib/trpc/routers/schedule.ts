import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { weatherService } from '@/lib/weather';
import { TREATMENT_CONDITIONS } from '@/lib/weather/types';
import { Prisma } from '@prisma/client';

// Basic types and helpers
const scheduleInclude = {
  treatments: {
    include: {
      weatherData: true,
    },
  },
  lawnProfile: true,
  recurrencePattern: true,
} as any;

function handleRecurrencePattern(data: any) {
  if (!data.recurrencePattern) return undefined;

  const { weekdays, ...rest } = data.recurrencePattern;
  return {
    ...rest,
    weekdays: weekdays ? JSON.stringify(weekdays) : null,
  };
}

function createScheduleData(data: any) {
  const recurrenceData = handleRecurrencePattern(data);
  return {
    ...data,
    isRecurring: !!recurrenceData,
    recurrencePattern: recurrenceData ? { create: recurrenceData } : undefined,
  } as any;
}

function updateScheduleData(data: any) {
  const recurrenceData = handleRecurrencePattern(data);
  return {
    ...data,
    recurrencePattern: recurrenceData ? { update: recurrenceData } : undefined,
  } as any;
}
import {
  generateOccurrences,
  validateRecurrencePattern,
  type Frequency,
  type EndType,
  type RecurrencePatternInput
} from '@/lib/utils/recurrence';

const recurrencePatternSchema = z.object({
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  interval: z.number().min(1),
  weekdays: z.array(z.number().min(0).max(6)).optional(),
  monthDay: z.number().min(1).max(31).optional(),
  endType: z.enum(['never', 'after_occurrences', 'on_date']),
  occurrences: z.number().min(1).optional(),
  endDate: z.date().optional(),
});

function serializeRecurrencePattern(pattern: z.infer<typeof recurrencePatternSchema>) {
  return {
    ...pattern,
    weekdays: pattern.weekdays ? JSON.stringify(pattern.weekdays) : undefined,
  };
}

function deserializeRecurrencePattern(pattern: any) {
  return {
    ...pattern,
    weekdays: pattern.weekdays ? JSON.parse(pattern.weekdays) : undefined,
  };
}

const treatmentSchema = z.object({
  type: z.string().min(1),
  date: z.date(),
  notes: z.string().optional(),
  completed: z.boolean().optional(),
  effectiveness: z.number().min(1).max(5).optional(),
  weatherScore: z.number().min(1).max(5).optional(),
  actualDuration: z.number().optional(),
});

const weatherDataSchema = z.object({
  temperature: z.number(),
  humidity: z.number(),
  precipitation: z.number(),
  windSpeed: z.number(),
  conditions: z.string(),
});

const scheduleSchema = z.object({
  name: z.string().min(1),
  lawnProfileId: z.string(),
  startDate: z.date(),
  endDate: z.date().optional(),
  treatments: z.array(treatmentSchema).optional(),
  isRecurring: z.boolean().optional(),
  recurrencePattern: recurrencePatternSchema.optional(),
});

const recurringScheduleInput = z.object({
  name: z.string().min(1),
  lawnProfileId: z.string(),
  startDate: z.date(),
  endDate: z.date().optional(),
  treatments: z.array(treatmentSchema).optional(),
  recurrencePattern: recurrencePatternSchema,
});

export const scheduleRouter = router({
  // Weather-based scheduling
  findOptimalTime: protectedProcedure
    .input(z.object({
      lawnProfileId: z.string(),
      treatmentType: z.string(),
      startDate: z.date(),
      endDate: z.date(),
    }))
    .mutation(async ({ ctx, input }) => {
      const lawnProfile = await ctx.prisma.lawnProfile.findFirst({
        where: {
          id: input.lawnProfileId,
          userId: ctx.session.user.id,
        },
      });

      if (!lawnProfile || !lawnProfile.latitude || !lawnProfile.longitude || !lawnProfile.timezone) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Lawn profile must have location data for weather-based scheduling',
        });
      }

      return weatherService.findOptimalTreatmentTime(
        {
          latitude: lawnProfile.latitude,
          longitude: lawnProfile.longitude,
          timezone: lawnProfile.timezone,
        },
        input.treatmentType,
        input.startDate,
        input.endDate
      );
    }),

  checkWeatherConflicts: protectedProcedure
    .input(z.object({
      lawnProfileId: z.string(),
      treatmentType: z.string(),
      date: z.date(),
    }))
    .mutation(async ({ ctx, input }) => {
      const lawnProfile = await ctx.prisma.lawnProfile.findFirst({
        where: {
          id: input.lawnProfileId,
          userId: ctx.session.user.id,
        },
      });

      if (!lawnProfile || !lawnProfile.latitude || !lawnProfile.longitude || !lawnProfile.timezone) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Lawn profile must have location data for weather checking',
        });
      }

      const weather = await weatherService.getCurrentWeather({
        latitude: lawnProfile.latitude,
        longitude: lawnProfile.longitude,
        timezone: lawnProfile.timezone,
      });

      return {
        weather,
        recommendations: weatherService.getTreatmentRecommendations(weather, input.treatmentType),
        score: weatherService.calculateWeatherScore(weather, input.treatmentType),
      };
    }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.schedule.findMany({
      where: { userId: ctx.session.user.id },
      include: {
        treatments: {
          include: {
            weatherData: true,
          },
        },
        lawnProfile: true,
        recurrencePattern: true,
      },
    });
  }),

  getById: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      return ctx.prisma.schedule.findFirst({
        where: {
          id: input,
          userId: ctx.session.user.id,
        },
        include: {
          treatments: {
            include: {
              weatherData: true,
            },
          },
          lawnProfile: true,
        },
      });
    }),

  create: protectedProcedure
    .input(scheduleSchema)
    .mutation(async ({ ctx, input }) => {
      const lawnProfile = await ctx.prisma.lawnProfile.findFirst({
        where: {
          id: input.lawnProfileId,
          userId: ctx.session.user.id,
        },
      });

      if (!lawnProfile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Lawn profile not found',
        });
      }

      return ctx.prisma.schedule.create({
        data: {
          name: input.name,
          startDate: input.startDate,
          endDate: input.endDate,
          userId: ctx.session.user.id,
          lawnProfileId: input.lawnProfileId,
          treatments: input.treatments ? {
            create: input.treatments,
          } : undefined,
        },
        include: {
          treatments: true,
        },
      });
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: scheduleSchema.partial(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.schedule.update({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
        data: {
          name: input.data.name,
          startDate: input.data.startDate,
          endDate: input.data.endDate,
          lawnProfileId: input.data.lawnProfileId,
        },
      });
    }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.schedule.delete({
        where: {
          id: input,
          userId: ctx.session.user.id,
        },
      });
    }),

  // Treatment management
  addTreatment: protectedProcedure
    .input(z.object({
      scheduleId: z.string(),
      treatment: treatmentSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify schedule ownership and get lawn profile
      const schedule = await ctx.prisma.schedule.findFirst({
        where: {
          id: input.scheduleId,
          userId: ctx.session.user.id,
        },
        include: {
          lawnProfile: true,
        },
      });

      if (!schedule) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Schedule not found',
        });
      }

      // Get weather data if location is available
      let weatherData = null;
      if (schedule.lawnProfile.latitude && schedule.lawnProfile.longitude && schedule.lawnProfile.timezone) {
        try {
          weatherData = await weatherService.getCurrentWeather({
            latitude: schedule.lawnProfile.latitude,
            longitude: schedule.lawnProfile.longitude,
            timezone: schedule.lawnProfile.timezone,
          });
        } catch (error) {
          console.error('Failed to fetch weather data:', error);
        }
      }

      // Calculate weather score if weather data is available
      const weatherScore = weatherData 
        ? weatherService.calculateWeatherScore(weatherData, input.treatment.type)
        : undefined;

      // Create treatment with weather data
      const treatment = await ctx.prisma.treatment.create({
        data: {
          ...input.treatment,
          scheduleId: input.scheduleId,
          weatherScore,
        },
      });

      // Create weather condition record if weather data is available
      if (weatherData) {
        await ctx.prisma.weatherCondition.create({
          data: {
            treatmentId: treatment.id,
            ...weatherData,
            forecast: Prisma.JsonNull, // We'll add forecast data in a separate update
          },
        });
      }

      return treatment;
    }),

  updateTreatment: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: treatmentSchema.partial(),
    }))
    .mutation(async ({ ctx, input }) => {
      const treatment = await ctx.prisma.treatment.findFirst({
        where: {
          id: input.id,
          schedule: {
            userId: ctx.session.user.id,
          },
        },
        include: {
          schedule: {
            include: {
              lawnProfile: true,
            },
          },
          weatherData: true,
        },
      });

      if (!treatment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Treatment not found',
        });
      }

      // If effectiveness is being updated and we have weather data, analyze it
      let effectiveness = input.data.effectiveness;
      if (effectiveness && treatment.weatherData) {
        const insights = await weatherService.analyzeTreatmentEffectiveness(
          treatment.type,
          treatment.weatherData,
          effectiveness
        );

        // Add insights to notes if they exist
        if (insights.length > 0) {
          input.data.notes = input.data.notes
            ? `${input.data.notes}\n\nWeather Analysis:\n${insights.join('\n')}`
            : `Weather Analysis:\n${insights.join('\n')}`;
        }
      }

      return ctx.prisma.treatment.update({
        where: { id: input.id },
        data: input.data,
        include: {
          weatherData: true,
        },
      });
    }),

  analyzeTreatmentEffectiveness: protectedProcedure
    .input(z.object({
      treatmentId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const treatment = await ctx.prisma.treatment.findFirst({
        where: {
          id: input.treatmentId,
          schedule: {
            userId: ctx.session.user.id,
          },
        },
        include: {
          weatherData: true,
        },
      });

      if (!treatment || !treatment.effectiveness || !treatment.weatherData) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Treatment must have both effectiveness rating and weather data for analysis',
        });
      }

      return weatherService.analyzeTreatmentEffectiveness(
        treatment.type,
        treatment.weatherData,
        treatment.effectiveness
      );
    }),

  deleteTreatment: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const treatment = await ctx.prisma.treatment.findFirst({
        where: {
          id: input,
          schedule: {
            userId: ctx.session.user.id,
          },
        },
      });

      if (!treatment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Treatment not found',
        });
      }

      return ctx.prisma.treatment.delete({
        where: { id: input },
      });
    }),

  getUpcomingTreatments: protectedProcedure
    .query(async ({ ctx }) => {
      const now = new Date();
      const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

      return ctx.prisma.treatment.findMany({
        where: {
          schedule: {
            userId: ctx.session.user.id,
          },
          date: {
            gte: now,
            lte: twoWeeksFromNow,
          },
          completed: false,
        },
        include: {
          schedule: {
            include: {
              lawnProfile: true,
            },
          },
          weatherAlerts: true,
        },
      });
    }),

  rescheduleTreatment: protectedProcedure
    .input(z.object({
      treatmentId: z.string(),
      newDate: z.date(),
    }))
    .mutation(async ({ ctx, input }) => {
      const treatment = await ctx.prisma.treatment.findFirst({
        where: {
          id: input.treatmentId,
          schedule: {
            userId: ctx.session.user.id,
          },
        },
        include: {
          schedule: {
            include: {
              lawnProfile: true,
            },
          },
        },
      });

      if (!treatment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Treatment not found',
        });
      }

      // Stop weather monitoring for the old schedule
      weatherService.stopMonitoring(input.treatmentId);

      // Update the treatment date
      const updatedTreatment = await ctx.prisma.treatment.update({
        where: { id: input.treatmentId },
        data: {
          date: input.newDate,
          weatherAlerts: {
            deleteMany: {}, // Clear old alerts
          },
        },
        include: {
          schedule: {
            include: {
              lawnProfile: true,
            },
          },
        },
      });

      // Start monitoring with new date if lawn profile has location
      if (
        updatedTreatment.schedule.lawnProfile.latitude &&
        updatedTreatment.schedule.lawnProfile.longitude &&
        updatedTreatment.schedule.lawnProfile.timezone
      ) {
        await weatherService.startMonitoring(
          updatedTreatment.id,
          updatedTreatment.type,
          {
            latitude: updatedTreatment.schedule.lawnProfile.latitude,
            longitude: updatedTreatment.schedule.lawnProfile.longitude,
            timezone: updatedTreatment.schedule.lawnProfile.timezone,
          },
          updatedTreatment.date
        );
      }

      return updatedTreatment;
    }),

  // Recurring schedule management
  createRecurringSchedule: protectedProcedure
    .input(recurringScheduleInput)
    .mutation(async ({ ctx, input }) => {
      const lawnProfile = await ctx.prisma.lawnProfile.findFirst({
        where: {
          id: input.lawnProfileId,
          userId: ctx.session.user.id,
        },
      });

      if (!lawnProfile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Lawn profile not found',
        });
      }

      const errors = validateRecurrencePattern(input.recurrencePattern);
      if (errors.length > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Invalid recurrence pattern: ${errors.join(', ')}`,
        });
      }

      // Create the schedule with recurrence pattern
      const schedule = await ctx.prisma.schedule.create({
        data: {
          name: input.name,
          startDate: input.startDate,
          endDate: input.endDate,
          userId: ctx.session.user.id,
          lawnProfileId: input.lawnProfileId,
          isRecurring: true,
          recurrencePattern: {
            create: serializeRecurrencePattern(input.recurrencePattern),
          },
        },
        include: {
          recurrencePattern: true,
        },
      });

      // Generate recurring treatments
      const dates = generateOccurrences(input.recurrencePattern, {
        startDate: input.startDate,
        endDate: input.endDate,
        maxOccurrences: input.recurrencePattern.occurrences,
      });

      // Create treatments for each date
      if (input.treatments) {
        const treatments = dates.flatMap(date =>
          input.treatments!.map(treatment => ({
            ...treatment,
            date,
            scheduleId: schedule.id,
          }))
        );

        await ctx.prisma.treatment.createMany({
          data: treatments,
        });
      }

      return schedule;
    }),

  updateRecurringSchedule: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: recurringScheduleInput,
      updateMode: z.enum(['single', 'future', 'all']),
    }))
    .mutation(async ({ ctx, input }) => {
      const schedule = await ctx.prisma.schedule.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
        include: {
          recurrencePattern: true,
          treatments: true,
        },
      });

      if (!schedule) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Schedule not found',
        });
      }

      const errors = validateRecurrencePattern(input.data.recurrencePattern);
      if (errors.length > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Invalid recurrence pattern: ${errors.join(', ')}`,
        });
      }

      switch (input.updateMode) {
        case 'single':
          // Update just this schedule
          return ctx.prisma.schedule.update({
            where: { id: input.id },
            data: {
              name: input.data.name,
              startDate: input.data.startDate,
              endDate: input.data.endDate,
              lawnProfileId: input.data.lawnProfileId,
              recurrencePattern: {
                update: serializeRecurrencePattern(input.data.recurrencePattern),
              },
            },
            include: {
              recurrencePattern: true,
            },
          });

        case 'future':
          // Create new schedule for future occurrences
          const futureSchedule = await ctx.prisma.schedule.create({
            data: {
              name: input.data.name,
              startDate: input.data.startDate,
              endDate: input.data.endDate,
              userId: ctx.session.user.id,
              lawnProfileId: input.data.lawnProfileId,
              isRecurring: true,
              recurrencePattern: {
                create: serializeRecurrencePattern(input.data.recurrencePattern),
              },
            },
            include: {
              recurrencePattern: true,
            },
          });

          // Move future treatments to new schedule
          const now = new Date();
          await ctx.prisma.treatment.updateMany({
            where: {
              scheduleId: input.id,
              date: { gt: now },
            },
            data: {
              scheduleId: futureSchedule.id,
            },
          });

          return futureSchedule;

        case 'all':
          // Update this schedule and create new treatments
          await ctx.prisma.schedule.update({
            where: { id: input.id },
            data: {
              name: input.data.name,
              startDate: input.data.startDate,
              endDate: input.data.endDate,
              lawnProfileId: input.data.lawnProfileId,
              recurrencePattern: {
                update: serializeRecurrencePattern(input.data.recurrencePattern),
              },
            },
          });

          // Delete all future treatments
          await ctx.prisma.treatment.deleteMany({
            where: {
              scheduleId: input.id,
              date: { gt: new Date() },
            },
          });

          // Generate new treatments
          const newDates = generateOccurrences(input.data.recurrencePattern, {
            startDate: input.data.startDate,
            endDate: input.data.endDate,
            maxOccurrences: input.data.recurrencePattern.occurrences,
          });

          if (input.data.treatments) {
            const newTreatments = newDates.flatMap(date =>
              input.data.treatments!.map(treatment => ({
                ...treatment,
                date,
                scheduleId: input.id,
              }))
            );

            await ctx.prisma.treatment.createMany({
              data: newTreatments,
            });
          }

          return ctx.prisma.schedule.findUnique({
            where: { id: input.id },
            include: {
              recurrencePattern: true,
            },
          });
      }
    }),
});