# FrameCraft

A comprehensive custom framing business management system built with React, TypeScript, Express, and PostgreSQL.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL database (using Neon serverless PostgreSQL)

## Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd framekraft
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Variables**
   
   Create a `.env` file in the root directory with the following variables:
   ```env
   DATABASE_URL=your_neon_postgresql_connection_string
   SESSION_SECRET=your_session_secret
   ANTHROPIC_API_KEY=your_anthropic_api_key
   OPENAI_API_KEY=your_openai_api_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   ```

4. **Database Setup**
   ```bash
   npm run db:push
   ```

## Running the Application

### Development Mode

Run both frontend and backend concurrently:
```bash
npm run dev
```

Or run them separately:

**Frontend only** (runs on port 5173):
```bash
npm run dev:client
```

**Backend only** (runs on port 5000):
```bash
npm run dev:server
```

### Production Mode

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

## Testing

Run unit tests:
```bash
npm test
```

Run E2E tests:
```bash
npx playwright test
```

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, TypeScript, Drizzle ORM
- **Database**: Neon PostgreSQL (serverless)
- **Authentication**: Replit Auth with OpenID Connect
- **State Management**: React Query (TanStack Query)
- **Routing**: Wouter
- **Payments**: Stripe
- **AI**: Anthropic Claude and OpenAI APIs

## API Documentation

The API follows REST conventions with all routes prefixed with `/api`:
- Authentication: `GET /api/auth/user`
- Health check: `GET /health`
- All CRUD operations use standard REST verbs (GET, POST, PUT, DELETE)

## License

[Your License Here]





  3. Navigate to http://localhost:3000
  4. Click "Sign In" or go to http://localhost:3000/login