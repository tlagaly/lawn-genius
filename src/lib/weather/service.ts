import {
  WeatherAlert,
  WeatherData,
  Location,
  WeatherMonitorConfig,
  TreatmentConditions,
  WeatherRecommendation,
  TreatmentEffectiveness,
  RescheduleOption,
  WeatherForecast,
  EffectivenessRating,
  AlertBatch,
  TREATMENT_CONDITIONS
} from './types';
import { validateConfig, DEFAULT_CONFIG } from './config';
import { randomUUID } from 'crypto';

export class WeatherService {
  private config: WeatherMonitorConfig;
  private activeMonitoring: Set<string> = new Set();
  private currentBatch: AlertBatch | null = null;
  private batchTimeout: NodeJS.Timeout | null = null;

  constructor(config: Partial<WeatherMonitorConfig> = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };
    validateConfig(this.config);
  }

  private initializeBatch(): AlertBatch {
    return {
      id: randomUUID(),
      alerts: [],
      createdAt: new Date(),
      priority: 0,
      treatmentIds: []
    };
  }

  private async processBatch(batch: AlertBatch): Promise<void> {
    if (!batch.alerts.length) return;

    // Sort alerts by priority
    batch.alerts.sort((a, b) => b.priority - a.priority);
    
    // Update batch metadata
    batch.priority = Math.max(...batch.alerts.map(a => a.priority));
    batch.processedAt = new Date();

    // Group alerts by treatment for better context
    const groupedAlerts = new Map<string, WeatherAlert[]>();
    for (const alert of batch.alerts) {
      const existing = groupedAlerts.get(alert.treatmentId) || [];
      groupedAlerts.set(alert.treatmentId, [...existing, alert]);
    }

    // Process each group
    for (const [treatmentId, alerts] of groupedAlerts) {
      await this.sendBatchedAlerts(treatmentId, alerts);
    }

    // Clear the batch
    this.currentBatch = null;
  }

  private async sendBatchedAlerts(treatmentId: string, alerts: WeatherAlert[]): Promise<void> {
    try {
      // Get treatment details including user ID
      const treatment = await prisma.treatment.findUnique({
        where: { id: treatmentId },
        select: { userId: true }
      });

      if (!treatment) {
        throw new Error(`Treatment not found: ${treatmentId}`);
      }

      // Store alerts in database
      const storedAlerts = await Promise.all(
        alerts.map(alert =>
          prisma.weatherAlert.create({
            data: {
              id: alert.id,
              treatmentId: alert.treatmentId,
              type: alert.type,
              severity: alert.severity,
              message: alert.message,
              priority: alert.priority,
              location: alert.location,
              originalDate: alert.originalDate,
              metrics: alert.metrics,
              createdAt: alert.createdAt
            }
          })
        )
      );

      // Send notifications for each alert
      await Promise.all(
        storedAlerts.map(alert =>
          NotificationService.sendNotification(treatment.userId, alert)
        )
      );

    } catch (error) {
      console.error('Error sending batched alerts:', error);
      throw error;
    }
  }

  private scheduleBatchProcessing(): void {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    this.batchTimeout = setTimeout(
      async () => {
        if (this.currentBatch) {
          await this.processBatch(this.currentBatch);
        }
        this.batchTimeout = null;
      },
      this.config.batchWindow * 60 * 1000 // Convert minutes to milliseconds
    );
  }

  private async addToBatch(alert: WeatherAlert): Promise<void> {
    if (!this.currentBatch) {
      this.currentBatch = this.initializeBatch();
      this.scheduleBatchProcessing();
    }

    // Add alert to batch if it meets priority threshold
    if (alert.priority >= this.config.minAlertPriority) {
      this.currentBatch.alerts.push(alert);
      this.currentBatch.treatmentIds.push(alert.treatmentId);

      // Process immediately if batch is full
      if (this.currentBatch.alerts.length >= this.config.maxAlertsPerBatch) {
        await this.processBatch(this.currentBatch);
      }
    }
  }

  async getCurrentWeather(location: Location): Promise<WeatherData> {
    try {
      const data = await fetchWeatherData(location);
      return {
        ...data,
        uvIndex: 0, // Will be added in future API integration
        soilMoisture: 0, // Will be added in future API integration
        dewPoint: 0, // Will be added in future API integration
      };
    } catch (error) {
      console.error('Error fetching current weather:', error);
      throw error;
    }
  }

  async getForecast(
    location: Location,
    days: number = 7
  ): Promise<WeatherForecast[]> {
    try {
      const forecast = await fetchForecast(location, days);
      return forecast.map(data => ({
        ...data,
        uvIndex: 0, // Will be added in future API integration
        soilMoisture: 0, // Will be added in future API integration
        dewPoint: 0, // Will be added in future API integration
      }));
    } catch (error) {
      console.error('Error fetching forecast:', error);
      throw error;
    }
  }

  async checkConditions(location: Location, date: Date): Promise<WeatherData> {
    const now = new Date();
    const isInFuture = date > now;

    if (isInFuture) {
      // Get forecast and find the closest time period
      const daysUntil = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const forecast = await this.getForecast(location, daysUntil);
      
      // Find the forecast period closest to the target date
      const targetTime = date.getTime();
      const closestPeriod = forecast.reduce((closest, current) => {
        const currentDiff = Math.abs(new Date(current.date).getTime() - targetTime);
        const closestDiff = Math.abs(new Date(closest.date).getTime() - targetTime);
        return currentDiff < closestDiff ? current : closest;
      });

      return closestPeriod;
    } else {
      // For current or past dates, get current conditions
      return this.getCurrentWeather(location);
    }
  }

  async generateAlert(
    treatmentId: string,
    conditions: WeatherData,
    location: Location,
    date: Date,
    treatmentType: string
  ): Promise<WeatherAlert | null> {
    const treatmentConditions = TREATMENT_CONDITIONS[treatmentType];
    if (!treatmentConditions) {
      throw new Error(`Unknown treatment type: ${treatmentType}`);
    }

    const alerts: Partial<WeatherAlert>[] = [];

    // Check temperature
    if (conditions.temperature < treatmentConditions.minTemp) {
      alerts.push({
        type: 'temperature',
        severity: 'critical',
        priority: 5,
        message: `Temperature too low: ${conditions.temperature}°C (min: ${treatmentConditions.minTemp}°C)`
      });
    } else if (conditions.temperature > treatmentConditions.maxTemp) {
      alerts.push({
        type: 'temperature',
        severity: 'critical',
        priority: 5,
        message: `Temperature too high: ${conditions.temperature}°C (max: ${treatmentConditions.maxTemp}°C)`
      });
    }

    // Check wind
    if (conditions.windSpeed > treatmentConditions.maxWindSpeed) {
      alerts.push({
        type: 'wind',
        severity: 'warning',
        priority: 4,
        message: `Wind speed too high: ${conditions.windSpeed}km/h (max: ${treatmentConditions.maxWindSpeed}km/h)`
      });
    }

    // Check precipitation
    if (conditions.precipitation > treatmentConditions.maxPrecipitation) {
      alerts.push({
        type: 'precipitation',
        severity: 'warning',
        priority: 4,
        message: `Precipitation too high: ${conditions.precipitation}mm (max: ${treatmentConditions.maxPrecipitation}mm)`
      });
    }

    // Check UV index
    if (conditions.uvIndex > treatmentConditions.metrics.uvIndex.max) {
      alerts.push({
        type: 'uv',
        severity: 'warning',
        priority: 3,
        message: `UV index too high: ${conditions.uvIndex} (max: ${treatmentConditions.metrics.uvIndex.max})`
      });
    }

    // Check soil moisture
    if (conditions.soilMoisture < treatmentConditions.metrics.soilMoisture.min) {
      alerts.push({
        type: 'soil',
        severity: 'warning',
        priority: 3,
        message: `Soil too dry: ${conditions.soilMoisture}% (min: ${treatmentConditions.metrics.soilMoisture.min}%)`
      });
    } else if (conditions.soilMoisture > treatmentConditions.metrics.soilMoisture.max) {
      alerts.push({
        type: 'soil',
        severity: 'warning',
        priority: 3,
        message: `Soil too wet: ${conditions.soilMoisture}% (max: ${treatmentConditions.metrics.soilMoisture.max}%)`
      });
    }

    // Check dew point for disease risk
    if (conditions.dewPoint > treatmentConditions.metrics.dewPoint.max) {
      alerts.push({
        type: 'dewpoint',
        severity: 'warning',
        priority: 3,
        message: `High disease risk - dew point: ${conditions.dewPoint}°C (max: ${treatmentConditions.metrics.dewPoint.max}°C)`
      });
    }

    // If no alerts, return null
    if (!alerts.length) return null;

    // Create and batch the highest priority alert
    const highestPriorityAlert = alerts.reduce((prev, curr) =>
      (curr.priority || 0) > (prev.priority || 0) ? curr : prev
    );

    const alert: WeatherAlert = {
      id: randomUUID(),
      treatmentId,
      treatmentType,
      type: highestPriorityAlert.type!,
      severity: highestPriorityAlert.severity!,
      priority: highestPriorityAlert.priority!,
      message: highestPriorityAlert.message!,
      createdAt: new Date(),
      location,
      originalDate: date,
      metrics: {
        temperature: conditions.temperature,
        humidity: conditions.humidity,
        windSpeed: conditions.windSpeed,
        precipitation: conditions.precipitation,
        uvIndex: conditions.uvIndex,
        soilMoisture: conditions.soilMoisture,
        dewPoint: conditions.dewPoint
      }
    };

    // Add to batch
    await this.addToBatch(alert);

    return alert;
  }

  async monitorConditions(
    location: Location,
    treatmentType: string,
    startDate: Date,
    endDate: Date,
    treatmentId: string
  ): Promise<WeatherAlert[]> {
    const alerts: WeatherAlert[] = [];
    
    // Validate treatment type
    if (!TREATMENT_CONDITIONS[treatmentType]) {
      throw new Error(`Unknown treatment type: ${treatmentType}`);
    }

    // Get forecast for the period
    const forecast = await this.getForecast(location,
      Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    );

    // Check each forecast period
    for (const period of forecast) {
      const alert = await this.generateAlert(
        treatmentId,
        period,
        location,
        new Date(period.date),
        treatmentType
      );

      if (alert) {
        alerts.push(alert);
      }
    }

    // Get current conditions if monitoring period includes current time
    const now = new Date();
    if (now >= startDate && now <= endDate) {
      const currentConditions = await this.getCurrentWeather(location);
      const alert = await this.generateAlert(
        treatmentId,
        currentConditions,
        location,
        now,
        treatmentType
      );

      if (alert) {
        alerts.push(alert);
      }
    }

    return alerts;
  }

  async getRescheduleOptions(
    treatmentId: string,
    treatmentType: string,
    location: Location,
    originalDate: Date,
    daysToCheck: number = 7
  ): Promise<RescheduleOption[]> {
    const treatmentConditions = TREATMENT_CONDITIONS[treatmentType];
    if (!treatmentConditions) {
      throw new Error(`Unknown treatment type: ${treatmentType}`);
    }

    // Get forecast for the period
    const forecast = await this.getForecast(location, daysToCheck);
    
    // Calculate scores for each forecast period
    const options: RescheduleOption[] = await Promise.all(
      forecast.map(async (conditions) => {
        const score = this.calculateWeatherScore(conditions, treatmentType);
        
        // Analyze potential effectiveness
        const effectiveness = await this.analyzeTreatmentEffectiveness(
          treatmentType,
          conditions,
          Math.min(5, Math.max(1, Math.round(score))) as EffectivenessRating
        );

        // Apply time-of-day adjustments
        const date = new Date(conditions.date);
        const hour = date.getHours();
        let timeAdjustment = 0;

        // Prefer early morning for most treatments (6-9 AM)
        if (hour >= 6 && hour <= 9) {
          timeAdjustment = 0.5;
        }
        // Avoid mid-day for temperature-sensitive treatments
        else if (hour >= 11 && hour <= 15) {
          timeAdjustment = -0.3;
        }
        // Late afternoon can be good (3-6 PM)
        else if (hour >= 15 && hour <= 18) {
          timeAdjustment = 0.2;
        }

        const adjustedScore = Math.min(5, Math.max(1, score + timeAdjustment));

        return {
          date: new Date(conditions.date),
          score: adjustedScore,
          conditions
        };
      })
    );

    // Sort by score descending and filter out poor conditions
    return options
      .filter(option => option.score >= this.config.alertThreshold)
      .sort((a, b) => b.score - a.score);
  }

  // Alias for getRescheduleOptions to maintain compatibility
  findRescheduleOptions = this.getRescheduleOptions;

  async findOptimalTreatmentTime(
    location: Location,
    treatmentType: string,
    startDate: Date,
    endDate: Date
  ): Promise<Date> {
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Get reschedule options for the period
    const options = await this.getRescheduleOptions(
      'optimization', // Temporary ID for optimization purpose
      treatmentType,
      location,
      startDate,
      days
    );

    if (!options.length) {
      throw new Error('No suitable treatment times found in the given period');
    }

    // Find the option with the highest score
    const optimal = options.reduce((best, current) =>
      current.score > best.score ? current : best
    );

    return optimal.date;
  }

  async getTreatmentRecommendations(
    weatherData: WeatherData,
    treatmentType: string
  ): Promise<WeatherRecommendation> {
    const treatmentConditions = TREATMENT_CONDITIONS[treatmentType];
    if (!treatmentConditions) {
      throw new Error(`Unknown treatment type: ${treatmentType}`);
    }

    // Calculate current weather score
    const score = this.calculateWeatherScore(weatherData, treatmentType);

    // Analyze effectiveness for current conditions
    const effectiveness = await this.analyzeTreatmentEffectiveness(
      treatmentType,
      weatherData,
      Math.min(5, Math.max(1, Math.round(score))) as EffectivenessRating
    );

    // Generate base recommendations
    const recommendations = [...effectiveness.recommendations];

    // Add specific recommendations based on current conditions
    if (score < 3) {
      // Get 7-day forecast
      const forecast = await this.getForecast({
        latitude: 0, // These will be replaced with actual values
        longitude: 0,
        timezone: 'UTC'
      }, 7);

      // Find alternative dates with better conditions
      const alternativeDates = forecast
        .filter(day => {
          const dayScore = this.calculateWeatherScore(day, treatmentType);
          return dayScore > score;
        })
        .sort((a, b) => {
          const scoreA = this.calculateWeatherScore(a, treatmentType);
          const scoreB = this.calculateWeatherScore(b, treatmentType);
          return scoreB - scoreA;
        })
        .slice(0, 3)
        .map(day => new Date(day.date));

      // Add timing recommendations
      if (weatherData.temperature > treatmentConditions.maxTemp) {
        recommendations.push('Consider early morning or evening application to avoid high temperatures');
      }
      if (weatherData.windSpeed > treatmentConditions.maxWindSpeed) {
        recommendations.push('Early morning typically has lower wind speeds');
      }
      if (weatherData.uvIndex > treatmentConditions.metrics.uvIndex.max) {
        recommendations.push('UV levels are high - consider treatment during lower UV hours');
      }

      return {
        score,
        recommendations,
        alternativeDates
      };
    }

    // For good conditions, add reinforcing recommendations
    if (score >= 4) {
      recommendations.push('Current conditions are optimal for treatment');
      if (weatherData.soilMoisture >= treatmentConditions.metrics.soilMoisture.min &&
          weatherData.soilMoisture <= treatmentConditions.metrics.soilMoisture.max) {
        recommendations.push('Soil moisture levels are ideal for treatment effectiveness');
      }
    }

    return {
      score,
      recommendations,
      alternativeDates: []
    };
  }

  calculateWeatherScore(
    conditions: WeatherData,
    treatmentType: string
  ): number {
    const treatmentConditions = TREATMENT_CONDITIONS[treatmentType];
    if (!treatmentConditions) {
      throw new Error(`Unknown treatment type: ${treatmentType}`);
    }

    // Calculate individual metric scores (0-1 range)
    const scores = {
      temperature: this.calculateTemperatureScore(
        conditions.temperature,
        treatmentConditions.minTemp,
        treatmentConditions.maxTemp
      ),
      wind: this.calculateWindScore(
        conditions.windSpeed,
        treatmentConditions.maxWindSpeed
      ),
      precipitation: this.calculatePrecipitationScore(
        conditions.precipitation,
        treatmentConditions.maxPrecipitation
      ),
      uvIndex: this.calculateRangeScore(
        conditions.uvIndex,
        treatmentConditions.metrics.uvIndex.min,
        treatmentConditions.metrics.uvIndex.max
      ),
      soilMoisture: this.calculateRangeScore(
        conditions.soilMoisture,
        treatmentConditions.metrics.soilMoisture.min,
        treatmentConditions.metrics.soilMoisture.max
      ),
      dewPoint: this.calculateRangeScore(
        conditions.dewPoint,
        treatmentConditions.metrics.dewPoint.min,
        treatmentConditions.metrics.dewPoint.max
      )
    };

    // Weight factors based on treatment type priority
    const weights = {
      temperature: 0.25,
      wind: 0.2,
      precipitation: 0.2,
      uvIndex: 0.1,
      soilMoisture: 0.15,
      dewPoint: 0.1
    };

    // Calculate weighted average
    const weightedScore = Object.entries(scores).reduce(
      (sum, [metric, score]) => sum + score * weights[metric as keyof typeof weights],
      0
    );

    // Convert to 1-5 scale and round to nearest 0.5
    return Math.max(1, Math.min(5, Math.round(weightedScore * 4 + 1)));
  }

  private calculateTemperatureScore(temp: number, min: number, max: number): number {
    if (temp < min || temp > max) return 0;
    
    // Optimal temperature is in the middle of the range
    const optimal = (min + max) / 2;
    const range = max - min;
    
    // Calculate distance from optimal as percentage of range
    const distance = Math.abs(temp - optimal) / (range / 2);
    return Math.max(0, 1 - distance);
  }

  private calculateWindScore(speed: number, max: number): number {
    return Math.max(0, 1 - (speed / max));
  }

  private calculatePrecipitationScore(amount: number, max: number): number {
    return Math.max(0, 1 - (amount / max));
  }

  private calculateRangeScore(value: number, min: number, max: number): number {
    if (value < min) return Math.max(0, value / min);
    if (value > max) return Math.max(0, 1 - ((value - max) / max));
    return 1;
  }

  async analyzeTreatmentEffectiveness(
    treatmentType: string,
    weatherData: WeatherData,
    effectiveness: EffectivenessRating
  ): Promise<TreatmentEffectiveness> {
    const treatmentConditions = TREATMENT_CONDITIONS[treatmentType];
    if (!treatmentConditions) {
      throw new Error(`Unknown treatment type: ${treatmentType}`);
    }

    // Calculate impact factors for each weather metric
    const factors: Record<string, number> = {
      temperature: this.calculateTemperatureImpact(
        weatherData.temperature,
        treatmentConditions.minTemp,
        treatmentConditions.maxTemp,
        effectiveness
      ),
      wind: this.calculateWindImpact(
        weatherData.windSpeed,
        treatmentConditions.maxWindSpeed,
        effectiveness
      ),
      precipitation: this.calculatePrecipitationImpact(
        weatherData.precipitation,
        treatmentConditions.maxPrecipitation,
        effectiveness
      ),
      uvIndex: this.calculateMetricImpact(
        weatherData.uvIndex,
        treatmentConditions.metrics.uvIndex.min,
        treatmentConditions.metrics.uvIndex.max,
        effectiveness
      ),
      soilMoisture: this.calculateMetricImpact(
        weatherData.soilMoisture,
        treatmentConditions.metrics.soilMoisture.min,
        treatmentConditions.metrics.soilMoisture.max,
        effectiveness
      ),
      dewPoint: this.calculateMetricImpact(
        weatherData.dewPoint,
        treatmentConditions.metrics.dewPoint.min,
        treatmentConditions.metrics.dewPoint.max,
        effectiveness
      )
    };

    // Generate recommendations based on impact factors
    const recommendations = this.generateEffectivenessRecommendations(factors, treatmentType);

    // Calculate overall effectiveness score
    const score = Object.values(factors).reduce((sum, factor) => sum + factor, 0) / Object.keys(factors).length;

    return {
      score,
      factors,
      recommendations
    };
  }

  private calculateTemperatureImpact(
    temp: number,
    min: number,
    max: number,
    effectiveness: EffectivenessRating
  ): number {
    const optimalTemp = (min + max) / 2;
    const range = max - min;
    const distanceFromOptimal = Math.abs(temp - optimalTemp) / (range / 2);
    
    // Adjust impact based on effectiveness rating
    const baseImpact = Math.max(0, 1 - distanceFromOptimal);
    return this.adjustImpactByEffectiveness(baseImpact, effectiveness);
  }

  private calculateWindImpact(
    speed: number,
    max: number,
    effectiveness: EffectivenessRating
  ): number {
    const baseImpact = Math.max(0, 1 - (speed / max));
    return this.adjustImpactByEffectiveness(baseImpact, effectiveness);
  }

  private calculatePrecipitationImpact(
    amount: number,
    max: number,
    effectiveness: EffectivenessRating
  ): number {
    const baseImpact = Math.max(0, 1 - (amount / max));
    return this.adjustImpactByEffectiveness(baseImpact, effectiveness);
  }

  private calculateMetricImpact(
    value: number,
    min: number,
    max: number,
    effectiveness: EffectivenessRating
  ): number {
    let baseImpact: number;
    if (value < min) {
      baseImpact = Math.max(0, value / min);
    } else if (value > max) {
      baseImpact = Math.max(0, 1 - ((value - max) / max));
    } else {
      baseImpact = 1;
    }
    return this.adjustImpactByEffectiveness(baseImpact, effectiveness);
  }

  private adjustImpactByEffectiveness(
    baseImpact: number,
    effectiveness: EffectivenessRating
  ): number {
    // Scale the impact based on effectiveness rating (1-5)
    const effectivenessWeight = (effectiveness - 1) / 4; // Convert to 0-1 range
    return (baseImpact + effectivenessWeight) / 2;
  }

  private generateEffectivenessRecommendations(
    factors: Record<string, number>,
    treatmentType: string
  ): string[] {
    const recommendations: string[] = [];
    const treatmentConditions = TREATMENT_CONDITIONS[treatmentType];

    // Sort factors by impact (lowest impact first)
    const sortedFactors = Object.entries(factors)
      .sort(([, a], [, b]) => a - b);

    // Generate recommendations for the most impactful factors
    for (const [factor, impact] of sortedFactors) {
      if (impact < 0.7) { // Threshold for generating recommendations
        switch (factor) {
          case 'temperature':
            recommendations.push(
              `Consider adjusting treatment time to when temperature is closer to ${
                Math.round((treatmentConditions.minTemp + treatmentConditions.maxTemp) / 2)
              }°C`
            );
            break;
          case 'wind':
            if (impact < 0.5) {
              recommendations.push(
                `Avoid treatment during high winds (above ${treatmentConditions.maxWindSpeed}km/h)`
              );
            }
            break;
          case 'precipitation':
            if (impact < 0.6) {
              recommendations.push(
                `Check forecast to avoid precipitation within ${treatmentConditions.maxPrecipitation}mm`
              );
            }
            break;
          case 'uvIndex':
            recommendations.push(
              `Consider UV exposure levels when scheduling treatments`
            );
            break;
          case 'soilMoisture':
            recommendations.push(
              `Monitor soil moisture levels for optimal treatment effectiveness`
            );
            break;
          case 'dewPoint':
            if (impact < 0.6) {
              recommendations.push(
                `Watch for high disease risk conditions with current dew point levels`
              );
            }
            break;
        }
      }
    }

    return recommendations;
  }

  async startMonitoring(
    treatmentId: string,
    treatmentType: string,
    location: Location,
    scheduledDate: Date,
    config?: {
      checkInterval?: number;
      alertThreshold?: number;
      forecastHours?: number;
    }
  ): Promise<void> {
    // Validate treatment type
    if (!TREATMENT_CONDITIONS[treatmentType]) {
      throw new Error(`Unknown treatment type: ${treatmentType}`);
    }

    // Update monitoring config if provided
    if (config) {
      this.updateConfig({
        checkInterval: config.checkInterval ?? this.config.checkInterval,
        alertThreshold: config.alertThreshold ?? this.config.alertThreshold,
        forecastHours: config.forecastHours ?? this.config.forecastHours
      });
    }

    this.activeMonitoring.add(treatmentId);

    // Initial conditions check
    await this.monitorConditions(
      location,
      treatmentType,
      scheduledDate,
      new Date(scheduledDate.getTime() + (this.config.forecastHours * 60 * 60 * 1000)),
      treatmentId
    );

    // Set up recurring checks
    const checkInterval = setInterval(async () => {
      if (!this.isMonitoring(treatmentId)) {
        clearInterval(checkInterval);
        return;
      }

      try {
        const now = new Date();
        const endTime = new Date(now.getTime() + (this.config.forecastHours * 60 * 60 * 1000));

        await this.monitorConditions(
          location,
          treatmentType,
          now,
          endTime,
          treatmentId
        );
      } catch (error) {
        // Log error but don't stop monitoring
        console.error(`Error monitoring treatment ${treatmentId}:`, error);
      }
    }, this.config.checkInterval * 60 * 1000); // Convert minutes to milliseconds
  }

  async stopMonitoring(treatmentId: string): Promise<void> {
    this.activeMonitoring.delete(treatmentId);
    // Full implementation will be added later
  }

  getConfig(): WeatherMonitorConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<WeatherMonitorConfig>): void {
    const updatedConfig = {
      ...this.config,
      ...newConfig,
    };
    validateConfig(updatedConfig);
    this.config = updatedConfig;
  }

  resetConfig(): void {
    this.config = { ...DEFAULT_CONFIG };
  }

  isMonitoring(treatmentId: string): boolean {
    return this.activeMonitoring.has(treatmentId);
  }
}

// Export a singleton instance
export const weatherService = new WeatherService();