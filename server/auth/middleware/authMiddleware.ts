import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { jwtService } from '../services/jwtService';
import { sessionService } from '../services/sessionService';
import { authService } from '../services/authService';
import { securityConfig } from '../config';

/**
 * Authentication middleware - Verifies JWT tokens and loads user
 */
export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = jwtService.extractTokenFromHeader(authHeader);

    if (!token) {
      res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
      return;
    }

    // Verify access token
    const verification = jwtService.verifyAccessToken(token);
    
    if (!verification.valid || !verification.payload) {
      // Check if token is expired
      if (verification.expired) {
        res.status(401).json({ 
          success: false, 
          message: 'Token expired', 
          code: 'TOKEN_EXPIRED' 
        });
      } else {
        res.status(401).json({ 
          success: false, 
          message: 'Invalid token' 
        });
      }
      return;
    }

    // Get session
    const session = await sessionService.getSession(verification.payload.sessionId);
    if (!session) {
      res.status(401).json({ 
        success: false, 
        message: 'Session expired or invalid' 
      });
      return;
    }

    // Get user
    const user = await authService.getUserById(verification.payload.userId);
    if (!user) {
      res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
      return;
    }

    // Check if user is still active
    if (!user.emailVerified) {
      res.status(403).json({ 
        success: false, 
        message: 'Email not verified' 
      });
      return;
    }

    // Update session activity
    await sessionService.updateSessionActivity(session.id);

    // Attach user and session to request
    req.user = user;
    req.session = session;
    req.accessToken = token;

    next();
  } catch (error: any) {
    console.error('Authentication error:', error);
    res.status(401).json({ 
      success: false, 
      message: 'Authentication failed' 
    });
  }
}

/**
 * Optional authentication - Loads user if token is present but doesn't require it
 */
export async function optionalAuthenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = jwtService.extractTokenFromHeader(authHeader);

    if (!token) {
      // No token, but that's OK for optional auth
      return next();
    }

    // Try to verify token
    const verification = jwtService.verifyAccessToken(token);
    
    if (verification.valid && verification.payload) {
      const session = await sessionService.getSession(verification.payload.sessionId);
      if (session) {
        const user = await authService.getUserById(verification.payload.userId);
        if (user && user.emailVerified) {
          req.user = user;
          req.session = session;
          req.accessToken = token;
          await sessionService.updateSessionActivity(session.id);
        }
      }
    }

    next();
  } catch (error) {
    // Ignore errors for optional auth
    next();
  }
}

/**
 * Role-based authorization middleware
 */
export function authorize(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
      return;
    }

    next();
  };
}

/**
 * CSRF protection middleware
 */
export async function verifyCsrf(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Skip CSRF for GET requests
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }

  // Skip if CSRF is disabled
  if (!securityConfig.csrfEnabled) {
    return next();
  }

  const csrfToken = req.headers['x-csrf-token'] as string || req.body._csrf;

  if (!csrfToken) {
    res.status(403).json({ 
      success: false, 
      message: 'CSRF token required' 
    });
    return;
  }

  if (!req.session) {
    res.status(403).json({ 
      success: false, 
      message: 'Session required for CSRF validation' 
    });
    return;
  }

  const isValid = await sessionService.validateCsrfToken(csrfToken, req.session.id);

  if (!isValid) {
    res.status(403).json({ 
      success: false, 
      message: 'Invalid CSRF token' 
    });
    return;
  }

  // Generate new CSRF token for next request
  const newToken = await sessionService.generateCsrfToken(req.session.id);
  res.setHeader('X-CSRF-Token', newToken);
  req.csrfToken = newToken;

  next();
}

/**
 * Refresh token middleware
 */
export async function refreshToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { refreshToken, fingerprint } = req.body;

    if (!refreshToken) {
      res.status(400).json({ 
        success: false, 
        message: 'Refresh token required' 
      });
      return;
    }

    const tokens = await sessionService.refreshSession(refreshToken, fingerprint);

    res.json({
      success: true,
      ...tokens
    });
  } catch (error: any) {
    console.error('Token refresh error:', error);
    res.status(401).json({ 
      success: false, 
      message: error.message || 'Failed to refresh token' 
    });
  }
}

/**
 * Check if token is expiring soon and refresh if needed
 */
export async function autoRefreshToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.accessToken) {
    return next();
  }

  // Check if token is expiring soon (within 5 minutes)
  if (jwtService.isTokenExpiringSoon(req.accessToken, 5)) {
    // Get refresh token from cookie or header
    const refreshToken = req.cookies?.refreshToken || req.headers['x-refresh-token'] as string;
    
    if (refreshToken && req.session) {
      try {
        const tokens = await sessionService.refreshSession(refreshToken);
        
        // Set new tokens in response headers
        res.setHeader('X-New-Access-Token', tokens.accessToken);
        res.setHeader('X-New-Refresh-Token', tokens.refreshToken);
        
        // Update request with new token
        req.accessToken = tokens.accessToken;
      } catch (error) {
        // Log but don't fail the request
        console.warn('Auto-refresh failed:', error);
      }
    }
  }

  next();
}

/**
 * Log authentication attempts
 */
export async function logAuthAttempt(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Log the attempt (implementation depends on your logging strategy)
  const ipAddress = req.ip || req.socket.remoteAddress || '';
  const userAgent = req.headers['user-agent'] || '';
  
  console.log(`Auth attempt from ${ipAddress} with ${userAgent}`);
  
  next();
}

/**
 * Ensure HTTPS in production
 */
export function requireHttps(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (process.env.NODE_ENV === 'production' && !req.secure && req.headers['x-forwarded-proto'] !== 'https') {
    res.redirect(301, `https://${req.headers.host}${req.url}`);
    return;
  }
  next();
}