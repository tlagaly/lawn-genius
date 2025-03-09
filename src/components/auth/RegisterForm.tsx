"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/trpc/client";
import { motion, AnimatePresence } from "framer-motion";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { AUTH_ERRORS } from "@/lib/auth/error-constants";
import { useHydrated } from "@/hooks/useHydrated";

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

interface ValidationState {
  name: string | null;
  email: string | null;
  password: string | null;
  confirmPassword: string | null;
}

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
};

const validateName = (name: string): boolean => {
  return name.length >= 2 && /^[a-zA-Z\s-]+$/.test(name);
};

export default function RegisterForm() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const isHydrated = useHydrated();
  const [validationErrors, setValidationErrors] = useState<ValidationState>({
    name: null,
    email: null,
    password: null,
    confirmPassword: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionChecks, setSessionChecks] = useState(0);

  useEffect(() => {
    if (session && sessionStatus === "authenticated") {
      router.replace("/dashboard");
    }
  }, [session, sessionStatus, router]);
  const [error, setError] = useState<string | null>(null);
  
  const createUser = api.user.create.useMutation({
    onSuccess: async (_, variables) => {
      // Sign in the user after successful registration
      try {
        // Sign in after registration
        const result = await signIn("credentials", {
          email: variables.email,
          password: variables.password,
          redirect: false,
          callbackUrl: "/dashboard"
        });

        if (result?.error) {
          setError(AUTH_ERRORS.LOGIN_FAILED);
          return;
        }

        // Wait for session to be established
        const checkSession = async () => {
          const response = await fetch('/api/auth/session');
          return response.ok && response.status === 200;
        };

        // Poll for session establishment
        for (let i = 0; i < 5; i++) {
          if (await checkSession()) {
            await router.replace("/dashboard");
            return;
          }
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        throw new Error("Session not established");
      } catch (error) {
        setError(AUTH_ERRORS.REGISTRATION_FAILED);
        console.error("Registration error:", error);
      }
    },
    onError: (error) => {
      if (error.message.includes("email")) {
        setError(AUTH_ERRORS.EMAIL_IN_USE);
      } else {
        setError(AUTH_ERRORS.REGISTRATION_FAILED);
      }
    },
  });

  const validateForm = (
    name: string,
    email: string,
    password: string,
    confirmPassword: string
  ): boolean => {
    const newValidationErrors: ValidationState = {
      name: null,
      email: null,
      password: null,
      confirmPassword: null,
    };
    let isValid = true;

    if (!validateName(name)) {
      newValidationErrors.name = "Name must be at least 2 characters and contain only letters, spaces, and hyphens";
      isValid = false;
    }

    if (!validateEmail(email)) {
      newValidationErrors.email = AUTH_ERRORS.INVALID_EMAIL;
      isValid = false;
    }

    if (!validatePassword(password)) {
      newValidationErrors.password = AUTH_ERRORS.PASSWORD_TOO_WEAK;
      isValid = false;
    }

    if (password !== confirmPassword) {
      newValidationErrors.confirmPassword = AUTH_ERRORS.PASSWORDS_DONT_MATCH;
      isValid = false;
    }

    setValidationErrors(newValidationErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setValidationErrors({
      name: null,
      email: null,
      password: null,
      confirmPassword: null
    });
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!validateForm(name, email, password, confirmPassword)) {
      setIsSubmitting(false);
      return;
    }

    try {
      await createUser.mutateAsync({
        name,
        email,
        password,
      });
    } catch (err) {
      setIsSubmitting(false);
      console.error("Form submission error:", err);
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Or{" "}
          <Link href="/auth/login" className="text-green-600 hover:text-green-500">
            sign in to your account
          </Link>
        </p>
      </div>

      <form
        className="mt-8 space-y-6"
        onSubmit={handleSubmit}
        data-testid="register-form"
        data-hydrated={isHydrated}
        aria-busy={!isHydrated}
      >
        <div className="space-y-4 rounded-md">
          <div>
            <label htmlFor="name" className="sr-only">
              Full name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              disabled={!isHydrated || isSubmitting}
              className={`relative block w-full rounded-lg border ${
                validationErrors.name ? 'border-red-300' : 'border-gray-300'
              } px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm ${
                isSubmitting ? 'opacity-50' : ''
              }`}
              placeholder="Full name"
              data-testid="name-input"
            />
            {validationErrors.name && (
              <ErrorMessage
                message={validationErrors.name}
                className="mt-1"
                data-testid="name-error"
              />
            )}
          </div>
          <div>
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              disabled={!isHydrated || isSubmitting}
              className={`relative block w-full rounded-lg border ${
                validationErrors.email ? 'border-red-300' : 'border-gray-300'
              } px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm ${
                isSubmitting ? 'opacity-50' : ''
              }`}
              placeholder="Email address"
              data-testid="email-input"
            />
            {validationErrors.email && (
              <ErrorMessage
                message={validationErrors.email}
                className="mt-1"
                data-testid="email-error"
              />
            )}
          </div>
          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              disabled={!isHydrated || isSubmitting}
              className={`relative block w-full rounded-lg border ${
                validationErrors.password ? 'border-red-300' : 'border-gray-300'
              } px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm ${
                isSubmitting ? 'opacity-50' : ''
              }`}
              placeholder="Password"
              data-testid="password-input"
            />
            {validationErrors.password && (
              <ErrorMessage
                message={validationErrors.password}
                className="mt-1"
                data-testid="password-error"
              />
            )}
          </div>
          <div>
            <label htmlFor="confirmPassword" className="sr-only">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              disabled={isSubmitting}
              className={`relative block w-full rounded-lg border ${
                validationErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
              } px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm ${
                isSubmitting ? 'opacity-50' : ''
              }`}
              placeholder="Confirm password"
              data-testid="confirm-password-input"
            />
            {validationErrors.confirmPassword && (
              <ErrorMessage
                message={validationErrors.confirmPassword}
                className="mt-1"
                data-testid="confirm-password-error"
              />
            )}
          </div>
        </div>

        {error && (
          <ErrorMessage
            message={error}
            className="mb-4"
            data-testid="form-error"
          />
        )}

        <div className="space-y-4">
          <button
            type="submit"
            disabled={!isHydrated || isSubmitting || createUser.isLoading}
            className="group relative flex w-full items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="register-form-submit"
          >
            {(!isHydrated || isSubmitting || createUser.isLoading) && <LoadingSpinner />}
            <span data-testid="submit-button-text">
              {!isHydrated ? "Loading..." :
               isSubmitting ? "Creating account..." :
               createUser.isLoading ? "Setting up your account..." :
               "Create account"}
            </span>
          </button>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={!isHydrated || createUser.isLoading}
            className="group relative flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
            data-testid="google-sign-in-button"
          >
            <svg
              className="mr-2 h-5 w-5"
              aria-hidden="true"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
            </svg>
            Sign up with Google
          </button>
        </div>
      </form>
    </div>
  );
}