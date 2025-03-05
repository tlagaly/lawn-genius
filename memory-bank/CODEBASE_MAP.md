# Codebase Map

## App Structure

```
src/
├── app/                      # Next.js app router pages
│   ├── api/                # API routes
│   │   ├── auth/          # NextAuth API routes
│   │   │   └── [...nextauth]/ # NextAuth handler
│   │   └── notifications/ # Notification endpoints
│   ├── auth/              # Authentication pages
│   │   ├── login/        # Login page
│   │   ├── register/     # Registration page
│   │   └── forgot-password/ # Password reset page
│   └── dashboard/        # Protected dashboard pages
│       └── layout.tsx    # Dashboard layout with navigation
├── components/           # React components
│   ├── auth/            # Authentication components
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── ForgotPasswordForm.tsx
│   ├── dashboard/       # Dashboard components
│   │   └── DashboardNav.tsx
│   ├── notifications/   # Notification components
│   │   ├── NotificationPreferences.tsx
│   │   └── NotificationHistory.tsx
│   └── ui/             # Shared UI components
├── lib/                # Utility functions and configurations
│   ├── auth/          # Authentication utilities
│   │   └── auth-options.ts
│   ├── db/           # Database utilities
│   │   └── prisma.ts
│   ├── notifications/ # Notification utilities
│   │   ├── client.ts
│   │   └── push.ts
│   └── trpc/         # TRPC setup and routers
│       ├── client.ts
│       ├── context.ts
│       ├── root.ts
│       └── routers/
│           ├── user.ts
│           ├── lawn.ts
│           ├── schedule.ts
│           └── subscription.ts
└── types/           # TypeScript type definitions
    └── next-auth.d.ts
```

## Key Files

- `auth-options.ts`: NextAuth.js configuration with email/password and Google providers
- `api/auth/[...nextauth]/route.ts`: NextAuth API route handler
- `prisma.ts`: Prisma client configuration with notification models
- `trpc/client.ts`: TRPC client setup for frontend
- `trpc/routers/user.ts`: User management procedures including auth and notification operations
- `dashboard/layout.tsx`: Protected layout for authenticated pages

## Authentication System

- `src/lib/auth/auth-options.ts`: NextAuth configuration with:
  - Credentials provider for email/password
  - Google OAuth provider
  - JWT session handling
  - Custom callbacks for user data
- `src/app/api/auth/[...nextauth]/route.ts`: NextAuth API endpoints
- `src/components/auth/LoginForm.tsx`: Login form with credentials/OAuth
- `src/components/auth/RegisterForm.tsx`: Registration with default preferences

## Notification System

- `src/components/notifications/NotificationPreferences.tsx`: Component for managing notification preferences with tRPC integration
- `src/components/notifications/NotificationHistory.tsx`: Component for viewing and managing notification history
- `src/lib/notifications/client.ts`: Client-side notification utilities
- `src/lib/notifications/push.ts`: Push notification setup and handling
- `prisma/schema.prisma`: Added Notification model for tracking user notifications
- `src/lib/trpc/routers/user.ts`: Added notification-related tRPC procedures