import { useState } from 'react';
import { api } from '@/lib/trpc/client';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  createdAt: Date;
  read: boolean;
}

interface NotificationHistoryProps {
  initialNotifications: Notification[];
}

export default function NotificationHistory({
  initialNotifications,
}: NotificationHistoryProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [loading, setLoading] = useState(false);

  const utils = api.useUtils();
  const markAsRead = api.user.markNotificationAsRead.useMutation({
    onSuccess: () => {
      utils.user.getNotifications.invalidate();
    },
  });

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      setLoading(true);
      await markAsRead.mutateAsync({ notificationId });
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'weather':
        return '🌤️';
      case 'schedule':
        return '📅';
      case 'system':
        return '⚙️';
      default:
        return '📬';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(new Date(date));
  };

  return (
    <div className="space-y-4">
      {notifications.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No notifications yet
        </div>
      ) : (
        notifications.map((notification) => (
          <div
            key={notification.id}
            className={`bg-white p-4 rounded-lg shadow transition ${
              notification.read ? 'opacity-75' : ''
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{notification.title}</h3>
                  <span className="text-sm text-gray-500">
                    {formatDate(notification.createdAt)}
                  </span>
                </div>
                <p className="text-gray-600 mt-1">{notification.message}</p>
                {!notification.read && (
                  <button
                    onClick={() => handleMarkAsRead(notification.id)}
                    disabled={loading}
                    className="text-sm text-blue-600 hover:text-blue-800 mt-2"
                  >
                    Mark as read
                  </button>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}