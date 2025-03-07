import { WeatherMonitorConfig } from '@/lib/weather/types';
import { validateConfig, createDefaultConfig } from '@/lib/weather';

describe('Weather Monitor Configuration', () => {
  const validConfig: WeatherMonitorConfig = {
    checkInterval: 30, // 30 minutes
    alertThreshold: 3, // Alert when weather score is below 3
    forecastHours: 48, // Look ahead 48 hours
  };

  describe('validateConfig', () => {
    it('accepts valid configuration', () => {
      expect(() => validateConfig(validConfig)).not.toThrow();
    });

    it('requires positive check interval', () => {
      const invalidConfig = {
        ...validConfig,
        checkInterval: -30,
      };
      expect(() => validateConfig(invalidConfig)).toThrow('Check interval must be positive');
    });

    it('requires reasonable check interval', () => {
      const tooFrequentConfig = {
        ...validConfig,
        checkInterval: 1, // 1 minute is too frequent
      };
      expect(() => validateConfig(tooFrequentConfig)).toThrow('Check interval must be at least 15 minutes');

      const tooInfrequentConfig = {
        ...validConfig,
        checkInterval: 24 * 60, // 24 hours is too infrequent
      };
      expect(() => validateConfig(tooInfrequentConfig)).toThrow('Check interval must not exceed 6 hours');
    });

    it('validates alert threshold range', () => {
      const lowThresholdConfig = {
        ...validConfig,
        alertThreshold: 0,
      };
      expect(() => validateConfig(lowThresholdConfig)).toThrow('Alert threshold must be between 1 and 5');

      const highThresholdConfig = {
        ...validConfig,
        alertThreshold: 6,
      };
      expect(() => validateConfig(highThresholdConfig)).toThrow('Alert threshold must be between 1 and 5');
    });

    it('validates forecast hours range', () => {
      const shortForecastConfig = {
        ...validConfig,
        forecastHours: 1,
      };
      expect(() => validateConfig(shortForecastConfig)).toThrow('Forecast hours must be at least 24');

      const longForecastConfig = {
        ...validConfig,
        forecastHours: 169, // 7 days + 1 hour
      };
      expect(() => validateConfig(longForecastConfig)).toThrow('Forecast hours must not exceed 168');
    });
  });

  describe('createDefaultConfig', () => {
    it('creates valid default configuration', () => {
      const defaultConfig = createDefaultConfig();
      expect(() => validateConfig(defaultConfig)).not.toThrow();
    });

    it('sets reasonable default values', () => {
      const defaultConfig = createDefaultConfig();
      
      // Check interval should be reasonable
      expect(defaultConfig.checkInterval).toBeGreaterThanOrEqual(15);
      expect(defaultConfig.checkInterval).toBeLessThanOrEqual(360);

      // Alert threshold should be in valid range
      expect(defaultConfig.alertThreshold).toBeGreaterThanOrEqual(1);
      expect(defaultConfig.alertThreshold).toBeLessThanOrEqual(5);

      // Forecast hours should be reasonable
      expect(defaultConfig.forecastHours).toBeGreaterThanOrEqual(24);
      expect(defaultConfig.forecastHours).toBeLessThanOrEqual(168);
    });

    it('allows overriding specific values', () => {
      const customConfig = createDefaultConfig({
        checkInterval: 45,
      });

      expect(customConfig.checkInterval).toBe(45);
      // Other values should be default
      expect(customConfig.alertThreshold).toBe(3);
      expect(customConfig.forecastHours).toBe(48);
    });

    it('validates overridden values', () => {
      expect(() => 
        createDefaultConfig({
          checkInterval: -1,
        })
      ).toThrow('Check interval must be positive');
    });
  });

  describe('configuration use cases', () => {
    it('supports frequent monitoring for critical treatments', () => {
      const criticalConfig = createDefaultConfig({
        checkInterval: 15,
        alertThreshold: 4,
        forecastHours: 24,
      });
      expect(() => validateConfig(criticalConfig)).not.toThrow();
    });

    it('supports extended forecasting for long-term planning', () => {
      const planningConfig = createDefaultConfig({
        checkInterval: 360,
        alertThreshold: 2,
        forecastHours: 168,
      });
      expect(() => validateConfig(planningConfig)).not.toThrow();
    });

    it('supports balanced monitoring for typical use', () => {
      const typicalConfig = createDefaultConfig({
        checkInterval: 30,
        alertThreshold: 3,
        forecastHours: 72,
      });
      expect(() => validateConfig(typicalConfig)).not.toThrow();
    });
  });
});