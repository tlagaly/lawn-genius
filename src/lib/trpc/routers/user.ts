import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import bcrypt from 'bcryptjs';

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
});