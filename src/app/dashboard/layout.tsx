import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import DashboardNav from "@/components/dashboard/DashboardNav";
import Image from "next/image";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="hidden w-64 flex-shrink-0 border-r border-gray-200 bg-white lg:block">
          <div className="flex h-screen flex-col">
            {/* Logo */}
            <Link href="/" className="flex h-16 items-center border-b border-gray-200 px-4 hover:bg-gray-50">
              <span className="text-green-600 text-2xl font-bold">LG</span>
              <span className="ml-2 text-lg font-semibold text-gray-900">
                Lawn Genius
              </span>
            </Link>

            {/* Navigation */}
            <div className="flex flex-1 flex-col overflow-y-auto p-4">
              <DashboardNav />
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-1 flex-col">
          {/* Header */}
          <header className="border-b border-gray-200 bg-white">
            <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
              <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
              <div className="flex items-center gap-4">
                {session.user.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || ""}
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-full"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-sm font-medium text-green-700">
                    {(session.user.name || session.user.email || "U")[0].toUpperCase()}
                  </div>
                )}
                <span className="text-sm font-medium text-gray-700">
                  {session.user.name || session.user.email}
                </span>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}