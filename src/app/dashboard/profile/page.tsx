'use client';

import { ProfileForm } from '@/components/user/ProfileForm';
import { PrivacySettings } from '@/components/user/PrivacySettings';
import { ImageUpload } from '@/components/user/ImageUpload';
import { Toaster } from 'react-hot-toast';

export default function ProfilePage() {
  return (
    <div className="container mx-auto py-8">
      <Toaster position="top-right" />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <p className="text-gray-600">Manage your profile information and privacy settings</p>
      </div>

      <div className="grid gap-8 md:grid-cols-[300px,1fr]">
        <div className="space-y-6">
          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 text-xl font-semibold">Profile Picture</h2>
            <ImageUpload />
          </div>

          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 text-xl font-semibold">Privacy</h2>
            <PrivacySettings />
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-xl font-semibold">Profile Information</h2>
          <ProfileForm />
        </div>
      </div>
    </div>
  );
}