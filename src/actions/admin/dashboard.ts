'use server';

import { prisma } from '@/lib/store/prisma';

export async function getDashboardStatsAction(tenantId: string) {
  try {
    const [bookingsCount, customersCount, servicesCount, payments] =
      await Promise.all([
        prisma.booking?.count({ where: { tenantId } }).catch(() => 0),
        prisma.customer?.count({ where: { tenantId } }).catch(() => 0),
        prisma.service.count({ where: { tenantId, isActive: true } }),
        prisma.paymentLog
          .findMany({
            where: {
              tenantId,
              status: 'succeeded',
            },
            select: { amount: true },
          })
          .catch(() => []),
      ]);

    const totalRevenue = (payments || []).reduce(
      (sum, payment) => sum + payment.amount,
      0
    );

    return {
      success: true,
      stats: {
        bookings: bookingsCount || 0,
        customers: customersCount || 0,
        services: servicesCount,
        revenue: totalRevenue,
      },
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      success: false,
      error: 'Failed to fetch stats',
      stats: {
        bookings: 0,
        customers: 0,
        services: 0,
        revenue: 0,
      },
    };
  }
}

export async function getRecentActivityAction(tenantId: string, limit = 5) {
  try {
    const [bookings, paymentLogs] = await Promise.all([
      prisma.booking
        ?.findMany({
          where: { tenantId },
          include: {
            service: true,
            customer: true,
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
        })
        .catch(() => []),
      prisma.paymentLog.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
    ]);

    return {
      success: true,
      activity: {
        bookings: bookings || [],
        payments: paymentLogs,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to fetch activity',
      activity: { bookings: [], payments: [] },
    };
  }
}
