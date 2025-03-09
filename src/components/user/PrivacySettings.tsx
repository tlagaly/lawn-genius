'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

const privacySettingsSchema = z.object({
  privacySettings: z.object({
    profileVisibility: z.enum(['public', 'private', 'contacts']),
    showEmail: z.boolean(),
    showPhone: z.boolean(),
    showLocation: z.boolean(),
    showExpertise: z.boolean(),
  }),
});

type PrivacySettingsData = z.infer<typeof privacySettingsSchema>;

export function PrivacySettings() {
  const [isEditing, setIsEditing] = useState(false);

  const { data: profile, isLoading } = api.user.getProfile.useQuery();
  const updatePrivacy = api.user.updatePrivacySettings.useMutation({
    onSuccess: () => {
      toast.success('Privacy settings updated successfully');
      setIsEditing(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PrivacySettingsData>({
    resolver: zodResolver(privacySettingsSchema),
    defaultValues: {
      privacySettings: profile?.privacySettings || {
        profileVisibility: 'private',
        showEmail: false,
        showPhone: false,
        showLocation: false,
        showExpertise: false,
      },
    },
  });

  const onSubmit = (data: PrivacySettingsData) => {
    updatePrivacy.mutate(data);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Privacy Settings</h3>

        <div>
          <label className="block text-sm font-medium">Profile Visibility</label>
          <select
            {...register('privacySettings.profileVisibility')}
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2"
            disabled={!isEditing}
          >
            <option value="private">Private</option>
            <option value="contacts">Contacts Only</option>
            <option value="public">Public</option>
          </select>
        </div>

        <div className="space-y-2">
          {[
            { key: 'showEmail' as const, label: 'Show Email' },
            { key: 'showPhone' as const, label: 'Show Phone Number' },
            { key: 'showLocation' as const, label: 'Show Location' },
            { key: 'showExpertise' as const, label: 'Show Expertise' },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center">
              <input
                type="checkbox"
                {...register(`privacySettings.${key}`)}
                id={key}
                className="h-4 w-4 rounded border-gray-300"
                disabled={!isEditing}
              />
              <label htmlFor={key} className="ml-2 block text-sm">
                {label}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        {isEditing ? (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsEditing(false);
                reset();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updatePrivacy.isLoading}>
              {updatePrivacy.isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </>
        ) : (
          <Button type="button" onClick={() => setIsEditing(true)}>
            Edit Privacy Settings
          </Button>
        )}
      </div>
    </form>
  );
}