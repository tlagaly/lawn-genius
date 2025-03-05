"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/trpc/client";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const resetMutation = api.user.requestPasswordReset.useMutation({
    onSuccess: () => {
      setSuccess(true);
    },
    onError: (error) => {
      setError(error.message || "An error occurred. Please try again.");
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    resetMutation.mutate({ email });
  };

  if (success) {
    return (
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Check your email</h2>
          <p className="mt-2 text-sm text-gray-600">
            If an account exists for {email}, we have sent password reset
            instructions to your email address.
          </p>
        </div>
        <div className="mt-6 text-center">
          <Link
            href="/auth/login"
            className="text-sm text-green-600 hover:text-green-500"
          >
            Return to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Reset your password</h2>
        <p className="mt-2 text-sm text-gray-600">
          Enter your email address and we&apos;ll send you instructions to reset
          your password.
        </p>
      </div>

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="relative block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
            placeholder="Email address"
          />
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={resetMutation.isLoading}
            className="group relative flex w-full justify-center rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {resetMutation.isLoading ? "Sending..." : "Send reset instructions"}
          </button>
        </div>

        <div className="text-center">
          <Link
            href="/auth/login"
            className="text-sm text-green-600 hover:text-green-500"
          >
            Return to sign in
          </Link>
        </div>
      </form>
    </div>
  );
}