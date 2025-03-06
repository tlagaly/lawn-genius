import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { NextRequest } from "next/server";

async function handler(req: NextRequest, context: any) {
  // Handle auto-login in development
  if (
    process.env.NODE_ENV === "development" &&
    req.nextUrl.searchParams.get("auto") === "true"
  ) {
    // Automatically set credentials for test account
    const searchParams = new URLSearchParams(req.nextUrl.search);
    searchParams.set("email", "test@example.com");
    searchParams.set("password", "TestPassword123!");
    searchParams.set("provider", "credentials");
    req.nextUrl.search = searchParams.toString();
  }

  const auth = await NextAuth(authOptions);
  return auth(req, context);
}

export { handler as GET, handler as POST };