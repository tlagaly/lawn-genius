"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/trpc/client";

export default function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  
  const createUser = api.user.create.useMutation({
    onSuccess: async (_, variables) => {
      // Sign in the user after successful registration
      const result = await signIn("credentials", {
        email: variables.email,
        password: variables.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Failed to sign in after registration");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    },
    onError: (error) => {
      setError(error.message || "An error occurred during registration");
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    createUser.mutate({
      name,
      email,
      password,
    });
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

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
              className="relative block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
              placeholder="Full name"
            />
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
              className="relative block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
              placeholder="Email address"
            />
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
              className="relative block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
              placeholder="Password"
            />
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
              className="relative block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
              placeholder="Confirm password"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        <div className="space-y-4">
          <button
            type="submit"
            disabled={createUser.isLoading}
            className="group relative flex w-full justify-center rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {createUser.isLoading ? "Creating account..." : "Create account"}
          </button>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={createUser.isLoading}
            className="group relative flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
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