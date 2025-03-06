"use client";

import { useState } from 'react';
import { api } from '@/lib/trpc/client';
import { SpeciesCard } from './SpeciesCard';
import { SpeciesSearch } from './SpeciesSearch';
import type { SpeciesSelectionProps, SpeciesFilters, GrassSpecies } from './types';

export function SpeciesSelection({
  onSpeciesSelect,
  selectedSpecies,
  region,
}: SpeciesSelectionProps) {
  const [filters, setFilters] = useState<SpeciesFilters>({
    search: '',
    ...(region && { region }),
  });

  // Fetch grass species with filters
  const { data: species, isLoading } = api.grassSpecies.getAll.useQuery(filters, {
    enabled: true,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const handleSearch = (newFilters: SpeciesFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <SpeciesSearch
        onSearch={handleSearch}
        searchTerm={filters.search || ''}
      />

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Species Grid */}
      {!isLoading && species && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {species.map((grassSpecies: GrassSpecies) => (
            <SpeciesCard
              key={grassSpecies.id}
              species={grassSpecies}
              selected={selectedSpecies?.id === grassSpecies.id}
              onSelect={onSpeciesSelect}
            />
          ))}
        </div>
      )}

      {/* No Results */}
      {!isLoading && species?.length === 0 && (
        <div className="text-center py-8">
          <p className="text-lg text-gray-600">
            No grass species found matching your criteria.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Try adjusting your search filters.
          </p>
        </div>
      )}

      {/* Educational Note */}
      <div className="bg-blue-50 p-4 rounded-lg mt-8">
        <h4 className="font-semibold text-blue-900 mb-2">
          Choosing the Right Grass
        </h4>
        <p className="text-sm text-blue-800">
          Select a grass species that matches your climate and maintenance preferences.
          Consider factors like sunlight, water needs, and traffic tolerance for the best results.
        </p>
      </div>
    </div>
  );
}