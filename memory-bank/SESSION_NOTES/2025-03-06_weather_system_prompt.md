# Weather System Development Prompt

Use this prompt to provide context and next steps for the weather notification system:

```
Continue development of the weather notification system:

1. Current Implementation Status:
   - Weather service implemented and tested
   - Alert generation system configured
   - Treatment scheduling optimization ready
   - Real-time monitoring system active
   - Integration with lawn profiles and scheduling complete

2. System Components:
   - WeatherService class in src/lib/weather/service.ts
   - Weather types in src/lib/weather/types.ts
   - Weather API integration in src/lib/weather/api.ts
   - Test suite in src/lib/weather/__tests__/
   - UI components in src/components/weather/

3. Next Enhancement Steps:
   - Implement additional weather metrics
   - Enhance alert batching logic
   - Add machine learning for treatment optimization
   - Expand test coverage
   - Improve error recovery mechanisms

4. Integration Points:
   - Dashboard weather alerts (WeatherAlertList)
   - Treatment scheduling (ScheduleCalendar)
   - Notification preferences
   - TRPC routers (weather, schedule)

5. Testing Requirements:
   - Maintain test isolation
   - Mock external services
   - Cover error scenarios
   - Validate weather calculations
   - Ensure proper type safety

Focus on maintaining code quality, type safety, and test coverage while implementing new features.

Reference documentation in:
- memory-bank/SESSION_NOTES/2025-03-06_weather_system_usage.md
- memory-bank/activeContext.md
```

## Usage Instructions

1. Copy the prompt above when starting new weather system development tasks
2. Update the "Next Enhancement Steps" based on current priorities
3. Adjust integration points as new components are added
4. Modify testing requirements for specific features

## Notes

- The prompt provides context about the current state of the weather system
- It outlines the key components and their locations
- It specifies the next steps for enhancement
- It includes references to detailed documentation

## Maintenance

Update this prompt when:
- Major features are completed
- New integration points are added
- Testing requirements change
- System architecture is modified