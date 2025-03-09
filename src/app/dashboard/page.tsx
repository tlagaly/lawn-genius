'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dashboard Overview</h2>
        <p className="text-gray-600">Welcome to your lawn care dashboard</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Profile Card */}
        <div className="rounded-lg border bg-white p-6">
          <h3 className="text-lg font-medium">Profile</h3>
          <p className="mt-2 text-sm text-gray-600">
            Manage your profile and preferences
          </p>
          <a
            href="/dashboard/profile"
            className="mt-4 inline-block text-sm text-green-600 hover:text-green-700"
          >
            View profile →
          </a>
        </div>

        {/* Lawn Profiles */}
        <div className="rounded-lg border bg-white p-6">
          <h3 className="text-lg font-medium">Lawn Profiles</h3>
          <p className="mt-2 text-sm text-gray-600">
            Manage your lawn profiles and schedules
          </p>
          <a
            href="/dashboard/lawn"
            className="mt-4 inline-block text-sm text-green-600 hover:text-green-700"
          >
            View lawn profiles →
          </a>
        </div>

        {/* Weather */}
        <div className="rounded-lg border bg-white p-6">
          <h3 className="text-lg font-medium">Weather Updates</h3>
          <p className="mt-2 text-sm text-gray-600">
            Check weather conditions for your lawn care
          </p>
          <a
            href="/dashboard/weather"
            className="mt-4 inline-block text-sm text-green-600 hover:text-green-700"
          >
            View weather →
          </a>
        </div>
      </div>
    </div>
  );
}