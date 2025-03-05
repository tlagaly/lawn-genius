# Codebase Map

## App Structure

```
src/
├── app/                      # Next.js app router pages
│   ├── auth/                # Authentication pages
│   │   ├── login/          # Login page
│   │   ├── register/       # Registration page
│   │   └── forgot-password/ # Password reset page
│   └── dashboard/          # Protected dashboard pages
│       └── layout.tsx      # Dashboard layout with navigation
├── components/             # React components
│   ├── auth/              # Authentication components
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── ForgotPasswordForm.tsx
│   ├── dashboard/         # Dashboard components
│   │   └── DashboardNav.tsx
│   └── ui/               # Shared UI components
├── lib/                  # Utility functions and configurations
│   ├── auth/            # Authentication utilities
│   │   └── auth-options.ts
│   ├── db/             # Database utilities
│   │   └── prisma.ts
│   └── trpc/          # TRPC setup and routers
│       ├── client.ts
│       ├── context.ts
│       ├── root.ts
│       └── routers/
│           ├── user.ts
│           ├── lawn.ts
│           ├── schedule.ts
│           └── subscription.ts
└── types/             # TypeScript type definitions
    └── next-auth.d.ts
```

## Key Files

- `auth-options.ts`: NextAuth.js configuration with email/password and Google providers
- `prisma.ts`: Prisma client configuration
- `trpc/client.ts`: TRPC client setup for frontend
- `trpc/routers/user.ts`: User management procedures including auth operations
- `dashboard/layout.tsx`: Protected layout for authenticated pages