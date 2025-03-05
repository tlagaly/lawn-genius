import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

const treatmentSchema = z.object({
  type: z.string().min(1),
  date: z.date(),
  notes: z.string().optional(),
});

const scheduleSchema = z.object({
  name: z.string().min(1),
  lawnProfileId: z.string(),
  startDate: z.date(),
  endDate: z.date().optional(),
  treatments: z.array(treatmentSchema).optional(),
});

export const scheduleRouter = router({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.schedule.findMany({
      where: { userId: ctx.session.user.id },
      include: {
        treatments: true,
        lawnProfile: true,
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
          treatments: true,
          lawnProfile: true,
        },
      });
    }),

  create: protectedProcedure
    .input(scheduleSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify lawn profile ownership
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
      // Verify schedule ownership
      const schedule = await ctx.prisma.schedule.findFirst({
        where: {
          id: input.scheduleId,
          userId: ctx.session.user.id,
        },
      });

      if (!schedule) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Schedule not found',
        });
      }

      return ctx.prisma.treatment.create({
        data: {
          ...input.treatment,
          scheduleId: input.scheduleId,
        },
      });
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
      });

      if (!treatment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Treatment not found',
        });
      }

      return ctx.prisma.treatment.update({
        where: { id: input.id },
        data: input.data,
      });
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
});