'use server';

import { prisma } from '@/lib/store/prisma';
import { cache } from 'react';

export const getStoreBySlug = cache(async (slug: string) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        slug: true,
        websiteData: true,
        isActive: true,
        services: {
          where: { isActive: true },
          take: 6,
        },
      },
    });

    if (!tenant || !tenant.isActive) {
      return null;
    }

    return tenant;
  } catch (error) {
    console.error('Error fetching store:', error);
    return null;
  }
});
