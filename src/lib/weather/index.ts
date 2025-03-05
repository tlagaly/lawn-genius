import {
  WeatherData,
  WeatherForecast,
  Location,
  TreatmentConditions,
  TREATMENT_CONDITIONS,
  WeatherServiceError,
  WeatherAlert,
  WeatherMonitorConfig,
  RescheduleOption
} from './types';

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

if (!OPENWEATHER_API_KEY) {
  throw new Error('OpenWeather API key is not configured');
}

export class WeatherService {
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map();
  private readonly defaultConfig: WeatherMonitorConfig = {
    checkInterval: 30, // Check every 30 minutes
    alertThreshold: 3, // Alert when weather score drops below 3
    forecastHours: 24 // Look ahead 24 hours
  };

  private async fetchFromAPI(endpoint: string, params: Record<string, string>): Promise<any> {
    const queryParams = new URLSearchParams(
      Object.entries({
        ...params,
        appid: OPENWEATHER_API_KEY!,
        units: 'metric'
      })
    );

    const response = await fetch(`${BASE_URL}${endpoint}?${queryParams}`);
    
    if (!response.ok) {
      throw {
        code: 'WEATHER_API_ERROR',
        message: `OpenWeather API error: ${response.statusText}`
      } as WeatherServiceError;
    }

    return response.json();
  }

  async getCurrentWeather(location: Location): Promise<WeatherData> {
    try {
      const data = await this.fetchFromAPI('/weather', {
        lat: location.latitude.toString(),
        lon: location.longitude.toString()
      });

      return {
        temperature: data.main.temp,
        humidity: data.main.humidity,
        precipitation: data.rain?.['1h'] || 0,
        windSpeed: data.wind.speed,
        conditions: data.weather[0].main
      };
    } catch (error) {
      console.error('Error fetching current weather:', error);
      throw error;
    }
  }

  async getForecast(location: Location, days: number = 5): Promise<WeatherForecast[]> {
    try {
      const data = await this.fetchFromAPI('/forecast', {
        lat: location.latitude.toString(),
        lon: location.longitude.toString()
      });

      return data.list
        .slice(0, days * 8) // OpenWeather returns 3-hour forecasts
        .map((item: any) => ({
          date: new Date(item.dt * 1000),
          temperature: item.main.temp,
          humidity: item.main.humidity,
          precipitation: item.rain?.['3h'] || 0,
          windSpeed: item.wind.speed,
          conditions: item.weather[0].main,
          probability: item.pop * 100 // Convert to percentage
        }));
    } catch (error) {
      console.error('Error fetching forecast:', error);
      throw error;
    }
  }

  calculateWeatherScore(weather: WeatherData, treatmentType: string): number {
    const conditions = TREATMENT_CONDITIONS[treatmentType];
    if (!conditions) {
      throw new Error(`Unknown treatment type: ${treatmentType}`);
    }

    let score = 5; // Start with perfect score

    // Temperature check
    if (weather.temperature < conditions.minTemp || weather.temperature > conditions.maxTemp) {
      score -= 2;
    } else if (weather.temperature < conditions.minTemp + 2 || weather.temperature > conditions.maxTemp - 2) {
      score -= 1;
    }

    // Wind check
    if (weather.windSpeed > conditions.maxWindSpeed) {
      score -= 2;
    } else if (weather.windSpeed > conditions.maxWindSpeed - 5) {
      score -= 1;
    }

    // Precipitation check
    if (weather.precipitation > conditions.maxPrecipitation) {
      score -= 2;
    } else if (weather.precipitation > 0) {
      score -= 1;
    }

    // Conditions check
    if (!conditions.idealConditions.includes(weather.conditions)) {
      score -= 1;
    }

    return Math.max(1, score); // Ensure score is at least 1
  }

