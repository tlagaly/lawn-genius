# Service Registry

## Authentication Services
- NextAuth.js for authentication
- Email/password and OAuth providers
- Password reset functionality
- JWT session handling
- Custom callbacks for user data
- Prisma adapter integration
- Error handling and redirection
- Secure credential validation

## Database Services
- PostgreSQL database
- Prisma ORM
- Database schema management

## API Services (TRPC)

### User Management
- User registration with default preferences
- Profile management
- Account settings
- Notification preferences

### Notification Services
- Email notifications via Resend
- Push notifications via Web Push API
- Notification preference management
- Notification history tracking
- Service worker for push handling
- VAPID key infrastructure
- Alert threshold management
- Notification batching and frequency control
- Delivery status tracking
- User interaction monitoring

### Lawn Management
- Create/update lawn profiles
- Lawn metrics tracking
- Multiple lawn support

### Schedule Management
- Treatment schedule creation and management
- Treatment tracking with completion status
- Calendar-based scheduling
- Integration with lawn profiles
- Foundation for weather-based scheduling

### Subscription Management
- Subscription plans
- Payment processing (Stripe)
- Subscription status tracking

## External Services Integration

### Email Service
- Resend for transactional emails
- Email template system
- Delivery tracking
- Email preference management

### Push Notification Service
- Web Push API integration
- Service worker implementation
- Browser permission handling
- Subscription management
- Cross-browser support

### Weather Services
- OpenWeather API integration for real-time weather data
- Smart scheduling with weather condition analysis
- Treatment recommendations based on weather conditions
- Weather score calculation for treatment timing
- Historical weather data tracking
- Treatment effectiveness analysis with weather correlation
- Real-time weather monitoring system
- Weather alert generation and management
- Severity-based alert classification
- Intelligent rescheduling suggestions
- Weather condition violation detection
- Treatment timing optimization

### Payment Processing
- Stripe integration
- Secure payment handling
- Subscription management

## Infrastructure
- Next.js application framework
- TRPC for type-safe APIs
- Tailwind CSS for styling
- Vercel deployment
- TRPCProvider with:
  * SuperJSON transformer
  * HTTP batch link
  * React Query integration