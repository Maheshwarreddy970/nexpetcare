'use server';

import { prisma } from '@/lib/store/prisma';

export async function getTenantBySlugAction(slug: string) {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug, isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        phone: true,
        websiteData: true,
      },
    });

    if (!tenant) {
      return { success: false, error: 'Tenant not found' };
    }

    return { success: true, tenant };
  } catch (error) {
    console.error('Error fetching tenant:', error);
    return { success: false, error: 'Failed to fetch tenant' };
  }
}
