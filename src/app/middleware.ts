import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Skip middleware for login and forgot-password pages
  if (
    pathname.includes('/admin/login') ||
    pathname.includes('/admin/forgot-password') ||
    pathname.includes('/api/admin/login') ||
    pathname.includes('/api/admin/forgot-password')
  ) {
    return NextResponse.next();
  }

  // For other admin pages, session check happens in layout
  return NextResponse.next();
}

export const config = {
  matcher: ['/:store/admin/:path*'],
};
