# FrameCraft - Custom Framing Business Management System

A comprehensive, enterprise-grade business management solution for custom framing shops. Built with modern web technologies, FrameCraft streamlines operations from customer management to AI-powered frame recommendations.

## 🎯 Overview

FrameCraft is a full-stack web application that provides professional framing businesses with:
- Complete order lifecycle management (pending → measuring → designing → cutting → assembly → completed)
- Customer relationship tracking with complete history
- Real-time inventory control with vendor integration
- Dynamic pricing engine with tax calculations
- AI-powered frame recommendations using Claude and GPT-4
- Integrated payment processing via Stripe
- Business analytics and insights dashboard
- Automated customer notifications (SMS/Email)

## 🏗️ System Architecture

### How It All Works Together

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
│                        Port: 5173 (Vite)                        │
│  - React 18 with TypeScript                                     │
│  - Wouter for routing                                           │
│  - TanStack Query for server state                              │
│  - shadcn/ui components                                         │
└─────────────┬───────────────────────────────────┬───────────────┘
              │                                   │
              │         HTTP/WebSocket            │
              │                                   │
┌─────────────▼───────────────────────────────────▼───────────────┐
│                      Backend (Express.js)                        │
│                        Port: 3001                                │
│  - Express with TypeScript                                       │
│  - Multiple auth strategies (JWT/Session/Replit)                 │
│  - Rate limiting & security middleware                           │
│  - RESTful API with 40+ endpoints                               │
└─────────────┬───────────────────────────────────┬───────────────┘
              │                                   │
    ┌─────────▼──────────┐           ┌───────────▼──────────┐
    │     MongoDB        │           │    PostgreSQL        │
    │   (Auth/Sessions)  │           │  (Business Data)     │
    │   Port: 27017      │           │    Port: 5432        │
    └────────────────────┘           └───────────────────────┘
```

### Data Flow Example: Creating an Order

1. **User Action**: Customer service rep clicks "New Order" in the UI
2. **Frontend**: React form validates input using Zod schema
3. **API Call**: TanStack Query sends POST to `/api/orders`
4. **Authentication**: Middleware checks session/JWT token
5. **Validation**: Express validates request body
6. **Business Logic**: Server calculates pricing, checks inventory
7. **Database**: Order saved to PostgreSQL via Drizzle ORM
8. **AI Processing**: If enabled, Claude generates frame recommendations
9. **Response**: Server returns order with generated ID
10. **UI Update**: React Query updates cache, UI reflects new order
11. **Notifications**: Background job sends SMS/email to customer

## 🚀 Quick Start Guide

### Prerequisites

Before you begin, ensure you have the following installed:

```bash
# Check Node.js version (requires v18 or higher)
node --version

# Check npm version (requires v8 or higher)
npm --version

# Check if MongoDB is installed (optional, for auth)
mongod --version

# Check if PostgreSQL is installed (optional, can use cloud DB)
psql --version
```

### Step 1: Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd framekraft

# Install all dependencies (root, client, and server)
npm install
```

This single command will:
- Install root dependencies
- Install client dependencies in `/client`
- Install server dependencies in `/server`

### Step 2: Database Setup

#### Option A: Local Databases (Recommended for Development)

**MongoDB Setup:**
```bash
# Start MongoDB (macOS with Homebrew)
brew services start mongodb-community

# Or start MongoDB manually
mongod --dbpath /usr/local/var/mongodb

# The app will automatically create the database and collections
```

**PostgreSQL Setup (Optional - for full features):**
```bash
# Start PostgreSQL (macOS with Homebrew)
brew services start postgresql

# Create database
createdb framekraft

# Or use psql
psql -U postgres
CREATE DATABASE framekraft;
\q
```

#### Option B: Cloud Databases

**MongoDB Atlas (Free Tier):**
1. Create account at https://cloud.mongodb.com
2. Create a free cluster
3. Get connection string
4. Update `MONGODB_URI` in `.env`

