import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/store/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    console.log('Fetching session:', sessionId);

    // Retrieve the Stripe session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    console.log('Session retrieved:', {
      id: session.id,
      customer_email: session.customer_email,
      subscription: session.subscription,
    });

    // Get the tenant by email from metadata or customer_email
    const email = session.customer_email;

    if (!email) {
      return NextResponse.json(
        { error: 'No email found in session' },
        { status: 400 }
      );
    }

    const tenant = await prisma.tenant.findUnique({
      where: { email },
      select: {
        id: true,
        slug: true,
        name: true,
        stripeSubscriptionId: true,
      },
    });

    if (!tenant) {
      console.log('Tenant not found for email:', email);
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    console.log('✅ Tenant found:', tenant.slug);

    return NextResponse.json({
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      subscriptionId: tenant.stripeSubscriptionId,
    });
  } catch (error: any) {
    console.error('❌ Error fetching session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch session' },
      { status: 500 }
    );
  }
}
