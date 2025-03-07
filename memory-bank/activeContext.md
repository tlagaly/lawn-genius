# Active Development Context

## Current Focus
- Lawn profile creation implementation
  - Development auth bypass fix
  - Species selection integration
  - Form validation and notifications
  - End-to-end flow testing
- Weather integration setup
  - Real-time monitoring
  - Alert generation
  - Schedule optimization

## Implementation Status
- Core UI components completed
- TRPC integration done
- Basic seed data created
- Authentication setup complete
  - Production auth flow implemented
  - Development mode auto-login enabled
  - Test account configured (test@example.com)
- Image support structure implemented
- Login flow tested and working
- Navigation behavior refined
  - MainNav and Footer now show on marketing pages when logged in
  - MainNav and Footer hidden only in dashboard
- Weather system integration complete
  - Weather service implemented and tested
  - Alert generation system configured
  - Treatment scheduling optimization ready
  - Real-time monitoring system active

## Critical Issues
1. Auth Bypass:
   - 500 errors on protected routes
   - Redirect loops in middleware
   - TRPC authentication failures
   - Session state synchronization

2. Development Environment:
   - Port configuration issues
   - Build manifest errors
   - Auth state management

## Technical Considerations
- Session management between Next.js auth and TRPC
- Development vs production auth flows
- Protected procedure implementation
- Error handling and logging
- Weather data integration
- Schedule optimization algorithms

## Dependencies
- Next.js Auth
- TRPC
- Middleware configuration
- Client-side state management
- OpenWeather API
- Scheduling system

## Development Testing Notes
- Browser Testing Workflow:
  - Development mode automatically uses test account
  - No manual login required for protected routes
  - Only disable auto-login when testing auth flows
  - Test account credentials:
    Email: test@example.com
    Password: TestPassword123!

## Current Blockers
- Tooltip component error in grass species page
- Missing grass species images
- Image optimization needs configuration
- Need to implement TooltipProvider

## Next Steps
1. Fix UI Component Issues
   - Add TooltipProvider wrapper
   - Test tooltip functionality
   - Verify error boundary handling

2. Complete image implementation
   - Set up grass species image directory
   - Configure image optimization
   - Implement proper fallbacks
   - Test image loading states

3. Enhance Weather System
   - Implement data persistence for ML training ⏳
   - Add confidence scoring to predictions ⏳
   - Create model retraining pipeline ⏳
   - Expand pattern recognition capabilities ⏳
   - Conduct load testing for ML components ⏳

## Implementation Status
- Core UI components completed ✅
- TRPC integration done ✅
- Basic seed data created ✅
- Authentication setup complete ✅
- Weather system ML implementation complete ✅
  - Treatment effectiveness analysis
  - Smart recommendations engine
  - Optimized scheduling system
  - Time-of-day optimization
  - Pattern recognition framework

## Version Control Workflow
- Repository: https://github.com/tlagaly/lawn-genius
- Branch Strategy:
  - Main branch for primary development
  - Feature branches for major changes
- Commit Guidelines:
  - Use semantic commit messages (feat:, fix:, etc.)
  - Include clear descriptions of changes
  - Regular commits for trackable progress
- Push Schedule:
  - Push after significant feature completion
  - Push at end of development sessions
  - Push when implementing critical fixes

## Resources
- Session notes: 2025-03-06_lawn_profile_auth_bypass_issues.md
- Progress tracking: progress.md
- Technical decisions: DECISION_LOG.md
- Weather system guide: SESSION_NOTES/2025-03-06_weather_system_usage.md
- Weather development prompt: SESSION_NOTES/2025-03-06_weather_system_prompt.md