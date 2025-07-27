# FrameCraft - AI-Powered Custom Framing Business Management Platform

## Overview

FrameCraft is a comprehensive full-stack web application designed to streamline custom framing business operations through AI-powered insights and automation. The platform combines traditional business management features with advanced AI capabilities to help framing shops improve efficiency, customer service, and profitability.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (July 27, 2025)

### Comprehensive Pricing Logic Integration (July 27, 2025)
✓ **Implemented Complete Houston Heights Pricing Formula**: Integrated exact pricing logic from pricing_logic_1753223216760.md with Houston Heights market adjustments (frame reduced to 16.67%, glass reduced to 45%)
✓ **Added Sliding Scale Markup System**: Frame markup varies from 2.5× to 4.5× based on price per foot ($5+ luxury to $0.99-$1.99 low cost), mat markup from 1.4× to 2.0× based on united inches, glass markup from 1.25× to 2.0× based on size
✓ **Created Comprehensive Pricing Calculator**: New `client/src/lib/pricingCalculator.ts` module with `calculateFramingPrice()` function implementing all pricing formulas, markup calculations, and Houston Heights adjustments
✓ **Enhanced Order Form with Detailed Breakdowns**: Order creation now shows comprehensive pricing details including frame perimeter calculations, united inches methodology, markup factors, and Houston Heights adjustments
✓ **Fixed All Schema and Type Issues**: Resolved LSP diagnostics errors and ensured proper data flow between pricing calculator and order form components
✓ **Added Industry-Standard United Inches System**: Proper implementation of custom framing industry standard where united inches = artwork width + height + (mat width × 4 sides)

## Previous Changes (July 25, 2025)

### Production Readiness Updates (July 25, 2025)
✓ **Enhanced Security**: Added comprehensive security middleware including rate limiting (100 req/15min API, 10 req/15min auth), security headers (XSS protection, content-type sniffing prevention), and request sanitization to prevent malicious input
✓ **Error Handling & Monitoring**: Implemented React error boundaries, structured request/response logging, health check endpoint (/health), and production-safe error messages that don't expose internal details
✓ **Performance Optimization**: Added loading spinners, smooth drag-and-drop without page refreshes using React Query mutations, and memory monitoring with automatic slow query detection (>1 second alerts)
✓ **UI/UX Improvements**: Enhanced existing orders page with table/kanban view toggle, created comprehensive analytics page with business insights, and improved navigation with production tools section
✓ **Deployment Ready**: Created detailed deployment guide, environment configuration example, and comprehensive production checklist covering security, performance, and monitoring requirements

## Previous Changes (July 24, 2025)

✓ **Implemented Exact User-Specified Pricing Formula**: Frame pricing correctly accounts for mat size impact - 16x20 artwork with 2" mat becomes 20x24 frame (88" perimeter ÷ 12 = 7.33 feet × price per foot × sliding scale markup)
✓ **Updated Mat Pricing to United Inches Method**: Mat pricing using simple united inches formula (16+20=36 united inches × $0.0109 per square inch) based on 32"×40" board at $14 cost
✓ **Removed All Location-Specific Discounts**: Eliminated Houston Heights market adjustments and location-based pricing strategies to use industry-standard methodology
✓ **Updated Labor and Overhead Costs**: Labor cost increased from $25 to $38, added $54 overhead cost per frame job for accurate business cost accounting
✓ **Fixed Critical Data Persistence Issues**: Resolved all database connection and API request problems preventing orders, customers, and invoices from saving
✓ **Enhanced Price Breakdown Display**: Shows detailed calculation steps including actual frame dimensions (20x24), perimeter calculation, feet conversion, wholesale cost, and sliding scale markup factors
✓ **Fixed Mat Size Impact on Frame/Glass**: Frame and glass sizes now correctly adjust when mat is added - 16x20 artwork becomes 20x24 frame/glass with 2" mat border
✓ **Added Searchable Frame and Mat Dropdowns**: Enhanced order form with searchable comboboxes for frame styles and mat colors, making it easy to find specific options from large inventories

