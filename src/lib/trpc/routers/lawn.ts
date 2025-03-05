import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';

const lawnProfileSchema = z.object({
  name: z.string().min(1),
  size: z.number().positive(),
  grassType: z.string().min(1),
  soilType: z.string().min(1),
  sunExposure: z.string().min(1),
  irrigation: z.boolean(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

export const lawnRouter = router({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.lawnProfile.findMany({
      where: { userId: ctx.session.user.id },
      include: {
        schedules: true,
      },
    });
  }),

  getById: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      return ctx.prisma.lawnProfile.findFirst({
        where: {
          id: input,
          userId: ctx.session.user.id,
        },
        include: {
          schedules: {
            include: {
              treatments: true,
            },
          },
        },
      });
    }),

  create: protectedProcedure
    .input(lawnProfileSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.lawnProfile.create({
        data: {
          ...input,
          userId: ctx.session.user.id,
        },
      });
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: lawnProfileSchema.partial(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.lawnProfile.update({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
        data: input.data,
      });
    }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.lawnProfile.delete({
        where: {
          id: input,
          userId: ctx.session.user.id,
        },
      });
    }),
});