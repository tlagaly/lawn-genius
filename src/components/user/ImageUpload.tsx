'use client';

import { useState, useRef } from 'react';
import { api } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import Image from 'next/image';

export function ImageUpload() {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: profile } = api.user.getProfile.useQuery();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size should be less than 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div className="relative h-32 w-32 overflow-hidden rounded-full">
        {(preview || profile?.avatarUrl) ? (
          <Image
            src={preview || profile?.avatarUrl || ''}
            alt="Profile"
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-100">
            <span className="text-4xl text-gray-400">?</span>
          </div>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      <div className="flex space-x-2">
        <Button
          type="button"
          onClick={handleUploadClick}
          variant="outline"
        >
          Choose Image
        </Button>
        {preview && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setPreview(null)}
          >
            Remove
          </Button>
        )}
      </div>

      <p className="text-sm text-gray-500">
        Recommended: Square image, max 5MB
      </p>
    </div>
  );
}