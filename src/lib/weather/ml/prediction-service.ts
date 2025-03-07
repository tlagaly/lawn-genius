import { prisma } from '@/lib/db/prisma';
import { WeatherData, TreatmentType } from '../types';
import { 
  TrainingData, 
  PredictionResult, 
  ModelMetrics, 
  ConfidenceScore, 
  TrainingConfig 
} from './types';

const DEFAULT_CONFIG: TrainingConfig = {
  minDataPoints: 100,
  validationSplit: 0.2,
  seasonalWeight: 0.3,
  retrainingThreshold: 0.15
};

export class WeatherPredictionService {
  private config: TrainingConfig;

  constructor(config: Partial<TrainingConfig> = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config
    };
  }

  async addTrainingData(data: Omit<TrainingData, 'timestamp'>): Promise<void> {
    await prisma.weatherTrainingData.create({
      data: {
        weatherData: data.weatherData,
        treatmentType: data.treatmentType,
        effectiveness: data.effectiveness,
        timestamp: new Date()
      }
    });
  }

  async getTrainingData(
    treatmentType: TreatmentType,
    startDate?: Date,
    endDate?: Date
  ): Promise<TrainingData[]> {
    const where: {
      treatmentType: string;
      timestamp?: {
        gte?: Date;
        lte?: Date;
      };
    } = { treatmentType };
    
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    const data = await prisma.weatherTrainingData.findMany({ where });
    return data.map(item => ({
      weatherData: item.weatherData as WeatherData,
      treatmentType: item.treatmentType as TreatmentType,
      effectiveness: Number(item.effectiveness),
      timestamp: item.timestamp
    }));
  }

  private async calculateConfidenceScore(
    weatherData: WeatherData,
    treatmentType: TreatmentType
  ): Promise<ConfidenceScore> {
    // Calculate data quality score
    const dataQuality = this.assessDataQuality(weatherData);

    // Calculate data quantity score based on available training data
    const dataQuantity = await this.assessDataQuantity(treatmentType);

    // Calculate seasonal relevance
    const seasonalRelevance = this.calculateSeasonalRelevance(weatherData);

    // Calculate weather stability
    const weatherStability = this.assessWeatherStability(weatherData);

    // Combine scores with weights
    const value = (
      dataQuality * 0.3 +
      dataQuantity * 0.25 +
      seasonalRelevance * 0.25 +
      weatherStability * 0.2
    );

    return {
      value,
      factors: {
        dataQuality,
        dataQuantity,
        seasonalRelevance,
        weatherStability
      }
    };
  }

  private assessDataQuality(weatherData: WeatherData): number {
    // Check for missing or invalid values
    const requiredFields = [
      'temperature',
      'humidity',
      'precipitation',
      'windSpeed',
      'uvIndex',
      'soilMoisture'
    ];

    const validFields = requiredFields.filter(field => {
      const value = weatherData[field as keyof WeatherData];
      return typeof value === 'number' && !isNaN(value);
    });

    return validFields.length / requiredFields.length;
  }

  private async assessDataQuantity(treatmentType: TreatmentType): Promise<number> {
    const totalDataPoints = await prisma.weatherTrainingData.count({
      where: { treatmentType }
    });

    return Math.min(1, totalDataPoints / this.config.minDataPoints);
  }

  private calculateSeasonalRelevance(weatherData: WeatherData): number {
    const currentMonth = new Date().getMonth();
    const seasonalFactors = {
      temperature: this.getSeasonalWeight(currentMonth, weatherData.temperature),
      humidity: this.getSeasonalWeight(currentMonth, weatherData.humidity),
      precipitation: this.getSeasonalWeight(currentMonth, weatherData.precipitation)
    };

    return Object.values(seasonalFactors).reduce((sum, val) => sum + val, 0) / 3;
  }

  private getSeasonalWeight(month: number, value: number): number {
    // Simplified seasonal weighting based on month
    const seasonalRanges = {
      winter: [11, 0, 1],
      spring: [2, 3, 4],
      summer: [5, 6, 7],
      fall: [8, 9, 10]
    };

    // Determine current season
    let currentSeason: keyof typeof seasonalRanges;
    for (const [season, months] of Object.entries(seasonalRanges)) {
      if (months.includes(month)) {
        currentSeason = season as keyof typeof seasonalRanges;
        break;
      }
    }

    // Apply seasonal adjustments
    switch (currentSeason!) {
      case 'winter':
        return value < 10 ? 1 : 0.5;
      case 'summer':
        return value > 20 ? 1 : 0.5;
      default:
        return 0.8; // Spring and Fall are generally good for most operations
    }
  }

  private assessWeatherStability(weatherData: WeatherData): number {
    // Check for extreme conditions
    const stabilityFactors = {
      windSpeed: Math.max(0, 1 - weatherData.windSpeed / 30),
      precipitation: Math.max(0, 1 - weatherData.precipitation / 10),
      temperature: Math.min(
        Math.max(0, 1 - Math.abs(weatherData.temperature - 20) / 20),
        1
      )
    };

    return Object.values(stabilityFactors).reduce((sum, val) => sum + val, 0) / 3;
  }

  async predict(
    weatherData: WeatherData,
    treatmentType: TreatmentType
  ): Promise<PredictionResult> {
    try {
      // Get historical data for this treatment type
      const trainingData = await this.getTrainingData(treatmentType);

      // Calculate base effectiveness using weighted features
      const effectiveness = Number(this.calculateEffectiveness(weatherData, trainingData));

      // Calculate confidence score
      const confidence = await this.calculateConfidenceScore(weatherData, treatmentType);

      // Generate recommendations based on predictions
      const recommendations = this.generateRecommendations(
        weatherData,
        treatmentType,
        effectiveness
      );

      // Calculate impact factors
      const factors = this.calculateImpactFactors(weatherData, trainingData);
      
      // Ensure all numeric values are properly typed
      const typedFactors: Record<string, number> = {};
      for (const [key, value] of Object.entries(factors)) {
        typedFactors[key] = Number(value);
      }

      return {
        effectiveness,
        confidence: Number(confidence.value),
        factors: typedFactors,
        recommendations
      };
    } catch (error) {
      console.error('Error in weather prediction:', error);
      throw error;
    }
  }

  private calculateEffectiveness(
    weatherData: WeatherData,
    trainingData: TrainingData[]
  ): number {
    if (trainingData.length === 0) return 0.5; // Default when no training data

    // Calculate weighted average based on similar conditions
    let totalWeight = 0;
    let weightedSum = 0;

    for (const sample of trainingData) {
      const similarity = this.calculateSimilarity(weatherData, sample.weatherData);
      const weight = Math.pow(similarity, 2); // Square to emphasize closer matches
      
      weightedSum += sample.effectiveness * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0.5;
  }

  private calculateSimilarity(a: WeatherData, b: WeatherData): number {
    const features = [
      { name: 'temperature', weight: 0.3 },
      { name: 'humidity', weight: 0.2 },
      { name: 'windSpeed', weight: 0.2 },
      { name: 'precipitation', weight: 0.15 },
      { name: 'uvIndex', weight: 0.15 }
    ];

    return features.reduce((similarity, feature) => {
      const diff = Math.abs(
        a[feature.name as keyof WeatherData] as number -
        b[feature.name as keyof WeatherData] as number
      );
      const normalizedDiff = Math.max(0, 1 - diff / 10); // Normalize to 0-1
      return similarity + normalizedDiff * feature.weight;
    }, 0);
  }

  private calculateImpactFactors(
    weatherData: WeatherData,
    trainingData: TrainingData[]
  ): Record<string, number> {
    return {
      temperature: this.calculateFeatureImpact('temperature', weatherData, trainingData),
      humidity: this.calculateFeatureImpact('humidity', weatherData, trainingData),
      windSpeed: this.calculateFeatureImpact('windSpeed', weatherData, trainingData),
      precipitation: this.calculateFeatureImpact('precipitation', weatherData, trainingData),
      uvIndex: this.calculateFeatureImpact('uvIndex', weatherData, trainingData)
    };
  }

  private calculateFeatureImpact(
    feature: keyof WeatherData,
    weatherData: WeatherData,
    trainingData: TrainingData[]
  ): number {
    if (trainingData.length === 0) return 0.5;

    const value = weatherData[feature] as number;
    const similarSamples = trainingData.filter(sample => {
      const sampleValue = sample.weatherData[feature] as number;
      return Math.abs(value - sampleValue) < 5; // Threshold for similarity
    });

    if (similarSamples.length === 0) return 0.5;

    return similarSamples.reduce((sum, sample) => sum + sample.effectiveness, 0) / similarSamples.length;
  }

  private generateRecommendations(
    weatherData: WeatherData,
    treatmentType: TreatmentType,
    effectiveness: number
  ): string[] {
    const recommendations: string[] = [];

    // Add recommendations based on effectiveness
    if (effectiveness < 0.4) {
      recommendations.push('Consider rescheduling due to unfavorable conditions');
    } else if (effectiveness < 0.7) {
      recommendations.push('Conditions are acceptable but not optimal');
    } else {
      recommendations.push('Current conditions are favorable for treatment');
    }

    // Add specific recommendations based on weather conditions
    if (weatherData.windSpeed > 15) {
      recommendations.push('High wind speeds may affect treatment effectiveness');
    }
    if (weatherData.precipitation > 0) {
      recommendations.push('Precipitation may interfere with treatment');
    }
    if (weatherData.temperature < 10 || weatherData.temperature > 30) {
      recommendations.push('Temperature is outside optimal range');
    }

    return recommendations;
  }

  async getModelMetrics(treatmentType: TreatmentType): Promise<ModelMetrics> {
    const trainingData = await this.getTrainingData(treatmentType);
    
    if (trainingData.length === 0) {
      return {
        accuracy: 0,
        precision: 0,
        recall: 0,
        f1Score: 0,
        lastTrainingDate: new Date(0),
        dataPoints: 0
      };
    }

    // Calculate basic metrics
    const dataPoints = trainingData.length;
    const lastTrainingDate = new Date(Math.max(
      ...trainingData.map(data => data.timestamp.getTime())
    ));

    // Simple accuracy calculation based on effectiveness thresholds
    const predictions = await Promise.all(
      trainingData.map(data => this.predict(data.weatherData, treatmentType))
    );

    const accuracyMetrics = this.calculateAccuracyMetrics(
      predictions.map(p => p.effectiveness),
      trainingData.map(d => d.effectiveness)
    );

    return {
      ...accuracyMetrics,
      lastTrainingDate,
      dataPoints
    };
  }

  private calculateAccuracyMetrics(
    predicted: number[],
    actual: number[]
  ): Pick<ModelMetrics, 'accuracy' | 'precision' | 'recall' | 'f1Score'> {
    const threshold = 0.7; // Threshold for "good" predictions
    
    let truePositives = 0;
    let falsePositives = 0;
    let trueNegatives = 0;
    let falseNegatives = 0;

    for (let i = 0; i < predicted.length; i++) {
      const predGood = predicted[i] >= threshold;
      const actualGood = actual[i] >= threshold;

      if (predGood && actualGood) truePositives++;
      else if (predGood && !actualGood) falsePositives++;
      else if (!predGood && !actualGood) trueNegatives++;
      else falseNegatives++;
    }

    const accuracy = (truePositives + trueNegatives) / predicted.length;
    const precision = truePositives / (truePositives + falsePositives) || 0;
    const recall = truePositives / (truePositives + falseNegatives) || 0;
    const f1Score = 2 * (precision * recall) / (precision + recall) || 0;

    return { accuracy, precision, recall, f1Score };
  }
}

// Export a singleton instance
export const weatherPredictionService = new WeatherPredictionService();