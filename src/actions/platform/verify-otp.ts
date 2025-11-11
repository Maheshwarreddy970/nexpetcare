'use server';

import { prisma } from '@/lib/store/prisma';

export async function verifyOtpAction(email: string, otp: string) {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { email },
    });

    if (!tenant || !tenant.otpCode || !tenant.otpExpiry) {
      throw new Error('OTP not found');
    }

    // Check if OTP expired
    if (new Date() > tenant.otpExpiry) {
      throw new Error('OTP expired');
    }

    // Verify OTP
    if (tenant.otpCode !== otp) {
      throw new Error('Invalid OTP');
    }

    // Mark as verified
    await prisma.tenant.update({
      where: { email },
      data: {
        emailVerified: true,
        otpCode: null,
        otpExpiry: null,
      },
    });

    return true;
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return false;
  }
}
