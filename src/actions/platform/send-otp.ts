'use server';

import { Resend } from 'resend';
import { prisma } from '@/lib/store/prisma';
import { generateSlug } from '@/utils/platform/slug';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOtpAction(
  email: string,
  formData?: {
    name: string;
    storeName: string;
    phone: string;
  }
) {
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  try {
    // ✅ Generate slug from store name if provided
    let slug = 'pending';
    if (formData?.storeName) {
      slug = generateSlug(formData.storeName);
      
      // Check if slug already exists
      let counter = 1;
      let uniqueSlug = slug;
      while (await prisma.tenant.findUnique({ where: { slug: uniqueSlug } })) {
        uniqueSlug = `${slug}-${counter}`;
        counter++;
      }
      slug = uniqueSlug;
    }

    // Store OTP with actual form data
    await prisma.tenant.upsert({
      where: { email },
      create: {
        email,
        name: formData?.storeName || 'Pending', // ✅ Use store name
        slug, // ✅ Use generated slug
        phone: formData?.phone || null,
        subscriptionStatus: 'pending', // ✅ Change to pending until payment
        otpCode: otp,
        otpExpiry: expiresAt,
      },
      update: {
        name: formData?.storeName || undefined,
        slug: slug === 'pending' ? undefined : slug, // Don't overwrite if we couldn't generate
        otpCode: otp,
        otpExpiry: expiresAt,
      },
    });

    // Send OTP via Resend
    await resend.emails.send({
      from: process.env.FROM_EMAIL!,
      to: email,
      subject: 'Verify Your Email - NexPetCare',
      html: `
        <h2>Your Verification Code</h2>
        <p>Your OTP is: <strong>${otp}</strong></p>
        <p>This code expires in 5 minutes.</p>
        <br/>
        <p style="color: #666; font-size: 12px;">
          If you didn't request this code, please ignore this email.
        </p>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending OTP:', error);
    throw new Error('Failed to send OTP');
  }
}
