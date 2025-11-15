'use server';

import { prisma } from '@/lib/store/prisma';
import { verify } from '@node-rs/argon2';

export async function loginAdminAction(
  store: string,
  email: string,
  password: string
) {
  try {
    if (!store || !email || !password) {
      return { success: false, error: 'Missing required fields' };
    }

    // Find tenant by slug
    const tenant = await prisma.tenant.findUnique({
      where: { slug: store },
      select: { id: true, name: true, slug: true, isActive: true },
    });

    if (!tenant) {
      return { success: false, error: 'Store not found' };
    }

    if (!tenant.isActive) {
      return {
        success: false,
        error: 'Store is inactive. Please contact support.',
      };
    }

    // Find admin by email and tenantId
    const admin = await prisma.tenantAdmin.findFirst({
      where: {
        email: email.toLowerCase(),
        tenantId: tenant.id,
      },
    });

    if (!admin) {
      return { success: false, error: 'Invalid email or password' };
    }

    // Verify password
    let validPassword = false;
    try {
      validPassword = await verify(admin.passwordHash, password);
    } catch (error) {
      return { success: false, error: 'Invalid email or password' };
    }

    if (!validPassword) {
      return { success: false, error: 'Invalid email or password' };
    }

    return {
      success: true,
      admin: {
        adminId: admin.id,
        adminEmail: admin.email,
        adminName: admin.name,
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
        tenantName: tenant.name,
        role: admin.role,
      },
    };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'Login failed' };
  }
}

export async function verifyAdminSessionAction(
  tenantId: string,
  adminId: string
) {
  try {
    const admin = await prisma.tenantAdmin.findFirst({
      where: {
        id: adminId,
        tenantId,
      },
    });

    return { success: !!admin, admin };
  } catch (error) {
    return { success: false, admin: null };
  }
}
