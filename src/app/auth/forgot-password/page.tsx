import { Metadata } from "next";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Reset Password | Lawn Genius",
  description: "Reset your Lawn Genius account password",
};

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-full flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Link href="/" className="flex justify-center">
            <Image
              src="/logo.svg"
              alt="Lawn Genius"
              width={64}
              height={64}
              className="h-16 w-16"
              priority
            />
          </Link>
          <h1 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Reset Password
          </h1>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <ForgotPasswordForm />
        </div>

        <div className="mt-8 text-center text-sm text-gray-600">
          Remember your password?{" "}
          <Link href="/auth/login" className="text-green-600 hover:text-green-500">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}