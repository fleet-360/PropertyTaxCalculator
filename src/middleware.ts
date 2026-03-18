import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

async function verifyJWT(token: string): Promise<boolean> {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return false;

    const key = new TextEncoder().encode(secret);
    await jwtVerify(token, key);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // Allow all requests to /api/auth/*
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // API routes: only protect mutating methods (POST, PUT, DELETE)
  if (pathname.startsWith('/api/')) {
    if (method === 'GET') {
      return NextResponse.next();
    }

    const token = request.cookies.get('admin-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const isValid = await verifyJWT(token);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    return NextResponse.next();
  }

  // Allow access to the admin login page
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  // Protect all other /admin/* routes
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('admin-token')?.value;

    if (!token) {
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    const isValid = await verifyJWT(token);
    if (!isValid) {
      const loginUrl = new URL('/admin/login', request.url);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('admin-token');
      return response;
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*', '/admin/:path*'],
};
