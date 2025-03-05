import { useState } from 'react';
import { setupPushNotifications } from '@/lib/notifications/client';
import { api } from '@/lib/trpc/client';

interface NotificationPreferencesProps {
  initialPreferences: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    notifyFrequency: string;
    monitoredConditions: string[] | null;
    alertThresholds: Record<string, number> | null;
  };
}

export default function NotificationPreferences({
  initialPreferences,
}: NotificationPreferencesProps) {
  const [preferences, setPreferences] = useState(initialPreferences);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const weatherConditions = [
    { id: 'temperature', label: 'Temperature' },
    { id: 'wind', label: 'Wind Speed' },
    { id: 'precipitation', label: 'Precipitation' },
    { id: 'conditions', label: 'Weather Conditions' },
  ];

  const utils = api.useUtils();
  const updatePreferences = api.user.updateNotificationPreferences.useMutation({
    onSuccess: () => {
      utils.user.getNotificationPreferences.invalidate();
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const handlePushNotificationToggle = async (enabled: boolean) => {
    try {
      setLoading(true);
      setError(null);

      if (enabled) {
        await setupPushNotifications();
      } else {
        // Handle unsubscribe
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
          await fetch('/api/notifications/unsubscribe', {
            method: 'POST',
          });
        }
      }

      setPreferences((prev) => ({
        ...prev,
        pushNotifications: enabled,
      }));

      await updatePreferences.mutateAsync({
        pushNotifications: enabled,
      });
    } catch (err) {
      setError('Failed to update push notification settings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = async (
    key: keyof typeof preferences,
    value: any
  ) => {
    try {
      setLoading(true);
      setError(null);

      setPreferences((prev) => ({
        ...prev,
        [key]: value,
      }));

      await updatePreferences.mutateAsync({
        [key]: value,
      });
    } catch (err) {
      setError('Failed to update preferences');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-lg">{error}</div>
      )}

      {/* Notification Methods */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Notification Methods</h2>
        <div className="space-y-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={preferences.emailNotifications}
              onChange={(e) =>
                handlePreferenceChange('emailNotifications', e.target.checked)
              }
              className="rounded"
            />
            <span>Email Notifications</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={preferences.pushNotifications}
              onChange={(e) =>
                handlePushNotificationToggle(e.target.checked)
              }
              className="rounded"
            />
            <span>Push Notifications</span>
          </label>
        </div>
      </div>

      {/* Notification Frequency */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Notification Frequency</h2>
        <select
          value={preferences.notifyFrequency}
          onChange={(e) =>
            handlePreferenceChange('notifyFrequency', e.target.value)
          }
          className="w-full p-2 border rounded"
        >
          <option value="immediate">Immediate</option>
          <option value="daily">Daily Summary</option>
          <option value="weekly">Weekly Summary</option>
        </select>
      </div>

      {/* Monitored Conditions */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Weather Conditions to Monitor</h2>
        <div className="space-y-2">
          {weatherConditions.map((condition) => (
            <label key={condition.id} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={preferences.monitoredConditions?.includes(condition.id) ?? false}
                onChange={(e) => {
                  const current = preferences.monitoredConditions ?? [];
                  const updated = e.target.checked
                    ? [...current, condition.id]
                    : current.filter((id) => id !== condition.id);
                  handlePreferenceChange('monitoredConditions', updated);
                }}
                className="rounded"
              />
              <span>{condition.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Alert Thresholds */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Alert Thresholds</h2>
        <div className="space-y-4">
          <div>
            <label className="block mb-2">Temperature (°F)</label>
            <input
              type="number"
              value={preferences.alertThresholds?.temperature ?? 90}
              onChange={(e) => {
                const thresholds = {
                  ...preferences.alertThresholds,
                  temperature: parseInt(e.target.value),
                };
                handlePreferenceChange('alertThresholds', thresholds);
              }}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block mb-2">Wind Speed (mph)</label>
            <input
              type="number"
              value={preferences.alertThresholds?.wind ?? 15}
              onChange={(e) => {
                const thresholds = {
                  ...preferences.alertThresholds,
                  wind: parseInt(e.target.value),
                };
                handlePreferenceChange('alertThresholds', thresholds);
              }}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block mb-2">Precipitation Chance (%)</label>
            <input
              type="number"
              value={preferences.alertThresholds?.precipitation ?? 50}
              onChange={(e) => {
                const thresholds = {
                  ...preferences.alertThresholds,
                  precipitation: parseInt(e.target.value),
                };
                handlePreferenceChange('alertThresholds', thresholds);
              }}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg">
            Saving preferences...
          </div>
        </div>
      )}
    </div>
  );
}