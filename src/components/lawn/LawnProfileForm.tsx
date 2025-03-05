'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/trpc/client';

interface LawnProfileFormProps {
  initialData?: {
    id?: string;
    name: string;
    size: number;
    grassType: string;
    soilType: string;
    sunExposure: string;
    irrigation: boolean;
    location?: string;
    notes?: string;
  };
  mode: 'create' | 'edit';
}

const GRASS_TYPES = [
  'Bermuda',
  'Kentucky Bluegrass',
  'Fescue',
  'Zoysia',
  'St. Augustine',
  'Perennial Ryegrass',
];

const SOIL_TYPES = ['Clay', 'Sandy', 'Loam', 'Silt', 'Peat', 'Chalky'];

const SUN_EXPOSURE = ['Full Sun', 'Partial Shade', 'Full Shade'];

export function LawnProfileForm({ initialData, mode }: LawnProfileFormProps) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const createMutation = api.lawn.create.useMutation({
    onSuccess: () => {
      router.push('/dashboard/lawn');
      router.refresh();
    },
    onError: () => {
      setError('Failed to save lawn profile. Please try again.');
    },
  });

  const updateMutation = api.lawn.update.useMutation({
    onSuccess: () => {
      router.push('/dashboard/lawn');
      router.refresh();
    },
    onError: () => {
      setError('Failed to save lawn profile. Please try again.');
    },
  });

  const [formData, setFormData] = useState({
    name: initialData?.name ?? '',
    size: initialData?.size ?? 0,
    grassType: initialData?.grassType ?? GRASS_TYPES[0],
    soilType: initialData?.soilType ?? SOIL_TYPES[0],
    sunExposure: initialData?.sunExposure ?? SUN_EXPOSURE[0],
    irrigation: initialData?.irrigation ?? false,
    location: initialData?.location ?? '',
    notes: initialData?.notes ?? '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'create') {
        await createMutation.mutateAsync(formData);
      } else if (initialData?.id) {
        await updateMutation.mutateAsync({
          id: initialData.id,
          data: formData,
        });
      }
    } catch (err) {
      // Error handling is done in mutation callbacks
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium">
            Lawn Name
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            required
          />
        </div>

        <div>
          <label htmlFor="size" className="block text-sm font-medium">
            Size (sq ft)
          </label>
          <input
            type="number"
            id="size"
            value={formData.size}
            onChange={(e) => setFormData({ ...formData, size: Number(e.target.value) })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            required
            min="1"
          />
        </div>

        <div>
          <label htmlFor="grassType" className="block text-sm font-medium">
            Grass Type
          </label>
          <select
            id="grassType"
            value={formData.grassType}
            onChange={(e) => setFormData({ ...formData, grassType: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          >
            {GRASS_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="soilType" className="block text-sm font-medium">
            Soil Type
          </label>
          <select
            id="soilType"
            value={formData.soilType}
            onChange={(e) => setFormData({ ...formData, soilType: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          >
            {SOIL_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="sunExposure" className="block text-sm font-medium">
            Sun Exposure
          </label>
          <select
            id="sunExposure"
            value={formData.sunExposure}
            onChange={(e) => setFormData({ ...formData, sunExposure: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          >
            {SUN_EXPOSURE.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="irrigation"
            checked={formData.irrigation}
            onChange={(e) => setFormData({ ...formData, irrigation: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300"
          />
          <label htmlFor="irrigation" className="ml-2 block text-sm font-medium">
            Has Irrigation System
          </label>
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium">
            Location (City, State)
          </label>
          <input
            type="text"
            id="location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            placeholder="Optional"
          />
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium">
            Notes
          </label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            rows={3}
            placeholder="Optional"
          />
        </div>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || createMutation.isLoading || updateMutation.isLoading}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {loading || createMutation.isLoading || updateMutation.isLoading
            ? 'Saving...'
            : mode === 'create'
            ? 'Create Profile'
            : 'Update Profile'}
        </button>
      </div>
    </form>
  );
}