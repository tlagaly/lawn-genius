import { WeatherData, TreatmentType } from '../types';

export interface TrainingData {
  weatherData: WeatherData;
  treatmentType: TreatmentType;
  effectiveness: number; // 0-1 scale
  timestamp: Date;
}

export interface PredictionResult {
  effectiveness: number; // 0-1 scale
  confidence: number; // 0-1 scale
  factors: {
    [key: string]: number;
  };
  recommendations: string[];
}

export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  lastTrainingDate: Date;
  dataPoints: number;
}

export interface ConfidenceScore {
  value: number;
  factors: {
    dataQuality: number;
    dataQuantity: number;
    seasonalRelevance: number;
    weatherStability: number;
  };
}

export interface TrainingConfig {
  minDataPoints: number;
  validationSplit: number;
  seasonalWeight: number;
  retrainingThreshold: number;
}