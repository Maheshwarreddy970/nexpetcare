'use server';

import { prisma } from '@/lib/store/prisma';

export async function getCustomersAction(tenantId: string) {
  try {
    const customers = await prisma.customer
      ?.findMany({
        where: { tenantId },
        include: {
          _count: {
            select: { bookings: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
      .catch(() => []);

    // Convert Date to string
    const formattedCustomers = (customers || []).map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      _count: c._count,
      createdAt: c.createdAt.toISOString(),
    }));

    return { success: true, customers: formattedCustomers };
  } catch (error) {
    console.error('Error fetching customers:', error);
    return { success: false, error: 'Failed to fetch customers', customers: [] };
  }
}

export async function getCustomerDetailsAction(customerId: string) {
  try {
    const customer = await prisma.customer?.findUnique({
      where: { id: customerId },
      include: {
        bookings: {
          include: {
            service: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) {
      return { success: false, error: 'Customer not found' };
    }

    // Convert dates to string
    const formattedCustomer = {
      ...customer,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
      bookings: customer.bookings.map((b) => ({
        ...b,
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString(),
      })),
    };

    return { success: true, customer: formattedCustomer };
  } catch (error) {
    console.error('Error fetching customer:', error);
    return { success: false, error: 'Failed to fetch customer' };
  }
}

export async function deleteCustomerAction(customerId: string) {
  try {
    await prisma.customer?.delete({
      where: { id: customerId },
    });

    return { success: true, message: 'Customer deleted' };
  } catch (error) {
    console.error('Error deleting customer:', error);
    return { success: false, error: 'Failed to delete customer' };
  }
}