**Neon PostgreSQL (Free Tier):**
1. Create account at https://neon.tech
2. Create a project
3. Get connection string
4. Update `DATABASE_URL` in `.env`

### Step 3: Environment Configuration

Create a `.env` file in the root directory:

```bash
# Copy the example file
cp .env.example .env
```

Edit `.env` with your settings:

```env
# === REQUIRED CONFIGURATION ===

# MongoDB (Primary Database for Auth)
# Local: mongodb://localhost:27017/framecraft
# Atlas: mongodb+srv://username:password@cluster.mongodb.net/framecraft
MONGODB_URI=mongodb://localhost:27017/framecraft

# PostgreSQL (Optional - for full business features)
# Local: postgresql://username:password@localhost:5432/framekraft
# Neon: postgresql://username:password@host.neon.tech/framekraft
DATABASE_URL=postgresql://postgres:password@localhost:5432/framekraft

# Server Port (3001 to avoid conflicts with AirPlay on Mac)
PORT=3001

# Session Secret (MUST be at least 32 characters)
SESSION_SECRET=your-super-secret-session-key-change-this-in-production-min-32-chars!

# Node Environment
NODE_ENV=development

# === OPTIONAL FEATURES ===

# AI Services (leave blank to disable AI features)
ANTHROPIC_API_KEY=sk-ant-xxxxx
OPENAI_API_KEY=sk-xxxxx

# Payment Processing (leave blank for demo mode)
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx

# SMS Notifications (leave blank to disable)
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE_NUMBER=+1234567890

# Email Service (leave blank to disable)
GMAIL_CLIENT_ID=xxxxx.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=xxxxx
```

### Step 4: Database Initialization

If using PostgreSQL, initialize the schema:

```bash
# Push schema to database
npm run db:push

# Or use Drizzle directly
npx drizzle-kit push
```

### Step 5: Running the Application

#### Development Mode (Recommended)

```bash
# Start both frontend and backend with hot reload
npm run dev

# This starts:
# - Frontend: http://localhost:5173 (Vite dev server)
# - Backend: http://localhost:3001 (Express API)
```

#### Run Frontend and Backend Separately

```bash
# Terminal 1: Start backend only
npm run dev:server
# Backend runs on http://localhost:3001

# Terminal 2: Start frontend only
npm run dev:client
# Frontend runs on http://localhost:5173
```

#### Production Mode

```bash
# Build the application
npm run build

# Start production server
npm start
# Serves both frontend and API on http://localhost:3001
```

### Step 6: Access the Application

1. Open your browser and navigate to:
   - Development: http://localhost:5173
   - Production: http://localhost:3001

2. Login with test credentials:
   ```
   Email: test@gmail.com
   Password: demo123456
   ```

3. Or create a new account via the registration page

## 🔧 Detailed Configuration

### Database Configuration

#### MongoDB (Required for Authentication)

MongoDB is used for:
- User authentication data
- Session management
- Real-time notifications
- Activity logs

Connection options in `.env`:
```env
# Local MongoDB
MONGODB_URI=mongodb://localhost:27017/framecraft

# MongoDB with authentication
MONGODB_URI=mongodb://username:password@localhost:27017/framecraft

# MongoDB Atlas (cloud)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/framecraft?retryWrites=true&w=majority

# MongoDB Replica Set
MONGODB_URI=mongodb://host1:27017,host2:27017,host3:27017/framecraft?replicaSet=rs0
```

#### PostgreSQL (Optional for Business Data)

PostgreSQL stores:
- Orders and order items
- Customer records
- Inventory data
- Pricing rules
- Business metrics

Connection options in `.env`:
```env
# Local PostgreSQL
DATABASE_URL=postgresql://postgres:password@localhost:5432/framekraft

# PostgreSQL with SSL
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require

# Neon Serverless PostgreSQL
DATABASE_URL=postgresql://user:pass@host.neon.tech/framekraft?sslmode=require
```

