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

## Comprehensive Project Analysis

### Business Domain
FrameCraft is a complete business management solution for custom framing shops, handling:
- Order lifecycle management (pending → measuring → designing → cutting → assembly → completed)
- Customer relationship management with history tracking
- Inventory control with alerts and vendor catalog integration
- Dynamic pricing with rules and tax calculations
- AI-powered frame recommendations and business insights
- Invoice generation and payment processing
- Business analytics and metrics dashboards

### Technical Architecture Details

#### Frontend (30+ screens)
- **Core Pages**: Dashboard, Orders (List/Kanban), Customers, Inventory, Invoices
- **Specialized Tools**: Virtual Frame Designer, AI Assistant, Pricing Calculator
- **Customer-Facing**: Customer Portal, Order Tracking
- **Admin**: Settings, Integrations, API Explorer, System Validation
- **40+ reusable UI components** using shadcn/ui design system
- Responsive design with Tailwind CSS
- Form validation with React Hook Form + Zod

#### Backend Architecture
- **API Design**: RESTful with 40+ endpoints
- **Database Strategy**: 
  - PostgreSQL (Neon) for business data (18 tables)
  - MongoDB for authentication/sessions
  - DynamoDB support for cloud deployments
- **Middleware Stack**:
  - Security headers (XSS, CSRF protection)
  - Rate limiting (configurable per endpoint)
  - Request sanitization and validation
  - Comprehensive logging and monitoring
- **Service Layer**: Separated business logic for AI, email, search, metrics

#### Security Implementation
- **Multiple Auth Strategies**: JWT, Session-based, Replit Auth, Demo mode
- **Password Security**: bcrypt hashing with salt
- **API Security**: Rate limiting, input validation, parameterized queries
- **Session Management**: Secure cookies, configurable expiration
- **Environment Security**: Separate configs for dev/prod

#### Third-Party Integrations
- **AI Services**: 
  - Anthropic Claude (Sonnet 4) for recommendations
  - OpenAI GPT-4 for image analysis
- **Payment Processing**: Full Stripe integration with webhooks
- **Communications**: Twilio SMS, Email service with templates
- **Cloud Services**: Optimized for Replit, Railway, Vercel deployments

### Database Schema (Key Relationships)
- **Users** → manage multiple **Orders**
- **Customers** → have multiple **Orders** and **Invoices**
- **Orders** → contain **OrderLineItems** → reference **WholesalerProducts**
- **Inventory** tracks stock levels for products
- **PricingRules** and **PriceStructure** for dynamic pricing
- **AIInsights** stores recommendations per order
- **BusinessMetrics** for analytics and reporting

### Performance Optimizations
- Vite for fast development with HMR
- React Query for intelligent data caching
- Database indexes on frequently queried fields
- Lazy loading and code splitting
- Optimistic UI updates for better UX
- Connection pooling for database efficiency

### Testing & Quality
- Unit tests with Vitest
- E2E tests with Playwright
- TypeScript strict mode
- Zod runtime validation
- Error boundaries for graceful failures
- Comprehensive error logging

### Notable Technical Decisions
1. **Wouter over React Router**: Smaller bundle size, simpler API
2. **Drizzle ORM**: Type-safe queries with excellent DX
3. **shadcn/ui**: Customizable component library
4. **TanStack Query**: Powerful server state management
5. **Hybrid Database**: PostgreSQL for data, MongoDB for auth
6. **Multiple Auth**: Flexibility for different deployment scenarios

### Development Best Practices
- Modular architecture with clear separation of concerns
- Shared types between frontend and backend
- Consistent error handling patterns
- Comprehensive logging for debugging
- Environment-based configuration
- Security-first approach in all features