import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';

const lawnGrassCompositionSchema = z.object({
  speciesId: z.string().min(1),
  percentage: z.number().min(1).max(100),
});

const lawnProfileSchema = z.object({
  name: z.string().min(1),
  size: z.number().positive(),
  soilType: z.string().min(1),
  sunExposure: z.string().min(1),
  irrigation: z.boolean(),
  location: z.string().optional(),
  notes: z.string().optional(),
  grassComposition: z.array(lawnGrassCompositionSchema),
});

export const lawnRouter = router({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.lawnProfile.findMany({
      where: { userId: ctx.session.user.id },
      include: {
        schedules: true,
        grassSpecies: {
          include: {
            species: true,
          },
        },
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
          grassSpecies: {
            include: {
              species: true,
            },
          },
        },
      });
    }),

  create: protectedProcedure
    .input(lawnProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const { grassComposition, ...profileData } = input;

      return ctx.prisma.$transaction(async (tx) => {
        // Create lawn profile
        const profile = await tx.lawnProfile.create({
          data: {
            ...profileData,
            userId: ctx.session.user.id,
            grassSpecies: {
              create: grassComposition.map(comp => ({
                speciesId: comp.speciesId,
                percentage: comp.percentage,
              })),
            },
          },
          include: {
            grassSpecies: {
              include: {
                species: true,
              },
            },
          },
        });

        return profile;
      });
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: lawnProfileSchema.partial(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { grassComposition, ...profileData } = input.data;

      return ctx.prisma.$transaction(async (tx) => {
        // Delete existing grass composition if updating it
        if (grassComposition) {
          await tx.lawnGrassComposition.deleteMany({
            where: { lawnProfileId: input.id },
          });
        }

        // Update lawn profile and create new grass composition if provided
        return tx.lawnProfile.update({
          where: {
            id: input.id,
            userId: ctx.session.user.id,
          },
          data: {
            ...profileData,
            ...(grassComposition && {
              grassSpecies: {
                create: grassComposition.map(comp => ({
                  speciesId: comp.speciesId,
                  percentage: comp.percentage,
                })),
              },
            }),
          },
          include: {
            grassSpecies: {
              include: {
                species: true,
              },
            },
          },
        });
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