### Authentication Methods

The system supports multiple authentication strategies:

1. **Session-Based Auth** (Default)
   - Uses Express sessions with MongoDB store
   - Secure cookies with httpOnly flag
   - Automatic session refresh

2. **JWT Authentication**
   - Token-based authentication
   - Stateless authentication
   - Good for mobile apps/APIs

3. **Demo Mode**
   - No database required
   - In-memory user storage
   - Great for testing

4. **Replit Auth**
   - OAuth integration
   - Single sign-on
   - Automatic user provisioning

Configure in `server/middleware/auth.ts`:
```typescript
// Default is session-based
const authStrategy = process.env.AUTH_STRATEGY || 'session';
```

### API Endpoints

#### Authentication
```
POST   /api/auth/register     - Create new account
POST   /api/auth/login        - Login with credentials
POST   /api/auth/logout       - Logout current user
GET    /api/auth/user         - Get current user
GET    /api/auth/check        - Check auth status
```

#### Orders Management
```
GET    /api/orders            - List all orders (paginated)
GET    /api/orders/:id        - Get specific order
POST   /api/orders            - Create new order
PUT    /api/orders/:id        - Update order
DELETE /api/orders/:id        - Delete order
PUT    /api/orders/:id/status - Update order status
GET    /api/orders/kanban     - Get orders for Kanban view
```

#### Customers
```
GET    /api/customers         - List all customers
GET    /api/customers/:id     - Get customer details
POST   /api/customers         - Create customer
PUT    /api/customers/:id     - Update customer
DELETE /api/customers/:id     - Delete customer
GET    /api/customers/:id/orders - Get customer orders
```

#### Inventory
```
GET    /api/inventory         - List inventory items
GET    /api/inventory/:id     - Get item details
POST   /api/inventory         - Add inventory item
PUT    /api/inventory/:id     - Update item
DELETE /api/inventory/:id     - Remove item
POST   /api/inventory/adjust  - Adjust stock levels
GET    /api/inventory/alerts  - Get low stock alerts
```

#### AI Services
```
POST   /api/ai/recommend      - Get frame recommendations
POST   /api/ai/analyze-image  - Analyze artwork image
GET    /api/ai/insights/:orderId - Get order insights
POST   /api/ai/chat           - AI assistant chat
```

#### Business Metrics
```
GET    /api/dashboard/stats   - Dashboard statistics
GET    /api/dashboard/metrics - Business metrics
GET    /api/reports/revenue  - Revenue reports
GET    /api/reports/inventory - Inventory reports
GET    /api/reports/customers - Customer analytics
```

## 🛠️ Development Tools

### Running Tests

```bash
# Run all tests
npm test

# Run unit tests with coverage
vitest run --coverage

# Run tests in watch mode
vitest --watch

# Run specific test file
vitest run server/test/api/orders.test.ts

# Run E2E tests
npx playwright test

# Run E2E tests with UI
npx playwright test --ui

# Run specific E2E test
npx playwright test e2e/orders.spec.ts
```

### Database Management

```bash
# Generate migrations from schema changes
npx drizzle-kit generate

# Apply migrations to database
npx drizzle-kit push

# Open Drizzle Studio (database GUI)
npx drizzle-kit studio

# Drop all tables (careful!)
npx drizzle-kit drop

# Introspect existing database
npx drizzle-kit introspect
```

### Development Commands

```bash
# Check TypeScript types
npx tsc --noEmit

# Format code with Prettier (if configured)
npx prettier --write .

# Find unused dependencies
npx depcheck

# Update dependencies
npm update

# Check for security vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

### Debugging

#### Backend Debugging
```bash
# Start server with Node debugger
node --inspect server/dist/server.js

# With nodemon for auto-restart
npx nodemon --inspect server/index.ts
```

#### Frontend Debugging
1. Open Chrome DevTools
2. Go to Sources tab
3. Find your source files under webpack://
4. Set breakpoints as needed

#### Database Debugging
```bash
# Connect to MongoDB
mongosh mongodb://localhost:27017/framecraft

