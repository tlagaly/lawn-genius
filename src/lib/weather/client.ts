interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  description: string;
  icon: string;
}

interface ForecastData extends WeatherData {
  date: Date;
}

interface WeatherAlert {
  type: string;
  description: string;
  start: Date;
  end: Date;
  severity: 'info' | 'warning' | 'severe';
}

export class WeatherService {
  private apiKey: string;
  private baseUrl = 'https://api.openweathermap.org/data/3.0';

  constructor() {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      throw new Error('Missing OPENWEATHER_API_KEY');
    }
    this.apiKey = apiKey;
  }

  private async fetchApi(endpoint: string, params: Record<string, string> = {}) {
    const queryParams = new URLSearchParams({
      ...params,
      appid: this.apiKey,
      units: 'metric', // Use metric units by default
    });

    const response = await fetch(`${this.baseUrl}${endpoint}?${queryParams}`);
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.statusText}`);
    }

    return response.json();
  }

  private parseWeatherData(data: any): WeatherData {
    return {
      temperature: data.main.temp,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
    };
  }

  async getCurrentWeather(latitude: number, longitude: number): Promise<WeatherData> {
    const data = await this.fetchApi('/weather', {
      lat: latitude.toString(),
      lon: longitude.toString(),
    });

    return this.parseWeatherData(data);
  }

  async getForecast(
    latitude: number,
    longitude: number,
    days: number = 5
  ): Promise<ForecastData[]> {
    const data = await this.fetchApi('/forecast', {
      lat: latitude.toString(),
      lon: longitude.toString(),
      cnt: (days * 8).toString(), // OpenWeather provides data in 3-hour intervals
    });

    return data.list.map((item: any) => ({
      ...this.parseWeatherData(item),
      date: new Date(item.dt * 1000),
    }));
  }

  async getAlerts(latitude: number, longitude: number): Promise<WeatherAlert[]> {
    const data = await this.fetchApi('/onecall', {
      lat: latitude.toString(),
      lon: longitude.toString(),
      exclude: 'current,minutely,hourly,daily',
    });

    if (!data.alerts) {
      return [];
    }

    return data.alerts.map((alert: any) => ({
      type: alert.event,
      description: alert.description,
      start: new Date(alert.start * 1000),
      end: new Date(alert.end * 1000),
      severity: this.determineSeverity(alert.event),
    }));
  }

  private determineSeverity(eventType: string): 'info' | 'warning' | 'severe' {
    const severeEvents = [
      'tornado',
      'hurricane',
      'thunderstorm',
      'flood',
    ];

    const warningEvents = [
      'rain',
      'snow',
      'wind',
      'extreme',
    ];

    const eventLower = eventType.toLowerCase();

    if (severeEvents.some(e => eventLower.includes(e))) {
      return 'severe';
    }

    if (warningEvents.some(e => eventLower.includes(e))) {
      return 'warning';
    }

    return 'info';
  }

  async shouldWaterLawn(latitude: number, longitude: number): Promise<{
    should: boolean;
    reason: string;
  }> {
    const [weather, forecast, alerts] = await Promise.all([
      this.getCurrentWeather(latitude, longitude),
      this.getForecast(latitude, longitude, 1),
      this.getAlerts(latitude, longitude),
    ]);

    // Don't water if there are severe weather alerts
    if (alerts.some(alert => alert.severity === 'severe')) {
      return {
        should: false,
        reason: 'Severe weather alert in effect',
      };
    }

    // Don't water if it's currently raining
    if (weather.description.includes('rain')) {
      return {
        should: false,
        reason: 'Currently raining',
      };
    }

    // Don't water if rain is forecasted in the next 24 hours
    if (forecast.some(f => f.description.includes('rain'))) {
      return {
        should: false,
        reason: 'Rain forecasted in the next 24 hours',
      };
    }

    // Check temperature and humidity conditions
    if (weather.temperature > 30) { // Above 30°C (86°F)
      return {
        should: true,
        reason: 'High temperature conditions',
      };
    }

    if (weather.humidity < 40) { // Low humidity
      return {
        should: true,
        reason: 'Low humidity conditions',
      };
    }

    return {
      should: false,
      reason: 'Normal weather conditions',
    };
  }
}