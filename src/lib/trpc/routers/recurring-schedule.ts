import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { generateOccurrences, validateRecurrencePattern } from '@/lib/utils/recurrence';
import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';

// Constants and types
const scheduleInclude = {
  recurrencePattern: true,
  treatments: true,
} as any;

// Helper functions
function serializeRecurrencePattern(pattern: any) {
  return {
    ...pattern,
    weekdays: pattern.weekdays ? JSON.stringify(pattern.weekdays) : null,
  };
}

// Zod schemas
const recurrencePatternSchema = z.object({
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  interval: z.number().min(1),
  weekdays: z.array(z.number().min(0).max(6)).optional(),
  monthDay: z.number().min(1).max(31).optional(),
  endType: z.enum(['never', 'after_occurrences', 'on_date']),
  occurrences: z.number().min(1).optional(),
  endDate: z.date().optional(),
});

const treatmentSchema = z.object({
  type: z.string().min(1),
  date: z.date(),
  notes: z.string().optional(),
  completed: z.boolean().optional(),
  effectiveness: z.number().min(1).max(5).optional(),
  weatherScore: z.number().min(1).max(5).optional(),
  actualDuration: z.number().optional(),
});

const recurringScheduleInput = z.object({
  name: z.string().min(1),
  lawnProfileId: z.string(),
  startDate: z.date(),
  endDate: z.date().optional(),
  treatments: z.array(treatmentSchema).optional(),
  recurrencePattern: recurrencePatternSchema,
});

// Router
export const recurringScheduleRouter = router({
  create: protectedProcedure
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

      // Create schedule with recurrence pattern
      const schedule = await ctx.prisma.schedule.create({
        data: {
          name: input.name,
          startDate: input.startDate,
          endDate: input.endDate,
          userId: ctx.session.user.id,
          lawnProfileId: input.lawnProfileId,
          isRecurring: true as const,
          recurrencePattern: {
            create: serializeRecurrencePattern(input.recurrencePattern),
          },
        },
        include: {
          recurrencePattern: true,
          treatments: true,
        },
      } as Prisma.ScheduleCreateArgs);

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

  update: protectedProcedure
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
        include: scheduleInclude,
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
              treatments: true,
            },
          } as Prisma.ScheduleUpdateArgs);

        case 'future':
          const futureSchedule = await ctx.prisma.schedule.create({
            data: {
              name: input.data.name,
              startDate: input.data.startDate,
              endDate: input.data.endDate,
              userId: ctx.session.user.id,
              lawnProfileId: input.data.lawnProfileId,
              isRecurring: true as const,
              recurrencePattern: {
                create: serializeRecurrencePattern(input.data.recurrencePattern),
              },
            },
            include: {
              recurrencePattern: true,
              treatments: true,
            },
          } as Prisma.ScheduleCreateArgs);

          // Move future treatments to new schedule
          await ctx.prisma.treatment.updateMany({
            where: {
              scheduleId: input.id,
              date: { gt: new Date() },
            },
            data: {
              scheduleId: futureSchedule.id,
            },
          });

          return futureSchedule;

        case 'all':
          // Update schedule and recurrence pattern
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
            include: {
              recurrencePattern: true,
              treatments: true,
            },
          } as Prisma.ScheduleUpdateArgs);

          // Delete future treatments
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
            include: scheduleInclude,
          });
      }
    }),
});