# Connect to PostgreSQL
psql -U postgres -d framekraft

# View MongoDB logs
tail -f /usr/local/var/log/mongodb/mongo.log

# View PostgreSQL logs
tail -f /usr/local/var/log/postgresql@14.log
```

## 🚨 Troubleshooting

### Common Issues and Solutions

#### Port Already in Use
```bash
# Error: Port 3001 is already in use

# Solution 1: Kill the process
lsof -ti:3001 | xargs kill -9

# Solution 2: Use different port
PORT=3002 npm run dev
```

#### MongoDB Connection Failed
```bash
# Error: MongoServerError: connect ECONNREFUSED 127.0.0.1:27017

# Solution: Start MongoDB
brew services start mongodb-community
# or
sudo systemctl start mongod
```

#### PostgreSQL Connection Failed
```bash
# Error: ECONNREFUSED 127.0.0.1:5432

# Solution: Start PostgreSQL
brew services start postgresql
# or
sudo systemctl start postgresql
```

#### Module Not Found
```bash
# Error: Cannot find module 'xyz'

# Solution: Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### TypeScript Errors
```bash
# Solution: Rebuild TypeScript
npm run build

# Or check types only
npx tsc --noEmit
```

#### Session Secret Error
```bash
# Error: Session secret must be at least 32 characters

# Solution: Update .env file
SESSION_SECRET=your-very-long-secret-key-at-least-32-characters-long!
```

#### CORS Issues
```bash
# Error: CORS policy blocked request

# Solution: Check frontend URL in server/index.ts
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:3001'],
  credentials: true
};
```

### Performance Issues

#### Slow Database Queries
1. Check database indexes in `shared/schema.ts`
2. Enable query logging in Drizzle
3. Use database query analyzer

#### High Memory Usage
1. Check for memory leaks with Chrome DevTools
2. Limit concurrent connections
3. Implement pagination for large datasets

#### Slow Frontend Loading
1. Check bundle size: `npm run build`
2. Enable code splitting
3. Lazy load components
4. Check React DevTools Profiler

## 📁 Project Structure Details

```
framekraft/
├── .env                    # Environment variables (create from .env.example)
├── .env.example           # Template for environment variables
├── package.json           # Root package configuration
├── tsconfig.json          # TypeScript configuration
├── drizzle.config.ts      # Drizzle ORM configuration
├── vitest.config.ts       # Vitest test configuration
├── playwright.config.ts   # Playwright E2E configuration
├── CLAUDE.md             # AI assistant instructions
├── README.md             # This file
│
├── client/               # Frontend React application
│   ├── public/          # Static assets
│   ├── src/
│   │   ├── main.tsx     # Application entry point
│   │   ├── App.tsx      # Root component
│   │   ├── components/  # UI components
│   │   │   ├── ui/      # Base shadcn/ui components
│   │   │   ├── dashboard/   # Dashboard components
│   │   │   ├── orders/      # Order management
│   │   │   ├── customers/   # Customer management
│   │   │   └── inventory/   # Inventory management
│   │   ├── pages/       # Route pages
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Orders.tsx
│   │   │   ├── Customers.tsx
│   │   │   └── Settings.tsx
│   │   ├── hooks/       # Custom React hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useOrders.ts
│   │   │   └── useCustomers.ts
│   │   ├── lib/         # Utilities
│   │   │   ├── api.ts   # API client
│   │   │   ├── utils.ts # Helper functions
│   │   │   └── constants.ts
│   │   └── styles/      # CSS/Tailwind styles
│   ├── package.json     # Frontend dependencies
│   └── vite.config.ts   # Vite configuration
│
├── server/              # Backend Express application
│   ├── index.ts        # Server entry point
│   ├── db.ts           # PostgreSQL connection
│   ├── mongodb.ts      # MongoDB connection
│   ├── storage.ts      # PostgreSQL queries
│   ├── mongoStorage.ts # MongoDB queries
│   ├── routes/         # API route handlers
│   │   ├── auth.ts     # Authentication routes
│   │   ├── orders.ts   # Order routes
│   │   ├── customers.ts # Customer routes
│   │   ├── inventory.ts # Inventory routes
│   │   ├── ai.ts       # AI service routes
│   │   └── finance.ts  # Financial routes
│   ├── services/       # Business logic
│   │   ├── ai.service.ts      # AI integrations
│   │   ├── email.service.ts   # Email service
│   │   ├── sms.service.ts     # SMS service
│   │   └── metrics.service.ts # Analytics
│   ├── middleware/     # Express middleware
│   │   ├── auth.ts     # Authentication
│   │   ├── validation.ts # Request validation
│   │   ├── rateLimiter.ts # Rate limiting
│   │   └── security.ts # Security headers
│   ├── models/         # Database models
│   ├── test/          # Server tests
│   └── package.json   # Server dependencies
│
├── shared/            # Shared code
│   ├── schema.ts     # Database schema & types
│   └── types.ts      # Shared TypeScript types
│
├── e2e/              # End-to-end tests
│   ├── auth.spec.ts
│   ├── orders.spec.ts
│   └── customers.spec.ts
│
└── migrations/       # Database migrations
    └── *.sql        # Migration files
```