  async findOptimalTreatmentTime(
    location: Location,
    treatmentType: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ date: Date; score: number }> {
    const forecast = await this.getForecast(location);
    let bestTime = { date: startDate, score: 0 };

    for (const period of forecast) {
      if (period.date < startDate || period.date > endDate) continue;

      const score = this.calculateWeatherScore(period, treatmentType);
      if (score > bestTime.score) {
        bestTime = { date: period.date, score };
      }
    }

    return bestTime;
  }

  getTreatmentRecommendations(weather: WeatherData, treatmentType: string): string[] {
    const conditions = TREATMENT_CONDITIONS[treatmentType];
    const recommendations: string[] = [];

    if (weather.temperature < conditions.minTemp) {
      recommendations.push(`Temperature is too low for ${treatmentType}. Wait for warmer conditions.`);
    } else if (weather.temperature > conditions.maxTemp) {
      recommendations.push(`Temperature is too high for ${treatmentType}. Consider early morning or evening application.`);
    }

    if (weather.windSpeed > conditions.maxWindSpeed) {
      recommendations.push(`Wind speed is too high for safe ${treatmentType}. Wait for calmer conditions.`);
    }

    if (weather.precipitation > conditions.maxPrecipitation) {
      recommendations.push(`Precipitation levels are too high for effective ${treatmentType}. Wait for drier conditions.`);
    }

    if (!conditions.idealConditions.includes(weather.conditions)) {
      recommendations.push(`Current weather conditions are not ideal for ${treatmentType}. Consider rescheduling.`);
    }

    if (recommendations.length === 0) {
      recommendations.push(`Weather conditions are suitable for ${treatmentType}.`);
    }

    return recommendations;
  }

  async analyzeTreatmentEffectiveness(
    treatmentType: string,
    weatherData: WeatherData,
    effectiveness: number
  ): Promise<string[]> {
    const score = this.calculateWeatherScore(weatherData, treatmentType);
    const insights: string[] = [];

    if (effectiveness < 3 && score >= 4) {
      insights.push('Treatment was less effective despite good weather conditions. Consider reviewing application method or product selection.');
    } else if (effectiveness >= 4 && score <= 2) {
      insights.push('Treatment was effective despite suboptimal weather conditions. Note successful adaptation to weather challenges.');
    } else if (effectiveness < 3 && score <= 2) {
      insights.push('Low effectiveness likely due to poor weather conditions. Consider rescheduling future treatments for better conditions.');
    } else if (effectiveness >= 4 && score >= 4) {
      insights.push('Optimal weather conditions contributed to treatment effectiveness. Continue scheduling during similar conditions.');
    }

    return insights;
  }

  async startMonitoring(
    treatmentId: string,
    treatmentType: string,
    location: Location,
    scheduledDate: Date,
    config: Partial<WeatherMonitorConfig> = {}
  ): Promise<void> {
    // Merge with default config
    const monitorConfig = { ...this.defaultConfig, ...config };
    
    // Clear any existing monitoring for this treatment
    this.stopMonitoring(treatmentId);

    // Start periodic monitoring
    const interval = setInterval(async () => {
      try {
        const alerts = await this.checkWeatherConditions(
          treatmentId,
          treatmentType,
          location,
          scheduledDate,
          monitorConfig
        );

        if (alerts.length > 0) {
          // Emit alerts (to be handled by the notification system)
          console.log('Weather alerts detected:', alerts);
          // TODO: Integrate with notification system
        }
      } catch (error) {
        console.error('Error in weather monitoring:', error);
      }
    }, monitorConfig.checkInterval * 60 * 1000);

    this.monitoringIntervals.set(treatmentId, interval);
  }

  stopMonitoring(treatmentId: string): void {
    const interval = this.monitoringIntervals.get(treatmentId);
    if (interval) {
      clearInterval(interval);
      this.monitoringIntervals.delete(treatmentId);
    }
  }

