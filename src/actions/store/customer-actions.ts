'use server';

import { prisma } from '@/lib/store/prisma';
import { cache } from 'react';

export const getCustomers = cache(async (tenantId: string) => {
  try {
    const customers = await prisma.customer.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { bookings: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return customers;
  } catch (error) {
    console.error('Error fetching customers:', error);
    return [];
  }
});

export async function getCustomerDetails(customerId: string) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        bookings: {
          include: { service: true },
          orderBy: { bookingDate: 'desc' },
          take: 10,
        },
      },
    });

    return customer;
  } catch (error) {
    console.error('Error fetching customer:', error);
    return null;
  }
}

export async function deleteCustomer(customerId: string) {
  try {
    // Mark bookings as cancelled instead of deleting
    await prisma.booking.updateMany({
      where: { customerId },
      data: { status: 'cancelled' },
    });

    // Delete customer
    await prisma.customer.delete({
      where: { id: customerId },
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting customer:', error);
    return { success: false, error: 'Failed to delete customer' };
  }
}
