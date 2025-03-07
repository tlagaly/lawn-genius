## March 6, 2025 - Weather System Enhancement Decisions

### Context
- Need to improve weather monitoring accuracy
- Require better alert management for multiple conditions
- Want to optimize treatment timing based on multiple metrics
- Need robust error recovery mechanisms

### Decisions Made

1. Alert Batching Strategy
   - Implemented priority-based batching (1-5 scale)
   - Set configurable batch windows (5-60 minutes)
   - Added correlation tracking between alerts
   - Defined maximum batch sizes (1-20 alerts)

2. Weather Metrics Weighting
   - Temperature: 25% (critical for most treatments)
   - Wind: 20% (affects application effectiveness)
   - Precipitation: 20% (crucial for timing)
   - Soil Moisture: 15% (treatment absorption)
   - UV Index: 10% (treatment degradation)
   - Dew Point: 10% (disease risk)

3. Error Recovery Approach
   - Continuous monitoring with auto-retry
   - Graceful API failure handling
   - State preservation during failures
   - Batch recovery mechanisms

### Rationale
- Needed to reduce alert noise while maintaining urgency
- Wanted to account for all relevant weather factors
- Aimed to prevent data loss during system issues
- Required treatment-specific optimization

### Alternatives Considered
1. Simple threshold-based alerts
2. Equal metric weighting
3. Individual alert processing
4. Fixed batch sizes

### Impact
- More accurate treatment timing
- Reduced alert noise
- Better error handling
- Improved monitoring reliability

### Next Steps
1. Conduct load testing for ML components
2. Implement historical data persistence
3. Add model retraining capabilities
4. Enhance prediction confidence scoring

## March 6, 2025 - Weather ML Implementation Decisions

### Context
Need to implement machine learning capabilities for weather pattern recognition and treatment optimization.

### Decisions Made

1. ML Strategy
   - Implemented effectiveness-based learning system
   - Used weighted metric scoring
   - Added time-of-day optimization
   - Integrated with existing weather monitoring

2. Scoring System
   - Base weather metrics: 60%
   - Historical effectiveness: 25%
   - Time-of-day factors: 15%
   - Dynamic adjustment based on feedback

3. Optimization Approach
   - Early morning preference (6-9 AM)
   - Mid-day avoidance for temperature-sensitive treatments
   - Late afternoon consideration (3-6 PM)
   - Weather pattern correlation tracking

### Rationale
- Needed to improve treatment timing accuracy
- Wanted to learn from past treatment effectiveness
- Required balance between immediate conditions and historical patterns
- Aimed for continuous improvement through feedback

### Alternatives Considered
1. Pure statistical analysis
2. Fixed time-of-day rules
3. Simple threshold-based system
4. Third-party ML service integration

### Impact
- More accurate treatment timing
- Better adaptation to local conditions
- Improved treatment effectiveness
- Reduced weather-related treatment failures

### Next Steps
1. Implement data persistence for ML training
2. Add confidence scoring to predictions
3. Create model retraining pipeline
4. Expand pattern recognition capabilities

## March 6, 2025 - Auth Bypass Implementation Decisions

### Context
- Need development auth bypass for testing lawn profile creation
- Experiencing issues with TRPC protected procedures and Next.js auth integration
- Current implementation causing redirect loops and 500 errors

### Decisions Made

1. Auth Bypass Strategy
   - Implemented development-only credentials provider
   - Added middleware checks for development environment
   - Modified TRPC provider to include auth headers
   - Updated client port configuration

2. Technical Approach
   - Separated auth logic between middleware and TRPC
   - Added development-specific session handling
   - Modified TRPC context creation for test account

### Rationale
- Needed to maintain security while enabling development testing
- Wanted to minimize changes to production auth flow
- Aimed to keep development and production code paths clear

### Alternatives Considered
1. Using environment variables for bypass
2. Mocking auth in test environment
3. Separate development routes

### Impact
- Development testing workflow improved
- Some technical debt in auth implementation
- Need for better session handling between Next.js and TRPC

### Next Steps
1. Consider implementing detailed auth flow logging
2. Review session management approach
3. Plan for separating development and production auth flows

## March 6, 2025 - Development Auth Bypass Implementation

### Context
Need to implement a development auth bypass to streamline testing and development of protected features like lawn profile creation.

### Decision
1. Implemented a development-only credentials provider that:
   - Auto-creates/finds a test user (test@example.com)
   - Bypasses password verification in development
   - Maintains proper JWT token handling

2. Simplified auth configuration by:
   - Using conditional provider selection based on environment
   - Removing middleware redirect logic
   - Updating LoginForm for auto-signin in development

### Rationale
- Streamlines development workflow
- Maintains security in production
- Follows Next.js best practices for auth handling
- Keeps test data consistent with a single test account

### Consequences
- Positive:
  - Faster development cycles
  - Consistent test data
  - Clear separation between dev/prod auth
- Negative:
  - Need to ensure bypass doesn't affect production
  - Must maintain separate auth flows

### Implementation Notes
- Located in src/lib/auth/auth-options.ts
- Uses environment-based provider selection
- Maintains existing Google auth for production
- Test account: test@example.com

# Architectural Decision Log

## 2025-03-05: Recurring Schedules Implementation

### Context
The lawn care management system needs to support recurring schedules for treatments while maintaining weather optimization features.

### Decision
Implement recurring schedules using a separate RecurrencePattern model with support for:
- Multiple frequency types (daily, weekly, monthly)
- Exception handling
- Weather-based optimization
- Parent-child schedule relationships

### Alternatives Considered
1. Embedding recurrence rules in Schedule model
   - Pros: Simpler data model
   - Cons: Less flexible, harder to modify patterns
   
2. Using a calendar library's recurrence rules
   - Pros: Proven implementation
   - Cons: Less control over weather integration

3. Generating all occurrences upfront
   - Pros: Simpler querying
   - Cons: Storage intensive, less adaptable

### Consequences
Positive:
- Flexible recurrence patterns
- Strong exception handling
- Weather optimization per occurrence
- Clear separation of concerns

Negative:
- More complex data model
- Additional database queries
- Need for occurrence calculation logic

### Implementation Plan
1. Database schema updates
2. Core recurrence logic
3. Weather integration
4. UI components
5. Testing and validation

### Metrics
- Performance impact on schedule queries
- Weather optimization effectiveness
- User engagement with recurring schedules