'use server';

import { prisma } from '@/lib/store/prisma';

export async function validateCouponAction(
  tenantId: string,
  couponCode: string
) {
  try {
    // ✅ Add debugging logs
    console.log('🔍 Validating coupon:', {
      tenantId,
      couponCode: couponCode.toUpperCase(),
      rawCouponCode: couponCode,
    });

    // ✅ Trim whitespace and convert to uppercase
    const cleanCode = couponCode.trim().toUpperCase();

    if (!cleanCode) {
      return {
        success: false,
        error: 'Please enter a coupon code',
      };
    }

    if (!tenantId) {
      console.error('❌ No tenantId provided');
      return {
        success: false,
        error: 'Invalid session. Please refresh the page.',
      };
    }

    // ✅ First, check if any coupons exist for this tenant
    const allCoupons = await prisma.coupon.findMany({
      where: { tenantId },
      select: {
        id: true,
        code: true,
        isActive: true,
        expiresAt: true,
      },
    });

    console.log('📋 All coupons for tenant:', allCoupons);

    // ✅ Find the specific coupon
    const coupon = await prisma.coupon.findFirst({
      where: {
        tenantId: tenantId,
        code: cleanCode,
        isActive: true,
      },
    });

    console.log('🎟️ Found coupon:', coupon);

    if (!coupon) {
      // ✅ Check if code exists but is inactive
      const inactiveCoupon = await prisma.coupon.findFirst({
        where: {
          tenantId: tenantId,
          code: cleanCode,
        },
      });

      if (inactiveCoupon && !inactiveCoupon.isActive) {
        return {
          success: false,
          error: 'This coupon is no longer active',
        };
      }

      return {
        success: false,
        error: 'Invalid coupon code',
      };
    }

    // ✅ Check if expired
    const now = new Date();
    const expiryDate = new Date(coupon.expiresAt);
    
    console.log('📅 Date check:', {
      now: now.toISOString(),
      expiresAt: expiryDate.toISOString(),
      isExpired: expiryDate < now,
    });

    if (expiryDate < now) {
      return {
        success: false,
        error: 'This coupon has expired',
      };
    }

    console.log('✅ Coupon validated successfully');

    return {
      success: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      },
    };
  } catch (error) {
    console.error('❌ Error validating coupon:', error);
    return {
      success: false,
      error: 'Failed to validate coupon',
    };
  }
}

export async function calculateDiscountAmount(
  price: number,
  discountType: string,
  discountValue: number
): Promise<number> {
  console.log('💰 Calculating discount:', {
    price,
    discountType,
    discountValue,
  });

  if (discountType === 'percentage') {
    const discount = (price * discountValue) / 100;
    console.log(`📊 Percentage discount: ${discountValue}% of ${price} = ${discount}`);
    return discount;
  } else {
    // Fixed amount discount (in same currency unit)
    const discount = Math.min(discountValue * 100, price);
    console.log(`💵 Fixed discount: min(${discountValue * 100}, ${price}) = ${discount}`);
    return discount;
  }
}
