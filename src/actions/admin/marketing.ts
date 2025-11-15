'use server';

import { prisma } from '@/lib/store/prisma';
import { sendEmailNotification } from '@/lib/email';

export async function createCouponAction(
  tenantId: string,
  data: {
    code: string;
    description: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    expiresAt: string;
  }
) {
  try {
    const coupon = await prisma.coupon.create({
      data: {
        tenantId,
        code: data.code.toUpperCase(),
        description: data.description,
        discountType: data.discountType,
        discountValue: data.discountValue,
        expiresAt: new Date(data.expiresAt),
        isActive: true,
      },
    });

    return {
      success: true,
      coupon,
      message: 'Coupon created successfully!',
    };
  } catch (error) {
    console.error('Error creating coupon:', error);
    return { success: false, error: 'Failed to create coupon' };
  }
}

export async function getCouponsAction(tenantId: string) {
  try {
    const coupons = await prisma.coupon.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    const formattedCoupons = coupons.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      expiresAt: c.expiresAt.toISOString(),
    }));

    return { success: true, coupons: formattedCoupons };
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return { success: false, error: 'Failed to fetch coupons', coupons: [] };
  }
}

export async function sendCouponToAllCustomersAction(
  tenantId: string,
  couponId: string,
  storeName: string
) {
  try {
    const [coupon, customers] = await Promise.all([
      prisma.coupon.findUnique({ where: { id: couponId } }),
      prisma.customer?.findMany({
        where: { tenantId },
        select: { id: true, email: true, name: true },
      }),
    ]);

    if (!coupon || !customers) {
      return { success: false, error: 'Coupon or customers not found' };
    }

    const discount =
      coupon.discountType === 'percentage'
        ? `${coupon.discountValue}%`
        : `₹${coupon.discountValue}`;

    const expiryDate = coupon.expiresAt.toLocaleDateString('en-IN');

    // Send email to all customers
    const emailPromises = customers.map((customer) =>
      sendEmailNotification('couponOffer', customer.email, {
        customerName: customer.name,
        storeName,
        couponCode: coupon.code,
        discount,
        expiryDate,
      })
    );

    const results = await Promise.all(emailPromises);
    const successCount = results.filter((r) => r.success).length;

    return {
      success: true,
      message: `Coupon sent to ${successCount} customers!`,
    };
  } catch (error) {
    console.error('Error sending coupon:', error);
    return { success: false, error: 'Failed to send coupon' };
  }
}

export async function announceNewServiceAction(
  tenantId: string,
  serviceId: string,
  storeName: string
) {
  try {
    const [service, customers] = await Promise.all([
      prisma.service.findUnique({ where: { id: serviceId } }),
      prisma.customer?.findMany({
        where: { tenantId },
        select: { email: true, name: true },
      }),
    ]);

    if (!service || !customers) {
      return { success: false, error: 'Service or customers not found' };
    }

    const emailPromises = customers.map((customer) =>
      sendEmailNotification('newServiceAnnouncement', customer.email, {
        customerName: customer.name,
        storeName,
        serviceName: service.name,
        serviceDescription: service.description || '',
        servicePrice: (service.price / 100).toFixed(0),
      })
    );

    const results = await Promise.all(emailPromises);
    const successCount = results.filter((r) => r.success).length;

    return {
      success: true,
      message: `Service announcement sent to ${successCount} customers!`,
    };
  } catch (error) {
    console.error('Error announcing service:', error);
    return { success: false, error: 'Failed to announce service' };
  }
}

export async function deleteCouponAction(tenantId: string, couponId: string) {
  try {
    // Check if coupon has been used in any bookings
    const usedInBookings = await prisma.booking.count({
      where: {
        tenantId,
        couponId: couponId,
      },
    });

    const usedByCustomers = await prisma.customerCoupon.count({
      where: {
        couponId: couponId,
      },
    });

    // If coupon has been used, don't allow deletion
    if (usedInBookings > 0 || usedByCustomers > 0) {
      return {
        success: false,
        error: `Cannot delete coupon. It has been used in ${usedInBookings} booking(s) and assigned to ${usedByCustomers} customer(s). You can deactivate it instead.`,
      };
    }

    // Delete the coupon
    await prisma.coupon.delete({
      where: {
        id: couponId,
        tenantId: tenantId, // Ensure tenant owns this coupon
      },
    });

    return {
      success: true,
      message: 'Coupon deleted successfully!',
    };
  } catch (error) {
    console.error('Error deleting coupon:', error);
    return {
      success: false,
      error: 'Failed to delete coupon',
    };
  }
}

export async function deactivateCouponAction(tenantId: string, couponId: string) {
  try {
    await prisma.coupon.update({
      where: {
        id: couponId,
        tenantId: tenantId,
      },
      data: {
        isActive: false,
      },
    });

    return {
      success: true,
      message: 'Coupon deactivated successfully!',
    };
  } catch (error) {
    console.error('Error deactivating coupon:', error);
    return {
      success: false,
      error: 'Failed to deactivate coupon',
    };
  }
}
