'use client';

import { useState } from 'react';
import { api } from '@/lib/trpc/client';
import { type inferRouterOutputs } from '@trpc/server';
import { type AppRouter } from '@/lib/trpc/root';

type RouterOutputs = inferRouterOutputs<AppRouter>;
type Schedule = RouterOutputs['schedule']['getAll'][0];
type Treatment = Schedule['treatments'][0];
type WeatherData = RouterOutputs['weather']['getCurrentWeather'];

interface CalendarDay {
  date: Date;
  treatments: Treatment[];
  isCurrentMonth: boolean;
  weather?: WeatherData;
  weatherScore?: number;
}

interface ScheduleCalendarProps {
  initialDate?: Date;
}

function WeatherIndicator({ weather, score }: { weather?: WeatherData; score?: number }) {
  if (!weather) return null;

  const getWeatherIcon = (conditions: string) => {
    switch (conditions.toLowerCase()) {
      case 'clear':
        return '☀️';
      case 'clouds':
      case 'partly cloudy':
        return '⛅';
      case 'rain':
        return '🌧️';
      case 'snow':
        return '❄️';
      default:
        return '🌤️';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-green-600';
    if (score >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="text-xs flex items-center gap-1">
      <span>{getWeatherIcon(weather.conditions)}</span>
      <span>{Math.round(weather.temperature)}°C</span>
      {score && (
        <span className={`font-medium ${getScoreColor(score)}`}>
          ({score}/5)
        </span>
      )}
    </div>
  );
}

function TreatmentCard({ treatment, weather }: { treatment: Treatment; weather?: WeatherData }) {
  const statusColors = {
    completed: 'bg-green-100 text-green-800',
    pending: 'bg-blue-100 text-blue-800',
    unsuitable: 'bg-red-100 text-red-800',
  };

  const getStatus = () => {
    if (treatment.completed) return 'completed';
    if (treatment.weatherScore && treatment.weatherScore < 3) return 'unsuitable';
    return 'pending';
  };

  return (
    <div
      className={`text-xs p-2 rounded ${statusColors[getStatus()]} space-y-1`}
    >
      <div className="flex justify-between items-center">
        <span>{treatment.type}</span>
        {treatment.weatherScore && (
          <span className="text-xs">Score: {treatment.weatherScore}/5</span>
        )}
      </div>
      {treatment.effectiveness && (
        <div className="text-xs">
          Effectiveness: {treatment.effectiveness}/5
        </div>
      )}
    </div>
  );
}

export function ScheduleCalendar({ initialDate = new Date() }: ScheduleCalendarProps) {
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  
  const { data: schedules } = api.schedule.getAll.useQuery();
  const { data: weatherForecasts } = api.weather.getForecast.useQuery(
    {
      latitude: 0, // TODO: Get from first lawn profile
      longitude: 0,
      timezone: 'UTC',
      days: 5,
    },
    {
      enabled: false, // TODO: Enable when we have location data
    }
  );

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
        weather: getWeatherForDate(date),
      });
    }

    // Add days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      days.push({
        date,
        treatments: getTreatmentsForDate(date),
        isCurrentMonth: true,
        weather: getWeatherForDate(date),
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
        weather: getWeatherForDate(date),
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

  const getWeatherForDate = (date: Date) => {
    if (!weatherForecasts) return undefined;

    return weatherForecasts.find(forecast => {
      const forecastDate = new Date(forecast.date);
      return forecastDate.getFullYear() === date.getFullYear() &&
             forecastDate.getMonth() === date.getMonth() &&
             forecastDate.getDate() === date.getDate();
    });
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
            className={`min-h-[120px] bg-white p-2 ${
              day.isCurrentMonth ? '' : 'text-gray-400'
            } hover:bg-gray-50 cursor-pointer`}
            onClick={() => setSelectedDay(day)}
          >
            <div className="flex justify-between items-start">
              <span className="font-medium">{day.date.getDate()}</span>
              {day.weather && (
                <WeatherIndicator
                  weather={day.weather}
                  score={day.weatherScore}
                />
              )}
            </div>
            <div className="mt-2 space-y-1">
              {day.treatments.map((treatment) => (
                <TreatmentCard
                  key={treatment.id}
                  treatment={treatment}
                  weather={day.weather}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Weather Details Modal */}
      {selectedDay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {selectedDay.date.toLocaleDateString()}
              </h3>
              <button
                onClick={() => setSelectedDay(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            {selectedDay.weather && (
              <div className="mb-4">
                <h4 className="font-medium mb-2">Weather Conditions</h4>
                <div className="space-y-1 text-sm">
                  <p>Temperature: {Math.round(selectedDay.weather.temperature)}°C</p>
                  <p>Humidity: {selectedDay.weather.humidity}%</p>
                  <p>Wind Speed: {selectedDay.weather.windSpeed} km/h</p>
                  <p>Conditions: {selectedDay.weather.conditions}</p>
                </div>
              </div>
            )}
            {selectedDay.treatments.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Scheduled Treatments</h4>
                <div className="space-y-2">
                  {selectedDay.treatments.map((treatment) => (
                    <TreatmentCard
                      key={treatment.id}
                      treatment={treatment}
                      weather={selectedDay.weather}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}