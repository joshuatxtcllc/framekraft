import rateLimit from 'express-rate-limit';
import slowDownLib from 'express-slow-down';
import { Request, Response } from 'express';
import { authRateLimitConfig, generalRateLimitConfig } from '../config';
import { db } from '../../db';
import { authLoginAttempts } from '../schema';
import { and, eq, gte } from 'drizzle-orm';

/**
 * General rate limiter for all API endpoints
 */
export const generalRateLimiter = rateLimit({
  windowMs: generalRateLimitConfig.windowMs,
  max: generalRateLimitConfig.maxRequests,
  message: generalRateLimitConfig.message,
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
  skipSuccessfulRequests: generalRateLimitConfig.skipSuccessfulRequests,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: generalRateLimitConfig.message,
      retryAfter: req.rateLimit?.resetTime
    });
  },
  // Use default keyGenerator which handles IPv6 properly
});

/**
 * Strict rate limiter for authentication endpoints
 */
export const authRateLimiter = rateLimit({
  windowMs: authRateLimitConfig.windowMs,
  max: authRateLimitConfig.maxRequests,
  message: authRateLimitConfig.message,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: authRateLimitConfig.skipSuccessfulRequests,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: authRateLimitConfig.message,
      retryAfter: req.rateLimit?.resetTime
    });
  },
  // Use default keyGenerator for proper IPv6 handling
});

/**
 * Password reset rate limiter (very strict)
 */
export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Only 3 attempts per hour
  message: 'Too many password reset attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Too many password reset attempts, please try again later',
      retryAfter: req.rateLimit?.resetTime
    });
  }
});

/**
 * Email verification rate limiter
 */
export const emailVerificationRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 attempts per hour
  message: 'Too many verification attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Custom rate limiter based on database tracking
 */
export async function customLoginRateLimiter(
  req: Request,
  res: Response,
  next: Function
): Promise<void> {
  const email = req.body?.email?.toLowerCase();
  const ipAddress = req.ip || req.socket.remoteAddress || '';

  if (!email || !ipAddress) {
    return next();
  }

  try {
    // Check recent failed attempts from this IP/email combination
    const windowStart = new Date(Date.now() - authRateLimitConfig.windowMs);
    
    const recentAttempts = await db.select()
      .from(authLoginAttempts)
      .where(
        and(
          eq(authLoginAttempts.email, email),
          eq(authLoginAttempts.ipAddress, ipAddress),
          gte(authLoginAttempts.attemptTime, windowStart)
        )
      );

    const failedAttempts = recentAttempts.filter(a => !a.success);

    // Block if too many failed attempts
    if (failedAttempts.length >= authRateLimitConfig.maxRequests) {
      const oldestAttempt = failedAttempts[0];
      const resetTime = new Date(oldestAttempt.attemptTime.getTime() + authRateLimitConfig.windowMs);
      const minutesLeft = Math.ceil((resetTime.getTime() - Date.now()) / 60000);

      res.status(429).json({
        success: false,
        message: `Too many failed login attempts. Please try again in ${minutesLeft} minutes.`,
        retryAfter: resetTime.toISOString()
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Rate limiter error:', error);
    // Don't block on error
    next();
  }
}

/**
 * API key rate limiter for external integrations
 */
export const apiKeyRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: 'API rate limit exceeded',
  standardHeaders: true,
  legacyHeaders: false,
  // Use default keyGenerator for proper IPv6 handling
});

/**
 * Dynamic rate limiter that adjusts based on user role
 */
export function dynamicRateLimiter(defaultMax: number = 100) {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: (req: Request) => {
      // Adjust rate limit based on user role
      const user = (req as any).user;
      
      if (!user) return defaultMax;
      
      switch (user.role) {
        case 'owner':
        case 'admin':
          return defaultMax * 2; // Double limit for admins
        case 'employee':
          return defaultMax;
        case 'viewer':
          return Math.floor(defaultMax * 0.5); // Half limit for viewers
        default:
          return defaultMax;
      }
    },
    message: 'Rate limit exceeded',
    standardHeaders: true,
    legacyHeaders: false
  });
}

/**
 * Slow down repeated requests (alternative to hard blocking)
 */
export const slowDown = slowDownLib({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Allow 50 requests per window without delay
  delayMs: () => 500, // Add 500ms delay per request after delayAfter
  maxDelayMs: 20000, // Maximum delay of 20 seconds
  skipSuccessfulRequests: true
});

/**
 * Cleanup old login attempts from database
 */
export async function cleanupOldLoginAttempts(): Promise<void> {
  try {
    const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days old
    
    await db.delete(authLoginAttempts)
      .where(gte(cutoffDate, authLoginAttempts.attemptTime));
    
    console.log('✅ Cleaned up old login attempts');
  } catch (error) {
    console.error('Failed to cleanup login attempts:', error);
  }
}

// Schedule cleanup to run daily
if (process.env.NODE_ENV === 'production') {
  setInterval(cleanupOldLoginAttempts, 24 * 60 * 60 * 1000); // Run once per day
}