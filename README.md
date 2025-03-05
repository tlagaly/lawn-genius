# Lawn Genius

A modern SaaS application for personalized lawn care management.

## Features

- 🌱 Personalized lawn care schedules
- 🌡️ Weather-based recommendations
- 📊 Progress tracking
- 📱 Treatment reminders
- 💳 Subscription management

## Tech Stack

- **Framework:** Next.js 14 with App Router
- **Language:** TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** NextAuth.js
- **API:** tRPC for end-to-end type safety
- **State Management:** React Query & Zustand
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI
- **Payments:** Stripe
- **Forms:** React Hook Form & Zod

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/tylerlagaly/lawn-genius.git
   cd lawn-genius
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Fill in your environment variables in `.env`

4. Set up the database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
/src
├── app/                    # Next.js App Router pages
├── components/            # React components
├── lib/                  # Utility functions
│   ├── api/             # API utilities
│   ├── auth/            # Authentication
│   ├── db/              # Database utilities
│   ├── trpc/            # tRPC configuration
│   └── utils/           # Helper functions
├── server/               # Server-side code
└── types/               # TypeScript types
```

## Environment Variables

Required environment variables:

```
# Database
DATABASE_URL=

# Authentication
NEXTAUTH_URL=
NEXTAUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Stripe
STRIPE_PUBLIC_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# OpenWeather
OPENWEATHER_API_KEY=
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
