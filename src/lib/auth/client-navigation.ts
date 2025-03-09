"use client";

import { Session } from "next-auth";
import { useRouter } from "next/navigation";
import { DEFAULT_SUCCESS_REDIRECT } from "./navigation";

// Client-side auth success handler
export async function handleAuthSuccess(
  session: Session | null,
  options: {
    successRedirect?: string;
    showWelcome?: boolean;
  } = {}
): Promise<boolean> {
  const router = useRouter();
  const { successRedirect = DEFAULT_SUCCESS_REDIRECT, showWelcome = true } = options;

  try {
    if (session?.user) {
      // Store welcome message flag if needed
      if (showWelcome) {
        sessionStorage.setItem('showWelcome', 'true');
      }
      
      // Ensure we have a valid path
      const redirectPath = successRedirect || DEFAULT_SUCCESS_REDIRECT;
      
      // Perform the redirect
      await router.push(redirectPath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Auth success handling error:', error);
    return false;
  }
}

// Helper to check if we should show welcome message
export function shouldShowWelcome(): boolean {
  if (typeof window === 'undefined') return false;

  const shouldShow = sessionStorage.getItem('showWelcome') === 'true';
  if (shouldShow) {
    sessionStorage.removeItem('showWelcome');
  }
  return shouldShow;
}