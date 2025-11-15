'use server';

import { prisma } from '@/lib/store/prisma';
import { hash } from '@node-rs/argon2';
import { sendEmailNotification } from '@/lib/email';

export async function createBookingAction(data: {
  storeSlug: string;
  serviceId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  bookingDate: string;
  petId: string;
  notes?: string;
  couponId?: string; // ✅ Added coupon support
}) {
  try {
    // Get tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: data.storeSlug },
      select: { id: true, name: true },
    });

    if (!tenant) {
      return { success: false, error: 'Store not found' };
    }

    // Get service
    const service = await prisma.service.findUnique({
      where: { id: data.serviceId },
    });

    if (!service) {
      return { success: false, error: 'Service not found' };
    }

    // ✅ Validate coupon if provided
    let coupon = null;
    let discountAmount = 0;
    let finalAmount = service.price;

    if (data.couponId) {
      coupon = await prisma.coupon.findFirst({
        where: {
          id: data.couponId,
          tenantId: tenant.id,
          isActive: true,
        },
      });

      if (!coupon) {
        return { success: false, error: 'Invalid or inactive coupon' };
      }

      // Check if coupon is expired
      if (new Date(coupon.expiresAt) < new Date()) {
        return { success: false, error: 'This coupon has expired' };
      }

      // Calculate discount
      if (coupon.discountType === 'percentage') {
        discountAmount = Math.floor((service.price * coupon.discountValue) / 100);
      } else {
        // Fixed amount (coupon.discountValue is already in cents/paise)
        discountAmount = Math.min(coupon.discountValue * 100, service.price);
      }

      finalAmount = service.price - discountAmount;
    }

    // Get or create customer
    let customer = await prisma.customer?.findFirst({
      where: {
        email: data.customerEmail,
        tenantId: tenant.id,
      },
    });

    if (!customer) {
      const tempPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await hash(tempPassword);

      customer = await prisma.customer?.create({
        data: {
          tenantId: tenant.id,
          email: data.customerEmail,
          phone: data.customerPhone,
          name: data.customerName,
          passwordHash: hashedPassword,
        },
      });
    }

    if (!customer) {
      return { success: false, error: 'Failed to create customer' };
    }

    // Verify pet belongs to customer
    const pet = await prisma.pet?.findFirst({
      where: {
        id: data.petId,
        customerId: customer.id,
      },
    });

    if (!pet) {
      return { success: false, error: 'Pet not found or does not belong to customer' };
    }

    // ✅ Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Create booking with coupon
      const booking = await tx.booking.create({
        data: {
          tenantId: tenant.id,
          customerId: customer.id,
          serviceId: service.id,
          petId: pet.id,
          bookingDate: new Date(data.bookingDate),
          status: 'pending',
          totalAmount: finalAmount / 100, // Store in dollars/rupees
          notes: data.notes || '',
          couponId: data.couponId || null,
        },
        include: {
          service: true,
          customer: true,
          pet: true,
          coupon: true,
        },
      });

      // ✅ Track coupon usage if coupon was applied
      if (data.couponId && customer) {
        await tx.customerCoupon.upsert({
          where: {
            customerId_couponId: {
              customerId: customer.id,
              couponId: data.couponId,
            },
          },
          create: {
            customerId: customer.id,
            couponId: data.couponId,
            usedAt: new Date(),
          },
          update: {
            usedAt: new Date(),
          },
        });
      }

      // Update customer stats
      await tx.customer.update({
        where: { id: customer.id },
        data: {
          bookingCount: { increment: 1 },
          totalSpent: { increment: finalAmount / 100 },
          lastVisit: new Date(),
        },
      });

      return booking;
    });

    // 📧 Send booking confirmation email with discount info
    const bookingDate = new Date(data.bookingDate);
    const formattedDate = bookingDate.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = bookingDate.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    // ✅ Prepare email data with discount information
    const emailData: any = {
      customerName: customer.name,
      storeName: tenant.name,
      serviceName: service.name,
      bookingDate: formattedDate,
      bookingTime: formattedTime,
      petName: pet.name,
      originalAmount: (service.price / 100).toFixed(0),
      totalAmount: (finalAmount / 100).toFixed(0),
    };

    // Add discount info if coupon was used
    if (coupon && discountAmount > 0) {
      emailData.couponCode = coupon.code;
      emailData.discountAmount = (discountAmount / 100).toFixed(0);
      emailData.hasCoupon = true;
    } else {
      emailData.hasCoupon = false;
    }

    await sendEmailNotification('bookingConfirmation', customer.email, emailData);

    return {
      success: true,
      booking: {
        id: result.id,
        bookingDate: result.bookingDate.toISOString(),
        service: result.service.name,
        pet: result.pet.name,
        status: result.status,
        originalPrice: service.price / 100,
        discount: discountAmount / 100,
        finalPrice: finalAmount / 100,
        couponCode: coupon?.code,
      },
      message: discountAmount > 0 
        ? `Booking created successfully! You saved ₹${(discountAmount / 100).toFixed(0)} with coupon ${coupon?.code}. Confirmation email sent.`
        : 'Booking created successfully! Confirmation email sent.',
    };
  } catch (error) {
    console.error('Error creating booking:', error);
    return { success: false, error: 'Failed to create booking' };
  }
}
