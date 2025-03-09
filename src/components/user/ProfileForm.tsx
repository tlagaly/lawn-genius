'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import toast from 'react-hot-toast';

// Profile validation schema
const profileSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters').max(50).optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  location: z.string().max(100).optional(),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format').optional(),
  profession: z.string().max(50).optional(),
  organization: z.string().max(100).optional(),
  expertise: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  socialLinks: z.object({
    twitter: z.string().url().optional(),
    linkedin: z.string().url().optional(),
    facebook: z.string().url().optional(),
    instagram: z.string().url().optional(),
    website: z.string().url().optional(),
  }).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function ProfileForm() {
  const [isEditing, setIsEditing] = useState(false);
  const [expertise, setExpertise] = useState<string[]>([]);
  const [certifications, setCertifications] = useState<string[]>([]);

  const { data: profile, isLoading } = api.user.getProfile.useQuery();
  const updateProfile = api.user.updateProfile.useMutation({
    onSuccess: () => {
      toast.success('Profile updated successfully');
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
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: profile?.displayName || '',
      bio: profile?.bio || '',
      location: profile?.location || '',
      phoneNumber: profile?.phoneNumber || '',
      profession: profile?.profession || '',
      organization: profile?.organization || '',
      expertise: profile?.expertise || [],
      certifications: profile?.certifications || [],
      socialLinks: profile?.socialLinks || {},
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    updateProfile.mutate({
      ...data,
      expertise,
      certifications,
    });
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium">
            Display Name
          </label>
          <Input
            id="displayName"
            {...register('displayName')}
            className="mt-1"
            disabled={!isEditing}
          />
          {errors.displayName && (
            <p className="text-sm text-red-500">{errors.displayName.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="bio" className="block text-sm font-medium">
            Bio
          </label>
          <Textarea
            id="bio"
            {...register('bio')}
            className="mt-1"
            disabled={!isEditing}
          />
          {errors.bio && (
            <p className="text-sm text-red-500">{errors.bio.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium">
            Location
          </label>
          <Input
            id="location"
            {...register('location')}
            className="mt-1"
            disabled={!isEditing}
          />
          {errors.location && (
            <p className="text-sm text-red-500">{errors.location.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium">
            Phone Number
          </label>
          <Input
            id="phoneNumber"
            {...register('phoneNumber')}
            className="mt-1"
            disabled={!isEditing}
          />
          {errors.phoneNumber && (
            <p className="text-sm text-red-500">{errors.phoneNumber.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="profession" className="block text-sm font-medium">
            Profession
          </label>
          <Input
            id="profession"
            {...register('profession')}
            className="mt-1"
            disabled={!isEditing}
          />
          {errors.profession && (
            <p className="text-sm text-red-500">{errors.profession.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="organization" className="block text-sm font-medium">
            Organization
          </label>
          <Input
            id="organization"
            {...register('organization')}
            className="mt-1"
            disabled={!isEditing}
          />
          {errors.organization && (
            <p className="text-sm text-red-500">{errors.organization.message}</p>
          )}
        </div>

        {/* Social Links */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Social Links</h3>
          {[
            { key: 'twitter' as const, label: 'Twitter' },
            { key: 'linkedin' as const, label: 'LinkedIn' },
            { key: 'facebook' as const, label: 'Facebook' },
            { key: 'instagram' as const, label: 'Instagram' },
            { key: 'website' as const, label: 'Website' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label htmlFor={key} className="block text-sm font-medium">
                {label}
              </label>
              <Input
                id={key}
                {...register(`socialLinks.${key}`)}
                className="mt-1"
                disabled={!isEditing}
                placeholder={`https://${key}.com/username`}
              />
              {errors.socialLinks?.[key] && (
                <p className="text-sm text-red-500">
                  {errors.socialLinks[key]?.message}
                </p>
              )}
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
            <Button type="submit" disabled={updateProfile.isLoading}>
              {updateProfile.isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </>
        ) : (
          <Button type="button" onClick={() => setIsEditing(true)}>
            Edit Profile
          </Button>
        )}
      </div>
    </form>
  );
}