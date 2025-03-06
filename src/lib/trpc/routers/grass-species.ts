import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

const grassSpeciesSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  scientificName: z.string().min(1, 'Scientific name is required'),
  type: z.enum(['cool-season', 'warm-season']),
  characteristics: z.object({
    growthHabit: z.string(),
    leafTexture: z.string(),
    color: z.string(),
    rootSystem: z.string(),
    droughtTolerance: z.number().min(1).max(5),
    shadeTolerance: z.number().min(1).max(5),
    wearTolerance: z.number().min(1).max(5),
  }),
  idealConditions: z.object({
    soilPH: z.object({
      min: z.number(),
      max: z.number(),
    }),
    soilTypes: z.array(z.string()),
    temperature: z.object({
      min: z.number(),
      max: z.number(),
      optimal: z.number(),
    }),
    annualRainfall: z.object({
      min: z.number(),
      max: z.number(),
    }),
  }),
  maintenance: z.object({
    mowingHeight: z.object({
      min: z.number(),
      max: z.number(),
      optimal: z.number(),
    }),
    wateringNeeds: z.number().min(1).max(5),
    fertilizationFrequency: z.string(),
    aerationFrequency: z.string(),
  }),
  commonMixes: z.array(z.string()),
  mainImage: z.string().optional(),
  images: z.array(z.string()).optional(),
  imageDescriptions: z.object({
    main: z.string().optional(),
    additional: z.record(z.string()).optional(),
  }).optional(),
});

export const grassSpeciesRouter = router({
  // Create a new grass species
  create: protectedProcedure
    .input(grassSpeciesSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.grassSpecies.create({
        data: input,
      });
    }),

  // Update an existing grass species
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: grassSpeciesSchema.partial(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.grassSpecies.update({
        where: { id: input.id },
        data: input.data,
      });
    }),

  // Get a single grass species by ID
  getById: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const species = await ctx.prisma.grassSpecies.findUnique({
        where: { id: input },
        include: {
          treatments: {
            include: {
              treatment: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                  description: true,
                  season: true,
                  frequency: true,
                },
              },
            },
          },
          citations: true,
        },
      });

      if (!species) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Grass species not found',
        });
      }

      return species;
    }),

  // Get all grass species
  getAll: protectedProcedure
    .input(z.object({
      type: z.enum(['cool-season', 'warm-season']).optional(),
      search: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const where = {
        ...(input?.type && { type: input.type }),
        ...(input?.search && {
          OR: [
            { name: { contains: input.search, mode: 'insensitive' } },
            { scientificName: { contains: input.search, mode: 'insensitive' } },
          ],
        }),
      };

      return ctx.prisma.grassSpecies.findMany({
        where,
        select: {
          id: true,
          name: true,
          scientificName: true,
          type: true,
          characteristics: true,
          idealConditions: true,
          maintenance: true,
          commonMixes: true,
          mainImage: true,
          images: true,
          imageDescriptions: true,
          treatments: {
            include: {
              treatment: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                  description: true,
                  season: true,
                  frequency: true,
                },
              },
            },
          },
        },
      });
    }),

  // Get recommended mixes for a grass species
  getRecommendedMixes: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const species = await ctx.prisma.grassSpecies.findUnique({
        where: { id: input },
        select: { commonMixes: true },
      });

      if (!species) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Grass species not found',
        });
      }

      return ctx.prisma.grassSpecies.findMany({
        where: {
          name: {
            in: species.commonMixes,
          },
        },
      });
    }),

  // Get treatments effective for a grass species
  getEffectiveTreatments: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      return ctx.prisma.speciesTreatment.findMany({
        where: {
          speciesId: input,
          effectiveness: {
            gte: 4, // Only highly effective treatments (4-5 rating)
          },
        },
        include: {
          treatment: true,
        },
        orderBy: {
          effectiveness: 'desc',
        },
      });
    }),
});