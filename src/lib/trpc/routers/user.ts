import { z } from 'zod';
import { publicProcedure, router } from '../trpc';
import { prisma } from '@/lib/db/prisma';
import { TRPCError } from '@trpc/server';
import { hash } from 'bcryptjs';

const notificationSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  message: z.string(),
  createdAt: z.date(),
  read: z.boolean(),
});

const userCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const notificationPreferencesSchema = z.object({
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  notifyFrequency: z.enum(['immediate', 'daily', 'weekly']).optional(),
  monitoredConditions: z.array(z.string()).nullable().optional(),
  alertThresholds: z.record(z.number()).nullable().optional(),
});

export const userRouter = router({
  create: publicProcedure
    .input(userCreateSchema)
    .mutation(async ({ input }) => {
      const existingUser = await prisma.user.findUnique({
        where: { email: input.email },
      });

      if (existingUser) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'A user with this email already exists',
        });
      }

      const hashedPassword = await hash(input.password, 12);

      const user = await prisma.user.create({
        data: {
          name: input.name,
          email: input.email,
          password: hashedPassword,
          emailNotifications: true, // Default notification preferences
          pushNotifications: false,
          notifyFrequency: 'daily',
          monitoredConditions: [],
          alertThresholds: {},
        },
      });

      return {
        id: user.id,
        name: user.name,
        email: user.email,
      };
    }),

  updateProfile: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.session?.user?.email) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to update your profile',
        });
      }

      const user = await prisma.user.update({
        where: { email: ctx.session.user.email },
        data: {
          name: input.name,
          email: input.email,
        },
      });

      return user;
    }),

  updatePassword: publicProcedure
    .input(
      z.object({
        currentPassword: z.string().min(6),
        newPassword: z.string().min(6),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.session?.user?.email) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to change your password',
        });
      }

      const user = await prisma.user.findUnique({
        where: { email: ctx.session.user.email },
      });

      if (!user?.password) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No password set for this account',
        });
      }

      const hashedNewPassword = await hash(input.newPassword, 12);

      await prisma.user.update({
        where: { email: ctx.session.user.email },
        data: {
          password: hashedNewPassword,
        },
      });

      return { success: true };
    }),

  updateNotificationPreferences: publicProcedure
    .input(notificationPreferencesSchema)
    .mutation(async ({ input, ctx }) => {
      if (!ctx.session?.user?.email) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to update notification preferences',
        });
      }

      const user = await prisma.user.update({
        where: { email: ctx.session.user.email },
        data: {
          emailNotifications: input.emailNotifications,
          pushNotifications: input.pushNotifications,
          notifyFrequency: input.notifyFrequency,
          monitoredConditions: input.monitoredConditions as any,
          alertThresholds: input.alertThresholds as any,
        },
      });

      return user;
    }),

  getNotificationPreferences: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user?.email) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to get notification preferences',
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: ctx.session.user.email },
      select: {
        emailNotifications: true,
        pushNotifications: true,
        notifyFrequency: true,
        monitoredConditions: true,
        alertThresholds: true,
      },
    });

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    return user;
  }),

  getNotifications: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user?.email) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to get notifications',
      });
    }

    const notifications = await prisma.notification.findMany({
      where: {
        userId: ctx.session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limit to most recent 50 notifications
    });

    return notifications;
  }),

  markNotificationAsRead: publicProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.session?.user?.email) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to update notifications',
        });
      }

      const notification = await prisma.notification.findUnique({
        where: { id: input.notificationId },
      });

      if (!notification || notification.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Notification not found',
        });
      }

      await prisma.notification.update({
        where: { id: input.notificationId },
        data: { read: true },
      });

      return { success: true };
    }),
});