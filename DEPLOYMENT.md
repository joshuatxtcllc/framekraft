# FrameCraft Deployment Guide

## Production Readiness Checklist

### ✅ Security
- **Rate Limiting**: Implemented for API endpoints (100 req/15min) and auth endpoints (10 req/15min)
- **Security Headers**: XSS protection, content type sniffing prevention, frame options
- **Request Validation**: Zod schema validation for all API endpoints
- **Input Sanitization**: Null byte removal and request sanitization
- **Error Handling**: Production-safe error messages (no internal details exposed)
- **Session Security**: Secure session management with PostgreSQL store

### ✅ Performance & Reliability
- **Error Boundaries**: React error boundaries to prevent app crashes
- **Loading States**: Consistent loading spinners and skeleton screens
- **Smooth UX**: React Query for optimistic updates and caching
- **Database Connection**: Neon serverless PostgreSQL with connection pooling
- **Memory Management**: Process monitoring and memory usage tracking

### ✅ Monitoring & Logging
- **Health Check Endpoint**: `/health` endpoint for monitoring service health
- **Request Logging**: Comprehensive request/response logging with performance metrics
- **Error Logging**: Structured error logging with stack traces
- **Slow Query Detection**: Automatic detection of requests taking >1 second
- **Memory Monitoring**: Real-time memory usage tracking

### ✅ Development Experience
- **TypeScript**: Full type safety across client and server
- **Hot Reload**: Vite HMR for fast development
- **Database Migrations**: Drizzle Kit for schema management
- **Environment Configuration**: Comprehensive `.env.example` file

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Required
DATABASE_URL=your_neon_database_url
SESSION_SECRET=your_secure_session_secret

# Optional AI Features
ANTHROPIC_API_KEY=your_anthropic_key
OPENAI_API_KEY=your_openai_key

# Optional Payment Processing
STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_PUBLISHABLE_KEY=your_stripe_public

# Production Settings
NODE_ENV=production
PORT=5000
```

## Deployment Commands

### Build for Production
```bash
npm run build    # Builds both client and server
```

### Start Production Server
```bash
npm start        # Runs the production build
```

### Database Schema
```bash
npm run db:push  # Push schema changes to database
```

## Architecture Overview

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Express.js + TypeScript + Drizzle ORM
- **Database**: Neon PostgreSQL (serverless)
- **Authentication**: Replit Auth with OpenID Connect
- **State Management**: React Query for server state
- **UI Components**: Radix UI with shadcn/ui styling

## Production Deployment Options

### Replit Deployments (Recommended)
1. Click the "Deploy" button in Replit
2. Configure environment variables in the deployment settings
3. The app will be automatically built and deployed

### Manual Deployment
1. Set all required environment variables
2. Run `npm run build` to create production build
3. Run `npm start` to start the production server
4. Ensure PostgreSQL database is accessible
5. Configure reverse proxy if needed (nginx, cloudflare, etc.)

## Monitoring

### Health Check
The application provides a health check endpoint at `/health` that returns:
- Application status (healthy/unhealthy)
- Database connectivity and response time  
- Memory usage statistics
- Application uptime

Example response:
```json
{
  "status": "healthy",
  "timestamp": "2025-07-25T22:33:00.000Z",
  "version": "1.0.0",
  "uptime": 3600,
  "database": {
    "status": "connected",
    "responseTime": 45
  },
  "memory": {
    "used": 125,
    "total": 512,
    "percentage": 24
  }
}
```

### Key Metrics to Monitor
- Response time (alerts if >1 second)
- Error rate (4xx/5xx responses)
- Memory usage (alerts if >90%)
- Database connection health
- Rate limit violations

## Security Considerations

- All API requests are rate limited
- Request/response data is logged for security analysis
- Authentication failures are logged and monitored
- SQL injection protection via Drizzle ORM
- XSS protection via security headers
- Input validation on all endpoints

## Scaling Considerations

The application is designed to scale horizontally:
- Stateless server architecture
- Session data stored in PostgreSQL (not memory)
- Database connection pooling via Neon
- Rate limiting uses in-memory store (consider Redis for multi-instance)

For high-traffic scenarios, consider:
- Implementing Redis for session storage and rate limiting
- Adding database read replicas
- Using a CDN for static assets
- Implementing horizontal pod autoscaling