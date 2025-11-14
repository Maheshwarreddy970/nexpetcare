'use server';

import { prisma } from '@/lib/store/prisma';
import { revalidatePath } from 'next/cache';

interface CreateServiceInput {
  tenantId: string;
  name: string;
  description: string;
  price: number;
  duration: number;
}

interface UpdateServiceInput {
  serviceId: string;
  name?: string;
  description?: string;
  price?: number;
  duration?: number;
  isActive?: boolean;
}

export async function createService(input: CreateServiceInput) {
  try {
    const service = await prisma.service.create({
      data: {
        tenantId: input.tenantId,
        name: input.name,
        slug: input.name.toLowerCase().replace(/\s+/g, '-'),
        description: input.description,
        price: input.price,
        duration: input.duration,
        isActive: true,
      },
    });

    revalidatePath(`/[store]/admin/services`, 'page');
    return { success: true, service };
  } catch (error) {
    console.error('Error creating service:', error);
    return { success: false, error: 'Failed to create service' };
  }
}

export async function updateService(input: UpdateServiceInput) {
  try {
    const service = await prisma.service.update({
      where: { id: input.serviceId },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.name && { slug: input.name.toLowerCase().replace(/\s+/g, '-') }),
        ...(input.description && { description: input.description }),
        ...(input.price && { price: input.price }),
        ...(input.duration && { duration: input.duration }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
      },
    });

    revalidatePath(`/[store]/admin/services`, 'page');
    return { success: true, service };
  } catch (error) {
    console.error('Error updating service:', error);
    return { success: false, error: 'Failed to update service' };
  }
}

export async function deleteService(serviceId: string) {
  try {
    await prisma.service.update({
      where: { id: serviceId },
      data: { isActive: false },
    });

    revalidatePath(`/[store]/admin/services`, 'page');
    return { success: true };
  } catch (error) {
    console.error('Error deleting service:', error);
    return { success: false, error: 'Failed to delete service' };
  }
}

export async function getServiceById(serviceId: string) {
  try {
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    return service;
  } catch (error) {
    console.error('Error fetching service:', error);
    return null;
  }
}
