# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FrameCraft is a comprehensive custom framing business management system built with React, TypeScript, Express, and PostgreSQL. It provides tools for order management, customer tracking, inventory control, pricing, and AI-powered recommendations.

## Common Development Commands

### Development
```bash
npm run dev              # Start both client (Vite) and server concurrently
npm run dev:client      # Start only the frontend (port 5173)
npm run dev:server      # Start only the backend (port 5000)
```

### Building & Production
```bash
npm run build           # Build both client and server for production
npm start               # Run production server
```

### Testing
```bash
npm test                # Run Vitest tests
npx playwright test     # Run E2E tests
```

### Database Operations
```bash
npm run db:push         # Push schema changes to Neon PostgreSQL
```

## Architecture Overview

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui (Radix UI)
- **Backend**: Express.js + TypeScript + Drizzle ORM
- **Database**: Neon PostgreSQL (serverless)
- **Authentication**: Replit Auth with OpenID Connect
- **State Management**: React Query (TanStack Query) for server state
- **Routing**: Wouter (lightweight React router)
- **Payments**: Stripe integration
- **AI**: Anthropic Claude and OpenAI APIs

### Project Structure
```
/client                 # React frontend application
  /src
    /components        # Reusable UI components
      /ui             # shadcn/ui base components
      /dashboard      # Dashboard-specific components
      /orders         # Order management components
    /pages            # Route components
    /hooks            # Custom React hooks
    /lib              # Utilities and configurations
/server                # Express backend
  /routes             # API route handlers
  /services           # Business logic services
  /middleware         # Express middleware (auth, logging, rate limiting)
  db.ts              # Database connection
  storage.ts         # Database queries and operations
/shared               # Shared code between client and server
  schema.ts          # Drizzle ORM schema and Zod validation
```

### Key API Patterns

All API routes follow REST conventions and are prefixed with `/api`:
- Authentication check: `GET /api/auth/user`
- CRUD operations use standard REST verbs (GET, POST, PUT, DELETE)
- Request validation using Zod schemas from `shared/schema.ts`
- Consistent error handling with appropriate HTTP status codes
- Rate limiting: 100 req/15min general, 10 req/15min for auth

### Database Schema

Core tables (defined in `shared/schema.ts`):
- `users` - User accounts with Replit Auth integration
- `customers` - Customer information and history
- `orders` - Order details with status tracking
- `orderLineItems` - Individual items within orders
- `inventory` - Stock management
- `wholesalerProducts` - Vendor catalog items
- `pricingRules` - Dynamic pricing configuration

### Component Patterns

- UI components use shadcn/ui pattern with compound components
- Form handling with `react-hook-form` and Zod validation
- Data fetching with React Query hooks for caching and optimistic updates
- Error boundaries for graceful error handling
- Loading states using skeleton components

### Security & Production

- Environment variables required (see `.env.example`):
  - `DATABASE_URL` - Neon PostgreSQL connection
  - `SESSION_SECRET` - Session encryption
  - `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` - AI services
  - `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY` - Payments
- Security middleware includes rate limiting, XSS protection, request validation
- Health check endpoint at `/health` for monitoring
- Comprehensive logging with performance metrics

### Development Notes

- Always verify npm server is stopped and port is freed after development
- The application uses Replit Auth - authentication is handled via OpenID Connect
- Client-side routing uses Wouter (not React Router)
- State updates use React Query's optimistic updates for better UX
- All monetary values stored as decimals with 2 decimal precision