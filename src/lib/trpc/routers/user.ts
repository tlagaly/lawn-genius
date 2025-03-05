import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export const userRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      include: {
        subscription: true,
      },
    });
    return user;
  }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string(),
        email: z.string().email(),
        password: z.string().min(8),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existingUser = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      });

      if (existingUser) {
        throw new Error('Email already registered');
      }

      const hashedPassword = await bcrypt.hash(input.password, 12);

      return ctx.prisma.user.create({
        data: {
          name: input.name,
          email: input.email,
          password: hashedPassword,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        email: z.string().email().optional(),
        currentPassword: z.string().optional(),
        newPassword: z.string().min(8).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      if (input.currentPassword && input.newPassword) {
        const user = await ctx.prisma.user.findUnique({
          where: { id: userId },
          select: { password: true },
        });

        if (!user?.password) {
          throw new Error('No password set');
        }

        const isValid = await bcrypt.compare(input.currentPassword, user.password);
        if (!isValid) {
          throw new Error('Invalid current password');
        }

        const hashedPassword = await bcrypt.hash(input.newPassword, 12);
        return ctx.prisma.user.update({
          where: { id: userId },
          data: {
            ...input,
            password: hashedPassword,
          },
        });
      }

      return ctx.prisma.user.update({
        where: { id: userId },
        data: input,
      });
    }),

  requestPasswordReset: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      });

      if (!user) {
        // Return success even if user doesn't exist to prevent email enumeration
        return { success: true };
      }

      const token = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 3600000); // 1 hour from now

      await ctx.prisma.passwordReset.create({
        data: {
          userId: user.id,
          token: await bcrypt.hash(token, 12),
          expires,
        },
      });

      // TODO: Send password reset email with token
      // For now, we'll just return success
      return { success: true };
    }),

  resetPassword: publicProcedure
    .input(
      z.object({
        token: z.string(),
        password: z.string().min(8),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const passwordReset = await ctx.prisma.passwordReset.findFirst({
        where: {
          expires: {
            gt: new Date(),
          },
        },
        include: {
          user: true,
        },
      });

      if (!passwordReset) {
        throw new Error('Invalid or expired reset token');
      }

      const isValid = await bcrypt.compare(input.token, passwordReset.token);
      if (!isValid) {
        throw new Error('Invalid reset token');
      }

      const hashedPassword = await bcrypt.hash(input.password, 12);

      await ctx.prisma.user.update({
        where: { id: passwordReset.userId },
        data: {
          password: hashedPassword,
        },
      });

      await ctx.prisma.passwordReset.delete({
        where: { id: passwordReset.id },
      });

      return { success: true };
    }),
});