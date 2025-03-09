"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { TRPCClientError } from "@trpc/client";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { AUTH_ERRORS } from "@/lib/auth/error-constants";

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const resetPasswordMutation = trpc.user.resetPassword.useMutation({
    onSuccess: () => {
      setSuccess(true);
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    },
    onError: (error) => {
      if (error instanceof TRPCClientError) {
        if (error.message.includes("token")) {
          setError(AUTH_ERRORS.RESET_TOKEN_INVALID);
        } else {
          setError(AUTH_ERRORS.RESET_FAILED);
        }
      } else {
        setError(AUTH_ERRORS.SERVER_ERROR);
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    // Client-side validation
    if (!token) {
      setError(AUTH_ERRORS.RESET_TOKEN_INVALID);
      return;
    }

    if (!PASSWORD_REGEX.test(newPassword)) {
      setError(AUTH_ERRORS.PASSWORD_TOO_WEAK);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(AUTH_ERRORS.PASSWORDS_DONT_MATCH);
      return;
    }

    resetPasswordMutation.mutate({
      token,
      newPassword,
    });
  };

  return (
    <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div className="rounded-lg bg-white px-4 py-8 shadow sm:px-10">
        <form
          className="space-y-6"
          onSubmit={handleSubmit}
          data-testid="reset-password-form"
        >
          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-gray-700"
            >
              New Password
            </label>
            <div className="mt-1">
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
                data-testid="new-password-input"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700"
            >
              Confirm Password
            </label>
            <div className="mt-1">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
                data-testid="confirm-password-input"
              />
            </div>
          </div>

          {error && (
            <ErrorMessage
              message={error}
              variant="error"
              className="mb-4"
              data-testid="error-message"
            />
          )}

          {success && (
            <ErrorMessage
              message="Password reset successful! Redirecting to login..."
              variant="success"
              className="mb-4"
              data-testid="success-message"
            />
          )}

          <div>
            <button
              type="submit"
              disabled={resetPasswordMutation.isLoading}
              className="flex w-full justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
              data-testid="reset-password-submit"
            >
              <span data-testid="submit-button-text">
                {resetPasswordMutation.isLoading ? "Resetting Password..." : "Reset Password"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}