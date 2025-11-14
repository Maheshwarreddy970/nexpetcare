import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/store/prisma';
import { hash } from '@node-rs/argon2';

export async function POST(req: NextRequest) {
  try {
    const { email, storeName, storePassword, name, phone } = await req.json();

    if (!email || !storeName || !storePassword) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const hashedPassword = await hash(storePassword);
    const slug = `${storeName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${Date.now().toString().slice(-4)}`;

    const tenant = await prisma.tenant.upsert({
      where: { email },
      create: {
        name: storeName,
        slug,
        email,
        phone: phone || null,
        emailVerified: true,
        stripeCustomerId: `cus_test_${Date.now()}`,
        subscriptionPlan: 'monthly',
        subscriptionStatus: 'active',
        lastPaymentDate: new Date(),
        stripeCurrentPeriodStart: new Date(),
        stripeCurrentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        websiteData: {
          hero: {
            title: `Welcome to ${storeName}`,
            subtitle: 'Premium pet care services',
            image: '/default-hero.jpg',
          },
          about: 'We provide the best care for your pets.',
        },
      },
      update: {
        name: storeName,
        phone: phone || null,
        websiteData: {
          hero: {
            title: `Welcome to ${storeName}`,
            subtitle: 'Premium pet care services',
            image: '/default-hero.jpg',
          },
          about: 'We provide the best care for your pets.',
        },
      },
    });

    const admin = await prisma.tenantAdmin.upsert({
      where: {
        email_tenantId: {
          email,
          tenantId: tenant.id,
        },
      },
      create: {
        email,
        name: name || storeName,
        passwordHash: hashedPassword,
        role: 'root',
        tenantId: tenant.id,
      },
      update: {
        passwordHash: hashedPassword,
      },
    });

    const existingServices = await prisma.service.count({
      where: { tenantId: tenant.id },
    });

    let servicesCreated = 0;
    if (existingServices === 0) {
      const result = await prisma.service.createMany({
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
      servicesCreated = result.count;
    }

    await prisma.paymentLog.create({
      data: {
        tenantId: tenant.id,
        amount: 29900,
        status: 'succeeded',
        description: 'Test subscription',
        stripeInvoiceId: `in_test_${Date.now()}`,
      },
    });

    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        email: tenant.email,
        stripeCustomerId: tenant.stripeCustomerId,
        subscriptionStatus: tenant.subscriptionStatus,
        stripeCurrentPeriodEnd: tenant.stripeCurrentPeriodEnd,
        websiteData: tenant.websiteData,
      },
      admin: { id: admin.id, email: admin.email, role: admin.role },
      servicesCreated,
    });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
