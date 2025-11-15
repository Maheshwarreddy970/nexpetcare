'use server';

import { prisma } from '@/lib/store/prisma';
import { hash } from '@node-rs/argon2';

export async function createBookingAction(data: {
  storeSlug: string;
  serviceId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  bookingDate: string;
  petId: string;
  notes?: string;
}) {
  try {
    // Get tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: data.storeSlug },
      select: { id: true },
    });

    if (!tenant) {
      return { success: false, error: 'Store not found' };
    }

    // Get service
    const service = await prisma.service.findUnique({
      where: { id: data.serviceId },
    });

    if (!service) {
      return { success: false, error: 'Service not found' };
    }

    // Get or create customer
    let customer = await prisma.customer?.findFirst({
      where: {
        email: data.customerEmail,
        tenantId: tenant.id,
      },
    });

    if (!customer) {
      const tempPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await hash(tempPassword);

      customer = await prisma.customer?.create({
        data: {
          tenantId: tenant.id,
          email: data.customerEmail,
          phone: data.customerPhone,
          name: data.customerName,
          passwordHash: hashedPassword,
        },
      });
    }

    if (!customer) {
      return { success: false, error: 'Failed to create customer' };
    }

    // Verify pet belongs to customer
    const pet = await prisma.pet?.findFirst({
      where: {
        id: data.petId,
        customerId: customer.id,
      },
    });

    if (!pet) {
      return { success: false, error: 'Pet not found or does not belong to customer' };
    }

    // Create booking
    const booking = await prisma.booking?.create({
      data: {
        tenantId: tenant.id,
        customerId: customer.id,
        serviceId: service.id,
        petId: pet.id,
        bookingDate: new Date(data.bookingDate),
        status: 'pending',
        totalAmount: service.price / 100,
        notes: data.notes || '',
      },
      include: {
        service: true,
        customer: true,
        pet: true,
      },
    });

    // Update customer stats
    await prisma.customer?.update({
      where: { id: customer.id },
      data: {
        bookingCount: { increment: 1 },
        totalSpent: { increment: service.price / 100 },
        lastVisit: new Date(),
      },
    });

    return {
      success: true,
      booking: {
        id: booking?.id,
        bookingDate: booking?.bookingDate.toISOString(),
        service: booking?.service.name,
        pet: booking?.pet.name,
        status: booking?.status,
      },
      message: 'Booking created successfully!',
    };
  } catch (error) {
    console.error('Error creating booking:', error);
    return { success: false, error: 'Failed to create booking' };
  }
}
