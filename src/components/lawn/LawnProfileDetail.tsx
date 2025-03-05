'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/trpc/client';

interface Treatment {
  id: string;
  type: string;
  date: string;
  completed: boolean;
  notes?: string | null;
}

interface Schedule {
  id: string;
  name: string;
  startDate: string;
  endDate?: string | null;
  treatments: Treatment[];
}

interface LawnProfile {
  id: string;
  name: string;
  size: number;
  grassType: string;
  soilType: string;
  sunExposure: string;
  irrigation: boolean;
  location?: string | null;
  notes?: string | null;
  schedules: Schedule[];
}

interface LawnProfileDetailProps {
  profile: LawnProfile;
}

export function LawnProfileDetail({ profile }: LawnProfileDetailProps) {
  const router = useRouter();

  const deleteMutation = api.lawn.delete.useMutation({
    onSuccess: () => {
      router.push('/dashboard/lawn');
      router.refresh();
    },
    onError: () => {
      alert('Failed to delete lawn profile');
    },
  });

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this lawn profile?')) return;
    await deleteMutation.mutateAsync(profile.id);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{profile.name}</h2>
        <div className="flex space-x-4">
          <Link
            href={`/dashboard/lawn/${profile.id}/edit`}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            Edit Profile
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isLoading}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {deleteMutation.isLoading ? 'Deleting...' : 'Delete Profile'}
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Lawn Details</h3>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-gray-600">Size:</dt>
                <dd>{profile.size} sq ft</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Grass Type:</dt>
                <dd>{profile.grassType}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Soil Type:</dt>
                <dd>{profile.soilType}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Sun Exposure:</dt>
                <dd>{profile.sunExposure}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Irrigation System:</dt>
                <dd>{profile.irrigation ? 'Yes' : 'No'}</dd>
              </div>
              {profile.location && (
                <div className="flex justify-between">
                  <dt className="text-gray-600">Location:</dt>
                  <dd>{profile.location}</dd>
                </div>
              )}
            </dl>
          </div>

          {profile.notes && (
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Notes</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{profile.notes}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Maintenance Schedules</h3>
              <Link
                href={`/dashboard/schedule/new?lawnId=${profile.id}`}
                className="text-green-600 hover:text-green-800"
              >
                Add Schedule
              </Link>
            </div>
            
            {profile.schedules.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No schedules yet. Create one to start tracking maintenance.
              </p>
            ) : (
              <div className="space-y-4">
                {profile.schedules.map((schedule) => (
                  <div key={schedule.id} className="border rounded p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">{schedule.name}</h4>
                      <Link
                        href={`/dashboard/schedule/${schedule.id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        View Details
                      </Link>
                    </div>
                    <p className="text-sm text-gray-600">
                      Start: {new Date(schedule.startDate).toLocaleDateString()}
                      {schedule.endDate && 
                        ` - End: ${new Date(schedule.endDate).toLocaleDateString()}`}
                    </p>
                    <p className="text-sm text-gray-600">
                      Treatments: {schedule.treatments.length}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}