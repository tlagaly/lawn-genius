import { withAuth } from "next-auth/middleware";

// Export the middleware with NextAuth's built-in handler
export default withAuth({
  pages: {
    signIn: '/auth/login',
  },
});

// Protect specific routes
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/trpc/:path*',
  ],
};