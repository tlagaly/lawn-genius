'use client';

import { useState } from 'react';
import { WeatherAlert as WeatherAlertType } from '@/lib/weather/types';
import { api } from '@/lib/trpc/client';

interface WeatherAlertProps {
  alert: WeatherAlertType;
  treatmentType: string;
  location: {
    latitude: number;
    longitude: number;
    timezone: string;
  };
  originalDate: Date;
  onReschedule?: (newDate: Date) => void;
  onDismiss?: () => void;
}

export function WeatherAlert({
  alert,
  treatmentType,
  location,
  originalDate,
  onReschedule,
  onDismiss
}: WeatherAlertProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showRescheduleOptions, setShowRescheduleOptions] = useState(false);

  const { data: rescheduleOptions } = api.weather.getRescheduleOptions.useQuery(
    {
      treatmentId: alert.treatmentId,
      treatmentType,
      location,
      originalDate,
      daysToCheck: 7
    },
    { enabled: showRescheduleOptions }
  );

  const handleReschedule = async (date: Date) => {
    if (!onReschedule) return;
    setIsLoading(true);
    try {
      await onReschedule(date);
      setShowRescheduleOptions(false);
    } catch (error) {
      console.error('Error rescheduling treatment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`rounded-lg p-4 mb-4 ${
      alert.severity === 'critical' ? 'bg-red-100' : 'bg-yellow-100'
    }`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className={`font-semibold ${
            alert.severity === 'critical' ? 'text-red-800' : 'text-yellow-800'
          }`}>
            Weather Alert
          </h3>
          <p className="text-sm mt-1">{alert.message}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-gray-500 hover:text-gray-700"
          >
            <span className="sr-only">Dismiss</span>
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>

      {onReschedule && (
        <div className="mt-3">
          <button
            onClick={() => setShowRescheduleOptions(!showRescheduleOptions)}
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
            disabled={isLoading}
          >
            View rescheduling options
          </button>

          {showRescheduleOptions && rescheduleOptions && (
            <div className="mt-2 space-y-2">
              {rescheduleOptions.map((option) => (
                <button
                  key={option.date.toISOString()}
                  onClick={() => handleReschedule(option.date)}
                  disabled={isLoading}
                  className="block w-full text-left px-3 py-2 text-sm rounded-md hover:bg-blue-50 disabled:opacity-50"
                >
                  <div className="flex justify-between items-center">
                    <span>
                      {option.date.toLocaleDateString()} ({option.date.toLocaleTimeString()})
                    </span>
                    <span className="text-green-600">
                      Score: {option.score}/5
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {option.conditions.conditions}, {option.conditions.temperature}°C
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}