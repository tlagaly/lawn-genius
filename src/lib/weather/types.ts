export interface WeatherData {
  temperature: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  conditions: string;
}

export interface WeatherForecast extends WeatherData {
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
}

// Weather suitability scores for different treatment types
export const TREATMENT_CONDITIONS: Record<string, TreatmentConditions> = {
  'Fertilization': {
    minTemp: 10, // °C
    maxTemp: 29,
    maxWindSpeed: 15, // km/h
    maxPrecipitation: 5, // mm
    idealConditions: ['Clear', 'Partly cloudy']
  },
  'Weed Control': {
    minTemp: 12,
    maxTemp: 30,
    maxWindSpeed: 10,
    maxPrecipitation: 0,
    idealConditions: ['Clear', 'Partly cloudy']
  },
  'Mowing': {
    minTemp: 5,
    maxTemp: 35,
    maxWindSpeed: 20,
    maxPrecipitation: 0,
    idealConditions: ['Clear', 'Partly cloudy', 'Cloudy']
  },
  'Seeding': {
    minTemp: 8,
    maxTemp: 26,
    maxWindSpeed: 12,
    maxPrecipitation: 2,
    idealConditions: ['Partly cloudy', 'Cloudy']
  }
};

export interface WeatherAlert {
  id: string;
  treatmentId: string;
  treatmentType: string;
  type: 'temperature' | 'wind' | 'precipitation' | 'conditions';
  severity: 'warning' | 'critical';
  message: string;
  suggestedDate?: Date;
  createdAt: Date;
  location: Location;
  originalDate: Date;
}

export interface WeatherMonitorConfig {
  checkInterval: number; // Minutes between checks
  alertThreshold: number; // Weather score threshold for alerts
  forecastHours: number; // Hours ahead to check
}

export interface RescheduleOption {
  date: Date;
  score: number;
  conditions: WeatherData;
}

export interface WeatherServiceError {
  code: string;
  message: string;
}