'use server';

import { prisma } from '@/lib/store/prisma';

export async function getPublicServicesAction(storeSlug: string) {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: storeSlug, isActive: true },
      select: { id: true },
    });

    if (!tenant) {
      return { success: false, error: 'Store not found', services: [] };
    }

    const services = await prisma.service.findMany({
      where: {
        tenantId: tenant.id,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        duration: true,
        images: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, services };
  } catch (error) {
    console.error('Error fetching services:', error);
    return { success: false, error: 'Failed to fetch services', services: [] };
  }
}

export async function getServiceBySlugAction(storeSlug: string, serviceSlug: string) {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: storeSlug, isActive: true },
      select: { id: true },
    });

    if (!tenant) {
      return { success: false, error: 'Store not found' };
    }

    const service = await prisma.service.findFirst({
      where: {
        tenantId: tenant.id,
        slug: serviceSlug,
        isActive: true,
      },
    });

    if (!service) {
      return { success: false, error: 'Service not found' };
    }

    return {
      success: true,
      service: {
        id: service.id,
        name: service.name,
        slug: service.slug,
        description: service.description || '',
        price: service.price,
        duration: service.duration,
        images: service.images,
      },
    };
  } catch (error) {
    console.error('Error fetching service:', error);
    return { success: false, error: 'Failed to fetch service' };
  }
}
