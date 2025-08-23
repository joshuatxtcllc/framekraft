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
vitest run --coverage   # Run tests with coverage
```

### Database Operations
```bash
npm run db:push         # Push schema changes to Neon PostgreSQL
```

## Architecture Overview

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui (Radix UI)
- **Backend**: Express.js + TypeScript + Drizzle ORM
- **Database**: Neon PostgreSQL (serverless) + MongoDB (auth/sessions)
- **Authentication**: Multiple strategies - JWT, Session-based, Replit Auth, Demo mode
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
  db.ts              # PostgreSQL connection (Drizzle)
  mongodb.ts         # MongoDB connection (for auth)
  storage.ts         # PostgreSQL queries and operations
  mongoStorage.ts    # MongoDB queries for auth/sessions
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
- `users` - User accounts with multiple auth strategies
- `customers` - Customer information and history
- `orders` - Order details with status tracking
- `orderLineItems` - Individual items within orders
- `inventory` - Stock management
- `wholesalerProducts` - Vendor catalog items
- `pricingRules` - Dynamic pricing configuration
- `aiInsights` - AI recommendations storage
- `businessMetrics` - Analytics and reporting

MongoDB collections (for authentication):
- `users` - User authentication data
- `sessions` - Session management

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
- Password hashing with bcrypt

### Development Notes

- Always verify npm server is stopped and port is freed after development
- The application supports multiple auth strategies - check `server/middleware/auth.ts`
- Client-side routing uses Wouter (not React Router)
- State updates use React Query's optimistic updates for better UX
- All monetary values stored as decimals with 2 decimal precision
- Test credentials: test@gmail.com:demo123456

## Key Technical Decisions

1. **Hybrid Database Strategy**: PostgreSQL for business data, MongoDB for authentication/sessions
2. **Wouter over React Router**: Smaller bundle size, simpler API
3. **Drizzle ORM**: Type-safe queries with excellent developer experience
4. **shadcn/ui**: Customizable, accessible component library built on Radix UI
5. **Multiple Auth Strategies**: Flexibility for different deployment scenarios (JWT, sessions, Replit Auth)
6. **Vite**: Fast development with HMR, optimized production builds

## Testing Strategy

- **Unit Tests**: Vitest with React Testing Library
  - Test files: `*.test.ts`, `*.test.tsx`, `*.spec.ts`, `*.spec.tsx`
  - Setup file: `src/test/setup.ts`
  - Coverage: Run with `vitest run --coverage`
- **E2E Tests**: Playwright
  - Test directory: `/e2e`
  - Configuration: `playwright.config.ts`
  - Runs against `http://localhost:5000`

## Common Development Tasks

### Running a Single Test
```bash
# Vitest - run specific test file
vitest run path/to/file.test.ts

# Playwright - run specific test
npx playwright test e2e/orders.spec.ts
```

### Database Migrations
```bash
# Generate migration from schema changes
npx drizzle-kit generate

# Apply migrations
npx drizzle-kit push
```

### Development Server Management
```bash
# Kill process on port 5173 (frontend)
lsof -ti:5173 | xargs kill -9

# Kill process on port 5000 (backend)
lsof -ti:5000 | xargs kill -9
```

## API Architecture

The backend follows a layered architecture:
1. **Routes** (`/server/routes/*`): HTTP request handling
2. **Middleware** (`/server/middleware/*`): Authentication, validation, rate limiting
3. **Services** (`/server/services/*`): Business logic (AI, email, search, metrics)
4. **Storage** (`storage.ts`, `mongoStorage.ts`): Database operations
5. **Schema** (`/shared/schema.ts`): Shared types and validation

## Performance Considerations

- React Query caching strategy reduces API calls
- Database indexes on frequently queried fields
- Connection pooling for database efficiency
- Lazy loading and code splitting for frontend bundles
- Optimistic UI updates for better perceived performance