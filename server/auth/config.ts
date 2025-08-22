import { SecurityConfig, RateLimitConfig } from './types';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

// Security configuration with sensible defaults
export const securityConfig: SecurityConfig = {
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
  sessionTimeout: parseInt(process.env.SESSION_TIMEOUT_HOURS || '24') * 60 * 60 * 1000,
  refreshTokenExpiry: parseInt(process.env.REFRESH_TOKEN_DAYS || '30') * 24 * 60 * 60 * 1000,
  accessTokenExpiry: parseInt(process.env.ACCESS_TOKEN_MINUTES || '15') * 60 * 1000,
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
  passwordMinLength: 8,
  passwordRequireNumbers: true,
  passwordRequireSpecialChars: true,
  passwordRequireUppercase: true,
  csrfEnabled: true,
  cookieSecure: process.env.NODE_ENV === 'production',
  cookieHttpOnly: true,
  cookieSameSite: 'strict'
};

// Rate limiting configurations - DISABLED for development
export const authRateLimitConfig: RateLimitConfig = {
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES || '15') * 60 * 1000,
  maxRequests: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || '1000'), // Increased to effectively disable
  message: 'Too many authentication attempts, please try again later',
  skipSuccessfulRequests: false
};

export const generalRateLimitConfig: RateLimitConfig = {
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES || '15') * 60 * 1000,
  maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later',
  skipSuccessfulRequests: true
};

// JWT Configuration
export const jwtConfig = {
  accessSecret: process.env.JWT_SECRET || generateSecureSecret(),
  refreshSecret: process.env.JWT_REFRESH_SECRET || generateSecureSecret(),
  accessExpiresIn: `${process.env.ACCESS_TOKEN_MINUTES || '15'}m`,
  refreshExpiresIn: `${process.env.REFRESH_TOKEN_DAYS || '30'}d`,
  issuer: 'framecraft',
  audience: 'framecraft-api'
};

// Cookie Configuration
export const cookieConfig = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: securityConfig.cookieSameSite as boolean | 'none' | 'lax' | 'strict',
  path: '/',
  domain: process.env.COOKIE_DOMAIN || undefined
};

// Session Configuration
export const sessionConfig = {
  secret: process.env.SESSION_SECRET || generateSecureSecret(),
  resave: false,
  saveUninitialized: false,
  rolling: true, // Reset expiry on activity
  cookie: {
    ...cookieConfig,
    maxAge: securityConfig.sessionTimeout
  },
  name: 'framecraft.sid' // Custom session name
};

// CORS Configuration
export const corsConfig = {
  origin: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With'],
  exposedHeaders: ['X-CSRF-Token', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  maxAge: 86400 // 24 hours
};

// Email Configuration
export const emailConfig = {
  from: process.env.EMAIL_FROM || 'noreply@framecraft.com',
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  }
};

// Frontend URL for redirects and password reset links
export const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

// Helper function to generate secure secrets (for development only)
function generateSecureSecret(): string {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Security secrets must be provided in production environment');
  }
  // Generate a warning for development
  console.warn('⚠️  Using auto-generated secret for development. Set proper secrets in production!');
  return crypto.randomBytes(32).toString('hex');
}

// Validate critical configuration
export function validateAuthConfig(): void {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (process.env.NODE_ENV === 'production') {
    if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
      errors.push('SESSION_SECRET must be at least 32 characters in production');
    }
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      errors.push('JWT_SECRET must be at least 32 characters in production');
    }
    if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET.length < 32) {
      errors.push('JWT_REFRESH_SECRET must be at least 32 characters in production');
    }
    if (!process.env.DATABASE_URL) {
      errors.push('DATABASE_URL is required');
    }
  } else {
    // Development warnings
    if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
      warnings.push('Using default SESSION_SECRET for development');
    }
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('localhost')) {
      warnings.push('Using in-memory storage for development');
    }
  }

  if (warnings.length > 0) {
    console.log('⚠️ Authentication configuration warnings:');
    warnings.forEach(warning => console.log(`   - ${warning}`));
  }

  if (errors.length > 0) {
    console.error('❌ Authentication configuration errors:');
    errors.forEach(error => console.error(`   - ${error}`));
    throw new Error('Invalid authentication configuration');
  }

  console.log('✅ Authentication configuration validated');
}