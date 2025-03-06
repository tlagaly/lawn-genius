import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  // Only apply bypass in development
  if (process.env.NODE_ENV === "development") {
    const token = await getToken({ req: request });
    
    // If no token and trying to access protected route, auto-login
    if (!token && request.nextUrl.pathname.startsWith("/dashboard")) {
      // Store the original URL to redirect back after auto-login
      const callbackUrl = encodeURIComponent(request.nextUrl.pathname);
      return NextResponse.redirect(
        new URL(`/api/auth/signin?callbackUrl=${callbackUrl}&auto=true`, request.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};