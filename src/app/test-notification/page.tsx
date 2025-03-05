import { api } from '@/lib/trpc/server';

export default async function TestNotificationPage() {
  try {
    const result = await api.weather.testEmailNotification();
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Test Notification Results</h1>
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <p>Test notification sent successfully!</p>
          <p className="text-sm mt-2">Alert ID: {result.alertId}</p>
          <p className="text-sm">User ID: {result.userId}</p>
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Test Notification Error</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Failed to send test notification</p>
          <p className="text-sm mt-2">{error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      </div>
    );
  }
}