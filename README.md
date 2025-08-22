# FrameCraft - Custom Framing Business Management System

A comprehensive, enterprise-grade business management solution for custom framing shops. Built with modern web technologies, FrameCraft streamlines operations from customer management to AI-powered frame recommendations.

## 🎯 Overview

FrameCraft is a full-stack web application that provides professional framing businesses with:
- Complete order lifecycle management
- Customer relationship tracking
- Inventory control with vendor integration
- Dynamic pricing and invoicing
- AI-powered recommendations
- Payment processing
- Business analytics and insights

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL database (Neon serverless recommended)
- MongoDB (for authentication - optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd framekraft
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   
   Create a `.env` file in the root directory:
   ```env
   # Required
   DATABASE_URL=your_neon_postgresql_connection_string
   SESSION_SECRET=your_session_secret_min_32_chars
   
   # Optional (for full features)
   ANTHROPIC_API_KEY=your_anthropic_api_key
   OPENAI_API_KEY=your_openai_api_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   TWILIO_ACCOUNT_SID=your_twilio_sid
   TWILIO_AUTH_TOKEN=your_twilio_token
   TWILIO_PHONE_NUMBER=your_twilio_phone
   ```

4. **Database Setup**
   ```bash
   npm run db:push
   ```

### Running the Application

**Development Mode**
```bash
npm run dev              # Start both client and server
npm run dev:client      # Frontend only (port 5173)
npm run dev:server      # Backend only (port 5000)
```

**Production Mode**
```bash
npm run build           # Build for production
npm start               # Start production server
```

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite (Lightning-fast HMR)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Routing**: Wouter (lightweight router)
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod validation

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **ORM**: Drizzle ORM (type-safe SQL)
- **Databases**: 
  - PostgreSQL (Neon) - Primary data
  - MongoDB - Authentication/sessions
  - DynamoDB - Optional cloud support

### Integrations
- **AI**: Anthropic Claude Sonnet 4 & OpenAI GPT-4
- **Payments**: Stripe
- **Communications**: Twilio (SMS), Email services
- **Authentication**: JWT, Sessions, Replit Auth

## 📁 Project Structure

```
framekraft/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # UI components (40+ reusable)
│   │   ├── pages/         # Route pages (30+ screens)
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities
├── server/                 # Express backend
│   ├── routes/            # API endpoints (40+ routes)
│   ├── services/          # Business logic
│   ├── middleware/        # Auth, security, logging
│   └── models/            # Database models
└── shared/                # Shared types and schemas
    └── schema.ts          # Drizzle ORM + Zod validation
```

## 🔥 Key Features

### Business Operations
- **Order Management**: Full lifecycle tracking (pending → completed)
- **Kanban Board**: Visual workflow management
- **Customer CRM**: Complete history and communications
- **Inventory Control**: Stock levels, alerts, vendor catalogs
- **Pricing Engine**: Dynamic rules, discounts, tax calculations

### AI-Powered Tools
- **Frame Recommendations**: Style and material suggestions
- **Artwork Analysis**: Image processing for optimal framing
- **Business Insights**: Revenue opportunities and optimization
- **Customer Analytics**: Behavior patterns and preferences

### Financial Management
- **Invoicing**: Professional invoice generation
- **Payment Processing**: Integrated Stripe payments
- **Receivables**: Outstanding balance tracking
- **Reporting**: Comprehensive business metrics

### Customer Experience
- **Virtual Frame Designer**: Visual frame preview tool
- **Customer Portal**: Self-service order tracking
- **Communication**: Automated SMS/email notifications
- **Order Tracking**: Real-time status updates

## 🔐 Security

- **Authentication**: Multiple strategies (JWT, Sessions, OAuth)
- **Authorization**: Role-based access control
- **API Security**: Rate limiting, input validation
- **Data Protection**: Encrypted sessions, secure cookies
- **SQL Injection Prevention**: Parameterized queries
- **XSS/CSRF Protection**: Security headers and tokens

## 📊 Database Schema

The application uses 18 tables including:
- `users` - User accounts and roles
- `customers` - Customer profiles
- `orders` - Order management
- `inventory` - Stock tracking
- `invoices` - Billing records
- `wholesalerProducts` - Vendor catalogs
- `aiInsights` - AI recommendations
- And more...

## 🧪 Testing

```bash
npm test                    # Run unit tests (Vitest)
npx playwright test        # Run E2E tests
```

## 📚 API Documentation

RESTful API with 40+ endpoints:
- `/api/auth/*` - Authentication
- `/api/customers/*` - Customer management
- `/api/orders/*` - Order operations
- `/api/inventory/*` - Stock control
- `/api/invoices/*` - Billing
- `/api/ai/*` - AI services
- `/api/dashboard/*` - Analytics

All endpoints follow REST conventions with proper HTTP status codes and JSON responses.

## 🚀 Deployment

The application is optimized for:
- **Replit**: Built-in configuration
- **Railway**: Simple deployment
- **Vercel**: Frontend hosting
- **Docker**: Container support
- **Traditional VPS**: Node.js deployment

## 📈 Performance

- Vite for instant HMR in development
- React Query for intelligent caching
- Database indexing on key fields
- Lazy loading and code splitting
- Optimistic UI updates
- Connection pooling

## 🤝 Contributing

Please read our contributing guidelines before submitting PRs.

## 📄 License

[Your License Here]

## 🆘 Support

For issues and feature requests, please use the GitHub issues tracker.

---

Built with ❤️ for the custom framing industry