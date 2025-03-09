# LawnSync.ai

Smart lawn care management powered by AI.

## Features

- User Management & Authentication
- Lawn Profile Management
- Weather Integration & Alerts
- Scheduling System
- AI-Powered Recommendations

## Tech Stack

- **Frontend**: Next.js, React, TailwindCSS
- **Backend**: tRPC, Prisma, PostgreSQL
- **Authentication**: NextAuth.js
- **APIs**: OpenWeather, Stripe, Resend
- **Infrastructure**: Vercel, Redis (Upstash)

## Getting Started

### Prerequisites

- Node.js 20.x or later
- PostgreSQL
- Redis (via Upstash)

### Environment Setup

1. Clone the repository
```bash
git clone https://github.com/yourusername/lawnsync.ai.git
cd lawnsync.ai
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env.local
```

4. Set up the database
```bash
npx prisma migrate dev
npx prisma db seed
```

5. Start the development server
```bash
npm run dev
```

### Environment Variables

Required environment variables:

```env
# Database
DATABASE_URL=

# Authentication
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# External Services
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
OPENWEATHER_API_KEY=

# Rate Limiting
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

## Development

### Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run test` - Run tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run lint` - Run linter

### Testing

- Unit tests with Jest
- E2E tests with Playwright
- API tests with Cypress

### Deployment

Deployments are handled through Vercel:

- Production: https://lawnsync.ai
- Staging: https://staging.lawnsync.ai

## Architecture

### Directory Structure

```
├── src/
│   ├── app/          # Next.js app router
│   ├── components/   # React components
│   ├── lib/          # Utility functions
│   ├── server/       # Server-side code
│   └── types/        # TypeScript types
├── prisma/           # Database schema
├── public/           # Static assets
└── scripts/          # Utility scripts
```

### Key Components

- **Authentication**: NextAuth.js with email/password and OAuth
- **API Layer**: tRPC for type-safe APIs
- **Database**: Prisma ORM with PostgreSQL
- **Monitoring**: Custom monitoring system
- **Rate Limiting**: Upstash Redis implementation

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests
4. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
