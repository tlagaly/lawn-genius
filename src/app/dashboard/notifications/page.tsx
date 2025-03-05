'use client';

import { api } from '@/lib/trpc/client';
import NotificationPreferences from '@/components/notifications/NotificationPreferences';
import NotificationHistory from '@/components/notifications/NotificationHistory';
import { useRouter } from 'next/navigation';

export default function NotificationsPage() {
  const router = useRouter();
  
  const { data: preferences, isLoading: prefsLoading } = api.user.getNotificationPreferences.useQuery(undefined, {
    onError: () => router.push('/auth/login'),
  });

  const { data: notifications, isLoading: notifsLoading } = api.user.getNotifications.useQuery(undefined, {
    onError: () => router.push('/auth/login'),
  });

  if (prefsLoading || notifsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-8 bg-gray-200 rounded w-1/4 mt-8"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!preferences || !notifications) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Notification Settings</h1>
      
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">Preferences</h2>
          <NotificationPreferences
            initialPreferences={{
              emailNotifications: preferences.emailNotifications,
              pushNotifications: preferences.pushNotifications,
              notifyFrequency: preferences.notifyFrequency,
              monitoredConditions: preferences.monitoredConditions as string[] | null,
              alertThresholds: preferences.alertThresholds as Record<string, number> | null,
            }}
          />
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Notification History</h2>
          <NotificationHistory initialNotifications={notifications} />
        </section>
      </div>
    </div>
  );
}