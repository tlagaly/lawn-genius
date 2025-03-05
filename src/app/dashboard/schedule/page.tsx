'use client';

import { useState } from 'react';
import { api } from '@/lib/trpc/client';
import { type inferRouterOutputs } from '@trpc/server';
import { type AppRouter } from '@/lib/trpc/root';

type RouterOutputs = inferRouterOutputs<AppRouter>;
type Schedule = RouterOutputs['schedule']['getAll'][0];
import { ScheduleForm } from '@/components/schedule/ScheduleForm';
import { ScheduleCalendar } from '@/components/schedule/ScheduleCalendar';
import { TreatmentList } from '@/components/schedule/TreatmentList';

export default function SchedulePage() {
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const { data: schedules, refetch } = api.schedule.getAll.useQuery();

  const handleScheduleSelect = (scheduleId: string) => {
    setSelectedScheduleId(scheduleId);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Schedule List */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold mb-4">Treatment Schedules</h2>
            <div className="space-y-4">
              {schedules?.map((schedule: Schedule) => (
                <button
                  key={schedule.id}
                  onClick={() => handleScheduleSelect(schedule.id)}
                  className={`w-full text-left p-4 rounded-lg border ${
                    selectedScheduleId === schedule.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <h3 className="font-medium">{schedule.name}</h3>
                  <p className="text-sm text-gray-500">
                    {schedule.lawnProfile.name} -{' '}
                    {new Date(schedule.startDate).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    {schedule.treatments.length} treatments
                  </p>
                </button>
              ))}
            </div>

            <div className="mt-6">
              <button
                onClick={() => setSelectedScheduleId(null)}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Create New Schedule
              </button>
            </div>
          </div>
        </div>

        {/* Calendar View */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <ScheduleCalendar />
          </div>
        </div>

        {/* Schedule Form or Treatment List */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow p-6">
            {selectedScheduleId ? (
              <>
                <h2 className="text-2xl font-semibold mb-4">Manage Treatments</h2>
                <TreatmentList
                  scheduleId={selectedScheduleId}
                  onTreatmentUpdate={() => refetch()}
                />
              </>
            ) : (
              <>
                <h2 className="text-2xl font-semibold mb-4">Create New Schedule</h2>
                <ScheduleForm />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}