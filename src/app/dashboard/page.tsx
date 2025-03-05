import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import Link from "next/link";
import { WeatherAlerts } from "@/components/dashboard/WeatherAlerts";

export const metadata: Metadata = {
  title: "Dashboard | Lawn Genius",
  description: "Manage your lawn care schedule and profiles",
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const firstName = session?.user?.name?.split(" ")[0] || "there";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          Welcome back, {firstName}!
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Manage your lawn care schedule and track your progress.
        </p>
      </div>

      {/* Weather Alerts */}
      <div className="rounded-lg border-l-4 border-l-yellow-500 border-y border-r border-gray-200 bg-white p-6">
        <WeatherAlerts />
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Quick Actions */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-base font-semibold text-gray-900">Quick Actions</h3>
          <div className="mt-4 space-y-3">
            <Link
              href="/dashboard/lawn/new"
              className="block rounded-md bg-green-50 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-100"
            >
              Create New Lawn Profile
            </Link>
            <Link
              href="/dashboard/schedule/new"
              className="block rounded-md bg-green-50 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-100"
            >
              Schedule Treatment
            </Link>
          </div>
        </div>

        {/* Upcoming Treatments */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-base font-semibold text-gray-900">
            Upcoming Treatments
          </h3>
          <div className="mt-4">
            <p className="text-sm text-gray-600">
              No upcoming treatments scheduled.
            </p>
            <Link
              href="/dashboard/schedule"
              className="mt-3 block text-sm font-medium text-green-600 hover:text-green-500"
            >
              View Schedule →
            </Link>
          </div>
        </div>

        {/* Subscription Status */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-base font-semibold text-gray-900">
            Subscription Status
          </h3>
          <div className="mt-4">
            <p className="text-sm text-gray-600">Free Plan</p>
            <Link
              href="/subscription"
              className="mt-3 block text-sm font-medium text-green-600 hover:text-green-500"
            >
              Upgrade Plan →
            </Link>
          </div>
        </div>
      </div>

      {/* Getting Started */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-gray-900">Getting Started</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
            <h4 className="font-medium text-gray-900">Create a Lawn Profile</h4>
            <p className="mt-1 text-sm text-gray-600">
              Add details about your lawn to get personalized care recommendations.
            </p>
          </div>
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
            <h4 className="font-medium text-gray-900">Set Up Your Schedule</h4>
            <p className="mt-1 text-sm text-gray-600">
              Plan your lawn care activities with our treatment scheduler.
            </p>
          </div>
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
            <h4 className="font-medium text-gray-900">Track Progress</h4>
            <p className="mt-1 text-sm text-gray-600">
              Monitor your lawn&apos;s health and treatment history.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}