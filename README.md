# Lawn Genius

A smart lawn care management system that helps users maintain their lawns with weather-optimized treatment scheduling.

## Features

- **Smart Scheduling**: Weather-aware treatment scheduling with real-time monitoring
- **Weather Integration**: Real-time weather data and forecasting for optimal treatment timing
- **Treatment Management**: Track and manage lawn care treatments with effectiveness monitoring
- **Weather Alerts**: Automated alerts for unfavorable weather conditions with rescheduling suggestions
- **Multi-Lawn Support**: Manage multiple lawn profiles with location-specific care
- **Subscription Plans**: Tiered access to advanced features

## Tech Stack

- **Frontend**: Next.js 13+ with App Router
- **Backend**: TRPC for type-safe APIs
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS
- **Weather Data**: OpenWeather API
- **Payments**: Stripe Integration

## Getting Started

1. Clone the repository
```bash
git clone https://github.com/yourusername/lawn-genius.git
cd lawn-genius
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
```
Fill in the required environment variables in `.env`

4. Set up the database
```bash
npx prisma generate
npx prisma db push
```

5. Run the development server
```bash
npm run dev
```

## Environment Variables

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Secret for NextAuth.js
- `OPENWEATHER_API_KEY`: API key for OpenWeather
- `STRIPE_SECRET_KEY`: Stripe secret key
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook secret
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Stripe publishable key

## Project Structure

- `/src/app`: Next.js 13+ app router pages and layouts
- `/src/components`: React components
- `/src/lib`: Utility functions and service integrations
- `/src/types`: TypeScript type definitions
- `/prisma`: Database schema and migrations
- `/memory-bank`: Project documentation and architecture decisions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License

MIT License - see LICENSE file for details
