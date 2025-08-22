// Export all authentication components
export * from './types';
export * from './config';
export * from './schema';

// Services
export { authService } from './services/authService';
export { sessionService } from './services/sessionService';
export { jwtService } from './services/jwtService';
export { passwordService } from './services/passwordService';
export { emailService } from './services/emailService';

// Middleware
export {
  authenticate,
  optionalAuthenticate,
  authorize,
  verifyCsrf,
  refreshToken,
  autoRefreshToken,
  logAuthAttempt,
  requireHttps
} from './middleware/authMiddleware';

export {
  generalRateLimiter,
  authRateLimiter,
  passwordResetRateLimiter,
  emailVerificationRateLimiter,
  customLoginRateLimiter,
  apiKeyRateLimiter,
  dynamicRateLimiter,
  slowDown
} from './middleware/rateLimiting';

// Routes
export { default as authRoutes } from './routes/authRoutes';

// Configuration validator
export { validateAuthConfig } from './config';

// Initialize authentication system
import { Express } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import { corsConfig, sessionConfig, validateAuthConfig } from './config';
import authRoutes from './routes/authRoutes';
import { generalRateLimiter } from './middleware/rateLimiting';
import { requireHttps } from './middleware/authMiddleware';
import session from 'express-session';
import connectPg from 'connect-pg-simple';

/**
 * Setup authentication system
 */
export async function setupAuthenticationSystem(app: Express): Promise<void> {
  console.log('🔐 Initializing authentication system...');

  // Validate configuration
  try {
    validateAuthConfig();
  } catch (error) {
    console.error('⚠️ Authentication configuration warning:', error);
    // Continue anyway in development
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  }

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // HTTPS redirect in production
  if (process.env.NODE_ENV === 'production') {
    app.use(requireHttps);
  }

  // CORS
  app.use(cors(corsConfig));

  // Cookie parser
  app.use(cookieParser(process.env.COOKIE_SECRET));

  // Body parser (should already be set up, but ensure it's there)
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Session management - use memory store in development if DB not available
  if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL?.includes('neon')) {
    const pgSession = connectPg(session);
    app.use(session({
      store: new pgSession({
        conString: process.env.DATABASE_URL,
        tableName: 'auth_sessions_store',
        createTableIfMissing: true,
      }),
      ...sessionConfig
    }));
  } else {
    // Use memory store for development
    app.use(session({
      ...sessionConfig,
      store: undefined // Uses default memory store
    }));
  }

  // General rate limiting
  app.use('/api', generalRateLimiter);

  // Authentication routes
  app.use('/api/auth', authRoutes);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      success: true,
      message: 'Authentication system is healthy',
      timestamp: new Date().toISOString()
    });
  });

  console.log('✅ Authentication system initialized successfully');
}

/**
 * Migrate from old authentication to new system
 */
export async function migrateAuthentication(): Promise<void> {
  console.log('🔄 Starting authentication migration...');
  
  try {
    // Run database migrations for new auth tables
    const { db } = await import('../db');
    const { sql } = await import('drizzle-orm');
    
    // Create new auth tables if they don't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS auth_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        role VARCHAR(50) DEFAULT 'owner' NOT NULL,
        business_name VARCHAR(255),
        profile_image_url TEXT,
        email_verified BOOLEAN DEFAULT false NOT NULL,
        email_verification_token VARCHAR(255),
        email_verification_expires TIMESTAMP,
        password_reset_token VARCHAR(255),
        password_reset_expires TIMESTAMP,
        two_factor_enabled BOOLEAN DEFAULT false NOT NULL,
        two_factor_secret TEXT,
        login_attempts INTEGER DEFAULT 0 NOT NULL,
        locked_until TIMESTAMP,
        last_login TIMESTAMP,
        last_login_ip VARCHAR(45),
        stripe_customer_id VARCHAR(255),
        stripe_subscription_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        deleted_at TIMESTAMP
      );
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS auth_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth_users(id) ON DELETE CASCADE NOT NULL,
        refresh_token TEXT UNIQUE NOT NULL,
        refresh_token_family UUID NOT NULL,
        user_agent TEXT,
        ip_address VARCHAR(45),
        fingerprint TEXT,
        is_valid BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        revoked_at TIMESTAMP,
        revoked_reason VARCHAR(255)
      );
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS auth_audit_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth_users(id) ON DELETE SET NULL,
        event_type VARCHAR(50) NOT NULL,
        event_status VARCHAR(20) NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS auth_login_attempts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL,
        ip_address VARCHAR(45) NOT NULL,
        attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        success BOOLEAN NOT NULL,
        user_agent TEXT
      );
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS auth_csrf_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        token VARCHAR(255) UNIQUE NOT NULL,
        session_id UUID REFERENCES auth_sessions(id) ON DELETE CASCADE NOT NULL,
        used BOOLEAN DEFAULT false NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        expires_at TIMESTAMP NOT NULL
      );
    `);
    
    // Create indexes
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_auth_users_email ON auth_users(email);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions(user_id);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_auth_sessions_refresh_token ON auth_sessions(refresh_token);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_auth_audit_log_user_id ON auth_audit_log(user_id);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_auth_login_attempts_email ON auth_login_attempts(email);`);
    
    console.log('✅ Authentication migration completed successfully');
  } catch (error) {
    console.error('❌ Authentication migration failed:', error);
    throw error;
  }
}

// Auto-migrate on import if in development
if (process.env.NODE_ENV === 'development') {
  migrateAuthentication().catch(console.error);
}