**Note**: Authentication is required for all data operations. Users must be logged in via Replit Auth to create customers, orders, or invoices.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: React Query (TanStack Query) for server state management
- **Styling**: Tailwind CSS with custom design system based on wood/framing theme
- **UI Components**: Radix UI primitives with custom theming via shadcn/ui

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: PostgreSQL-based session store

### Data Layer
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema**: Shared TypeScript schemas between client and server
- **Migrations**: Drizzle Kit for database schema management
- **Connection**: Neon serverless driver for PostgreSQL

## Key Components

### Core Business Features
1. **Customer Management**: Full CRUD operations for customer data with relationship tracking
2. **Order Management**: Comprehensive order lifecycle tracking with custom framing specifications
3. **Dashboard**: Real-time business metrics and performance indicators
4. **Project Tracking**: Multi-step project workflow management

### AI-Powered Features
1. **AI Assistant**: Conversational interface for business insights and automation
2. **Business Analytics**: AI-generated recommendations and insights
3. **Pricing Optimization**: Intelligent pricing suggestions based on market data
4. **Production Optimization**: Workflow efficiency recommendations

### Technical Components
1. **Authentication System**: Replit Auth integration with user profile management
2. **API Layer**: RESTful endpoints with Express.js
3. **Database Schema**: Comprehensive data models for all business entities
4. **UI Component Library**: Reusable components built on Radix UI

## Data Flow

### Client-Server Communication
1. **Client** makes HTTP requests to Express server
2. **Server** authenticates requests using Replit Auth middleware
3. **Database** operations performed through Drizzle ORM
4. **Response** data serialized and sent back to client
5. **Client** updates UI using React Query cache management

### AI Integration
1. **User** interacts with AI Assistant interface
2. **Context** gathered from business data and user input
3. **AI Service** processes requests using Anthropic Claude API
4. **Insights** generated and stored in database
5. **UI** updates with AI recommendations and responses

### Database Schema
- **Users**: Authentication and profile data
- **Customers**: Customer information and contact details
- **Orders**: Order specifications and status tracking
- **AI Insights**: Generated business recommendations
- **Sessions**: Authentication session management

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **@anthropic-ai/sdk**: AI integration for business insights
- **@tanstack/react-query**: Client-side state management
- **drizzle-orm**: Type-safe database operations
- **express**: Web server framework

### UI Dependencies
- **@radix-ui/react-***: Accessible UI component primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **react-hook-form**: Form state management
- **wouter**: Lightweight routing

### Development Dependencies
- **vite**: Build tool and development server
- **typescript**: Type checking and compilation
- **tsx**: TypeScript execution for server development

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server for client, tsx for server
- **Hot Reload**: Vite HMR for client, tsx watch mode for server
- **Database**: Neon Database development instance

### Production Build
- **Client Build**: Vite builds to `dist/public` directory
- **Server Build**: esbuild bundles server code to `dist/index.js`
- **Static Serving**: Express serves built client files from `dist/public`

### Environment Configuration
- **Database**: Connection via `DATABASE_URL` environment variable
- **AI Service**: Anthropic API key via `ANTHROPIC_API_KEY`
- **Session**: Secret key via `SESSION_SECRET`
- **Authentication**: Replit Auth configuration

### Key Architectural Decisions

1. **Monorepo Structure**: Client and server code in same repository for simplified development
2. **Shared Schema**: Common TypeScript types between client and server for consistency
3. **PostgreSQL Choice**: Relational database for complex business relationships
4. **React Query**: Chosen for robust server state management and caching
5. **Drizzle ORM**: Type-safe database operations with good TypeScript integration
6. **Replit Auth**: Integrated authentication system for simplified user management
7. **AI Integration**: Anthropic Claude for advanced business intelligence features

The architecture prioritizes developer experience, type safety, and scalability while providing a comprehensive business management solution for custom framing operations.