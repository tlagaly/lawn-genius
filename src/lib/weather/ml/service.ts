import { prisma } from '@/lib/db/prisma';
import { WeatherData, TreatmentType, EffectivenessRating, isWeatherMetric } from '../types';
import { TrainingData, PredictionResult, ModelMetrics, MLConfig } from './types';
import { Prisma } from '@prisma/client';

const DEFAULT_CONFIG: MLConfig = {
  minDataPoints: 50,
  confidenceThreshold: 0.7,
  trainingInterval: 24, // Retrain every 24 hours
  featureWeights: {
    temperature: 1.0,
    humidity: 0.8,
    precipitation: 1.0,
    windSpeed: 0.6,
    cloudCover: 0.4,
    soilMoisture: 0.9
  }
};

export class WeatherMLService {
  private config: MLConfig;
  private lastTrainingTime: Date | null = null;
  private modelMetrics: ModelMetrics | null = null;

  constructor(config: Partial<MLConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Store new training data from treatment effectiveness feedback
   */
  async addTrainingData(data: Omit<TrainingData, 'timestamp'>): Promise<void> {
    try {
      // Validate weather data
      if (!this.validateWeatherData(data.weatherConditions)) {
        throw new Error('Invalid weather data format');
      }

      const weatherData = this.sanitizeWeatherData(data.weatherConditions);
      const dataQuality = this.calculateDataQuality(weatherData);
      const confidence = this.calculateInitialConfidence(weatherData);

      await prisma.weatherTrainingData.create({
        data: {
          weatherData: weatherData as unknown as Prisma.JsonValue,
          treatmentType: data.treatmentType,
          effectiveness: data.effectiveness,
          timestamp: new Date(),
          dataQuality,
          confidence
        }
      });

      // Check if we should retrain the model
      if (this.shouldRetrain()) {
        await this.trainModel();
      }
    } catch (error) {
      console.error('Error adding training data:', error);
      throw error;
    }
  }

  /**
   * Generate predictions for treatment effectiveness
   */
  async predictEffectiveness(
    weatherData: WeatherData,
    treatmentType: TreatmentType
  ): Promise<PredictionResult> {
    try {
      // Validate and sanitize input
      if (!this.validateWeatherData(weatherData)) {
        throw new Error('Invalid weather data format');
      }

      const sanitizedData = this.sanitizeWeatherData(weatherData);

      // Ensure we have a trained model
      if (!this.modelMetrics || this.shouldRetrain()) {
        await this.trainModel();
      }

      // Calculate base score using feature weights
      const baseScore = this.calculateBaseScore(sanitizedData);
      
      // Calculate confidence based on data similarity and quality
      const confidence = this.calculateConfidence(sanitizedData);

      // Generate impact factors
      const factors = this.analyzeFactors(sanitizedData, treatmentType);

      return {
        score: baseScore,
        confidence,
        factors
      };
    } catch (error) {
      console.error('Error generating prediction:', error);
      // Return conservative prediction with low confidence
      return {
        score: 0.5,
        confidence: this.config.confidenceThreshold,
        factors: []
      };
    }
  }

  /**
   * Get current model metrics
   */
  async getModelMetrics(): Promise<ModelMetrics | null> {
    return this.modelMetrics;
  }

  /**
   * Validate weather data format and values
   */
  private validateWeatherData(data: WeatherData): boolean {
    // Check required fields exist and are numbers
    if (
      typeof data.temperature !== 'number' ||
      typeof data.humidity !== 'number' ||
      typeof data.precipitation !== 'number' ||
      typeof data.windSpeed !== 'number'
    ) {
      return false;
    }

    // Validate value ranges
    if (
      data.temperature < -50 || data.temperature > 150 ||
      data.humidity < 0 || data.humidity > 100 ||
      data.precipitation < 0 || data.precipitation > 100 ||
      data.windSpeed < 0 || data.windSpeed > 200
    ) {
      return false;
    }

    // Validate optional numeric fields if present
    if (
      (data.soilMoisture !== undefined && (data.soilMoisture < 0 || data.soilMoisture > 100)) ||
      (data.uvIndex !== undefined && (data.uvIndex < 0 || data.uvIndex > 11)) ||
      (data.pressure !== undefined && (data.pressure < 950 || data.pressure > 1050)) ||
      (data.dewPoint !== undefined && (data.dewPoint < -20 || data.dewPoint > 40)) ||
      (data.visibility !== undefined && (data.visibility < 0 || data.visibility > 10))
    ) {
      return false;
    }

    return true;
  }

  /**
   * Sanitize weather data by clamping values to valid ranges
   */
  private sanitizeWeatherData(data: WeatherData): Required<WeatherData> {
    return {
      ...data,
      temperature: Math.max(-50, Math.min(150, data.temperature)),
      humidity: Math.max(0, Math.min(100, data.humidity)),
      precipitation: Math.max(0, Math.min(100, data.precipitation)),
      windSpeed: Math.max(0, Math.min(200, data.windSpeed)),
      soilMoisture: typeof data.soilMoisture === 'number' 
        ? Math.max(0, Math.min(100, data.soilMoisture))
        : 50, // Default value if undefined
      conditions: data.conditions || 'Unknown',
      uvIndex: typeof data.uvIndex === 'number' ? data.uvIndex : 0,
      pressure: typeof data.pressure === 'number' ? data.pressure : 1013,
      dewPoint: typeof data.dewPoint === 'number' ? data.dewPoint : 0,
      visibility: typeof data.visibility === 'number' ? data.visibility : 10
    };
  }

  /**
   * Calculate initial data quality score
   */
  private calculateDataQuality(data: WeatherData): number {
    let quality = 1.0;
    let availableMetrics = 0;
    let totalMetrics = 0;

    // Check each weather metric
    for (const [feature, weight] of Object.entries(this.config.featureWeights)) {
      if (isWeatherMetric(feature)) {
        totalMetrics++;
        const value = data[feature as keyof Omit<WeatherData, 'conditions'>];
        if (typeof value === 'number') {
          availableMetrics++;
          
          // Reduce quality for extreme values
          switch (feature) {
            case 'temperature':
              if (value < 0 || value > 100) quality *= 0.9;
              if (value < -20 || value > 120) quality *= 0.8;
              break;
            case 'humidity':
              if (value < 20 || value > 90) quality *= 0.9;
              if (value < 10 || value > 95) quality *= 0.8;
              break;
            case 'windSpeed':
              if (value > 30) quality *= 0.8;
              if (value > 40) quality *= 0.7;
              break;
            case 'precipitation':
              if (value > 2) quality *= 0.9;
              if (value > 4) quality *= 0.8;
              break;
            case 'soilMoisture':
              if (value < 20 || value > 80) quality *= 0.9;
              if (value < 10 || value > 90) quality *= 0.8;
              break;
            case 'uvIndex':
              if (value > 8) quality *= 0.9;
              if (value > 10) quality *= 0.8;
              break;
            case 'pressure':
              if (value < 980 || value > 1020) quality *= 0.9;
              if (value < 960 || value > 1040) quality *= 0.8;
              break;
            case 'dewPoint':
              if (value < -10 || value > 30) quality *= 0.9;
              if (value < -15 || value > 35) quality *= 0.8;
              break;
            case 'visibility':
              if (value < 2) quality *= 0.8;
              if (value < 1) quality *= 0.7;
              break;
          }
        }
      }
    }

    // Adjust quality based on available metrics
    if (totalMetrics > 0) {
      quality *= availableMetrics / totalMetrics;
    }

    // Ensure minimum quality threshold
    return Math.max(quality, 0.5);
  }

  /**
   * Calculate initial confidence for new training data
   */
  private calculateInitialConfidence(data: WeatherData): number {
    return Math.min(
      this.calculateDataQuality(data) * 0.9, // Base on data quality
      0.9 // Cap initial confidence
    );
  }

  /**
   * Train/retrain the model using stored data
   */
  private async trainModel(): Promise<void> {
    try {
      // Get all training data
      const trainingData = await prisma.weatherTrainingData.findMany({
        orderBy: { timestamp: 'desc' },
        take: 1000, // Limit to recent data points
        where: {
          dataQuality: {
            gte: 0.7 // Only use high-quality data for training
          }
        }
      });

      if (trainingData.length < this.config.minDataPoints) {
        console.warn(`Insufficient training data: ${trainingData.length} points`);
        return;
      }

      // Update model metrics
      this.modelMetrics = {
        accuracy: this.calculateAccuracy(trainingData),
        precision: this.calculatePrecision(trainingData),
        recall: this.calculateRecall(trainingData),
        f1Score: this.calculateF1Score(trainingData),
        dataPoints: trainingData.length,
        lastUpdated: new Date()
      };

      this.lastTrainingTime = new Date();
    } catch (error) {
      console.error('Error training model:', error);
      throw error;
    }
  }

  /**
   * Determine if model retraining is needed
   */
  private shouldRetrain(): boolean {
    if (!this.lastTrainingTime) return true;

    const hoursSinceTraining = 
      (new Date().getTime() - this.lastTrainingTime.getTime()) / (1000 * 60 * 60);
    
    return hoursSinceTraining >= this.config.trainingInterval;
  }

  /**
   * Calculate base effectiveness score
   */
  /**
   * Normalize feature values to 0-1 range
   */
  private normalizeFeature(feature: keyof Omit<WeatherData, 'conditions'>, value: number): number {
    try {
      // Feature-specific normalization logic
      switch (feature) {
        case 'temperature':
          return this.normalizeTemperature(value);
        case 'humidity':
          return Math.max(0, Math.min(1, value / 100)); // 0-100
        case 'precipitation':
          return this.normalizePrecipitation(value);
        case 'windSpeed':
          return this.normalizeWindSpeed(value);
        case 'soilMoisture':
          return Math.max(0, Math.min(1, value / 100)); // 0-100
        case 'uvIndex':
          return Math.max(0, Math.min(1, value / 11)); // 0-11 scale
        case 'pressure':
          return Math.max(0, Math.min(1, (value - 950) / 100)); // 950-1050 range
        case 'dewPoint':
          return Math.max(0, Math.min(1, (value + 20) / 60)); // -20 to 40 range
        case 'visibility':
          return Math.max(0, Math.min(1, value / 10)); // 0-10 scale
        default:
          return Math.max(0, Math.min(1, value)); // Default 0-1 clamp
      }
    } catch (error) {
      console.error('Error normalizing feature:', error);
      return 0.5; // Return neutral value on error
    }
  }

  private calculateBaseScore(weatherData: Required<WeatherData>): number {
    try {
      let score = 0;
      let totalWeight = 0;

      // Weight each weather factor
      for (const [feature, weight] of Object.entries(this.config.featureWeights)) {
        if (isWeatherMetric(feature)) {
          const value = weatherData[feature];
          if (typeof value === 'number') {
            score += this.normalizeFeature(feature, value) * weight;
            totalWeight += weight;
          }
        }
      }

      return totalWeight > 0 ? Math.max(0, Math.min(1, score / totalWeight)) : 0.5;
    } catch (error) {
      console.error('Error calculating base score:', error);
      return 0.5; // Return neutral score on error
    }
  }

  /**
   * Calculate prediction confidence
   */
  private calculateConfidence(weatherData: WeatherData): number {
    try {
      // Start with base confidence
      let confidence = 0.8;

      // Adjust based on data completeness
      const expectedFeatures = Object.keys(this.config.featureWeights);
      const availableFeatures = Object.keys(weatherData).filter(
        f => typeof weatherData[f] === 'number'
      );
      const completeness = 
        availableFeatures.filter(f => expectedFeatures.includes(f)).length / 
        expectedFeatures.length;
      
      confidence *= completeness;

      // Adjust for extreme values
      if (this.hasExtremeValues(weatherData)) {
        confidence *= 0.8;
      }

      // Ensure minimum confidence threshold
      return Math.max(confidence, this.config.confidenceThreshold);
    } catch (error) {
      console.error('Error calculating confidence:', error);
      return this.config.confidenceThreshold;
    }
  }

  /**
   * Check for extreme weather values
   */
  private hasExtremeValues(data: WeatherData): boolean {
    return (
      data.temperature < 0 || data.temperature > 100 ||
      data.humidity < 20 || data.humidity > 90 ||
      data.windSpeed > 30 ||
      data.precipitation > 2 ||
      (typeof data.soilMoisture === 'number' && (data.soilMoisture < 20 || data.soilMoisture > 80))
    );
  }

  /**
   * Check for extreme weather conditions that affect all treatments
   */
  private checkExtremeConditions(feature: string, value: number): 'negative' | 'neutral' {
    switch (feature) {
      case 'temperature':
        if (value > 35) return 'negative'; // Above 95°F
        if (value < 0) return 'negative';  // Below 32°F
        break;
      case 'windSpeed':
        if (value > 25) return 'negative'; // Strong winds
        break;
      case 'precipitation':
        if (value > 1.0) return 'negative'; // Heavy rain
        break;
      case 'soilMoisture':
        if (value < 10) return 'negative'; // Severely dry
        if (value > 90) return 'negative'; // Waterlogged
        break;
    }
    return 'neutral';
  }

  /**
   * Determine impact factors for fertilization treatments
   */
  private determineFertilizationImpact(feature: string, value: number): 'positive' | 'negative' | 'neutral' {
    switch (feature) {
      case 'temperature':
        if (value >= 15 && value <= 25) return 'positive'; // 59-77°F ideal
        if (value < 10 || value > 30) return 'negative';   // Too cold/hot
        break;
      case 'precipitation':
        if (value >= 0.1 && value <= 0.3) return 'positive'; // Light rain beneficial
        if (value > 0.5) return 'negative';                  // Too wet
        break;
      case 'windSpeed':
        if (value < 10) return 'positive';  // Calm conditions
        if (value > 20) return 'negative';  // Too windy
        break;
      case 'humidity':
        if (value >= 40 && value <= 70) return 'positive';  // Ideal range
        if (value > 85) return 'negative';                  // Too humid
        break;
      case 'soilMoisture':
        if (value >= 40 && value <= 60) return 'positive';  // Ideal range
        if (value < 30 || value > 80) return 'negative';    // Too dry/wet
        break;
      case 'cloudCover':
        if (value <= 50) return 'positive';  // Some sun is good
        break;
    }
    return 'neutral';
  }

  /**
   * Determine impact factors for aeration treatments
   */
  private determineAerationImpact(feature: string, value: number): 'positive' | 'negative' | 'neutral' {
    switch (feature) {
      case 'soilMoisture':
        if (value >= 40 && value <= 60) return 'positive';  // Ideal range
        if (value < 30) return 'negative';                  // Too dry
        if (value > 70) return 'negative';                  // Too wet
        break;
      case 'temperature':
        if (value >= 10 && value <= 25) return 'positive';  // 50-77°F ideal
        if (value > 30) return 'negative';                  // Too hot
        break;
      case 'precipitation':
        if (value < 0.1) return 'positive';                 // Dry conditions preferred
        if (value > 0.3) return 'negative';                 // Too wet
        break;
      case 'cloudCover':
        return 'neutral';  // Not significant for aeration
    }
    return 'neutral';
  }

  /**
   * Determine impact factors for seeding treatments
   */
  private determineSeedingImpact(feature: string, value: number): 'positive' | 'negative' | 'neutral' {
    switch (feature) {
      case 'soilMoisture':
        if (value >= 50 && value <= 70) return 'positive';  // Moist soil ideal
        if (value < 40) return 'negative';                  // Too dry
        break;
      case 'temperature':
        if (value >= 18 && value <= 24) return 'positive';  // 65-75°F ideal
        if (value < 10 || value > 30) return 'negative';    // Too cold/hot
        break;
      case 'precipitation':
        if (value >= 0.1 && value <= 0.3) return 'positive'; // Light rain good
        if (value > 0.5) return 'negative';                  // Too heavy
        break;
      case 'windSpeed':
        if (value < 8) return 'positive';                    // Light wind okay
        if (value > 15) return 'negative';                   // Too windy
        break;
      case 'cloudCover':
        if (value >= 30 && value <= 70) return 'positive';   // Partial shade good
        break;
    }
    return 'neutral';
  }

  /**
   * Determine impact factors for weed control treatments
   */
  private determineWeedControlImpact(feature: string, value: number): 'positive' | 'negative' | 'neutral' {
    switch (feature) {
      case 'temperature':
        if (value >= 15 && value <= 28) return 'positive';  // 59-82°F ideal
        if (value > 32) return 'negative';                  // Too hot
        break;
      case 'precipitation':
        if (value < 0.1) return 'positive';                 // Dry conditions preferred
        if (value > 0.2) return 'negative';                 // Rain will wash away
        break;
      case 'windSpeed':
        if (value < 8) return 'positive';                   // Calm better for spraying
        if (value > 12) return 'negative';                  // Too windy for spraying
        break;
      case 'humidity':
        if (value >= 40 && value <= 70) return 'positive';  // Moderate humidity
        if (value > 80) return 'negative';                  // Too humid
        break;
      case 'cloudCover':
        if (value < 80) return 'positive';                  // Some sun helps absorption
        break;
    }
    return 'neutral';
  }

  /**
   * Determine general impact factors for unknown treatment types
   */
  private determineGeneralImpact(feature: string, value: number): 'positive' | 'negative' | 'neutral' {
    switch (feature) {
      case 'temperature':
        if (value >= 15 && value <= 28) return 'positive';  // Moderate temperature
        if (value < 5 || value > 32) return 'negative';     // Extreme temperature
        break;
      case 'precipitation':
        if (value >= 0.1 && value <= 0.3) return 'positive'; // Light rain
        if (value > 0.5) return 'negative';                  // Heavy rain
        break;
      case 'windSpeed':
        if (value < 15) return 'positive';                   // Light to moderate wind
        if (value > 20) return 'negative';                   // Strong wind
        break;
      case 'humidity':
        if (value >= 40 && value <= 70) return 'positive';   // Moderate humidity
        if (value > 85) return 'negative';                   // High humidity
        break;
      case 'soilMoisture':
        if (value >= 40 && value <= 60) return 'positive';   // Moderate soil moisture
        if (value < 20 || value > 80) return 'negative';     // Extreme soil moisture
        break;
    }
    return 'neutral';
  }

  /**
   * Analyze impact factors for prediction
   */
  private analyzeFactors(
    weatherData: Required<WeatherData>,
    treatmentType: TreatmentType
  ): Array<{
    name: string;
    weight: number;
    impact: 'positive' | 'negative' | 'neutral';
    confidence: number;
  }> {
    try {
      // First check for extreme conditions that affect all treatments
      const extremeFactors: Array<{
        name: string;
        weight: number;
        impact: 'positive' | 'negative' | 'neutral';
        confidence: number;
      }> = [];

      for (const [feature, weight] of Object.entries(this.config.featureWeights)) {
        if (isWeatherMetric(feature)) {
          const value = weatherData[feature];
          if (typeof value === 'number') {
            const extremeImpact = this.checkExtremeConditions(feature, value);
            
            if (extremeImpact === 'negative') {
              extremeFactors.push({
                name: feature,
                weight,
                impact: 'negative',
                confidence: this.calculateMetricConfidence(feature, value)
              });
            }
          }
        }
      }

      if (extremeFactors.length > 0) {
        return extremeFactors;
      }

      // If no extreme conditions, analyze treatment-specific impacts
      const factors: Array<{
        name: string;
        weight: number;
        impact: 'positive' | 'negative' | 'neutral';
        confidence: number;
      }> = [];

      for (const [feature, weight] of Object.entries(this.config.featureWeights)) {
        if (isWeatherMetric(feature)) {
          const value = weatherData[feature];
          if (typeof value === 'number') {
            let impact: 'positive' | 'negative' | 'neutral';

            switch (treatmentType) {
              case 'Fertilization':
                impact = this.determineFertilizationImpact(feature, value);
                break;
              case 'Aeration':
                impact = this.determineAerationImpact(feature, value);
                break;
              case 'Seeding':
                impact = this.determineSeedingImpact(feature, value);
                break;
              case 'WeedControl':
                impact = this.determineWeedControlImpact(feature, value);
                break;
              default:
                impact = this.determineGeneralImpact(feature, value);
            }
            
            factors.push({
              name: feature,
              weight,
              impact,
              confidence: this.calculateMetricConfidence(feature, value)
            });
          }
        }
      }

      // Sort by impact priority (negative first) then by weight
      return factors.sort((a, b) => {
        if (a.impact === 'negative' && b.impact !== 'negative') return -1;
        if (a.impact !== 'negative' && b.impact === 'negative') return 1;
        return b.weight - a.weight;
      });
    } catch (error) {
      console.error('Error analyzing factors:', error);
      return [];
    }
  }

  /**
   * Calculate confidence score for individual metrics
   */
  private calculateMetricConfidence(feature: string, value: number): number {
    try {
      // Base confidence starts high
      let confidence = 0.9;

      // Adjust confidence based on value ranges
      switch (feature) {
        case 'temperature':
          // Lower confidence for extreme temperatures
          if (value < 0 || value > 100) confidence *= 0.8;
          break;
        case 'humidity':
          // Lower confidence for very low humidity
          if (value < 20) confidence *= 0.85;
          break;
        case 'windSpeed':
          // Lower confidence for high wind speeds (more variable)
          if (value > 20) confidence *= 0.75;
          break;
        case 'precipitation':
          // Lower confidence for trace amounts
          if (value > 0 && value < 0.1) confidence *= 0.9;
          break;
        case 'soilMoisture':
          // Lower confidence for extreme values
          if (value < 10 || value > 90) confidence *= 0.85;
          break;
      }

      // Ensure minimum confidence threshold
      return Math.max(confidence, this.config.confidenceThreshold);
    } catch (error) {
      console.error('Error calculating metric confidence:', error);
      return this.config.confidenceThreshold;
    }
  }

  // Metric calculation helpers with error handling
  private calculateAccuracy(data: any[]): number {
    try {
      // Implement proper accuracy calculation
      const predictions = data.map(d => 
        this.calculateBaseScore(this.sanitizeWeatherData(d.weatherData as WeatherData))
      );
      const actuals = data.map(d => d.effectiveness);
      
      const correct = predictions.filter((p, i) => 
        Math.abs(p - actuals[i]) < 0.2
      ).length;
      
      return correct / predictions.length;
    } catch (error) {
      console.error('Error calculating accuracy:', error);
      return 0.7; // Conservative fallback
    }
  }

  private calculatePrecision(data: any[]): number {
    try {
      const predictions = data.map(d => 
        this.calculateBaseScore(this.sanitizeWeatherData(d.weatherData as WeatherData))
      );
      const actuals = data.map(d => d.effectiveness);
      
      let truePositives = 0;
      let falsePositives = 0;
      
      predictions.forEach((pred, i) => {
        if (pred >= 0.7) { // Threshold for "positive" prediction
          if (actuals[i] >= 0.7) truePositives++;
          else falsePositives++;
        }
      });
      
      return truePositives / (truePositives + falsePositives);
    } catch (error) {
      console.error('Error calculating precision:', error);
      return 0.7;
    }
  }

  private calculateRecall(data: any[]): number {
    try {
      const predictions = data.map(d => 
        this.calculateBaseScore(this.sanitizeWeatherData(d.weatherData as WeatherData))
      );
      const actuals = data.map(d => d.effectiveness);
      
      let truePositives = 0;
      let falseNegatives = 0;
      
      predictions.forEach((pred, i) => {
        if (actuals[i] >= 0.7) { // Actually positive
          if (pred >= 0.7) truePositives++;
          else falseNegatives++;
        }
      });
      
      return truePositives / (truePositives + falseNegatives);
    } catch (error) {
      console.error('Error calculating recall:', error);
      return 0.7;
    }
  }

  private calculateF1Score(data: any[]): number {
    try {
      const precision = this.calculatePrecision(data);
      const recall = this.calculateRecall(data);
      return 2 * (precision * recall) / (precision + recall);
    } catch (error) {
      console.error('Error calculating F1 score:', error);
      return 0.7;
    }
  }

  // Feature normalization helpers with validation
  private normalizeTemperature(value: number): number {
    // Normalize to 0-1 range assuming -50 to 150°F range
    return Math.max(0, Math.min(1, (value + 50) / 200));
  }

  private normalizePrecipitation(value: number): number {
    // Normalize to 0-1 range assuming 0-2 inches range
    return Math.max(0, Math.min(1, value / 2));
  }

  private normalizeWindSpeed(value: number): number {
    // Normalize to 0-1 range assuming 0-30 mph range
    return Math.max(0, Math.min(1, value / 30));
  }
}

// Export singleton instance
export const weatherMLService = new WeatherMLService();