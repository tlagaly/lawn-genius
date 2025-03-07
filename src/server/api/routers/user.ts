import { z } from 'zod';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { generateResetToken, sendResetEmail, validateResetToken, resetPassword } from '@/lib/auth/password-reset';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import type { Context } from '../trpc';

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

export const userRouter = createTRPCRouter({
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
        const { token } = await generateResetToken(user.id);
        await sendResetEmail(user.email, token);
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
});

export type UserRouter = typeof userRouter;
export type UserRouterInput = inferRouterInputs<UserRouter>;
export type UserRouterOutput = inferRouterOutputs<UserRouter>;