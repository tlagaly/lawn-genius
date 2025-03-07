'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/trpc/client';
import { toast } from '@/components/ui/toast';
import { SpeciesSelection } from '@/components/grass-species/SpeciesSelection';
import type { GrassSpecies } from '@/components/grass-species/types';

interface LawnProfileFormProps {
  initialData?: {
    id?: string;
    name: string;
    size: number;
    grassSpeciesId?: string;
    soilType: string;
    sunExposure: string;
    irrigation: boolean;
    location?: string;
    notes?: string;
  };
  mode: 'create' | 'edit';
}

const SOIL_TYPES = ['Clay', 'Sandy', 'Loam', 'Silt', 'Peat', 'Chalky'];

const SUN_EXPOSURE = ['Full Sun', 'Partial Shade', 'Full Shade'];

export function LawnProfileForm({ initialData, mode }: LawnProfileFormProps) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const createMutation = api.lawn.create.useMutation({
    onSuccess: () => {
      toast.success('Lawn profile created successfully! Redirecting to dashboard...');
      router.push('/dashboard/lawn');
      router.refresh();
    },
    onError: (error) => {
      const errorMessage = error.message || 'Failed to create lawn profile';
      setError(errorMessage);
      toast.error(errorMessage);
    },
  });

  const updateMutation = api.lawn.update.useMutation({
    onSuccess: () => {
      toast.success('Lawn profile updated successfully! Redirecting to dashboard...');
      router.push('/dashboard/lawn');
      router.refresh();
    },
    onError: (error) => {
      const errorMessage = error.message || 'Failed to update lawn profile';
      setError(errorMessage);
      toast.error(errorMessage);
    },
  });

  const isSubmitting = loading || createMutation.isLoading || updateMutation.isLoading;

  const [formData, setFormData] = useState({
    name: initialData?.name ?? '',
    size: initialData?.size ?? 0,
    soilType: initialData?.soilType ?? SOIL_TYPES[0],
    sunExposure: initialData?.sunExposure ?? SUN_EXPOSURE[0],
    irrigation: initialData?.irrigation ?? false,
    location: initialData?.location ?? '',
    notes: initialData?.notes ?? '',
  });

  const [selectedSpecies, setSelectedSpecies] = useState<GrassSpecies | undefined>(undefined);

  const handleSpeciesSelect = (species: GrassSpecies) => {
    setSelectedSpecies(species);
    // Auto-select soil type if it matches species ideal conditions
    if (species.idealConditions.soilTypes.length > 0 && !species.idealConditions.soilTypes.includes(formData.soilType)) {
      setFormData(prev => ({
        ...prev,
        soilType: species.idealConditions.soilTypes[0],
      }));
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Lawn name is required');
      return false;
    }

    if (formData.size <= 0) {
      setError('Lawn size must be greater than 0 square feet');
      return false;
    }

    if (!selectedSpecies) {
      setError('Please select a grass species for your lawn');
      return false;
    }

    if (!formData.soilType) {
      setError('Please select a soil type');
      return false;
    }

    if (!formData.sunExposure) {
      setError('Please select the sun exposure level');
      return false;
    }

    if (formData.location && formData.location.trim().length < 3) {
      setError('Location must be at least 3 characters long');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const submitData = {
        ...formData,
        grassComposition: [{
          speciesId: selectedSpecies.id,
          percentage: 100, // Single species = 100%
        }],
      };

      if (mode === 'create') {
        await createMutation.mutateAsync(submitData);
        toast.success('Lawn profile created successfully');
      } else if (initialData?.id) {
        await updateMutation.mutateAsync({
          id: initialData.id,
          data: submitData,
        });
        toast.success('Lawn profile updated successfully');
      }
    } catch (err) {
      toast.error('Failed to save lawn profile');
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
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 disabled:bg-gray-100 disabled:cursor-not-allowed"
            required
            disabled={isSubmitting}
            placeholder="Enter a name for your lawn"
          />
          <p className="mt-1 text-sm text-gray-500">Give your lawn a unique name to identify it</p>
        </div>

        <div>
          <label htmlFor="size" className="block text-sm font-medium">
            Size (sq ft)
          </label>
          <div className="relative">
            <input
              type="number"
              id="size"
              value={formData.size}
              onChange={(e) => setFormData({ ...formData, size: Number(e.target.value) })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 pr-12 disabled:bg-gray-100 disabled:cursor-not-allowed"
              required
              min="1"
              disabled={isSubmitting}
              placeholder="Enter lawn size"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">sq ft</span>
          </div>
          <p className="mt-1 text-sm text-gray-500">Enter the total area of your lawn in square feet</p>
          {formData.size < 1 && (
            <p className="mt-1 text-sm text-red-500">Size must be greater than 0</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Grass Species
          </label>
          <div className="border border-gray-200 rounded-lg p-4">
            <SpeciesSelection
              onSpeciesSelect={handleSpeciesSelect}
              selectedSpecies={selectedSpecies}
            />
          </div>
          {error && error.includes('grass species') && (
            <p className="mt-1 text-sm text-red-500">{error}</p>
          )}
        </div>

        <div>
          <label htmlFor="soilType" className="block text-sm font-medium">
            Soil Type
          </label>
          <select
            id="soilType"
            value={formData.soilType}
            onChange={(e) => setFormData({ ...formData, soilType: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 disabled:bg-gray-100 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {SOIL_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <p className="mt-1 text-sm text-gray-500">
            {selectedSpecies?.idealConditions?.soilTypes?.length > 0
              ? `Recommended soil types for ${selectedSpecies.name}: ${selectedSpecies.idealConditions.soilTypes.join(', ')}`
              : 'Select the primary soil type of your lawn'}
          </p>
        </div>

        <div>
          <label htmlFor="sunExposure" className="block text-sm font-medium">
            Sun Exposure
          </label>
          <select
            id="sunExposure"
            value={formData.sunExposure}
            onChange={(e) => setFormData({ ...formData, sunExposure: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 disabled:bg-gray-100 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {SUN_EXPOSURE.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <p className="mt-1 text-sm text-gray-500">
            {selectedSpecies?.idealConditions?.sunExposure
              ? `${selectedSpecies.name} grows best in ${selectedSpecies.idealConditions.sunExposure}`
              : 'Select the amount of sunlight your lawn receives'}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="irrigation"
              checked={formData.irrigation}
              onChange={(e) => setFormData({ ...formData, irrigation: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            />
            <label htmlFor="irrigation" className="ml-2 block text-sm font-medium">
              Has Irrigation System
            </label>
          </div>
          <p className="text-sm text-gray-500">
            Having an irrigation system helps maintain consistent watering schedules
          </p>
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
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="e.g., Austin, TX"
            disabled={isSubmitting}
          />
          <p className="mt-1 text-sm text-gray-500">
            Your location helps us provide better care recommendations
          </p>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium">
            Notes
          </label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 disabled:bg-gray-100 disabled:cursor-not-allowed"
            rows={3}
            placeholder="Add any additional information about your lawn"
            disabled={isSubmitting}
          />
          <p className="mt-1 text-sm text-gray-500">
            Include any specific concerns or requirements for your lawn
          </p>
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
          disabled={isSubmitting}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Saving...</span>
            </>
          ) : (
            <span>{mode === 'create' ? 'Create Profile' : 'Update Profile'}</span>
          )}
        </button>
      </div>
    </form>
  );
}