## 🔐 Security Features

### Authentication & Authorization
- Multiple authentication strategies
- Password hashing with bcrypt (salt rounds: 10)
- Session management with secure cookies
- JWT tokens with expiration
- Role-based access control (RBAC)
- Account lockout after failed attempts

### API Security
- Rate limiting (100 req/15min general, 10 req/15min auth)
- Input validation with Zod schemas
- SQL injection prevention (parameterized queries)
- XSS protection (Content Security Policy)
- CSRF protection (tokens)
- CORS configuration
- Request sanitization

### Data Protection
- Encrypted sessions
- Secure cookie flags (httpOnly, secure, sameSite)
- Environment variable validation
- Sensitive data masking in logs
- PII data encryption at rest

## 🚀 Deployment Guide

### Docker Deployment

```dockerfile
# Dockerfile included in repository
docker build -t framecraft .
docker run -p 3001:3001 --env-file .env framecraft
```

### Platform-Specific Deployment

#### Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### Railway
```bash
# Install Railway CLI
npm i -g @railway/cli

# Deploy
railway up
```

#### Heroku
```bash
# Create Heroku app
heroku create framecraft

# Set environment variables
heroku config:set SESSION_SECRET=your-secret

# Deploy
git push heroku main
```

#### Traditional VPS
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start npm --name framecraft -- start

# Save PM2 configuration
pm2 save
pm2 startup
```

## 📊 Monitoring & Logs

### Application Logs
```bash
# View server logs
tail -f logs/server.log

# View error logs
tail -f logs/error.log

# View access logs
tail -f logs/access.log
```

### Performance Monitoring
- Built-in performance metrics at `/api/metrics`
- Response time tracking
- Memory usage monitoring
- Database query performance

### Health Checks
```bash
# Check application health
curl http://localhost:3001/health

# Response:
{
  "status": "healthy",
  "uptime": 3600,
  "database": "connected",
  "version": "1.0.0"
}
```

## 🤝 Contributing

Please read our contributing guidelines before submitting PRs.

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and feature requests:
- GitHub Issues: [Create an issue](https://github.com/yourrepo/issues)
- Email: support@framecraft.com
- Documentation: [Wiki](https://github.com/yourrepo/wiki)

## 🙏 Acknowledgments

- Built with React, Express, TypeScript
- UI components from shadcn/ui
- Database ORM by Drizzle
- AI powered by Anthropic Claude and OpenAI

---

Built with ❤️ for the custom framing industry

**Version:** 1.0.0 | **Last Updated:** November 2024