  private async checkWeatherConditions(
    treatmentId: string,
    treatmentType: string,
    location: Location,
    scheduledDate: Date,
    config: WeatherMonitorConfig
  ): Promise<WeatherAlert[]> {
    const alerts: WeatherAlert[] = [];
    const forecast = await this.getForecast(location);
    const relevantForecasts = forecast.filter(f =>
      f.date >= new Date() &&
      f.date <= new Date(Date.now() + config.forecastHours * 60 * 60 * 1000)
    );

    for (const period of relevantForecasts) {
      const score = this.calculateWeatherScore(period, treatmentType);
      if (score <= config.alertThreshold) {
        const conditions = TREATMENT_CONDITIONS[treatmentType];
        
        // Generate specific alerts based on condition violations
        if (period.temperature < conditions.minTemp || period.temperature > conditions.maxTemp) {
          alerts.push(this.createAlert(treatmentId, treatmentType, 'temperature', period, location, scheduledDate));
        }
        if (period.windSpeed > conditions.maxWindSpeed) {
          alerts.push(this.createAlert(treatmentId, treatmentType, 'wind', period, location, scheduledDate));
        }
        if (period.precipitation > conditions.maxPrecipitation) {
          alerts.push(this.createAlert(treatmentId, treatmentType, 'precipitation', period, location, scheduledDate));
        }
        if (!conditions.idealConditions.includes(period.conditions)) {
          alerts.push(this.createAlert(treatmentId, treatmentType, 'conditions', period, location, scheduledDate));
        }
      }
    }

    return alerts;
  }

  private createAlert(
    treatmentId: string,
    treatmentType: string,
    type: WeatherAlert['type'],
    forecast: WeatherForecast,
    location: Location,
    originalDate: Date
  ): WeatherAlert {
    const severity = this.calculateAlertSeverity(type, forecast);
    const message = this.generateAlertMessage(type, forecast);
    
    return {
      id: `${treatmentId}-${type}-${Date.now()}`,
      treatmentId,
      treatmentType,
      type,
      severity,
      message,
      suggestedDate: undefined, // Will be set by rescheduling logic
      createdAt: new Date(),
      location,
      originalDate
    };
  }

  private calculateAlertSeverity(
    type: WeatherAlert['type'],
    forecast: WeatherForecast
  ): WeatherAlert['severity'] {
    // Determine severity based on how far conditions are from ideal
    switch (type) {
      case 'temperature':
        return Math.abs(forecast.temperature - 20) > 10 ? 'critical' : 'warning';
      case 'wind':
        return forecast.windSpeed > 20 ? 'critical' : 'warning';
      case 'precipitation':
        return forecast.precipitation > 10 ? 'critical' : 'warning';
      case 'conditions':
        return forecast.conditions === 'Storm' ? 'critical' : 'warning';
      default:
        return 'warning';
    }
  }

  private generateAlertMessage(
    type: WeatherAlert['type'],
    forecast: WeatherForecast
  ): string {
    const date = forecast.date.toLocaleDateString();
    switch (type) {
      case 'temperature':
        return `Unfavorable temperature (${forecast.temperature}°C) expected on ${date}`;
      case 'wind':
        return `High wind speeds (${forecast.windSpeed} km/h) expected on ${date}`;
      case 'precipitation':
        return `Precipitation (${forecast.precipitation}mm) expected on ${date}`;
      case 'conditions':
        return `Unfavorable weather conditions (${forecast.conditions}) expected on ${date}`;
      default:
        return `Weather alert for ${date}`;
    }
  }

  async findRescheduleOptions(
    treatmentId: string,
    treatmentType: string,
    location: Location,
    originalDate: Date,
    daysToCheck: number = 7
  ): Promise<RescheduleOption[]> {
    const forecast = await this.getForecast(location, daysToCheck);
    const options: RescheduleOption[] = [];

    for (const period of forecast) {
      const score = this.calculateWeatherScore(period, treatmentType);
      if (score >= 4) { // Only suggest dates with good weather scores
        options.push({
          date: period.date,
          score,
          conditions: period
        });
      }
    }

    // Sort by score (descending) and date (ascending)
    return options.sort((a, b) =>
      b.score - a.score || a.date.getTime() - b.date.getTime()
    );
  }
}

// Export singleton instance
export const weatherService = new WeatherService();