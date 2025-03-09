import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "./auth-options";

export const PROTECTED_ROUTES = [
  "/dashboard",
  "/profile",
  "/settings",
  "/lawn-profiles",
  "/schedules",
] as const;

export const PUBLIC_ONLY_ROUTES = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
] as const;

export const DEFAULT_AUTH_REDIRECT = "/auth/login";
export const DEFAULT_SUCCESS_REDIRECT = "/dashboard";

interface NavigationGuardOptions {
  requireAuth?: boolean;
  publicOnly?: boolean;
  redirectTo?: string;
}

export async function navigationGuard(
  currentPath: string,
  options: NavigationGuardOptions = {}
) {
  const {
    requireAuth = false,
    publicOnly = false,
    redirectTo,
  } = options;

  try {
    const session = await getServerSession(authOptions);
    const isAuthenticated = !!session?.user;

    // Handle protected routes
    if (requireAuth && !isAuthenticated) {
      const searchParams = new URLSearchParams({
        callbackUrl: currentPath,
      });
      redirect(`${DEFAULT_AUTH_REDIRECT}?${searchParams.toString()}`);
    }

    // Handle public-only routes (like login) when user is authenticated
    if (publicOnly && isAuthenticated) {
      redirect(redirectTo || DEFAULT_SUCCESS_REDIRECT);
    }

    return {
      isAuthenticated,
      session,
    };
  } catch (error) {
    console.error("Navigation guard error:", error);
    // On error, redirect to login for safety
    redirect(DEFAULT_AUTH_REDIRECT);
  }
}

export function isProtectedRoute(path: string): boolean {
  return PROTECTED_ROUTES.some(route => path.startsWith(route));
}

export function isPublicOnlyRoute(path: string): boolean {
  return PUBLIC_ONLY_ROUTES.some(route => path.startsWith(route));
}

// Helper for client-side navigation checks
export function shouldRedirect(
  path: string,
  isAuthenticated: boolean
): string | null {
  if (isProtectedRoute(path) && !isAuthenticated) {
    const searchParams = new URLSearchParams({
      callbackUrl: path,
    });
    return `${DEFAULT_AUTH_REDIRECT}?${searchParams.toString()}`;
  }

  if (isPublicOnlyRoute(path) && isAuthenticated) {
    return DEFAULT_SUCCESS_REDIRECT;
  }
  return null;
}

// Middleware helper
export function getNavigationRules(path: string) {
  return {
    requireAuth: isProtectedRoute(path),
    publicOnly: isPublicOnlyRoute(path),
  };
}