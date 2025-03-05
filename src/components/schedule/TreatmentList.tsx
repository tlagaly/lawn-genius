'use client';

import { useState } from 'react';
import { api } from '@/lib/trpc/client';
import { type inferRouterOutputs } from '@trpc/server';
import { type AppRouter } from '@/lib/trpc/root';
import { type TRPCClientErrorLike } from '@trpc/client';

type RouterOutputs = inferRouterOutputs<AppRouter>;
type Schedule = RouterOutputs['schedule']['getAll'][0];
type Treatment = Schedule['treatments'][0];

interface TreatmentListProps {
  scheduleId: string;
  onTreatmentUpdate?: () => void;
}

export function TreatmentList({ scheduleId, onTreatmentUpdate }: TreatmentListProps) {
  const [error, setError] = useState('');
  const [newTreatment, setNewTreatment] = useState({
    type: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const { data: schedule } = api.schedule.getById.useQuery(scheduleId);
  
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
          type: treatment.type,
          date: treatment.date,
          notes: treatment.notes,
          completed: !treatment.completed,
        },
      });
    } catch (err) {
      setError('Failed to update treatment');
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
          <input
            type="text"
            id="type"
            value={newTreatment.type}
            onChange={(e) =>
              setNewTreatment((prev) => ({ ...prev, type: e.target.value }))
            }
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            placeholder="Fertilization, Weed Control, etc."
          />
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
                className="flex items-center justify-between p-4 bg-white rounded-lg shadow"
              >
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
                    {treatment.notes && (
                      <p className="text-sm text-gray-600 mt-1">
                        {treatment.notes}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(treatment.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}