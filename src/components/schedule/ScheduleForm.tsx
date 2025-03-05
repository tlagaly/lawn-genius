'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/trpc/client';
import { type AppRouter } from '@/lib/trpc/root';
import { type inferRouterOutputs } from '@trpc/server';
import { type TRPCClientErrorLike } from '@trpc/client';
import { z } from 'zod';

type RouterOutputs = inferRouterOutputs<AppRouter>;
type LawnProfile = RouterOutputs['lawn']['getAll'][0];

interface Schedule {
  id: string;
  name: string;
  lawnProfileId: string;
  startDate: Date;
  endDate?: Date;
}

interface ScheduleFormProps {
  initialData?: Schedule;
  lawnProfileId?: string;
}

export function ScheduleForm({ initialData, lawnProfileId }: ScheduleFormProps) {
  const router = useRouter();
  const [error, setError] = useState('');

  const { data: lawnProfiles } = api.lawn.getAll.useQuery();
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
  });

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
          },
        });
      } else {
        await createSchedule.mutateAsync({
          name: formData.name,
          lawnProfileId: formData.lawnProfileId,
          startDate: formData.startDate,
          endDate: formData.endDate,
        });
      }
    } catch (err) {
      setError('Failed to save schedule');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

      <button
        type="submit"
        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
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