// src/proxy.ts (previously middleware.ts)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // Extract subdomain or slug from path
  const pathSegments = url.pathname.split('/').filter(Boolean);
  const potentialSlug = pathSegments[0];

  // Add tenant slug to headers for use in components
  const headers = new Headers(request.headers);
  headers.set('x-tenant-slug', potentialSlug);

  return NextResponse.next({
    request: {
      headers,
    },
  });
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
