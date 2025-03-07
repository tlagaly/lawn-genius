import { TREATMENT_CONDITIONS, TreatmentConditions, WeatherData } from '@/lib/weather/types';

describe('Treatment Conditions', () => {
  describe('Fertilization Conditions', () => {
    const fertilizationConditions = TREATMENT_CONDITIONS['Fertilization'];

    it('should have valid temperature thresholds', () => {
      expect(fertilizationConditions.minTemp).toBe(10);
      expect(fertilizationConditions.maxTemp).toBe(29);
    });

    it('should have valid wind speed threshold', () => {
      expect(fertilizationConditions.maxWindSpeed).toBe(15);
    });

    it('should have valid precipitation threshold', () => {
      expect(fertilizationConditions.maxPrecipitation).toBe(5);
    });

    it('should include appropriate ideal conditions', () => {
      expect(fertilizationConditions.idealConditions).toContain('Clear');
      expect(fertilizationConditions.idealConditions).toContain('Partly cloudy');
    });
  });

  describe('Weed Control Conditions', () => {
    const weedControlConditions = TREATMENT_CONDITIONS['Weed Control'];

    it('should have stricter wind requirements than fertilization', () => {
      expect(weedControlConditions.maxWindSpeed).toBeLessThan(
        TREATMENT_CONDITIONS['Fertilization'].maxWindSpeed
      );
    });

    it('should not allow any precipitation', () => {
      expect(weedControlConditions.maxPrecipitation).toBe(0);
    });
  });

  describe('Mowing Conditions', () => {
    const mowingConditions = TREATMENT_CONDITIONS['Mowing'];

    it('should have the widest temperature range', () => {
      const tempRanges = Object.values(TREATMENT_CONDITIONS).map(
        (condition) => condition.maxTemp - condition.minTemp
      );
      const mowingTempRange = mowingConditions.maxTemp - mowingConditions.minTemp;
      expect(Math.max(...tempRanges)).toBe(mowingTempRange);
    });

    it('should allow more wind than other treatments', () => {
      const windSpeeds = Object.values(TREATMENT_CONDITIONS).map(
        (condition) => condition.maxWindSpeed
      );
      expect(Math.max(...windSpeeds)).toBe(mowingConditions.maxWindSpeed);
    });

    it('should not allow precipitation', () => {
      expect(mowingConditions.maxPrecipitation).toBe(0);
    });
  });

  describe('Seeding Conditions', () => {
    const seedingConditions = TREATMENT_CONDITIONS['Seeding'];

    it('should prefer cloudy conditions', () => {
      expect(seedingConditions.idealConditions).toContain('Partly cloudy');
      expect(seedingConditions.idealConditions).toContain('Cloudy');
      expect(seedingConditions.idealConditions).not.toContain('Clear');
    });

    it('should allow some precipitation', () => {
      expect(seedingConditions.maxPrecipitation).toBeGreaterThan(0);
      expect(seedingConditions.maxPrecipitation).toBeLessThan(
        TREATMENT_CONDITIONS['Fertilization'].maxPrecipitation
      );
    });
  });

  describe('Treatment Conditions Validation', () => {
    const mockWeatherData: WeatherData = {
      temperature: 20,
      humidity: 50,
      precipitation: 0,
      windSpeed: 10,
      conditions: 'Clear',
    };

    it('should validate all required fields are present', () => {
      Object.values(TREATMENT_CONDITIONS).forEach((condition: TreatmentConditions) => {
        expect(condition).toHaveProperty('minTemp');
        expect(condition).toHaveProperty('maxTemp');
        expect(condition).toHaveProperty('maxWindSpeed');
        expect(condition).toHaveProperty('maxPrecipitation');
        expect(condition).toHaveProperty('idealConditions');
      });
    });

    it('should have consistent temperature ranges', () => {
      Object.values(TREATMENT_CONDITIONS).forEach((condition: TreatmentConditions) => {
        expect(condition.maxTemp).toBeGreaterThan(condition.minTemp);
      });
    });

    it('should have non-negative thresholds', () => {
      Object.values(TREATMENT_CONDITIONS).forEach((condition: TreatmentConditions) => {
        expect(condition.maxWindSpeed).toBeGreaterThanOrEqual(0);
        expect(condition.maxPrecipitation).toBeGreaterThanOrEqual(0);
      });
    });

    it('should have valid ideal conditions', () => {
      const validConditions = ['Clear', 'Partly cloudy', 'Cloudy'];
      Object.values(TREATMENT_CONDITIONS).forEach((condition: TreatmentConditions) => {
        condition.idealConditions.forEach((idealCondition) => {
          expect(validConditions).toContain(idealCondition);
        });
      });
    });
  });
});