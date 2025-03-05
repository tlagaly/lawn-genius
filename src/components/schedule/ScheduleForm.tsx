'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/trpc/client';
import { type AppRouter } from '@/lib/trpc/root';
import { type inferRouterOutputs } from '@trpc/server';
import { type TRPCClientErrorLike } from '@trpc/client';
import { z } from 'zod';
import { TREATMENT_CONDITIONS } from '@/lib/weather/types';

type RouterOutputs = inferRouterOutputs<AppRouter>;
type LawnProfile = RouterOutputs['lawn']['getAll'][0];

interface Treatment {
  type: string;
  date: Date;
  notes?: string;
}

interface Schedule {
  id: string;
  name: string;
  lawnProfileId: string;
  startDate: Date;
  endDate?: Date;
  treatments: Treatment[];
}

interface ScheduleFormProps {
  initialData?: Schedule;
  lawnProfileId?: string;
}

interface WeatherRecommendation {
  date: Date;
  score: number;
  recommendations: string[];
}

export function ScheduleForm({ initialData, lawnProfileId }: ScheduleFormProps) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [selectedTreatmentType, setSelectedTreatmentType] = useState('');
  const [weatherRecommendations, setWeatherRecommendations] = useState<WeatherRecommendation[]>([]);
  const [isCheckingWeather, setIsCheckingWeather] = useState(false);

  const { data: lawnProfiles } = api.lawn.getAll.useQuery();
  const findOptimalTime = api.schedule.findOptimalTime.useMutation();
  const checkWeatherConflicts = api.schedule.checkWeatherConflicts.useMutation();

  const createSchedule = api.schedule.create.useMutation({
    onSuccess: () => {
      router.push('/dashboard/schedule');
      router.refresh();
    },
    onError: (error: TRPCClientErrorLike<any>) => {
      setError(error.message);
    },
  });

  const updateSchedule = api.schedule.update.useMutation({
    onSuccess: () => {
      router.push('/dashboard/schedule');
      router.refresh();
    },
    onError: (error: TRPCClientErrorLike<any>) => {
      setError(error.message);
    },
  });

  const [formData, setFormData] = useState<Schedule>({
    id: initialData?.id || '',
    name: initialData?.name || '',
    lawnProfileId: initialData?.lawnProfileId || lawnProfileId || '',
    startDate: initialData?.startDate || new Date(),
    endDate: initialData?.endDate,
    treatments: initialData?.treatments || [],
  });

  const treatmentTypes = Object.keys(TREATMENT_CONDITIONS);

  const handleFindOptimalTime = async () => {
    if (!formData.lawnProfileId || !selectedTreatmentType) return;

    setIsCheckingWeather(true);
    try {
      const result = await findOptimalTime.mutateAsync({
        lawnProfileId: formData.lawnProfileId,
        treatmentType: selectedTreatmentType,
        startDate: formData.startDate,
        endDate: formData.endDate || new Date(formData.startDate.getTime() + 7 * 24 * 60 * 60 * 1000),
      });

      if (result) {
        const weatherCheck = await checkWeatherConflicts.mutateAsync({
          lawnProfileId: formData.lawnProfileId,
          treatmentType: selectedTreatmentType,
          date: result.date,
        });

        setWeatherRecommendations([{
          date: result.date,
          score: result.score,
          recommendations: weatherCheck.recommendations,
        }]);
      }
    } catch (error) {
      setError('Failed to find optimal treatment time');
    } finally {
      setIsCheckingWeather(false);
    }
  };

  const handleAddTreatment = () => {
    if (!selectedTreatmentType || weatherRecommendations.length === 0) return;

    const optimalDate = weatherRecommendations[0].date;
    setFormData(prev => ({
      ...prev,
      treatments: [
        ...prev.treatments,
        {
          type: selectedTreatmentType,
          date: optimalDate,
          notes: `Weather Score: ${weatherRecommendations[0].score}/5\nRecommendations:\n${weatherRecommendations[0].recommendations.join('\n')}`,
        },
      ],
    }));

    setSelectedTreatmentType('');
    setWeatherRecommendations([]);
  };

  const handleRemoveTreatment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      treatments: prev.treatments.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (initialData) {
        await updateSchedule.mutateAsync({
          id: initialData.id,
          data: {
            name: formData.name,
            lawnProfileId: formData.lawnProfileId,
            startDate: formData.startDate,
            endDate: formData.endDate,
            treatments: formData.treatments,
          },
        });
      } else {
        await createSchedule.mutateAsync({
          name: formData.name,
          lawnProfileId: formData.lawnProfileId,
          startDate: formData.startDate,
          endDate: formData.endDate,
          treatments: formData.treatments,
        });
      }
    } catch (err) {
      setError('Failed to save schedule');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded-md">{error}</div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Schedule Name
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, name: e.target.value }))
          }
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          placeholder="Spring Treatment Plan"
        />
      </div>

      <div>
        <label
          htmlFor="lawnProfile"
          className="block text-sm font-medium text-gray-700"
        >
          Lawn Profile
        </label>
        <select
          id="lawnProfile"
          value={formData.lawnProfileId}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, lawnProfileId: e.target.value }))
          }
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        >
          <option value="">Select a lawn profile</option>
          {lawnProfiles?.map((profile: LawnProfile) => (
            <option key={profile.id} value={profile.id}>
              {profile.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="startDate"
            className="block text-sm font-medium text-gray-700"
          >
            Start Date
          </label>
          <input
            type="date"
            id="startDate"
            value={formData.startDate.toISOString().split('T')[0]}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                startDate: new Date(e.target.value),
              }))
            }
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>

        <div>
          <label
            htmlFor="endDate"
            className="block text-sm font-medium text-gray-700"
          >
            End Date (Optional)
          </label>
          <input
            type="date"
            id="endDate"
            value={formData.endDate?.toISOString().split('T')[0] || ''}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                endDate: e.target.value ? new Date(e.target.value) : undefined,
              }))
            }
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="text-lg font-medium mb-4">Add Treatments</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label
              htmlFor="treatmentType"
              className="block text-sm font-medium text-gray-700"
            >
              Treatment Type
            </label>
            <select
              id="treatmentType"
              value={selectedTreatmentType}
              onChange={(e) => setSelectedTreatmentType(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="">Select a treatment type</option>
              {treatmentTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={handleFindOptimalTime}
              disabled={!selectedTreatmentType || !formData.lawnProfileId || isCheckingWeather}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isCheckingWeather ? 'Checking Weather...' : 'Find Optimal Time'}
            </button>
          </div>
        </div>

        {weatherRecommendations.length > 0 && (
          <div className="bg-blue-50 p-4 rounded-md mb-4">
            <h4 className="font-medium mb-2">Weather Recommendations</h4>
            <div className="space-y-2">
              <p>Optimal Date: {weatherRecommendations[0].date.toLocaleDateString()}</p>
              <p>Weather Score: {weatherRecommendations[0].score}/5</p>
              <div className="text-sm">
                {weatherRecommendations[0].recommendations.map((rec, i) => (
                  <p key={i}>{rec}</p>
                ))}
              </div>
              <button
                type="button"
                onClick={handleAddTreatment}
                className="mt-2 bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 text-sm"
              >
                Add to Schedule
              </button>
            </div>
          </div>
        )}

        {formData.treatments.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">Scheduled Treatments</h4>
            <div className="space-y-2">
              {formData.treatments.map((treatment, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-50 p-3 rounded-md"
                >
                  <div>
                    <p className="font-medium">{treatment.type}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(treatment.date).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveTreatment(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        type="submit"
        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 w-full"
        disabled={createSchedule.isLoading || updateSchedule.isLoading}
      >
        {createSchedule.isLoading || updateSchedule.isLoading
          ? 'Saving...'
          : initialData
          ? 'Update Schedule'
          : 'Create Schedule'}
      </button>
    </form>
  );
}