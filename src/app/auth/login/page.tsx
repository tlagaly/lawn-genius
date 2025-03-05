import { Metadata } from "next";
import LoginForm from "@/components/auth/LoginForm";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Login | Lawn Genius",
  description: "Sign in to your Lawn Genius account",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-full flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Link href="/" className="flex justify-center text-green-600 text-4xl font-bold">
            LG
          </Link>
          <h1 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Lawn Genius
          </h1>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <LoginForm />
        </div>

        <div className="mt-8 text-center text-sm text-gray-600">
          By signing in, you agree to our{" "}
          <Link href="/terms" className="text-green-600 hover:text-green-500">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-green-600 hover:text-green-500">
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
}