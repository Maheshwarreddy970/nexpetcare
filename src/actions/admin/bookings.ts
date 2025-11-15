'use server';

import { prisma } from '@/lib/store/prisma';
import { sendEmailNotification } from '@/lib/email';

export async function getBookingsAction(tenantId: string) {
  try {
    const bookings = await prisma.booking
      ?.findMany({
        where: { tenantId },
        include: {
          service: true,
          customer: true,
          pet: true,
        },
        orderBy: { createdAt: 'desc' },
      })
      .catch(() => []);

    const formattedBookings = (bookings || []).map((b) => ({
      id: b.id,
      status: b.status,
      service: b.service,
      customer: b.customer,
      pet: b.pet,
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
    const booking = await prisma.booking?.findUnique({
      where: { id: bookingId },
      include: {
        service: true,
        customer: true,
        pet: true,
        tenant: true,
      },
    });

    if (!booking) {
      return { success: false, error: 'Booking not found' };
    }

    // Update booking status
    const updatedBooking = await prisma.booking?.update({
      where: { id: bookingId },
      data: { status },
      include: {
        service: true,
        customer: true,
        pet: true,
      },
    });

    // 📧 Send status update email
    const bookingDate = booking.bookingDate.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const bookingTime = booking.bookingDate.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    if (status === 'confirmed') {
      await sendEmailNotification('bookingConfirmed', booking.customer.email, {
        customerName: booking.customer.name,
        storeName: booking.tenant?.name || 'Pet Care',
        serviceName: booking.service.name,
        bookingDate,
        bookingTime,
      });
    } else if (status === 'canceled') {
      await sendEmailNotification('bookingCanceled', booking.customer.email, {
        customerName: booking.customer.name,
        storeName: booking.tenant?.name || 'Pet Care',
        serviceName: booking.service.name,
        bookingDate,
      });
    }

    return {
      success: true,
      booking: updatedBooking,
      message: `Booking ${status} and notification sent to customer`,
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
      include: {
        service: true,
        customer: true,
      },
    });

    // 📧 Send cancellation email
    if (booking) {
      const bookingDate = booking.bookingDate.toLocaleDateString('en-IN');
      await sendEmailNotification('bookingCanceled', booking.customer.email, {
        customerName: booking.customer.name,
        storeName: 'Pet Care',
        serviceName: booking.service.name,
        bookingDate,
      });
    }

    return { success: true, booking, message: 'Booking canceled' };
  } catch (error) {
    console.error('Error canceling booking:', error);
    return { success: false, error: 'Failed to cancel booking' };
  }
}
