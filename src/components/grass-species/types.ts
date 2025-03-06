import { z } from 'zod';

export const SpeciesFiltersSchema = z.object({
  type: z.enum(['cool-season', 'warm-season']).optional(),
  maintenanceLevel: z.enum(['low', 'medium', 'high']).optional(),
  region: z.string().optional(),
  search: z.string().optional(),
});

export type SpeciesFilters = z.infer<typeof SpeciesFiltersSchema>;

export interface GrassSpeciesCharacteristics {
  growthHabit: string;
  leafTexture: string;
  color: string;
  rootSystem: string;
  droughtTolerance: number;
  shadeTolerance: number;
  wearTolerance: number;
}

export interface GrassSpeciesIdealConditions {
  soilPH: {
    min: number;
    max: number;
  };
  soilTypes: string[];
  temperature: {
    min: number;
    max: number;
    optimal: number;
  };
  annualRainfall: {
    min: number;
    max: number;
  };
}

export interface GrassSpeciesMaintenance {
  mowingHeight: {
    min: number;
    max: number;
    optimal: number;
  };
  wateringNeeds: number;
  fertilizationFrequency: string;
  aerationFrequency: string;
}

export interface GrassSpeciesImageDescriptions {
  main?: string;
  additional?: Record<string, string>;
}

export interface GrassSpecies {
  id: string;
  name: string;
  scientificName: string;
  type: 'cool-season' | 'warm-season';
  characteristics: GrassSpeciesCharacteristics;
  idealConditions: GrassSpeciesIdealConditions;
  maintenance: GrassSpeciesMaintenance;
  commonMixes: string[];
  mainImage?: string;
  images?: string[];
  imageDescriptions?: GrassSpeciesImageDescriptions;
}

export interface SpeciesCardProps {
  species: GrassSpecies;
  onSelect: (species: GrassSpecies) => void;
  selected: boolean;
}

export interface SpeciesFilterProps {
  onFilterChange: (filters: SpeciesFilters) => void;
  activeFilters: SpeciesFilters;
}

export interface SpeciesSearchProps {
  onSearch: (filters: SpeciesFilters) => void;
  searchTerm: string;
}

export interface SpeciesSelectionProps {
  onSpeciesSelect: (species: GrassSpecies) => void;
  selectedSpecies?: GrassSpecies;
  region?: string;
}