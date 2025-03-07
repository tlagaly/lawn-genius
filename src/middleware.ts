import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { isDevMode, createDevSession } from "@/lib/auth/dev-auth";

export async function middleware(request: NextRequest) {
  try {
    // Skip auth check for non-dashboard and auth routes
    if (!request.nextUrl.pathname.startsWith('/dashboard') ||
        request.nextUrl.pathname.startsWith('/auth')) {
      return NextResponse.next();
    }

    // Handle development mode authentication
    if (isDevMode()) {
      const response = NextResponse.next();
      
      // Set development session cookie if not present
      const sessionCookie = request.cookies.get('next-auth.session-token');
      if (!sessionCookie) {
        const devSession = createDevSession();
        response.cookies.set('next-auth.session-token', JSON.stringify(devSession), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 24 * 60 * 60 // 24 hours
        });
      }
      
      return response;
    }

    // Production authentication
    const token = await getToken({ req: request });

    // Check if user is authenticated
    if (!token) {
      // Prevent redirect loops
      if (request.nextUrl.pathname === '/auth/login') {
        return NextResponse.next();
      }

      const url = new URL('/auth/login', request.url);
      url.searchParams.set('callbackUrl', request.url);
      return NextResponse.redirect(url);
    }

    // Add user token to headers for TRPC
    const response = NextResponse.next();
    response.headers.set('x-user-token', JSON.stringify(token));

    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    
    // Return 500 error response
    return new NextResponse(
      JSON.stringify({
        error: 'Internal Server Error',
        message: 'An error occurred while processing your request'
      }),
      {
        status: 500,
        headers: { 'content-type': 'application/json' }
      }
    );
  }
}

export const config = {
  matcher: [
    // Only match dashboard routes
    '/dashboard/:path*',
  ],
};