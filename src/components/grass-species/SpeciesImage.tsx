"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Tooltip } from '@/components/ui/tooltip';

interface SpeciesImageProps {
  src?: string;
  alt: string;
  description?: string;
  priority?: boolean;
  className?: string;
}

const DEFAULT_IMAGE = '/images/grass-species/default.svg';

export function SpeciesImage({ 
  src, 
  alt, 
  description, 
  priority = false,
  className = ''
}: SpeciesImageProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const imageSrc = src || DEFAULT_IMAGE;

  return (
    <div className="relative w-full h-full">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
      
      <Image
        src={!error ? imageSrc : DEFAULT_IMAGE}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className={`object-cover transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'} ${className}`}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
        onLoad={() => setLoading(false)}
        priority={priority}
        quality={85}
      />

      {description && !loading && !error && (
        <Tooltip content={description}>
          <div
            className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 text-sm cursor-help"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            {description.length > 50 ? `${description.slice(0, 47)}...` : description}
          </div>
        </Tooltip>
      )}
    </div>
  );
}