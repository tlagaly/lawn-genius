'use client';

import { useState, useEffect } from 'react';
import { WeatherAlert as WeatherAlertType } from '@/lib/weather/types';
import { WeatherAlert } from './WeatherAlert';
import { api } from '@/lib/trpc/client';

interface WeatherAlertListProps {
  alerts: WeatherAlertType[];
  onReschedule: (treatmentId: string, newDate: Date) => Promise<void>;
}

export function WeatherAlertList({ alerts, onReschedule }: WeatherAlertListProps) {
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  // Reset dismissed alerts when alerts array changes
  useEffect(() => {
    setDismissedAlerts(new Set());
  }, [alerts]);

  const handleDismiss = (alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
  };

  const visibleAlerts = alerts.filter(alert => !dismissedAlerts.has(alert.id));

  if (visibleAlerts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">
        Weather Alerts ({visibleAlerts.length})
      </h2>
      <div className="space-y-2">
        {visibleAlerts.map(alert => (
          <WeatherAlert
            key={alert.id}
            alert={alert}
            treatmentType={alert.treatmentType} // Added from alert type
            location={alert.location} // Added from alert type
            originalDate={alert.originalDate} // Added from alert type
            onReschedule={(newDate) => onReschedule(alert.treatmentId, newDate)}
            onDismiss={() => handleDismiss(alert.id)}
          />
        ))}
      </div>
    </div>
  );
}