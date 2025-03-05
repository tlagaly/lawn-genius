# Lawn Genius Project Overview

## Project Description
Lawn Genius is a modern web application designed to help homeowners manage and maintain their lawns effectively. The application provides personalized lawn care recommendations, scheduling tools, and expert guidance through a SaaS model.

## Tech Stack
- Next.js 14 (React Framework)
- TypeScript (Type Safety)
- PostgreSQL (Database)
- Prisma (ORM)
- NextAuth.js (Authentication)
- tRPC (API Layer)
- React Query & Zustand (State Management)
- Stripe (Payment Processing)
- Tailwind CSS (Styling)
- Radix UI (Components)
- ESLint (Code Quality)
- Node.js v18.18.0

## Project Structure
- `/src` - Source code directory
  - `/app` - Next.js App Router pages and layouts
  - `/components` - Reusable React components
  - `/lib` - Utility functions and shared logic
    - `/api` - API utilities
    - `/auth` - Authentication configuration
    - `/db` - Database utilities
    - `/trpc` - tRPC configuration
    - `/stripe` - Payment processing
    - `/utils` - Helper functions
  - `/server` - Server-side code
  - `/types` - TypeScript type definitions
- `/prisma` - Database schema and migrations
- `/memory-bank` - Project documentation and development tracking

## Key Features (Planned)
1. User Management
   - Authentication
   - Profile management
   - Subscription handling

2. Lawn Profiles
   - Multiple lawn management
   - Soil and grass type tracking
   - Location-based settings

3. Treatment Scheduling
   - Customized care schedules
   - Task tracking
   - Weather-based adjustments

4. Subscription System
   - Tiered pricing (Basic, Pro, Enterprise)
   - Payment processing
   - Feature access control

5. Weather Integration
   - Local weather data
   - Treatment recommendations
   - Schedule adjustments

## Development Status
- Base marketing site completed
- SaaS infrastructure implemented
- Ready for UI development
- Repository initialized on GitHub

## Next Phase
- Implement user interface components
- Connect frontend to backend services
- Add weather integration
- Set up notification system
- Deploy staging environment

## Development Guidelines
- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Implement responsive design
- Follow Next.js App Router conventions
- Maintain code quality with ESLint
- Document development sessions
- Track technical decisions