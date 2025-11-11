import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { prisma } from '@/lib/store/prisma';
import { hashPassword } from '@/lib/platform/password';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = (await headers()).get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  console.log(`📥 Webhook received: ${event.type}`);

if (event.type === 'checkout.session.completed') {
  const session = event.data.object as Stripe.Checkout.Session;
  const metadata = session.metadata!;

  try {
    let subscriptionData = {
      id: '',
      current_period_end: 0,
      price_id: '',
    };

    if (session.subscription) {
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string,
        {
          expand: ['items.data.price'],
        }
      );

      // ✅ Cast to any to access current_period_end
      const sub = subscription as any;

      subscriptionData = {
        id: sub.id,
        current_period_end: sub.current_period_end,
        price_id: sub.items.data[0]?.price?.id || '',
      };

      console.log('✅ Subscription retrieved:', subscriptionData);
    }

    const hashedPassword = await hashPassword(metadata.storePassword);

    const tenant = await prisma.tenant.update({
      where: { email: metadata.email },
      data: {
        name: metadata.storeName,
        emailVerified: true,
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: subscriptionData.id,
        stripePriceId: subscriptionData.price_id,
        stripeCurrentPeriodEnd: new Date(subscriptionData.current_period_end * 1000),
        subscriptionStatus: 'active',
        websiteData: {
          hero: {
            title: `Welcome to ${metadata.storeName}`,
            subtitle: 'Premium pet care services',
            image: '/default-hero.jpg',
          },
          about: 'We provide the best care for your pets.',
        },
      },
    });

    const existingAdmin = await prisma.tenantAdmin.findUnique({
      where: {
        email_tenantId: {
          email: metadata.email,
          tenantId: tenant.id,
        },
      },
    });

    if (!existingAdmin) {
      await prisma.tenantAdmin.create({
        data: {
          email: metadata.email,
          name: metadata.name,
          passwordHash: hashedPassword,
          role: 'root',
          tenantId: tenant.id,
        },
      });
    }

    console.log(`✅ Tenant activated: ${tenant.slug}`);
  } catch (error) {
    console.error('Error processing checkout:', error);
    return NextResponse.json(
      { error: 'Failed to process checkout' },
      { status: 500 }
    );
  }
}

// ✅ Handle subscription updates
if (event.type === 'customer.subscription.updated') {
  const subscription = event.data.object as any; // ✅ Cast to any

  try {
    await prisma.tenant.update({
      where: { stripeCustomerId: subscription.customer as string },
      data: {
        subscriptionStatus: subscription.status,
        stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
        stripePriceId: subscription.items.data[0]?.price?.id,
      },
    });
    console.log(`✅ Subscription updated: ${subscription.id}`);
  } catch (error) {
    console.error('Error updating subscription:', error);
  }
}

// ✅ Handle subscription cancellation
if (event.type === 'customer.subscription.deleted') {
  const subscription = event.data.object as any; // ✅ Cast to any

  try {
    await prisma.tenant.update({
      where: { stripeCustomerId: subscription.customer as string },
      data: {
        subscriptionStatus: 'canceled',
        stripeCurrentPeriodEnd: null,
      },
    });
    console.log(`✅ Subscription canceled: ${subscription.id}`);
  } catch (error) {
    console.error('Error canceling subscription:', error);
  }
}

console.log(`✅ Webhook processed: ${event.type}`);
return NextResponse.json({ received: true });
}