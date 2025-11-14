import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe, webhookSecret } from '@/lib/stripe/config';
import { prisma } from '@/lib/store/prisma';
import { hash } from '@node-rs/argon2';

export async function POST(req: NextRequest) {
  console.log('\n🔔 ===== STRIPE WEBHOOK RECEIVED =====\n');

  const body = await req.text();
  const signature = (await headers()).get('stripe-signature');

  if (!signature) {
    console.error('❌ No Stripe signature');
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log('✅ Event verified:', event.type);
  } catch (err: any) {
    console.error('❌ Webhook verification failed:', err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  try {
    // ========== CHECKOUT SESSION COMPLETED ==========
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const metadata = session.metadata;

      if (!metadata?.email || !metadata?.storeName || !metadata?.storePassword) {
        console.error('❌ Missing metadata:', metadata);
        return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
      }

      console.log('💳 Processing checkout for:', metadata.email);

      try {
        const priceId = session.line_items?.data?.[0]?.price?.id;
        const isYearly = priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY;
        const plan = isYearly ? 'yearly' : 'monthly';

        console.log('📦 Plan:', plan);

        // ✅ Hash password
        const hashedPassword = await hash(metadata.storePassword);

        // ✅ Generate slug with timestamp
        const slug = `${metadata.storeName
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '')}-${Date.now().toString().slice(-4)}`;

        console.log('🏪 Generated slug:', slug);

        // ✅ UPSERT tenant
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
                description: 'Professional pet grooming service',
                price: 5000,
                duration: 60,
                isActive: true,
              },
              {
                tenantId: tenant.id,
                name: 'Training',
                slug: 'training',
                description: 'Expert pet training service',
                price: 7500,
                duration: 90,
                isActive: true,
              },
            ],
          });
          console.log('✅ Services created');
        }

      } catch (error: any) {
        console.error('❌ Error processing checkout:', error.message);
      }

      return NextResponse.json({ received: true });
    }

    // ========== SUBSCRIPTION CREATED ==========
    if (event.type === 'customer.subscription.created') {
      const subscription = event.data.object as any;

      console.log('🎉 Subscription created:', subscription.id);

      const currentPeriodStart = subscription.current_period_start;
      const currentPeriodEnd = subscription.current_period_end;
      const priceId = subscription.items?.data?.[0]?.price?.id;

      const isYearly = priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY;
      const plan = isYearly ? 'yearly' : 'monthly';

      const tenant = await prisma.tenant.findUnique({
        where: { stripeCustomerId: subscription.customer as string },
      });

      if (tenant) {
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: {
            stripeSubscriptionId: subscription.id,
            stripePriceId: priceId,
            stripeCurrentPeriodStart: new Date(currentPeriodStart * 1000),
            stripeCurrentPeriodEnd: new Date(currentPeriodEnd * 1000),
            nextPaymentDate: new Date(currentPeriodEnd * 1000),
            subscriptionStatus: 'active',
          },
        });

        await prisma.paymentLog.create({
          data: {
            tenantId: tenant.id,
            amount: subscription.items?.data?.[0]?.price?.unit_amount || 0,
            status: 'succeeded',
            description: `${plan} subscription started`,
          },
        });

        console.log('✅ Subscription activated');
      }

      return NextResponse.json({ received: true });
    }

    // ========== PAYMENT SUCCEEDED ==========
    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as any;

      const tenant = await prisma.tenant.findUnique({
        where: { stripeCustomerId: invoice.customer },
      });

      if (tenant) {
        await prisma.paymentLog.create({
          data: {
            stripeInvoiceId: invoice.id,
            amount: invoice.amount_paid,
            status: 'succeeded',
            description: `Invoice ${invoice.number || invoice.id}`,
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

        console.log('✅ Payment logged');
      }

      return NextResponse.json({ received: true });
    }

    // ========== PAYMENT FAILED ==========
    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as any;

      const tenant = await prisma.tenant.findUnique({
        where: { stripeCustomerId: invoice.customer },
      });

      if (tenant) {
        await prisma.paymentLog.create({
          data: {
            stripeInvoiceId: invoice.id,
            amount: invoice.amount_paid,
            status: 'failed',
            description: `Failed invoice`,
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

    console.log(`ℹ️ Unhandled event: ${event.type}`);
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
