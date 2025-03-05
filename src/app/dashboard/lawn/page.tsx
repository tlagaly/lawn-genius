import { api } from '@/lib/trpc/server';
import { LawnProfileList } from '@/components/lawn/LawnProfileList';

export const metadata = {
  title: 'Lawn Profiles | Lawn Genius',
  description: 'Manage your lawn profiles',
};

export default async function LawnProfilesPage() {
  const profiles = await api.lawn.getAll();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <LawnProfileList initialProfiles={profiles} />
    </div>
  );
}