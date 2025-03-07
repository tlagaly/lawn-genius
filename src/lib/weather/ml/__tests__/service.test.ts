import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient, Prisma } from '@prisma/client';

// Extend PrismaClient type to include our model
type PrismaClientWithWeatherTraining = PrismaClient & {
  weatherTrainingData: {
    create: (args: { data: any }) => Promise<any>;
    findMany: (args?: any) => Promise<any[]>;
  };
};

// Create a deep mock of PrismaClient with our extended type
const prismaMock = mockDeep<PrismaClientWithWeatherTraining>();

// Mock the prisma import
jest.mock('@/lib/db/prisma', () => ({
  prisma: prismaMock
}));

import { WeatherMLService } from '../service';
import { prisma } from '@/lib/db/prisma';
import { WeatherData, TreatmentType, EffectivenessRating } from '../../types';
import { TrainingData, PredictionResult, ModelMetrics } from '../types';

describe('WeatherMLService', () => {
  let service: WeatherMLService;
  
  // Sample weather data for testing
  const sampleWeatherData: WeatherData = {
    temperature: 22,
    humidity: 65,
    precipitation: 0,
    windSpeed: 8,
    conditions: 'Clear',
    uvIndex: 5,
    soilMoisture: 45,
    pressure: 1012,
    dewPoint: 12,
    visibility: 10
  };

  // Mock training data for all tests
  const mockTrainingData = Array.from({ length: 20 }, (_, i) => ({
    id: `test-${i}`,
    weatherData: sampleWeatherData as unknown as Prisma.JsonValue,
    treatmentType: 'Fertilization',
    effectiveness: 0.8,
    timestamp: new Date(),
    dataQuality: 0.9,
    confidence: 0.85,
    validationScore: null
  }));

  beforeEach(() => {
    mockReset(prismaMock);
    service = new WeatherMLService({
      minDataPoints: 10, // Lower threshold for testing
      confidenceThreshold: 0.6,
      trainingInterval: 24,
      featureWeights: {
        temperature: 1.0,
        humidity: 0.8,
        precipitation: 1.0,
        windSpeed: 0.6,
        soilMoisture: 0.9
      }
    });

    // Set up default training data mock for all tests
    prismaMock.weatherTrainingData.findMany.mockResolvedValue(mockTrainingData);
  });

  describe('Training Pipeline', () => {
    it('should add training data and trigger retraining', async () => {
      prismaMock.weatherTrainingData.create.mockResolvedValue(mockTrainingData[0]);

      await service.addTrainingData({
        weatherConditions: sampleWeatherData,
        treatmentType: 'Fertilization',
        effectiveness: 4
      });

      expect(prismaMock.weatherTrainingData.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          weatherData: sampleWeatherData,
          treatmentType: 'Fertilization',
          effectiveness: 4
        })
      });
    });

    it('should not train model with insufficient data', async () => {
      prismaMock.weatherTrainingData.findMany.mockResolvedValue([]);
      const metrics = await service.getModelMetrics();
      expect(metrics).toBeNull();
    });

    it('should update model metrics after training', async () => {
      await service.addTrainingData({
        weatherConditions: sampleWeatherData,
        treatmentType: 'Fertilization',
        effectiveness: 4
      });

      const metrics = await service.getModelMetrics();
      expect(metrics).toMatchObject({
        accuracy: expect.any(Number),
        precision: expect.any(Number),
        recall: expect.any(Number),
        f1Score: expect.any(Number),
        dataPoints: expect.any(Number)
      });
    });

    // New: Test data quality validation
    it('should handle corrupted training data', async () => {
      const corruptedData = mockTrainingData.map(data => ({
        ...data,
        weatherData: { temperature: 'invalid' } // Invalid type
      }));
      prismaMock.weatherTrainingData.findMany.mockResolvedValue(corruptedData);

      const metrics = await service.getModelMetrics();
      expect(metrics?.accuracy).toBeLessThan(0.5); // Expect poor accuracy with bad data
    });

    // New: Test boundary conditions for training data
    it('should handle minimum data point threshold exactly', async () => {
      const minData = Array(10).fill(mockTrainingData[0]); // Exactly minDataPoints
      prismaMock.weatherTrainingData.findMany.mockResolvedValue(minData);

      await service.addTrainingData({
        weatherConditions: sampleWeatherData,
        treatmentType: 'Fertilization',
        effectiveness: 4
      });

      const metrics = await service.getModelMetrics();
      expect(metrics).not.toBeNull();
    });
  });

  describe('Prediction System', () => {
    beforeEach(() => {
      // Ensure we have enough training data for predictions
      prismaMock.weatherTrainingData.findMany.mockResolvedValue(mockTrainingData);
    });

    it('should generate predictions with confidence scores', async () => {
      const prediction = await service.predictEffectiveness(
        sampleWeatherData,
        'Fertilization'
      );

      expect(prediction).toMatchObject({
        score: expect.any(Number),
        confidence: expect.any(Number),
        factors: expect.arrayContaining([
          expect.objectContaining({
            name: expect.any(String),
            weight: expect.any(Number),
            impact: expect.stringMatching(/positive|negative|neutral/)
          })
        ])
      });

      expect(prediction.score).toBeGreaterThanOrEqual(0);
      expect(prediction.score).toBeLessThanOrEqual(1);
      expect(prediction.confidence).toBeGreaterThanOrEqual(0.6); // Minimum threshold
    });

    it('should adjust confidence based on data completeness', async () => {
      const incompleteWeatherData: WeatherData = {
        temperature: 22,
        humidity: 65,
        precipitation: 0,
        windSpeed: 8,
        conditions: 'Clear',
        uvIndex: 5,
        soilMoisture: 45,
        pressure: 1012,
        dewPoint: 12,
        visibility: 10
      };

      delete (incompleteWeatherData as any).soilMoisture;
      delete (incompleteWeatherData as any).humidity;

      const prediction = await service.predictEffectiveness(
        incompleteWeatherData,
        'Fertilization'
      );

      expect(prediction.confidence).toBeLessThan(0.9); // Should be lower due to missing data
    });

    it('should provide relevant impact factors', async () => {
      const extremeWeatherData: WeatherData = {
        ...sampleWeatherData,
        temperature: 35, // High temperature
        windSpeed: 25,   // High wind
        soilMoisture: 20 // Low moisture
      };

      const prediction = await service.predictEffectiveness(
        extremeWeatherData,
        'Fertilization'
      );

      const hasNegativeImpacts = prediction.factors.some(f => f.impact === 'negative');
      expect(hasNegativeImpacts).toBe(true);
    });

    // New: Test extreme weather conditions
    it('should handle extreme weather values', async () => {
      const extremeWeatherData: WeatherData = {
        ...sampleWeatherData,
        temperature: 150, // Way too hot
        humidity: 120, // Impossible value
        windSpeed: -10, // Invalid negative
        precipitation: 100, // Extreme rain
        soilMoisture: 200 // Impossible value
      };

      const prediction = await service.predictEffectiveness(
        extremeWeatherData,
        'Fertilization'
      );

      expect(prediction.confidence).toBeLessThan(0.7); // Should have low confidence
      expect(prediction.factors.every(f => f.impact === 'negative')).toBe(true);
    });

    // New: Test invalid data handling
    it('should handle malformed weather data', async () => {
      const malformedData = {
        ...sampleWeatherData,
        temperature: 'invalid' as any,
        humidity: null as any,
        windSpeed: undefined as any
      };

      const prediction = await service.predictEffectiveness(
        malformedData,
        'Fertilization'
      );

      expect(prediction.confidence).toBeLessThan(0.5); // Very low confidence
      expect(prediction.factors.length).toBeLessThan(
        Object.keys(service['config'].featureWeights).length
      );
    });
  });

  describe('Load Testing', () => {
    beforeEach(() => {
      // Ensure we have enough training data for predictions
      prismaMock.weatherTrainingData.findMany.mockResolvedValue(mockTrainingData);
    });

    it('should handle concurrent prediction requests', async () => {
      const numRequests = 100;
      const requests = Array.from({ length: numRequests }, () =>
        service.predictEffectiveness(sampleWeatherData, 'Fertilization')
      );

      const results = await Promise.all(requests);
      expect(results).toHaveLength(numRequests);
      results.forEach(prediction => {
        expect(prediction).toMatchObject({
          score: expect.any(Number),
          confidence: expect.any(Number),
          factors: expect.any(Array)
        });
      });
    });

    it('should handle concurrent training data additions', async () => {
      const numRequests = 50;
      prismaMock.weatherTrainingData.create.mockResolvedValue(mockTrainingData[0]);
      
      const requests = Array.from({ length: numRequests }, () =>
        service.addTrainingData({
          weatherConditions: sampleWeatherData,
          treatmentType: 'Fertilization',
          effectiveness: 4
        })
      );

      await Promise.all(requests);
      expect(prismaMock.weatherTrainingData.create).toHaveBeenCalledTimes(numRequests);
    });

    // New: Test database error handling
    it('should handle database failures gracefully', async () => {
      prismaMock.weatherTrainingData.create.mockRejectedValue(new Error('DB Error'));
      prismaMock.weatherTrainingData.findMany.mockRejectedValue(new Error('DB Error'));

      await expect(service.addTrainingData({
        weatherConditions: sampleWeatherData,
        treatmentType: 'Fertilization',
        effectiveness: 4
      })).rejects.toThrow('DB Error');

      const prediction = await service.predictEffectiveness(
        sampleWeatherData,
        'Fertilization'
      );

      // Should still give prediction with lower confidence
      expect(prediction.confidence).toBeLessThan(0.7);
    });
  });

  describe('Model Metrics', () => {
    beforeEach(() => {
      prismaMock.weatherTrainingData.findMany.mockResolvedValue(mockTrainingData);
    });

    it('should calculate accurate model metrics', async () => {
      await service.addTrainingData({
        weatherConditions: sampleWeatherData,
        treatmentType: 'Fertilization',
        effectiveness: 4
      });

      const metrics = await service.getModelMetrics();
      expect(metrics).toBeTruthy();
      expect(metrics?.accuracy).toBeGreaterThan(0.7);
      expect(metrics?.precision).toBeGreaterThan(0.7);
      expect(metrics?.recall).toBeGreaterThan(0.7);
      expect(metrics?.f1Score).toBeGreaterThan(0.7);
    });

    // New: Test metric boundary conditions
    it('should handle perfect and worst-case metrics', async () => {
      // Perfect case
      const perfectData = mockTrainingData.map(data => ({
        ...data,
        effectiveness: 5,
        dataQuality: 1.0,
        confidence: 1.0
      }));
      prismaMock.weatherTrainingData.findMany.mockResolvedValue(perfectData);
      
      await service.addTrainingData({
        weatherConditions: sampleWeatherData,
        treatmentType: 'Fertilization',
        effectiveness: 5
      });

      let metrics = await service.getModelMetrics();
      expect(metrics?.accuracy).toBeGreaterThan(0.95);

      // Worst case
      const worstData = mockTrainingData.map(data => ({
        ...data,
        effectiveness: 1,
        dataQuality: 0.7,
        confidence: 0.6
      }));
      prismaMock.weatherTrainingData.findMany.mockResolvedValue(worstData);

      metrics = await service.getModelMetrics();
      expect(metrics?.accuracy).toBeLessThan(0.8);
    });
  });

  // New: Integration Testing
  describe('Integration Tests', () => {
    it('should integrate with treatment scheduling', async () => {
      const prediction = await service.predictEffectiveness(
        sampleWeatherData,
        'Fertilization'
      );

      // Verify prediction meets scheduling requirements
      expect(prediction).toMatchObject({
        score: expect.any(Number),
        confidence: expect.any(Number),
        factors: expect.arrayContaining([
          expect.objectContaining({
            name: expect.any(String),
            weight: expect.any(Number),
            impact: expect.stringMatching(/positive|negative|neutral/)
          })
        ])
      });

      // Verify confidence threshold for scheduling
      expect(prediction.confidence).toBeGreaterThanOrEqual(0.6);
    });

    it('should validate ML feedback loop', async () => {
      // Initial prediction
      const prediction = await service.predictEffectiveness(
        sampleWeatherData,
        'Fertilization'
      );

      // Feed result back as training data
      await service.addTrainingData({
        weatherConditions: sampleWeatherData,
        treatmentType: 'Fertilization',
        effectiveness: 4
      });

      // New prediction should be influenced by feedback
      const newPrediction = await service.predictEffectiveness(
        sampleWeatherData,
        'Fertilization'
      );

      expect(newPrediction.confidence).toBeGreaterThanOrEqual(prediction.confidence);
    });

    it('should persist and recover from data corruption', async () => {
      // Simulate corrupted data
      const corruptedData = {
        ...sampleWeatherData,
        temperature: null as any,
        humidity: undefined as any
      };

      // System should still generate prediction
      const prediction = await service.predictEffectiveness(
        corruptedData,
        'Fertilization'
      );

      expect(prediction).toBeTruthy();
      expect(prediction.confidence).toBeLessThan(0.8); // Lower confidence due to corruption

      // System should recover with good data
      const recoveryPrediction = await service.predictEffectiveness(
        sampleWeatherData,
        'Fertilization'
      );

      expect(recoveryPrediction.confidence).toBeGreaterThan(prediction.confidence);
    });
  });
});