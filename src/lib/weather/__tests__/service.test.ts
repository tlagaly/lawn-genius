import { WeatherMLService } from '../ml/service';
import { WeatherData, TreatmentType } from '../types';
import { describe, expect, it, beforeEach } from '@jest/globals';

describe('WeatherMLService', () => {
  let service: WeatherMLService;

  beforeEach(() => {
    service = new WeatherMLService();
  });

  describe('Weather Data Validation', () => {
    it('should validate correct weather data', () => {
      const data: WeatherData = {
        temperature: 20,
        humidity: 60,
        precipitation: 0.1,
        windSpeed: 10,
        conditions: 'Clear',
        soilMoisture: 50
      };

      const result = (service as any).validateWeatherData(data);
      expect(result).toBe(true);
    });

    it('should reject invalid weather data', () => {
      const data = {
        temperature: 200, // Too high
        humidity: -10,   // Invalid
        precipitation: 0.1,
        windSpeed: 10,
        conditions: 'Clear'
      };

      const result = (service as any).validateWeatherData(data as WeatherData);
      expect(result).toBe(false);
    });

    it('should handle missing required fields', () => {
      const data = {
        temperature: 20,
        humidity: 60,
        conditions: 'Clear'
      };

      const result = (service as any).validateWeatherData(data as WeatherData);
      expect(result).toBe(false);
    });
  });

  describe('Impact Factor Analysis', () => {
    const baseWeather: WeatherData = {
      temperature: 20,
      humidity: 60,
      precipitation: 0.1,
      windSpeed: 8,
      conditions: 'Clear',
      soilMoisture: 50
    };

    it('should provide relevant impact factors for fertilization', async () => {
      const prediction = await service.predictEffectiveness(baseWeather, 'Fertilization');
      
      expect(prediction.factors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'temperature',
            impact: 'positive'
          }),
          expect.objectContaining({
            name: 'soilMoisture',
            impact: 'positive'
          })
        ])
      );
    });

    it('should identify negative impacts for extreme conditions', async () => {
      const extremeWeather: WeatherData = {
        ...baseWeather,
        temperature: 35,  // Too hot
        windSpeed: 30,    // Too windy
        humidity: 90      // Too humid
      };

      const prediction = await service.predictEffectiveness(extremeWeather, 'Fertilization');
      
      // Should have negative impacts at the start of factors array
      expect(prediction.factors[0]).toEqual(
        expect.objectContaining({
          impact: 'negative'
        })
      );

      // Should have lower confidence
      expect(prediction.confidence).toBeLessThan(0.8);
    });

    it('should handle different treatment types appropriately', async () => {
      const weather: WeatherData = {
        ...baseWeather,
        soilMoisture: 45,  // Good for aeration
        temperature: 15    // Good for aeration
      };

      const aerationPrediction = await service.predictEffectiveness(weather, 'Aeration');
      expect(aerationPrediction.factors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'soilMoisture',
            impact: 'positive'
          })
        ])
      );

      // Change to conditions unfavorable for aeration
      const wetWeather: WeatherData = {
        ...weather,
        soilMoisture: 80,  // Too wet
        precipitation: 0.5  // Active rain
      };

      const wetPrediction = await service.predictEffectiveness(wetWeather, 'Aeration');
      expect(wetPrediction.factors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'soilMoisture',
            impact: 'negative'
          })
        ])
      );
    });

    it('should calculate appropriate confidence scores', async () => {
      const prediction = await service.predictEffectiveness(baseWeather, 'Fertilization');
      expect(prediction.confidence).toBeGreaterThan(0.7);

      // Test with missing optional data
      const limitedWeather: WeatherData = {
        temperature: 20,
        humidity: 60,
        precipitation: 0.1,
        windSpeed: 8,
        conditions: 'Clear'
      };

      const limitedPrediction = await service.predictEffectiveness(limitedWeather, 'Fertilization');
      expect(limitedPrediction.confidence).toBeLessThan(prediction.confidence);
    });
  });

  describe('Data Quality Scoring', () => {
    it('should calculate quality scores correctly', () => {
      const perfectData: WeatherData = {
        temperature: 20,
        humidity: 60,
        precipitation: 0.1,
        windSpeed: 8,
        conditions: 'Clear',
        soilMoisture: 50,
        uvIndex: 5,
        pressure: 1013,
        dewPoint: 15,
        visibility: 10
      };

      const quality = (service as any).calculateDataQuality(perfectData);
      expect(quality).toBeGreaterThan(0.9);

      // Test with extreme values
      const extremeData: WeatherData = {
        ...perfectData,
        temperature: -10,
        windSpeed: 35
      };

      const extremeQuality = (service as any).calculateDataQuality(extremeData);
      expect(extremeQuality).toBeLessThan(quality);
    });

    it('should handle missing optional metrics gracefully', () => {
      const minimalData: WeatherData = {
        temperature: 20,
        humidity: 60,
        precipitation: 0.1,
        windSpeed: 8,
        conditions: 'Clear'
      };

      const quality = (service as any).calculateDataQuality(minimalData);
      expect(quality).toBeGreaterThanOrEqual(0.5); // Minimum threshold
      expect(quality).toBeLessThan(0.9); // But not too high
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined optional fields', async () => {
      const minimalWeather: WeatherData = {
        temperature: 20,
        humidity: 60,
        precipitation: 0.1,
        windSpeed: 8,
        conditions: 'Clear'
      };

      const prediction = await service.predictEffectiveness(minimalWeather, 'Fertilization');
      expect(prediction.factors).toBeDefined();
      expect(prediction.confidence).toBeGreaterThan(0.5);
    });

    it('should handle boundary conditions', async () => {
      const boundaryWeather: WeatherData = {
        temperature: 0,    // At lower boundary
        humidity: 100,     // At upper boundary
        precipitation: 0,  // At lower boundary
        windSpeed: 0,     // At lower boundary
        conditions: 'Clear',
        soilMoisture: 100 // At upper boundary
      };

      const prediction = await service.predictEffectiveness(boundaryWeather, 'Fertilization');
      expect(prediction.factors.some(f => f.impact === 'negative')).toBe(true);
    });

    it('should recover gracefully from errors', async () => {
      const invalidWeather = {
        temperature: 'invalid',
        humidity: null,
        precipitation: undefined,
        windSpeed: NaN,
        conditions: 123
      } as unknown as WeatherData;

      const prediction = await service.predictEffectiveness(invalidWeather, 'Fertilization');
      expect(prediction).toEqual(expect.objectContaining({
        score: 0.5,
        confidence: expect.any(Number),
        factors: expect.any(Array)
      }));
    });
  });
});