'use client';

import { useState } from 'react';
import { api } from '@/lib/trpc/client';
import { type inferRouterOutputs } from '@trpc/server';
import { type AppRouter } from '@/lib/trpc/root';
import { type TRPCClientErrorLike } from '@trpc/client';
import { TREATMENT_CONDITIONS } from '@/lib/weather/types';

type RouterOutputs = inferRouterOutputs<AppRouter>;
type Schedule = RouterOutputs['schedule']['getAll'][0];
type Treatment = Schedule['treatments'][0];

interface TreatmentListProps {
  scheduleId: string;
  onTreatmentUpdate?: () => void;
}

function WeatherScore({ score }: { score?: number }) {
  if (!score) return null;

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-green-600';
    if (score >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={`text-sm font-medium ${getScoreColor(score)}`}>
      Weather Score: {score}/5
    </div>
  );
}

function EffectivenessRating({ 
  treatment, 
  onRate 
}: { 
  treatment: Treatment; 
  onRate: (rating: number) => void;
}) {
  return (
    <div className="mt-2">
      <label className="text-sm text-gray-600">Effectiveness:</label>
      <div className="flex gap-2 mt-1">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            onClick={() => onRate(rating)}
            className={`w-8 h-8 rounded-full ${
              treatment.effectiveness === rating
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {rating}
          </button>
        ))}
      </div>
    </div>
  );
}

export function TreatmentList({ scheduleId, onTreatmentUpdate }: TreatmentListProps) {
  const [error, setError] = useState('');
  const [newTreatment, setNewTreatment] = useState({
    type: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const { data: schedule } = api.schedule.getById.useQuery(scheduleId);
  const analyzeTreatment = api.schedule.analyzeTreatmentEffectiveness.useMutation();
  
  const addTreatment = api.schedule.addTreatment.useMutation({
    onSuccess: () => {
      setNewTreatment({
        type: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      onTreatmentUpdate?.();
    },
    onError: (error: TRPCClientErrorLike<any>) => {
      setError(error.message);
    },
  });

  const updateTreatment = api.schedule.updateTreatment.useMutation({
    onSuccess: () => {
      onTreatmentUpdate?.();
    },
    onError: (error: TRPCClientErrorLike<any>) => {
      setError(error.message);
    },
  });

  const deleteTreatment = api.schedule.deleteTreatment.useMutation({
    onSuccess: () => {
      onTreatmentUpdate?.();
    },
    onError: (error: TRPCClientErrorLike<any>) => {
      setError(error.message);
    },
  });

  const handleAddTreatment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await addTreatment.mutateAsync({
        scheduleId,
        treatment: {
          type: newTreatment.type,
          date: new Date(newTreatment.date),
          notes: newTreatment.notes || undefined,
        },
      });
    } catch (err) {
      setError('Failed to add treatment');
    }
  };

  const handleToggleComplete = async (treatment: Treatment) => {
    try {
      await updateTreatment.mutateAsync({
        id: treatment.id,
        data: {
          completed: !treatment.completed,
        },
      });
    } catch (err) {
      setError('Failed to update treatment');
    }
  };

  const handleRateEffectiveness = async (treatment: Treatment, rating: number) => {
    try {
      await updateTreatment.mutateAsync({
        id: treatment.id,
        data: {
          effectiveness: rating,
        },
      });

      // Get analysis after rating
      const analysis = await analyzeTreatment.mutateAsync({
        treatmentId: treatment.id,
      });

      // Update treatment with analysis
      await updateTreatment.mutateAsync({
        id: treatment.id,
        data: {
          notes: treatment.notes 
            ? `${treatment.notes}\n\nEffectiveness Analysis:\n${analysis.join('\n')}`
            : `Effectiveness Analysis:\n${analysis.join('\n')}`,
        },
      });
    } catch (err) {
      setError('Failed to update treatment effectiveness');
    }
  };

  const handleDelete = async (treatmentId: string) => {
    try {
      await deleteTreatment.mutateAsync(treatmentId);
    } catch (err) {
      setError('Failed to delete treatment');
    }
  };

  if (!schedule) return null;

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded-md">{error}</div>
      )}

      <form onSubmit={handleAddTreatment} className="space-y-4">
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700">
            Treatment Type
          </label>
          <select
            id="type"
            value={newTreatment.type}
            onChange={(e) =>
              setNewTreatment((prev) => ({ ...prev, type: e.target.value }))
            }
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="">Select a treatment type</option>
            {Object.keys(TREATMENT_CONDITIONS).map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700">
            Date
          </label>
          <input
            type="date"
            id="date"
            value={newTreatment.date}
            onChange={(e) =>
              setNewTreatment((prev) => ({ ...prev, date: e.target.value }))
            }
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            Notes
          </label>
          <textarea
            id="notes"
            value={newTreatment.notes}
            onChange={(e) =>
              setNewTreatment((prev) => ({ ...prev, notes: e.target.value }))
            }
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            rows={3}
            placeholder="Additional details about the treatment..."
          />
        </div>

        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          disabled={addTreatment.isLoading}
        >
          {addTreatment.isLoading ? 'Adding...' : 'Add Treatment'}
        </button>
      </form>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Scheduled Treatments</h3>
        {schedule.treatments.length === 0 ? (
          <p className="text-gray-500">No treatments scheduled yet.</p>
        ) : (
          <div className="space-y-2">
            {schedule.treatments.map((treatment: Treatment) => (
              <div
                key={treatment.id}
                className="p-4 bg-white rounded-lg shadow space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <input
                      type="checkbox"
                      checked={treatment.completed}
                      onChange={() => handleToggleComplete(treatment)}
                      className="h-4 w-4 text-green-600 rounded"
                    />
                    <div>
                      <h4 className="font-medium">{treatment.type}</h4>
                      <p className="text-sm text-gray-500">
                        {new Date(treatment.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(treatment.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>

                <WeatherScore score={treatment.weatherScore} />

                {treatment.completed && (
                  <EffectivenessRating
                    treatment={treatment}
                    onRate={(rating) => handleRateEffectiveness(treatment, rating)}
                  />
                )}

                {treatment.notes && (
                  <div className="mt-2 text-sm text-gray-600 whitespace-pre-line">
                    {treatment.notes}
                  </div>
                )}

                {treatment.weatherData && (
                  <div className="mt-2 text-sm text-gray-600">
                    <h5 className="font-medium">Weather Conditions:</h5>
                    <p>Temperature: {Math.round(treatment.weatherData.temperature)}°C</p>
                    <p>Humidity: {treatment.weatherData.humidity}%</p>
                    <p>Wind Speed: {treatment.weatherData.windSpeed} km/h</p>
                    <p>Conditions: {treatment.weatherData.conditions}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}