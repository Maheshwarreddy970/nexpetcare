'use server';

import { prisma } from '@/lib/store/prisma';
import { cache } from 'react';

interface AdminStats {
  totalBookings: number;
  totalCustomers: number;
  totalServices: number;
  totalRevenue: number;
  recentBookings: any[];
}

export const getAdminStats = cache(async (tenantId: string): Promise<AdminStats> => {
  try {
    // Run all queries in parallel for better performance
    const [bookingsCount, customersCount, servicesCount, paymentLogs, recentBookings] = await Promise.all([
      // Total bookings
      prisma.booking.count({
        where: { tenantId },
      }),

      // Total customers
      prisma.customer.count({
        where: { tenantId },
      }),

      // Total services
      prisma.service.count({
        where: { tenantId, isActive: true },
      }),

      // Payment logs for revenue calculation
      prisma.paymentLog.findMany({
        where: {
          tenantId,
          status: 'succeeded',
        },
        select: {
          amount: true,
        },
      }),

      // Recent bookings
      prisma.booking.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          service: {
            select: {
              id: true,
              name: true,
              price: true,
            },
          },
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      }),
    ]);

    // Calculate total revenue from payment logs
    const totalRevenue = paymentLogs.reduce((sum, payment) => {
      return sum + (payment.amount / 100); // Convert cents to rupees
    }, 0);

    return {
      totalBookings: bookingsCount,
      totalCustomers: customersCount,
      totalServices: servicesCount,
      totalRevenue,
      recentBookings: recentBookings.map((booking) => ({
        id: booking.id,
        bookingDate: booking.bookingDate,
        status: booking.status,
        notes: booking.notes,
        service: booking.service,
        customer: booking.customer,
      })),
    };
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return {
      totalBookings: 0,
      totalCustomers: 0,
      totalServices: 0,
      totalRevenue: 0,
      recentBookings: [],
    };
  }
});

// Additional helpful stats functions

export async function getRevenueByMonth(tenantId: string, year: number) {
  try {
    const payments = await prisma.paymentLog.findMany({
      where: {
        tenantId,
        status: 'succeeded',
        createdAt: {
          gte: new Date(`${year}-01-01`),
          lte: new Date(`${year}-12-31`),
        },
      },
      select: {
        amount: true,
        createdAt: true,
      },
    });

    // Group by month
    const revenueByMonth = Array(12).fill(0);
    payments.forEach((payment) => {
      const month = new Date(payment.createdAt).getMonth();
      revenueByMonth[month] += payment.amount / 100;
    });

    return revenueByMonth;
  } catch (error) {
    console.error('Error fetching revenue by month:', error);
    return Array(12).fill(0);
  }
}

export async function getTopServices(tenantId: string, limit: number = 5) {
  try {
    const services = await prisma.service.findMany({
      where: {
        tenantId,
        isActive: true,
      },
      include: {
        _count: {
          select: { bookings: true },
        },
      },
      orderBy: {
        bookings: {
          _count: 'desc',
        },
      },
      take: limit,
    });

    return services.map((service) => ({
      id: service.id,
      name: service.name,
      price: service.price,
      bookingCount: service._count.bookings,
    }));
  } catch (error) {
    console.error('Error fetching top services:', error);
    return [];
  }
}

export async function getBookingStatusBreakdown(tenantId: string) {
  try {
    const [confirmed, pending, cancelled, completed] = await Promise.all([
      prisma.booking.count({
        where: { tenantId, status: 'confirmed' },
      }),
      prisma.booking.count({
        where: { tenantId, status: 'pending' },
      }),
      prisma.booking.count({
        where: { tenantId, status: 'cancelled' },
      }),
      prisma.booking.count({
        where: { tenantId, status: 'completed' },
      }),
    ]);

    return {
      confirmed,
      pending,
      cancelled,
      completed,
    };
  } catch (error) {
    console.error('Error fetching booking breakdown:', error);
    return {
      confirmed: 0,
      pending: 0,
      cancelled: 0,
      completed: 0,
    };
  }
}
