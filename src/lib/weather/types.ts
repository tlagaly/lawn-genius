export interface WeatherData {
  temperature: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  conditions: string;
  uvIndex?: number;
  soilMoisture?: number;
  pressure?: number;
  dewPoint?: number;
  visibility?: number;
}

// Type guard for numeric weather metrics
export function isWeatherMetric(key: string): key is keyof Omit<WeatherData, 'conditions'> {
  return [
    'temperature',
    'humidity',
    'precipitation',
    'windSpeed',
    'uvIndex',
    'soilMoisture',
    'pressure',
    'dewPoint',
    'visibility'
  ].includes(key);
}

export interface WeatherMetricThresholds {
  uvIndex: { min: number; max: number };
  soilMoisture: { min: number; max: number };
  pressure: { min: number; max: number };
  dewPoint: { min: number; max: number };
  visibility: { min: number; max: number };
}

// Create a base interface for common weather properties
interface BaseWeatherData {
  temperature: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  conditions: string;
  uvIndex?: number;
  soilMoisture?: number;
  pressure?: number;
  dewPoint?: number;
  visibility?: number;
}

// Extend the base interface for forecast data
export interface WeatherForecast extends BaseWeatherData {
  date: Date;
  probability: number; // Precipitation probability
}

export interface Location {
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface TreatmentConditions {
  minTemp: number;
  maxTemp: number;
  maxWindSpeed: number;
  maxPrecipitation: number;
  idealConditions: string[];
  metrics: WeatherMetricThresholds;
  priority: number; // Base priority for this treatment type
}

// Weather suitability scores for different treatment types
export const TREATMENT_CONDITIONS: Record<string, TreatmentConditions> = {
  'Fertilization': {
    minTemp: 10, // °C
    maxTemp: 29,
    maxWindSpeed: 15, // km/h
    maxPrecipitation: 5, // mm
    idealConditions: ['Clear', 'Partly cloudy'],
    priority: 4,
    metrics: {
      uvIndex: { min: 2, max: 7 }, // UV index range
      soilMoisture: { min: 30, max: 70 }, // % saturation
      pressure: { min: 1000, max: 1020 }, // hPa
      dewPoint: { min: 5, max: 15 }, // °C
      visibility: { min: 5, max: 50 } // km
    }
  },
  'Weed Control': {
    minTemp: 12,
    maxTemp: 30,
    maxWindSpeed: 10,
    maxPrecipitation: 0,
    idealConditions: ['Clear', 'Partly cloudy'],
    priority: 3,
    metrics: {
      uvIndex: { min: 3, max: 8 },
      soilMoisture: { min: 20, max: 60 },
      pressure: { min: 1005, max: 1025 },
      dewPoint: { min: 8, max: 18 },
      visibility: { min: 8, max: 50 }
    }
  },
  'Mowing': {
    minTemp: 5,
    maxTemp: 35,
    maxWindSpeed: 20,
    maxPrecipitation: 0,
    idealConditions: ['Clear', 'Partly cloudy', 'Cloudy'],
    priority: 2,
    metrics: {
      uvIndex: { min: 0, max: 9 },
      soilMoisture: { min: 10, max: 80 },
      pressure: { min: 995, max: 1030 },
      dewPoint: { min: 2, max: 20 },
      visibility: { min: 3, max: 50 }
    }
  },
  'Seeding': {
    minTemp: 8,
    maxTemp: 26,
    maxWindSpeed: 12,
    maxPrecipitation: 2,
    idealConditions: ['Partly cloudy', 'Cloudy'],
    priority: 5,
    metrics: {
      uvIndex: { min: 1, max: 5 },
      soilMoisture: { min: 40, max: 80 },
      pressure: { min: 1008, max: 1022 },
      dewPoint: { min: 6, max: 14 },
      visibility: { min: 5, max: 50 }
    }
  }
};

export interface WeatherAlert {
  id: string;
  treatmentId: string;
  type: 'temperature' | 'wind' | 'precipitation' | 'conditions' | 'uv' | 'soil' | 'dewpoint' | 'visibility';
  severity: 'info' | 'warning' | 'critical';
  priority: number; // 1-5, higher is more urgent
  message: string;
  suggestedDate?: Date;
  createdAt: Date;
  location: Location;
  originalDate: Date;
  batchId?: string; // For grouping related alerts
  correlationId?: string; // For tracking related conditions
  metrics: Partial<WeatherData>; // Relevant metrics that triggered the alert
}

export interface WeatherMonitorConfig {
  checkInterval: number; // Minutes between checks
  alertThreshold: number; // Weather score threshold for alerts
  forecastHours: number; // Hours ahead to check
  batchWindow: number; // Minutes to batch alerts
  maxAlertsPerBatch: number; // Maximum alerts to include in a batch
  minAlertPriority: number; // Minimum priority level to generate alert
}

export interface AlertBatch {
  id: string;
  alerts: WeatherAlert[];
  createdAt: Date;
  processedAt?: Date;
  priority: number; // Highest priority in the batch
  treatmentIds: string[]; // All affected treatments
}

export interface RescheduleOption {
  date: Date;
  score: number;
  conditions: WeatherData;
}

export interface WeatherRecommendation {
  score: number;
  recommendations: string[];
  alternativeDates: Date[];
}

export interface TreatmentEffectiveness {
  score: number;
  factors: Record<string, number>;
  recommendations: string[];
}

export interface WeatherServiceError {
  code: string;
  message: string;
}

// Effectiveness rating scale for treatments
export type EffectivenessRating = 1 | 2 | 3 | 4 | 5;

// Treatment types based on TREATMENT_CONDITIONS
export type TreatmentType = keyof typeof TREATMENT_CONDITIONS;