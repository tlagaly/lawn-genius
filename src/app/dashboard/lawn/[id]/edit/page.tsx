import { notFound } from 'next/navigation';
import { api } from '@/lib/trpc/server';
import { LawnProfileForm } from '@/components/lawn/LawnProfileForm';

interface EditLawnProfilePageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: EditLawnProfilePageProps) {
  const profile = await api.lawn.getById(params.id);
  return {
    title: profile ? `Edit ${profile.name} | Lawn Genius` : 'Edit Lawn Profile',
    description: 'Edit your lawn profile settings',
  };
}

export default async function EditLawnProfilePage({ params }: EditLawnProfilePageProps) {
  const profile = await api.lawn.getById(params.id);

  if (!profile) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Edit Lawn Profile</h1>
      <div className="max-w-2xl mx-auto">
        <LawnProfileForm 
          mode="edit"
          initialData={{
            id: profile.id,
            name: profile.name,
            size: profile.size,
            grassType: profile.grassType,
            soilType: profile.soilType,
            sunExposure: profile.sunExposure,
            irrigation: profile.irrigation,
            location: profile.location ?? undefined,
            notes: profile.notes ?? undefined,
          }}
        />
      </div>
    </div>
  );
}