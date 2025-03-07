import { WeatherData, TreatmentType, EffectivenessRating } from '../types';

export interface TrainingData {
  weatherConditions: WeatherData;
  treatmentType: TreatmentType;
  effectiveness: EffectivenessRating;
  timestamp: Date;
}

export interface PredictionResult {
  score: number; // 0-1 prediction score
  confidence: number; // 0-1 confidence level
  factors: {
    name: string;
    weight: number;
    impact: 'positive' | 'negative' | 'neutral';
  }[];
}

export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  dataPoints: number;
  lastUpdated: Date;
}

export interface MLConfig {
  minDataPoints: number; // Minimum data points needed for training
  confidenceThreshold: number; // Minimum confidence for predictions
  trainingInterval: number; // Hours between model updates
  featureWeights: Record<string, number>; // Importance of different weather features
}