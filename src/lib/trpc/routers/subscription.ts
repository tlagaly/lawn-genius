import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia', // Updated to match our story's timeline
});

const SUBSCRIPTION_PLANS = {
  basic: {
    name: 'Basic Plan',
    priceId: process.env.STRIPE_BASIC_PRICE_ID!,
    features: ['1 lawn profile', 'Basic schedule', 'Email support'],
  },
  pro: {
    name: 'Pro Plan',
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
    features: ['3 lawn profiles', 'Advanced scheduling', 'Priority support', 'Weather alerts'],
  },
  enterprise: {
    name: 'Enterprise Plan',
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID!,
    features: ['Unlimited lawn profiles', 'Custom scheduling', '24/7 support', 'API access'],
  },
} as const;

export const subscriptionRouter = router({
  getPlans: protectedProcedure.query(() => {
    return SUBSCRIPTION_PLANS;
  }),

  getCurrentSubscription: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.subscription.findUnique({
      where: { userId: ctx.session.user.id },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  }),

  createCheckoutSession: protectedProcedure
    .input(z.object({
      planId: z.enum(['basic', 'pro', 'enterprise']),
      successUrl: z.string().url(),
      cancelUrl: z.string().url(),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { subscription: true },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      // If user already has a subscription, create a change subscription session
      if (user.subscription?.stripeId) {
        const session = await stripe.checkout.sessions.create({
          customer: user.subscription.stripeId,
          mode: 'subscription',
          payment_method_types: ['card'],
          line_items: [
            {
              price: SUBSCRIPTION_PLANS[input.planId].priceId,
              quantity: 1,
            },
          ],
          success_url: input.successUrl,
          cancel_url: input.cancelUrl,
        });

        return { url: session.url };
      }

      // Create new subscription session
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: SUBSCRIPTION_PLANS[input.planId].priceId,
            quantity: 1,
          },
        ],
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
        customer_email: user.email,
        metadata: {
          userId: user.id,
          planId: input.planId,
        },
      });

      return { url: session.url };
    }),

  cancelSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    const subscription = await ctx.prisma.subscription.findUnique({
      where: { userId: ctx.session.user.id },
    });

    if (!subscription?.stripeId) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'No active subscription found',
      });
    }

    await stripe.subscriptions.cancel(subscription.stripeId);

    return ctx.prisma.subscription.update({
      where: { userId: ctx.session.user.id },
      data: {
        status: 'canceled',
        endDate: new Date(),
      },
    });
  }),

  getPaymentHistory: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(10),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const payments = await ctx.prisma.payment.findMany({
        where: { userId: ctx.session.user.id },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: 'desc' },
      });

      let nextCursor: typeof input.cursor | undefined = undefined;
      if (payments.length > input.limit) {
        const nextItem = payments.pop();
        nextCursor = nextItem!.id;
      }

      return {
        items: payments,
        nextCursor,
      };
    }),
});