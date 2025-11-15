'use server';

import { prisma } from '@/lib/store/prisma';

export async function getBookingsAction(tenantId: string) {
  try {
    const bookings = await prisma.booking
      ?.findMany({
        where: { tenantId },
        include: {
          service: true,
          customer: true,
        },
        orderBy: { createdAt: 'desc' },
      })
      .catch(() => []);

    // Convert dates to string
    const formattedBookings = (bookings || []).map((b) => ({
      id: b.id,
      status: b.status,
      service: b.service,
      customer: {
        name: b.customer.name,
        email: b.customer.email,
      },
      bookingDate: b.bookingDate.toISOString(),
      createdAt: b.createdAt.toISOString(),
    }));

    return { success: true, bookings: formattedBookings };
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return { success: false, error: 'Failed to fetch bookings', bookings: [] };
  }
}

export async function updateBookingStatusAction(
  bookingId: string,
  status: 'pending' | 'confirmed' | 'completed' | 'canceled'
) {
  try {
    const booking = await prisma.booking?.update({
      where: { id: bookingId },
      data: { status },
      include: {
        service: true,
        customer: true,
      },
    });

    return {
      success: true,
      booking,
      message: `Booking ${status} successfully`,
    };
  } catch (error) {
    console.error('Error updating booking:', error);
    return { success: false, error: 'Failed to update booking' };
  }
}

export async function cancelBookingAction(bookingId: string) {
  try {
    const booking = await prisma.booking?.update({
      where: { id: bookingId },
      data: { status: 'canceled' },
    });

    return { success: true, booking, message: 'Booking canceled' };
  } catch (error) {
    console.error('Error canceling booking:', error);
    return { success: false, error: 'Failed to cancel booking' };
  }
}
