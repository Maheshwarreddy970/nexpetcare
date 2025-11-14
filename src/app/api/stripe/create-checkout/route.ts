import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/config';

export async function POST(req: NextRequest) {
  try {
    const { email, priceId, formData } = await req.json();

    if (!email || !priceId) {
      return NextResponse.json(
        { error: 'Missing email or priceId' },
        { status: 400 }
      );
    }

    if (!formData || !formData.storeName || !formData.storePassword) {
      return NextResponse.json(
        { error: 'Missing form data' },
        { status: 400 }
      );
    }

    console.log('Creating checkout session:', {
      email,
      priceId,
      storeName: formData.storeName,
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      // ✅ Simple redirect without session_id
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/create/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/create`,
      // ✅ Pass all formData in metadata
      metadata: {
        email,
        storeName: formData.storeName,
        storePassword: formData.storePassword,
        name: formData.name || '',
        phone: formData.phone || '',
      },
    });

    console.log('✅ Checkout session created:', session.id);

    return NextResponse.json({
      success: true,
      url: session.url,
      sessionId: session.id,
    });
  } catch (error: any) {
    console.error('❌ Checkout error:', error.message);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
