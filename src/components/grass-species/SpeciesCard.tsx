"use client";

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip } from '@/components/ui/tooltip';
import { SpeciesImage } from './SpeciesImage';
import type { SpeciesCardProps } from './types';

export function SpeciesCard({ species, onSelect, selected }: SpeciesCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const {
    name,
    scientificName,
    type,
    characteristics,
    maintenance,
    mainImage,
    images,
    imageDescriptions
  } = species;

  const getToleranceLabel = (value: number) => {
    if (value >= 4) return 'High';
    if (value >= 2) return 'Medium';
    return 'Low';
  };

  const getMaintenanceLevel = () => {
    const score = (
      maintenance.wateringNeeds +
      (maintenance.fertilizationFrequency === 'frequent' ? 5 : 
       maintenance.fertilizationFrequency === 'moderate' ? 3 : 1) +
      (maintenance.aerationFrequency === 'annual' ? 3 :
       maintenance.aerationFrequency === 'biannual' ? 4 : 2)
    ) / 3;

    return score >= 4 ? 'High' : score >= 2.5 ? 'Medium' : 'Low';
  };

  return (
    <Card
      className={`
        relative p-4 cursor-pointer transition-all duration-200
        hover:shadow-lg
        ${selected ? 'ring-2 ring-primary' : 'hover:ring-1 hover:ring-primary/50'}
      `}
      onClick={() => onSelect(species)}
    >
      {/* Type Badge */}
      <Badge
        variant={type === 'cool-season' ? 'default' : 'secondary'}
        className="absolute top-2 right-2 z-10"
      >
        {type}
      </Badge>

      {/* Main Image */}
      <div className="relative w-full h-48 mb-4 rounded-t overflow-hidden">
        <SpeciesImage
          src={mainImage}
          alt={name}
          description={imageDescriptions?.main}
          priority
        />
      </div>

      {/* Species Name */}
      <div className="mb-3">
        <h3 className="text-lg font-semibold">{name}</h3>
        <p className="text-sm text-muted-foreground italic">{scientificName}</p>
      </div>

      {/* Key Characteristics */}
      <div className="space-y-2">
        <Tooltip content="How well the grass handles dry conditions">
          <button
            type="button"
            className="w-full flex justify-between text-sm bg-transparent hover:bg-accent/50 px-2 py-1 rounded transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <span>Drought Tolerance:</span>
            <span>{getToleranceLabel(characteristics.droughtTolerance)}</span>
          </button>
        </Tooltip>

        <Tooltip content="How well the grass grows in shaded areas">
          <button
            type="button"
            className="w-full flex justify-between text-sm bg-transparent hover:bg-accent/50 px-2 py-1 rounded transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <span>Shade Tolerance:</span>
            <span>{getToleranceLabel(characteristics.shadeTolerance)}</span>
          </button>
        </Tooltip>

        <Tooltip content="How well the grass handles foot traffic and activity">
          <button
            type="button"
            className="w-full flex justify-between text-sm bg-transparent hover:bg-accent/50 px-2 py-1 rounded transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <span>Wear Tolerance:</span>
            <span>{getToleranceLabel(characteristics.wearTolerance)}</span>
          </button>
        </Tooltip>

        <Tooltip content="Overall maintenance requirements">
          <button
            type="button"
            className="w-full flex justify-between text-sm font-medium bg-transparent hover:bg-accent/50 px-2 py-1 rounded transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <span>Maintenance Level:</span>
            <span>{getMaintenanceLevel()}</span>
          </button>
        </Tooltip>
      </div>

      {/* View Details Button */}
      <button
        className="mt-4 text-sm text-primary hover:text-primary/80 transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          setShowDetails(true);
        }}
      >
        View Details
      </button>

      {/* Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">{name}</h2>
            <p className="italic text-gray-600 mb-6">{scientificName}</p>

            <div className="space-y-6">
              {/* Characteristics Section */}
              <section>
                <h3 className="text-lg font-semibold mb-3">Characteristics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium">Growth Habit</p>
                    <p className="text-gray-600">{characteristics.growthHabit}</p>
                  </div>
                  <div>
                    <p className="font-medium">Leaf Texture</p>
                    <p className="text-gray-600">{characteristics.leafTexture}</p>
                  </div>
                  <div>
                    <p className="font-medium">Color</p>
                    <p className="text-gray-600">{characteristics.color}</p>
                  </div>
                  <div>
                    <p className="font-medium">Root System</p>
                    <p className="text-gray-600">{characteristics.rootSystem}</p>
                  </div>
                </div>
              </section>

              {/* Image Gallery Section */}
              {images && images.length > 0 && (
                <section>
                  <h3 className="text-lg font-semibold mb-3">Image Gallery</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {images.map((image, index) => {
                      const imageName = image.split('/').pop()?.replace('.jpg', '');
                      const description = imageName && imageDescriptions?.additional?.[imageName];
                      
                      return (
                        <div key={image} className="relative h-40 rounded overflow-hidden">
                          <SpeciesImage
                            src={image}
                            alt={`${name} - ${imageName}`}
                            description={description}
                          />
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Maintenance Section */}
              <section>
                <h3 className="text-lg font-semibold mb-3">Maintenance</h3>
                <div className="space-y-3">
                  <div>
                    <p className="font-medium">Mowing Height</p>
                    <p className="text-gray-600">
                      Optimal: {maintenance.mowingHeight.optimal} inches
                      (Range: {maintenance.mowingHeight.min}-{maintenance.mowingHeight.max} inches)
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Watering Needs</p>
                    <p className="text-gray-600">
                      {getToleranceLabel(maintenance.wateringNeeds)} 
                      ({maintenance.wateringNeeds}/5)
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Fertilization</p>
                    <p className="text-gray-600">{maintenance.fertilizationFrequency}</p>
                  </div>
                  <div>
                    <p className="font-medium">Aeration</p>
                    <p className="text-gray-600">{maintenance.aerationFrequency}</p>
                  </div>
                </div>
              </section>
            </div>

            <button
              className="mt-6 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
              onClick={() => setShowDetails(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}