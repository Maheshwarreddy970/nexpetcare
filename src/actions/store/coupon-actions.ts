'use server';

import { prisma } from '@/lib/store/prisma';
import { revalidatePath } from 'next/cache';
import { cache } from 'react';

interface CreateCouponInput {
  tenantId: string;
  code: string;
  discount: number;
  discountType: 'percentage' | 'fixed';
  expiresAt: Date;
  maxUses?: number;
  description?: string;
}

export const getCoupons = cache(async (tenantId: string) => {
  try {
    const coupons = await prisma.coupon.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    return coupons;
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return [];
  }
});

export async function createCoupon(input: CreateCouponInput) {
  try {
    // Check if code already exists
    const existing = await prisma.coupon.findFirst({
      where: {
        tenantId: input.tenantId,
        code: input.code.toUpperCase(),
      },
    });

    if (existing) {
      return { success: false, error: 'Coupon code already exists' };
    }

    const coupon = await prisma.coupon.create({
      data: {
        tenantId: input.tenantId,
        code: input.code.toUpperCase(),
        discount: input.discount,
        discountType: input.discountType,
        expiresAt: input.expiresAt,
        maxUses: input.maxUses,
        description: input.description,
        isActive: true,
      },
    });

    revalidatePath(`/[store]/admin/coupons`, 'page');
    return { success: true, coupon };
  } catch (error) {
    console.error('Error creating coupon:', error);
    return { success: false, error: 'Failed to create coupon' };
  }
}

export async function updateCoupon(
  couponId: string,
  data: Partial<CreateCouponInput>
) {
  try {
    const coupon = await prisma.coupon.update({
      where: { id: couponId },
      data,
    });

    revalidatePath(`/[store]/admin/coupons`, 'page');
    return { success: true, coupon };
  } catch (error) {
    console.error('Error updating coupon:', error);
    return { success: false, error: 'Failed to update coupon' };
  }
}

export async function deleteCoupon(couponId: string) {
  try {
    await prisma.coupon.update({
      where: { id: couponId },
      data: { isActive: false },
    });

    revalidatePath(`/[store]/admin/coupons`, 'page');
    return { success: true };
  } catch (error) {
    console.error('Error deleting coupon:', error);
    return { success: false, error: 'Failed to delete coupon' };
  }
}
