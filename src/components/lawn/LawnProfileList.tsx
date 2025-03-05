'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/trpc/client';

interface LawnProfile {
  id: string;
  name: string;
  size: number;
  grassType: string;
  location?: string | null;
  schedules: any[];
}

interface LawnProfileListProps {
  initialProfiles: LawnProfile[];
}

export function LawnProfileList({ initialProfiles }: LawnProfileListProps) {
  const router = useRouter();
  const [profiles, setProfiles] = useState(initialProfiles);

  const deleteMutation = api.lawn.delete.useMutation({
    onSuccess: (_, deletedId) => {
      setProfiles(profiles.filter(profile => profile.id !== deletedId));
      router.refresh();
    },
    onError: () => {
      alert('Failed to delete lawn profile');
    },
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lawn profile?')) return;
    await deleteMutation.mutateAsync(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Lawns</h2>
        <Link
          href="/dashboard/lawn/new"
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
        >
          Add New Lawn
        </Link>
      </div>

      {profiles.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No lawn profiles yet. Create your first one!</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className="border rounded-lg p-6 space-y-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-semibold">{profile.name}</h3>
                <div className="flex space-x-2">
                  <Link
                    href={`/dashboard/lawn/${profile.id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => handleDelete(profile.id)}
                    disabled={deleteMutation.isLoading}
                    className="text-red-600 hover:text-red-800 disabled:opacity-50"
                  >
                    {deleteMutation.isLoading ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <p>Size: {profile.size} sq ft</p>
                <p>Grass Type: {profile.grassType}</p>
                {profile.location && <p>Location: {profile.location}</p>}
                <p>Active Schedules: {profile.schedules.length}</p>
              </div>

              <Link
                href={`/dashboard/lawn/${profile.id}/edit`}
                className="block mt-4 text-center border border-green-600 text-green-600 px-4 py-2 rounded-md hover:bg-green-50"
              >
                Edit Profile
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}