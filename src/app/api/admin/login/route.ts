import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/store/prisma';
import { verify } from '@node-rs/argon2';

export async function POST(req: NextRequest) {
  try {
    const { store, email, password } = await req.json();

    if (!store || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Find tenant by slug
    const tenant = await prisma.tenant.findUnique({
      where: { slug: store },
      select: { id: true, name: true, slug: true },
    });

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Store not found' },
        { status: 404 }
      );
    }

    // ✅ Find admin by email AND tenantId
    const admin = await prisma.tenantAdmin.findFirst({
      where: {
        email: email.toLowerCase(),
        tenantId: tenant.id,
      },
    });

    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // ✅ Verify password
    let validPassword = false;
    try {
      validPassword = await verify(admin.passwordHash, password);
    } catch (error) {
      console.error('Password verification error:', error);
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (!validPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // ✅ Return admin session
    return NextResponse.json({
      success: true,
      admin: {
        adminId: admin.id,
        adminEmail: admin.email,
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    );
  }
}
