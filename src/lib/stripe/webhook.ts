import { stripe } from './client';
import { prisma } from '@/lib/db/prisma';
import { buffer } from 'micro';
import type { NextApiRequest, NextApiResponse } from 'next';
import type Stripe from 'stripe';

export const config = {
  api: {
    bodyParser: false,
  },
};

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function handleStripeWebhook(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!webhookSecret) {
    throw new Error('Missing STRIPE_WEBHOOK_SECRET');
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const status = subscription.status;
        const priceId = subscription.items.data[0].price.id;
        const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

        // Get user by Stripe customer ID
        const user = await prisma.user.findFirst({
          where: {
            stripeCustomerId: customerId,
          },
        });

        if (!user) {
          console.error('User not found for Stripe customer:', customerId);
          return res.status(400).json({ error: 'User not found' });
        }

        // Update subscription in database
        await prisma.subscription.upsert({
          where: {
            userId: user.id,
          },
          create: {
            userId: user.id,
            stripeSubscriptionId: subscription.id,
            stripePriceId: priceId,
            status,
            endDate: currentPeriodEnd,
          },
          update: {
            stripeSubscriptionId: subscription.id,
            stripePriceId: priceId,
            status,
            endDate: currentPeriodEnd,
          },
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const user = await prisma.user.findFirst({
          where: {
            stripeCustomerId: customerId,
          },
        });

        if (!user) {
          console.error('User not found for Stripe customer:', customerId);
          return res.status(400).json({ error: 'User not found' });
        }

        // Update subscription status to canceled
        await prisma.subscription.update({
          where: {
            userId: user.id,
          },
          data: {
            status: 'canceled',
            endDate: new Date(subscription.current_period_end * 1000),
          },
        });
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const subscriptionId = invoice.subscription;

        if (!subscriptionId) break;

        const user = await prisma.user.findFirst({
          where: {
            stripeCustomerId: customerId,
          },
        });

        if (!user) {
          console.error('User not found for Stripe customer:', customerId);
          return res.status(400).json({ error: 'User not found' });
        }

        // Update subscription payment status
        await prisma.subscription.update({
          where: {
            userId: user.id,
          },
          data: {
            status: 'active',
            lastPaymentStatus: 'succeeded',
            lastPaymentDate: new Date(),
          },
        });
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const subscriptionId = invoice.subscription;

        if (!subscriptionId) break;

        const user = await prisma.user.findFirst({
          where: {
            stripeCustomerId: customerId,
          },
        });

        if (!user) {
          console.error('User not found for Stripe customer:', customerId);
          return res.status(400).json({ error: 'User not found' });
        }

        // Update subscription payment status
        await prisma.subscription.update({
          where: {
            userId: user.id,
          },
          data: {
            lastPaymentStatus: 'failed',
            lastPaymentDate: new Date(),
          },
        });
        break;
      }
    }

    return res.json({ received: true });
  } catch (err) {
    console.error('Error processing webhook:', err);
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
}