# Weather Notification System Usage Guide

## System Overview
The weather notification system provides automated weather monitoring and alerts for lawn treatments. It integrates with the lawn profile and treatment scheduling systems to optimize treatment timing based on weather conditions.

## Key Components

### 1. Weather Service
```typescript
import { weatherService } from '@/lib/weather';
import { EffectivenessRating } from '@/lib/weather/types';

// Basic weather monitoring
const weather = await weatherService.getCurrentWeather({
  latitude: 30.2672,
  longitude: -97.7431,
  timezone: 'America/Chicago'
});

// Get 5-day forecast
const forecast = await weatherService.getForecast({
  latitude: 30.2672,
  longitude: -97.7431,
  timezone: 'America/Chicago'
}, 5);
```

### 2. Treatment Scheduling
```typescript
// Find optimal treatment time
const optimalTime = await weatherService.findOptimalTreatmentTime(
  location,
  'Fertilization',
  startDate,
  endDate
);

// Get rescheduling options
const options = await weatherService.getRescheduleOptions(
  treatmentId,
  'Fertilization',
  location,
  originalDate,
  7 // days to check
);
```

### 3. Weather Monitoring
```typescript
// Start monitoring a treatment
await weatherService.startMonitoring(
  treatmentId,
  'Fertilization',
  location,
  scheduledDate,
  {
    checkInterval: 30, // minutes
    alertThreshold: 3, // minimum weather score
    forecastHours: 48 // hours ahead to check
  }
);

// Stop monitoring
await weatherService.stopMonitoring(treatmentId);
```

### 4. Treatment Analysis
```typescript
// Analyze treatment effectiveness
const analysis = await weatherService.analyzeTreatmentEffectiveness(
  'Fertilization',
  weatherData,
  4 as EffectivenessRating // Must be 1-5
);
```

## Integration Points

### Dashboard Components
- `WeatherAlertList`: Displays active weather alerts
- `ScheduleCalendar`: Shows treatments with weather scores
- `NotificationPreferences`: Configure alert settings

### TRPC Routers
- `weatherRouter`: Weather data and monitoring endpoints
- `scheduleRouter`: Treatment scheduling with weather integration

## Development & Testing

### Test Environment
1. Use test account:
   - Email: test@example.com
   - Password: TestPassword123!

2. Mock data available in:
   - src/lib/weather/__tests__/setup.ts
   - Mock weather API responses
   - Test database fixtures

3. Run tests:
   ```bash
   npm test src/lib/weather/__tests__/weather-service.test.ts
   ```

### Key Test Cases
- Weather condition monitoring
- Treatment scheduling optimization
- Alert batching
- Error recovery
- Database integration

## Best Practices

1. Weather Monitoring
   - Always provide accurate location data
   - Use appropriate check intervals (15-60 minutes)
   - Set reasonable alert thresholds

2. Treatment Scheduling
   - Check optimal times before scheduling
   - Consider forecast reliability window (1-5 days)
   - Use weather scores for timing decisions

3. Error Handling
   - Handle API failures gracefully
   - Provide fallback weather data
   - Maintain monitoring state

4. Performance
   - Batch weather checks when possible
   - Cache weather data appropriately
   - Monitor API usage limits

## Troubleshooting

Common Issues:
1. Weather API connection failures
   - Check API key configuration
   - Verify network connectivity
   - Review rate limits

2. Alert Generation
   - Verify monitoring is active
   - Check alert thresholds
   - Confirm notification preferences

3. Treatment Scheduling
   - Ensure valid location data
   - Check date range validity
   - Verify treatment type configuration

## Next Steps

1. Implement additional weather metrics
2. Enhance alert batching logic
3. Add machine learning for treatment optimization
4. Expand test coverage
5. Improve error recovery mechanisms