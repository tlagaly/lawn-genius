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
        <div className="absolute inset-0 flex items-center justify-center bg-accent/10">
          <div className="animate-pulse space-y-2 w-full h-full">
            <div className="h-full w-full bg-accent/20 rounded"></div>
          </div>
        </div>
      )}
      
      <Image
        src={!error ? imageSrc : DEFAULT_IMAGE}
        alt={alt}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1080px) 50vw, 33vw"
        className={`object-cover transition-all duration-300 ${
          loading ? 'opacity-0 scale-[0.98]' : 'opacity-100 scale-100'
        } ${className}`}
        onError={() => {
          console.error(`Failed to load image: ${imageSrc}`);
          setError(true);
          setLoading(false);
        }}
        onLoad={() => setLoading(false)}
        priority={priority}
        quality={90}
        loading={priority ? 'eager' : 'lazy'}
      />

      {description && !loading && !error && (
        <Tooltip content={description}>
          <button
            type="button"
            className="absolute bottom-0 left-0 right-0 bg-black/50 hover:bg-black/60 text-white p-2 text-sm cursor-help text-left transition-colors"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            aria-label={`Image description: ${description}`}
          >
            {description.length > 50 ? `${description.slice(0, 47)}...` : description}
          </button>
        </Tooltip>
      )}
    </div>
  );
}