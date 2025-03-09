"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { loginSchema, validateLoginForm, AUTH_ERRORS, verifySession } from "@/lib/auth/validation";
import type { LoginFormData } from "@/lib/auth/validation";
import { useHydrated } from "@/hooks/useHydrated";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const isHydrated = useHydrated();

  // Redirect if already authenticated
  useEffect(() => {
    if (session && status === "authenticated") {
      const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
      router.replace(callbackUrl);
    }
  }, [session, status, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const data: LoginFormData = {
        email: formData.get("email") as string,
        password: formData.get("password") as string,
      };

      // Validate form data
      const validation = validateLoginForm(data);
      if (!validation.success) {
        setError(validation.error || AUTH_ERRORS.SERVER_ERROR);
        setIsLoading(false);
        return;
      }

      const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
      const result = await signIn("credentials", {
        ...data,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError(AUTH_ERRORS.INVALID_CREDENTIALS);
        setIsLoading(false);
        return;
      }

      // Verify session establishment
      setIsValidating(true);
      let sessionEstablished = false;
      for (let i = 0; i < 5; i++) {
        try {
          const currentSession = await fetch('/api/auth/session').then(res => res.json());
          if (await verifySession(currentSession)) {
            sessionEstablished = true;
            break;
          }
        } catch (error) {
          console.error("Session verification error:", error);
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (!sessionEstablished) {
        setError(AUTH_ERRORS.SESSION_EXPIRED);
        setIsLoading(false);
        setIsValidating(false);
        return;
      }

      // Redirect on successful login
      await router.replace(callbackUrl);
      router.refresh();
    } catch (error) {
      console.error("Login error:", error);
      setError(AUTH_ERRORS.SERVER_ERROR);
      setIsLoading(false);
      setIsValidating(false);
    }
  };

  const handleGoogleSignIn = () => {
    const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
    setIsLoading(true);
    signIn("google", { callbackUrl });
  };

  const LoadingSpinner = () => (
    <svg
      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  return (
    <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Or{" "}
          <Link href="/auth/register" className="text-green-600 hover:text-green-500">
            create a new account
          </Link>
        </p>
      </div>

      <form
        className="mt-8 space-y-6"
        onSubmit={handleSubmit}
        noValidate
        data-testid="login-form"
        data-hydrated={isHydrated}
        aria-busy={!isHydrated}
      >
        <div className="space-y-4 rounded-md">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              disabled={!isHydrated || isLoading || isValidating}
              className="mt-1 relative block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="Enter your email"
              data-testid="email-input"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={!isHydrated || isLoading || isValidating}
              className="mt-1 relative block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="Enter your password"
              data-testid="password-input"
            />
          </div>
        </div>

        {error && (
          <ErrorMessage
            message={error}
            variant="error"
            className="mt-4"
            data-testid="error-message"
          />
        )}

        <div className="flex items-center justify-between">
          <div className="text-sm">
            <Link
              href="/auth/forgot-password"
              className="text-green-600 hover:text-green-500"
              tabIndex={!isHydrated || isLoading || isValidating ? -1 : 0}
            >
              Forgot your password?
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          <button
            type="submit"
            disabled={!isHydrated || isLoading || isValidating}
            className="group relative flex w-full items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
            data-testid="login-form-submit"
          >
            {(!isHydrated || isLoading || isValidating) && <LoadingSpinner />}
            <span data-testid="submit-button-text">
              {!isHydrated ? "Loading..." : isValidating ? "Verifying..." : isLoading ? "Signing in..." : "Sign in"}
            </span>
          </button>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={!isHydrated || isLoading || isValidating}
            className="group relative flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
          >
            <svg
              className="mr-2 h-5 w-5"
              aria-hidden="true"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
            </svg>
            Sign in with Google
          </button>
        </div>
      </form>
    </div>
  );
}