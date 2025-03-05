'use client';

import { useState } from 'react';
import { api } from '@/lib/trpc/client';
import { type inferRouterOutputs } from '@trpc/server';
import { type AppRouter } from '@/lib/trpc/root';

type RouterOutputs = inferRouterOutputs<AppRouter>;
type Schedule = RouterOutputs['schedule']['getAll'][0];
type Treatment = Schedule['treatments'][0];

interface CalendarDay {
  date: Date;
  treatments: Treatment[];
  isCurrentMonth: boolean;
}

interface ScheduleCalendarProps {
  initialDate?: Date;
}

export function ScheduleCalendar({ initialDate = new Date() }: ScheduleCalendarProps) {
  const [currentDate, setCurrentDate] = useState(initialDate);
  const { data: schedules } = api.schedule.getAll.useQuery();

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: CalendarDay[] = [];

    // Add days from previous month to start on Sunday
    const firstDayOfWeek = firstDay.getDay();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({
        date,
        treatments: getTreatmentsForDate(date),
        isCurrentMonth: false,
      });
    }

    // Add days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      days.push({
        date,
        treatments: getTreatmentsForDate(date),
        isCurrentMonth: true,
      });
    }

    // Add days from next month to complete the grid
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        treatments: getTreatmentsForDate(date),
        isCurrentMonth: false,
      });
    }

    return days;
  };

  const getTreatmentsForDate = (date: Date): Treatment[] => {
    if (!schedules) return [];
    
    return schedules.flatMap((schedule: Schedule) =>
      schedule.treatments.filter((treatment: Treatment) => {
        const treatmentDate = new Date(treatment.date);
        return treatmentDate.getFullYear() === date.getFullYear() &&
               treatmentDate.getMonth() === date.getMonth() &&
               treatmentDate.getDate() === date.getDate();
      })
    );
  };

  const calendarDays = getDaysInMonth(currentDate);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="flex items-center justify-between p-4">
        <button
          onClick={goToPreviousMonth}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          ←
        </button>
        <h2 className="text-xl font-semibold">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-500"
          >
            {day}
          </div>
        ))}

        {calendarDays.map((day, idx) => (
          <div
            key={idx}
            className={`min-h-[100px] bg-white p-2 ${
              day.isCurrentMonth ? '' : 'text-gray-400'
            }`}
          >
            <div className="font-medium">{day.date.getDate()}</div>
            <div className="mt-1 space-y-1">
              {day.treatments.map((treatment) => (
                <div
                  key={treatment.id}
                  className={`text-xs p-1 rounded ${
                    treatment.completed
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {treatment.type}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}