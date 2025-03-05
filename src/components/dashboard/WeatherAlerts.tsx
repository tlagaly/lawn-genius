'use client';

import { useEffect } from 'react';
import { api } from '@/lib/trpc/client';
import { WeatherAlertList } from '../weather/WeatherAlertList';
import { useRouter } from 'next/navigation';

export function WeatherAlerts() {
  const router = useRouter();
  const utils = api.useContext();

  // Get scheduled treatments that need monitoring
  const { data: scheduledTreatments } = api.schedule.getUpcomingTreatments.useQuery();

  // Start monitoring for each treatment
  const startMonitoring = api.weather.startMonitoring.useMutation({
    onSuccess: () => {
      utils.schedule.getUpcomingTreatments.invalidate();
    }
  });

  // Handle rescheduling
  const rescheduleTreatment = api.schedule.rescheduleTreatment.useMutation({
    onSuccess: () => {
      utils.schedule.getUpcomingTreatments.invalidate();
      router.refresh();
    }
  });

  // Start monitoring when treatments are loaded
  useEffect(() => {
    if (scheduledTreatments) {
      scheduledTreatments.forEach(treatment => {
        if (treatment.lawn) {
          startMonitoring.mutate({
            treatmentId: treatment.id,
            treatmentType: treatment.type,
            location: {
              latitude: treatment.lawn.latitude,
              longitude: treatment.lawn.longitude,
              timezone: treatment.lawn.timezone
            },
            scheduledDate: treatment.scheduledDate,
            config: {
              checkInterval: 30, // Check every 30 minutes
              alertThreshold: 3, // Alert when weather score is 3 or lower
              forecastHours: 24 // Look ahead 24 hours
            }
          });
        }
      });
    }
  }, [scheduledTreatments]);

  // Handle rescheduling
  const handleReschedule = async (treatmentId: string, newDate: Date) => {
    await rescheduleTreatment.mutate({
      treatmentId,
      newDate
    });
  };

  if (!scheduledTreatments || scheduledTreatments.length === 0) {
    return null;
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <WeatherAlertList
        alerts={scheduledTreatments.flatMap(treatment => 
          treatment.weatherAlerts || []
        )}
        onReschedule={handleReschedule}
      />
    </div>
  );
}