'use server';

import { prisma } from '@/lib/store/prisma';

export async function getServicesAction(tenantId: string) {
  try {
    const services = await prisma.service.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    // Convert dates to strings
    const formattedServices = services.map((s) => ({
      ...s,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
      description: s.description || '',
    }));

    return { success: true, services: formattedServices };
  } catch (error) {
    console.error('Error fetching services:', error);
    return { success: false, error: 'Failed to fetch services', services: [] };
  }
}

export async function createServiceAction(
  tenantId: string,
  data: {
    name: string;
    description: string;
    price: number;
    duration: number;
  }
) {
  try {
    const slug = data.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    const service = await prisma.service.create({
      data: {
        tenantId,
        name: data.name,
        slug,
        description: data.description,
        price: Math.round(data.price * 100),
        duration: data.duration,
        isActive: true,
        isDiscount: false,
      },
    });

    return {
      success: true,
      service: {
        ...service,
        createdAt: service.createdAt.toISOString(),
        updatedAt: service.updatedAt.toISOString(),
        description: service.description || '',
      },
      message: 'Service created successfully',
    };
  } catch (error) {
    console.error('Error creating service:', error);
    return { success: false, error: 'Failed to create service' };
  }
}

export async function updateServiceAction(
  serviceId: string,
  data: {
    name?: string;
    description?: string;
    price?: number;
    duration?: number;
    isActive?: boolean;
  }
) {
  try {
    const updateData: any = { ...data };
    if (data.price) {
      updateData.price = Math.round(data.price * 100);
    }

    const service = await prisma.service.update({
      where: { id: serviceId },
      data: updateData,
    });

    return {
      success: true,
      service: {
        ...service,
        createdAt: service.createdAt.toISOString(),
        updatedAt: service.updatedAt.toISOString(),
        description: service.description || '',
      },
      message: 'Service updated successfully',
    };
  } catch (error) {
    console.error('Error updating service:', error);
    return { success: false, error: 'Failed to update service' };
  }
}

export async function deleteServiceAction(serviceId: string) {
  try {
    await prisma.service.delete({
      where: { id: serviceId },
    });

    return { success: true, message: 'Service deleted successfully' };
  } catch (error) {
    console.error('Error deleting service:', error);
    return { success: false, error: 'Failed to delete service' };
  }
}
