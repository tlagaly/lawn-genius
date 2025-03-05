# Product Context

## System Architecture

### Frontend Layer
1. Next.js App Router
   - Server and Client Components
   - Protected routes
   - API routes for auth and notifications
   - Responsive layouts

2. Component Architecture
   - Modular design
   - Shared UI components
   - Feature-specific components
   - State management with React Query & Zustand

3. Styling System
   - Tailwind CSS
   - Responsive design patterns
   - Consistent UI/UX
   - Visual feedback patterns

### API Layer
1. TRPC Implementation
   - Type-safe procedures
   - Modular router structure
   - Protected routes
   - Error handling
   - Batch operations

2. Authentication
   - NextAuth.js
   - Multiple providers
   - JWT sessions
   - Password reset flow
   - Protected routes

### Service Layer
1. Database Services
   - PostgreSQL
   - Prisma ORM
   - Type-safe operations
   - Soft deletion
   - Relationship management

2. Notification System
   - Email (Resend)
   - Web Push API
   - Service worker
   - Delivery tracking
   - User preferences

3. Weather Integration
   - OpenWeather API
   - Real-time monitoring
   - Score calculation
   - Alert generation
   - Schedule optimization

4. Payment Processing
   - Stripe integration
   - Subscription management
   - Payment tracking
   - Plan management

## Data Models

### Core Entities
1. User
   - Authentication details
   - Profile information
   - Subscription status
   - Notification preferences

2. Lawn Profile
   - Characteristics
   - Location data
   - Treatment history
   - Weather preferences

3. Schedule
   - Treatments
   - Timing
   - Weather conditions
   - Completion status

4. Treatment
   - Type information
   - Application details
   - Weather requirements
   - Effectiveness tracking

5. Weather Alert
   - Conditions
   - Severity
   - Recommendations
   - Affected schedules

### Service Models
1. Notification
   - Type (email/push)
   - Status
   - Delivery tracking
   - User interaction

2. Subscription
   - Plan details
   - Payment status
   - Feature access
   - Usage tracking

## Implementation Patterns

### Authentication Flow
- Multi-provider support
- Secure session handling
- Protected route middleware
- Role-based access

### Data Access
- TRPC procedures
- Type-safe operations
- Error handling
- Caching strategy

### State Management
- Server state (React Query)
- Client state (Zustand)
- Form state (React Hook Form)
- Loading states

### Error Handling
- Type-safe error responses
- User-friendly messages
- Error recovery
- Logging system

### Testing Strategy
- Unit tests
- Integration tests
- E2E testing
- Component testing

## Deployment Architecture
- Vercel hosting
- Environment configuration
- CI/CD pipeline
- Monitoring setup

## Security Measures
- Authentication
- Data encryption
- API protection
- Input validation
- Rate limiting

## Performance Optimizations
- SSR/SSG usage
- Data caching
- API batching
- Image optimization
- Code splitting