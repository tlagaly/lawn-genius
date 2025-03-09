import { z } from 'zod';
import { hash } from 'bcrypt';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { generateResetToken, sendResetEmail, validateResetToken, resetPassword } from '@/lib/auth/password-reset';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import type { Context } from '../trpc';

// Profile validation schemas
const privacySettingsSchema = z.object({
  profileVisibility: z.enum(['public', 'private', 'contacts']),
  showEmail: z.boolean(),
  showPhone: z.boolean(),
  showLocation: z.boolean(),
  showExpertise: z.boolean(),
});

const socialLinksSchema = z.object({
  twitter: z.string().url().optional(),
  linkedin: z.string().url().optional(),
  facebook: z.string().url().optional(),
  instagram: z.string().url().optional(),
  website: z.string().url().optional(),
}).optional();

const profileSchema = z.object({
  displayName: z.string().min(2).max(50).optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  profession: z.string().max(50).optional(),
  organization: z.string().max(100).optional(),
  expertise: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  socialLinks: socialLinksSchema,
});

const updatePrivacySchema = z.object({
  privacySettings: privacySettingsSchema,
});

const createUserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string().min(8).regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  ),
});

const requestPasswordResetSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(8).regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  ),
});

type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;
type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

type CreateUserInput = z.infer<typeof createUserSchema>;

export const userRouter = createTRPCRouter({
  create: publicProcedure
    .input(createUserSchema)
    .mutation(async ({ ctx, input }: { ctx: Context; input: CreateUserInput }) => {
      const existingUser = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      });

      if (existingUser) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'User with this email already exists',
        });
      }

      const hashedPassword = await hash(input.password, 10);
      
      const user = await ctx.prisma.user.create({
        data: {
          name: input.name,
          email: input.email,
          password: hashedPassword,
        },
      });

      return { id: user.id, name: user.name, email: user.email };
    }),

  requestPasswordReset: publicProcedure
    .input(requestPasswordResetSchema)
    .mutation(async ({ ctx, input }: { ctx: Context; input: RequestPasswordResetInput }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      });

      // Don't reveal if user exists
      if (!user) {
        return { success: true };
      }

      try {
        const resetData = await generateResetToken(user.email);
        if (!resetData) {
          return { success: true };
        }
        await sendResetEmail(user.email, resetData.token);
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to process password reset request',
        });
      }
    }),

  resetPassword: publicProcedure
    .input(resetPasswordSchema)
    .mutation(async ({ ctx, input }: { ctx: Context; input: ResetPasswordInput }) => {
      try {
        const userId = await validateResetToken(input.token);
        await resetPassword(userId, input.newPassword);
        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to reset password',
        });
      }
    }),

  getProfile: protectedProcedure
    .query(async ({ ctx }) => {
      const profile = await ctx.prisma.userProfile.findUnique({
        where: { userId: ctx.session.user.id },
        include: {
          user: {
            select: {
              email: true,
              name: true,
              image: true,
            }
          }
        }
      });

      if (!profile) {
        // Return default profile structure if none exists
        return {
          user: {
            email: ctx.session.user.email,
            name: ctx.session.user.name,
            image: ctx.session.user.image,
          },
          privacySettings: {
            profileVisibility: 'private',
            showEmail: false,
            showPhone: false,
            showLocation: false,
            showExpertise: false,
          }
        };
      }

      return profile;
    }),

  updateProfile: protectedProcedure
    .input(profileSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const profile = await ctx.prisma.userProfile.upsert({
        where: { userId },
        update: {
          ...input,
          updatedAt: new Date(),
        },
        create: {
          userId,
          ...input,
          privacySettings: {
            profileVisibility: 'private',
            showEmail: false,
            showPhone: false,
            showLocation: false,
            showExpertise: false,
          }
        },
      });

      return profile;
    }),

  updatePrivacySettings: protectedProcedure
    .input(updatePrivacySchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const profile = await ctx.prisma.userProfile.upsert({
        where: { userId },
        update: {
          privacySettings: input.privacySettings,
          updatedAt: new Date(),
        },
        create: {
          userId,
          privacySettings: input.privacySettings,
        },
      });

      return profile;
    }),
});

export type UserRouter = typeof userRouter;
export type UserRouterInput = inferRouterInputs<UserRouter>;
export type UserRouterOutput = inferRouterOutputs<UserRouter>;