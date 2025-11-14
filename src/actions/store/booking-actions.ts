'use server';

import { prisma } from '@/lib/store/prisma';
import { revalidatePath } from 'next/cache';
import { cache } from 'react';

interface CreateBookingInput {
  tenantId: string;
  serviceId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  bookingDate: Date;
  notes?: string;
}

export const getBookings = cache(async (tenantId: string) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { tenantId },
      include: {
        service: true,
        customer: true,
      },
      orderBy: { bookingDate: 'desc' },
    });

    return bookings;
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return [];
  }
});

export async function createBooking(input: CreateBookingInput) {
  try {
    // Check or create customer
    let customer = await prisma.customer.findFirst({
      where: {
        tenantId: input.tenantId,
        phone: input.customerPhone,
      },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: input.customerName,
          email: input.customerEmail,
          phone: input.customerPhone,
          tenantId: input.tenantId,
        },
      });
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        tenantId: input.tenantId,
        serviceId: input.serviceId,
        customerId: customer.id,
        bookingDate: input.bookingDate,
        notes: input.notes,
        status: 'confirmed',
      },
      include: {
        service: true,
        customer: true,
      },
    });

    revalidatePath(`/[store]/admin/bookings`, 'page');
    return { success: true, booking };
  } catch (error) {
    console.error('Error creating booking:', error);
    return { success: false, error: 'Failed to create booking' };
  }
}

export async function updateBookingStatus(
  bookingId: string,
  status: 'confirmed' | 'completed' | 'cancelled'
) {
  try {
    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status },
      include: {
        service: true,
        customer: true,
      },
    });

    revalidatePath(`/[store]/admin/bookings`, 'page');
    return { success: true, booking };
  } catch (error) {
    console.error('Error updating booking:', error);
    return { success: false, error: 'Failed to update booking' };
  }
}

export async function getBookingById(bookingId: string) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        service: true,
        customer: true,
      },
    });

    return booking;
  } catch (error) {
    console.error('Error fetching booking:', error);
    return null;
  }
}
