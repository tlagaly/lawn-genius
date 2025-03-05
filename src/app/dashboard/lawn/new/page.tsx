import { LawnProfileForm } from '@/components/lawn/LawnProfileForm';

export const metadata = {
  title: 'New Lawn Profile | Lawn Genius',
  description: 'Create a new lawn profile',
};

export default function NewLawnProfilePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Create New Lawn Profile</h1>
      <div className="max-w-2xl mx-auto">
        <LawnProfileForm mode="create" />
      </div>
    </div>
  );
}