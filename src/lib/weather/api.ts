import { WeatherData, WeatherForecast, Location } from './types';

/**
 * Fetches current weather data for a given location
 */
export async function fetchWeatherData(location: Location): Promise<WeatherData> {
  const response = await fetch(
    `${process.env.WEATHER_API_URL}/current?` + new URLSearchParams({
      lat: location.latitude.toString(),
      lon: location.longitude.toString(),
      appid: process.env.WEATHER_API_KEY!,
      units: 'metric'
    })
  );

  if (!response.ok) {
    throw new Error(`Weather API error: ${response.statusText}`);
  }

  const data = await response.json();
  
  return {
    temperature: data.main.temp,
    humidity: data.main.humidity,
    precipitation: data.rain?.['1h'] || 0,
    windSpeed: data.wind.speed,
    conditions: data.weather[0].main
  };
}

/**
 * Fetches weather forecast for a given location and time range
 */
export async function fetchForecast(
  location: Location,
  days: number = 7
): Promise<WeatherForecast[]> {
  const response = await fetch(
    `${process.env.WEATHER_API_URL}/forecast?` + new URLSearchParams({
      lat: location.latitude.toString(),
      lon: location.longitude.toString(),
      appid: process.env.WEATHER_API_KEY!,
      units: 'metric',
      cnt: (days * 8).toString() // API returns data in 3-hour intervals
    })
  );

  if (!response.ok) {
    throw new Error(`Weather API error: ${response.statusText}`);
  }

  const data = await response.json();
  
  return data.list.map((item: any) => ({
    temperature: item.main.temp,
    humidity: item.main.humidity,
    precipitation: item.rain?.['3h'] || 0,
    windSpeed: item.wind.speed,
    conditions: item.weather[0].main,
    date: new Date(item.dt * 1000),
    probability: item.pop * 100 // Convert 0-1 to percentage
  }));
}