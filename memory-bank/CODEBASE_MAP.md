# Codebase Map

## Directory Structure

```
/src
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes (NextAuth, Stripe webhooks)
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # User dashboard pages
│   │   ├── lawn/         # Lawn profile management
│   │   ├── schedule/     # Schedule management
│   │   └── settings/     # User settings
│   └── subscription/     # Subscription management
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── dashboard/        # Dashboard components
│   ├── forms/            # Form components
│   ├── lawn/             # Lawn management components
│   ├── navigation/       # Navigation components
│   ├── schedule/         # Schedule components
│   ├── subscription/     # Subscription components
│   └── ui/              # Shared UI components
├── lib/                  # Utility functions and shared logic
│   ├── api/             # API utilities
│   ├── auth/            # Authentication utilities
│   ├── db/              # Database utilities
│   ├── stripe/          # Stripe integration
│   ├── trpc/            # tRPC configuration
│   ├── utils/           # General utilities
│   └── weather/         # Weather API integration
├── server/               # Server-side code
│   ├── auth/            # Authentication configuration
│   ├── db/              # Database operations
│   └── api/             # API routes and handlers
├── styles/              # Global styles
└── types/               # TypeScript type definitions

/prisma
├── migrations/          # Database migrations
└── schema.prisma       # Prisma schema

/public
├── images/             # Static images
└── icons/             # Icon assets
```

## Key Components

### Authentication
- NextAuth.js configuration
- Protected route middleware
- Authentication forms
- Session management

### Database
- Prisma schema and migrations
- Database utilities and helpers
- Type-safe queries and mutations

### API Layer
- tRPC router configuration
- API procedures and endpoints
- Type definitions and validation

### Dashboard
- User dashboard layout
- Lawn profile management
- Schedule visualization
- Progress tracking

### Subscription
- Stripe integration
- Payment processing
- Subscription management
- Usage tracking

### Forms
- Form components with validation
- Input fields and controls
- Error handling
- Success feedback

### UI Components
- Navigation components
- Layout components
- Data display components
- Interactive elements

## State Management

### Server State
- React Query for data fetching
- Cache management
- Real-time updates

### Client State
- Zustand stores
- Form state
- UI state
- Authentication state

## Integration Points

### External Services
- Stripe for payments
- OpenWeather API
- Email service
- SMS notifications

### Internal Services
- Authentication service
- Database service
- Weather service
- Notification service

## Development Guidelines

1. Use TypeScript for all new code
2. Follow component-driven development
3. Implement proper error handling
4. Write unit tests for critical functionality
5. Document all API endpoints
6. Follow accessibility guidelines
7. Optimize for performance
8. Maintain consistent styling