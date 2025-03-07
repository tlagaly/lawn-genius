import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { NextRequest } from "next/server";

async function handler(req: NextRequest, context: any) {
  // Handle auto-login in development
  if (
    process.env.NODE_ENV === "development" &&
    req.nextUrl.searchParams.get("auto") === "true" &&
    req.method === "POST"
  ) {
    // Create a new request with test credentials in the body
    const url = new URL(req.url);
    const newReq = new Request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: "test@example.com",
        password: "TestPassword123!",
        provider: "credentials",
      }),
    });

    req = newReq;
  }

  const auth = await NextAuth(authOptions);
  return auth(req, context);
}

export { handler as GET, handler as POST };