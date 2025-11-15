'use server';

import { prisma } from '@/lib/store/prisma';

export async function getCustomerBookingsAction(customerId: string) {
  try {
    const bookings = await prisma.booking?.findMany({
      where: { customerId },
      include: {
        service: { select: { name: true } },
        pet: { select: { name: true } },
      },
      orderBy: { bookingDate: 'desc' },
    });

    const formattedBookings = (bookings || []).map((b) => ({
      id: b.id,
      status: b.status,
      service: b.service,
      pet: b.pet,
      bookingDate: b.bookingDate.toISOString(),
      totalAmount: b.totalAmount,
    }));

    return { success: true, bookings: formattedBookings };
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return { success: false, error: 'Failed to fetch bookings', bookings: [] };
  }
}
