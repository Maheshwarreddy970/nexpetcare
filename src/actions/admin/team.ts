'use server';

import { prisma } from '@/lib/store/prisma';
import { hash } from '@node-rs/argon2';

export async function getTeamMembersAction(tenantId: string) {
  try {
    const members = await prisma.tenantAdmin.findMany({
      where: { tenantId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Convert Date to string
    const formattedMembers = members.map((m) => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
    }));

    return { success: true, members: formattedMembers };
  } catch (error) {
    console.error('Error fetching team members:', error);
    return {
      success: false,
      error: 'Failed to fetch team members',
      members: [],
    };
  }
}

export async function addTeamMemberAction(
  tenantId: string,
  data: {
    email: string;
    name: string;
    password: string;
    role: 'root' | 'admin' | 'staff';
  }
) {
  try {
    const existing = await prisma.tenantAdmin.findFirst({
      where: {
        email: data.email,
        tenantId,
      },
    });

    if (existing) {
      return { success: false, error: 'Email already in use' };
    }

    const hashedPassword = await hash(data.password);

    const admin = await prisma.tenantAdmin.create({
      data: {
        tenantId,
        email: data.email,
        name: data.name,
        passwordHash: hashedPassword,
        role: data.role,
      },
    });

    return {
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        createdAt: admin.createdAt.toISOString(),
      },
      message: 'Team member added successfully',
    };
  } catch (error) {
    console.error('Error adding team member:', error);
    return { success: false, error: 'Failed to add team member' };
  }
}

export async function updateTeamMemberAction(
  adminId: string,
  data: {
    name?: string;
    role?: 'root' | 'admin' | 'staff';
  }
) {
  try {
    const admin = await prisma.tenantAdmin.update({
      where: { id: adminId },
      data,
    });

    return {
      success: true,
      admin,
      message: 'Team member updated successfully',
    };
  } catch (error) {
    console.error('Error updating team member:', error);
    return { success: false, error: 'Failed to update team member' };
  }
}

export async function removeTeamMemberAction(adminId: string) {
  try {
    await prisma.tenantAdmin.delete({
      where: { id: adminId },
    });

    return { success: true, message: 'Team member removed' };
  } catch (error) {
    console.error('Error removing team member:', error);
    return { success: false, error: 'Failed to remove team member' };
  }
}
