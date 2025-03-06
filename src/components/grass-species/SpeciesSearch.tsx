"use client";

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import type { SpeciesSearchProps, SpeciesFilters } from './types';

export function SpeciesSearch({ onSearch, searchTerm }: SpeciesSearchProps) {
  const [activeType, setActiveType] = useState<'all' | 'cool-season' | 'warm-season'>('all');
  const [maintenanceLevel, setMaintenanceLevel] = useState<'all' | 'low' | 'medium' | 'high'>('all');

  const handleTypeChange = (type: typeof activeType) => {
    setActiveType(type);
    const filters: SpeciesFilters = {
      ...(type !== 'all' && { type }),
      ...(maintenanceLevel !== 'all' && { maintenanceLevel }),
      ...(searchTerm && { search: searchTerm }),
    };
    onSearch(filters);
  };

  const handleMaintenanceChange = (level: typeof maintenanceLevel) => {
    setMaintenanceLevel(level);
    const filters: SpeciesFilters = {
      ...(activeType !== 'all' && { type: activeType }),
      ...(level !== 'all' && { maintenanceLevel: level }),
      ...(searchTerm && { search: searchTerm }),
    };
    onSearch(filters);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const term = event.target.value;
    const filters: SpeciesFilters = {
      ...(activeType !== 'all' && { type: activeType }),
      ...(maintenanceLevel !== 'all' && { maintenanceLevel }),
      ...(term && { search: term }),
    };
    onSearch(filters);
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search grass species..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Type Filter */}
      <div className="flex flex-wrap gap-2">
        <Badge
          variant={activeType === 'all' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => handleTypeChange('all')}
        >
          All Types
        </Badge>
        <Badge
          variant={activeType === 'cool-season' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => handleTypeChange('cool-season')}
        >
          Cool Season
        </Badge>
        <Badge
          variant={activeType === 'warm-season' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => handleTypeChange('warm-season')}
        >
          Warm Season
        </Badge>
      </div>

      {/* Maintenance Level Filter */}
      <div className="flex flex-wrap gap-2">
        <Badge
          variant={maintenanceLevel === 'all' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => handleMaintenanceChange('all')}
        >
          All Maintenance
        </Badge>
        <Badge
          variant={maintenanceLevel === 'low' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => handleMaintenanceChange('low')}
        >
          Low Maintenance
        </Badge>
        <Badge
          variant={maintenanceLevel === 'medium' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => handleMaintenanceChange('medium')}
        >
          Medium Maintenance
        </Badge>
        <Badge
          variant={maintenanceLevel === 'high' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => handleMaintenanceChange('high')}
        >
          High Maintenance
        </Badge>
      </div>
    </div>
  );
}