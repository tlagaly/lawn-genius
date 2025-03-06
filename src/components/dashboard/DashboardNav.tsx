"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";

const navigation = [
  { name: "Overview", href: "/dashboard" },
  { name: "Lawn Profiles", href: "/dashboard/lawn" },
  { name: "Grass Species", href: "/dashboard/grass-species" },
  { name: "Schedule", href: "/dashboard/schedule" },
  { name: "Notifications", href: "/dashboard/notifications" },
  { name: "Settings", href: "/dashboard/settings" },
];

export default function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {navigation.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`
              group flex items-center rounded-lg px-3 py-2 text-sm font-medium
              ${
                isActive
                  ? "bg-green-50 text-green-700"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              }
            `}
          >
            {item.name}
          </Link>
        );
      })}
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="group flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
      >
        Sign out
      </button>
    </nav>
  );
}