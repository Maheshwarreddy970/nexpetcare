import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe, webhookSecret } from '@/lib/stripe/config';
import { prisma } from '@/lib/store/prisma';
import { hash } from '@node-rs/argon2';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = (await headers()).get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log('✅ Webhook event:', event.type);
  } catch (err: any) {
    console.error('❌ Webhook error:', err.message);
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 });
  }

  try {
    // ========== SUBSCRIPTION CREATED (Process FIRST) ==========
    if (event.type === 'customer.subscription.created') {
      const subscription = event.data.object as any;
      console.log('🎉 Subscription created:', subscription.id);

      const currentPeriodStart = subscription.current_period_start;
      const currentPeriodEnd = subscription.current_period_end;
      const priceId = subscription.items?.data?.[0]?.price?.id;

      const isYearly = priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY;
      const plan = isYearly ? 'yearly' : 'monthly';

      console.log('Period:', {
        start: new Date(currentPeriodStart * 1000).toISOString(),
        end: new Date(currentPeriodEnd * 1000).toISOString(),
      });

      // Find tenant by customer ID
      const tenant = await prisma.tenant.findUnique({
        where: { stripeCustomerId: subscription.customer as string },
      });

      if (tenant) {
        console.log('📝 Updating tenant with subscription details...');

        // ✅ Update with ALL subscription fields
        const updated = await prisma.tenant.update({
          where: { id: tenant.id },
          data: {
            stripeSubscriptionId: subscription.id,
            stripePriceId: priceId,
            subscriptionPlan: plan,
            stripeCurrentPeriodStart: new Date(currentPeriodStart * 1000),
            stripeCurrentPeriodEnd: new Date(currentPeriodEnd * 1000),
            nextPaymentDate: new Date(currentPeriodEnd * 1000),
            subscriptionStatus: 'active',
          },
        });

        console.log('✅ Subscription activated:', {
          subscriptionId: updated.stripeSubscriptionId,
          priceId: updated.stripePriceId,
          plan: updated.subscriptionPlan,
          status: updated.subscriptionStatus,
          periodEnd: updated.stripeCurrentPeriodEnd?.toISOString(),
        });

        // Create payment log
        await prisma.paymentLog.create({
          data: {
            tenantId: tenant.id,
            amount: subscription.items?.data?.[0]?.price?.unit_amount || 0,
            status: 'succeeded',
            description: `${plan} subscription activated`,
          },
        });
      } else {
        console.error('❌ Tenant not found for customer:', subscription.customer);
      }

      return NextResponse.json({ received: true });
    }

    // ========== CHECKOUT SESSION COMPLETED ==========
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const metadata = session.metadata;

      if (!metadata?.email || !metadata?.storeName || !metadata?.storePassword) {
        return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
      }

      console.log('💳 Checkout session completed for:', metadata.email);

      const priceId = session.line_items?.data?.[0]?.price?.id;
      const isYearly = priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY;
      const plan = isYearly ? 'yearly' : 'monthly';

      const hashedPassword = await hash(metadata.storePassword);

      const slug = `${metadata.storeName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')}-${Date.now().toString().slice(-4)}`;

      // ✅ Create tenant
      const tenant = await prisma.tenant.upsert({
        where: { email: metadata.email },
        create: {
          name: metadata.storeName,
          slug,
          email: metadata.email,
          phone: metadata.phone || null,
          emailVerified: true,
          stripeCustomerId: session.customer as string,
          subscriptionPlan: plan,
          subscriptionStatus: 'pending',
          lastPaymentDate: new Date(),
          websiteData: {
            hero: {
              title: `Welcome to ${metadata.storeName}`,
              subtitle: 'Premium pet care services',
              image: '/default-hero.jpg',
            },
            about: 'We provide the best care for your pets.',
          },
        },
        update: {
          name: metadata.storeName,
          phone: metadata.phone || null,
          stripeCustomerId: session.customer as string,
          subscriptionPlan: plan,
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

      console.log('✅ Tenant created:', tenant.id);

      // ✅ Create admin
      await prisma.tenantAdmin.upsert({
        where: {
          email_tenantId: {
            email: metadata.email,
            tenantId: tenant.id,
          },
        },
        create: {
          email: metadata.email,
          name: metadata.name || metadata.storeName,
          passwordHash: hashedPassword,
          role: 'root',
          tenantId: tenant.id,
        },
        update: {
          passwordHash: hashedPassword,
        },
      });

      console.log('✅ Admin created');

      // ✅ Create services
      const existingServices = await prisma.service.count({
        where: { tenantId: tenant.id },
      });

      if (existingServices === 0) {
        await prisma.service.createMany({
          data: [
            {
              tenantId: tenant.id,
              name: 'Grooming',
              slug: 'grooming',
              description:
                'Professional pet grooming service including bath, haircut, and nail trimming',
              price: 5000,
              duration: 60,
              isActive: true,
              isDiscount: false,
            },
            {
              tenantId: tenant.id,
              name: 'Training',
              slug: 'training',
              description:
                'Expert pet training including obedience, behavior correction, and tricks',
              price: 7500,
              duration: 90,
              isActive: true,
              isDiscount: false,
            },
          ],
        });

        console.log('✅ Services created');
      }

      return NextResponse.json({ received: true });
    }

    // ========== INVOICE PAYMENT SUCCEEDED ==========
    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as any;
      console.log('💰 Invoice payment succeeded:', invoice.id);

      const tenant = await prisma.tenant.findUnique({
        where: { stripeCustomerId: invoice.customer },
      });

      if (tenant) {
        await prisma.paymentLog.create({
          data: {
            stripeInvoiceId: invoice.id,
            amount: invoice.amount_paid,
            status: 'succeeded',
            description: 'Invoice paid',
            tenantId: tenant.id,
          },
        });

        await prisma.tenant.update({
          where: { id: tenant.id },
          data: {
            lastPaymentDate: new Date(),
            failedPaymentAttempts: 0,
          },
        });

        console.log('✅ Payment recorded');
      }

      return NextResponse.json({ received: true });
    }

    // ========== INVOICE PAYMENT FAILED ==========
    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as any;
      console.log('❌ Invoice payment failed:', invoice.id);

      const tenant = await prisma.tenant.findUnique({
        where: { stripeCustomerId: invoice.customer },
      });

      if (tenant) {
        await prisma.paymentLog.create({
          data: {
            stripeInvoiceId: invoice.id,
            amount: invoice.amount_paid,
            status: 'failed',
            description: 'Invoice failed',
            tenantId: tenant.id,
          },
        });

        await prisma.tenant.update({
          where: { id: tenant.id },
          data: {
            subscriptionStatus: 'past_due',
            failedPaymentAttempts: tenant.failedPaymentAttempts + 1,
          },
        });

        console.log('✅ Failed payment recorded');
      }

      return NextResponse.json({ received: true });
    }

    // Ignore other events
    console.log(`ℹ️ Ignoring event: ${event.type}`);
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
