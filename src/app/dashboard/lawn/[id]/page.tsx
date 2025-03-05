import { notFound } from 'next/navigation';
import { api } from '@/lib/trpc/server';
import { LawnProfileDetail } from '@/components/lawn/LawnProfileDetail';

interface LawnProfilePageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: LawnProfilePageProps) {
  const profile = await api.lawn.getById(params.id);
  return {
    title: profile ? `${profile.name} | Lawn Genius` : 'Lawn Profile',
    description: 'View and manage your lawn profile',
  };
}

export default async function LawnProfilePage({ params }: LawnProfilePageProps) {
  const profile = await api.lawn.getById(params.id);

  if (!profile) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <LawnProfileDetail profile={profile} />
    </div>
  );
}