'use server';

import { prisma } from '@/lib/store/prisma';

export async function getTenantSettingsAction(tenantId: string) {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        phone: true,
        websiteData: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        stripeCurrentPeriodEnd: true,
        isActive: true,
      },
    });

    if (!tenant) {
      return { success: false, error: 'Tenant not found' };
    }

    return {
      success: true,
      tenant: {
        ...tenant,
        stripeCurrentPeriodEnd: tenant.stripeCurrentPeriodEnd?.toISOString() || null,
      },
    };
  } catch (error) {
    console.error('Error fetching settings:', error);
    return { success: false, error: 'Failed to fetch settings' };
  }
}

export async function updateTenantSettingsAction(
  tenantId: string,
  data: {
    name?: string;
    email?: string;
    phone?: string;
    websiteData?: any;
  }
) {
  try {
    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data,
    });

    return {
      success: true,
      tenant,
      message: 'Settings updated successfully',
    };
  } catch (error) {
    console.error('Error updating settings:', error);
    return { success: false, error: 'Failed to update settings' };
  }
}

export async function updateWebsiteDataAction(
  tenantId: string,
  websiteData: any
) {
  try {
    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: { websiteData },
    });

    return {
      success: true,
      tenant,
      message: 'Website data updated successfully',
    };
  } catch (error) {
    console.error('Error updating website data:', error);
    return { success: false, error: 'Failed to update website data' };
  }
}

export async function getSubscriptionInfoAction(tenantId: string) {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        subscriptionStatus: true,
        subscriptionPlan: true,
        stripeCurrentPeriodEnd: true,
        stripeCurrentPeriodStart: true,
        lastPaymentDate: true,
      },
    });

    if (!tenant) {
      return { success: false, error: 'Tenant not found' };
    }

    return {
      success: true,
      subscription: {
        subscriptionStatus: tenant.subscriptionStatus,
        subscriptionPlan: tenant.subscriptionPlan || 'N/A',
        stripeCurrentPeriodEnd: tenant.stripeCurrentPeriodEnd?.toISOString() || null,
        stripeCurrentPeriodStart: tenant.stripeCurrentPeriodStart?.toISOString() || null,
        lastPaymentDate: tenant.lastPaymentDate?.toISOString() || null,
      },
    };
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return { success: false, error: 'Failed to fetch subscription' };
  }
}
