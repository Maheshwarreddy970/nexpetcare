'use server';

import { prisma } from '@/lib/store/prisma';
import { hash, verify } from '@node-rs/argon2';

export async function customerSignupAction(data: {
  storeSlug: string;
  name: string;
  email: string;
  phone: string;
  password: string;
}) {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: data.storeSlug, isActive: true },
      select: { id: true },
    });

    if (!tenant) {
      return { success: false, error: 'Store not found' };
    }

    // Check if customer exists
    const existing = await prisma.customer?.findFirst({
      where: {
        email: data.email,
        tenantId: tenant.id,
      },
    });

    if (existing) {
      return { success: false, error: 'Email already registered' };
    }

    const hashedPassword = await hash(data.password);

    const customer = await prisma.customer?.create({
      data: {
        tenantId: tenant.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        passwordHash: hashedPassword,
      },
    });

    if (!customer) {
      return { success: false, error: 'Failed to create account' };
    }

    // ✅ Return consistent format with login action
    return {
      success: true,
      customer: {
        customerId: customer.id,  // ✅ Changed from 'id' to 'customerId' for consistency
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        tenantId: tenant.id,      // ✅ Added tenantId
        tenantSlug: data.storeSlug, // ✅ Added tenantSlug
      },
      message: 'Account created successfully!',
    };
  } catch (error) {
    console.error('Signup error:', error);
    return { success: false, error: 'Failed to create account' };
  }
}

export async function customerLoginAction(data: {
  storeSlug: string;
  email: string;
  password: string;
}) {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: data.storeSlug, isActive: true },
      select: { id: true },
    });

    if (!tenant) {
      return { success: false, error: 'Store not found' };
    }

    const customer = await prisma.customer?.findFirst({
      where: {
        email: data.email,
        tenantId: tenant.id,
      },
    });

    if (!customer) {
      return { success: false, error: 'Invalid email or password' };
    }

    const validPassword = await verify(customer.passwordHash, data.password);

    if (!validPassword) {
      return { success: false, error: 'Invalid email or password' };
    }

    // Update last visit
    await prisma.customer?.update({
      where: { id: customer.id },
      data: { lastVisit: new Date() },
    });

    return {
      success: true,
      customer: {
        customerId: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        tenantId: tenant.id,
        tenantSlug: data.storeSlug,
      },
      message: 'Logged in successfully!',
    };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'Login failed' };
  }
}

export async function verifyCustomerSessionAction(
  tenantId: string,
  customerId: string
) {
  try {
    const customer = await prisma.customer?.findFirst({
      where: {
        id: customerId,
        tenantId,
      },
    });

    return { success: !!customer, customer };
  } catch (error) {
    return { success: false, customer: null };
  }
}
