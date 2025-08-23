import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
      token?: string;
    }
  }
}

/**
 * Session validation middleware
 * Validates JWT tokens and ensures user sessions are valid
 */
export const validateSession = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  try {
    // Get token from multiple sources
    const token = 
      req.cookies?.accessToken || 
      req.headers.authorization?.replace('Bearer ', '') ||
      req.query.token as string;

    // No token provided
    if (!token) {
      return res.status(401).json({ 
        message: 'Authentication required',
        code: 'NO_TOKEN',
        isAuthenticated: false
      });
    }

    // No demo tokens - real authentication only

    try {
      // Verify JWT token
      const decoded = jwt.verify(token, JWT_SECRET) as { 
        userId: string; 
        email: string;
        iat: number;
        exp: number;
      };

      // Check if token is expired
      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        return res.status(401).json({ 
          message: 'Token has expired',
          code: 'TOKEN_EXPIRED',
          isAuthenticated: false
        });
      }

      // Find user in database
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        return res.status(401).json({ 
          message: 'User not found',
          code: 'USER_NOT_FOUND',
          isAuthenticated: false
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(403).json({ 
          message: 'Account is deactivated',
          code: 'ACCOUNT_DEACTIVATED',
          isAuthenticated: false
        });
      }

      // Attach user to request
      req.user = user;
      req.token = token;
      
      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ 
          message: 'Invalid token',
          code: 'INVALID_TOKEN',
          isAuthenticated: false
        });
      }
      
      if (error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({ 
          message: 'Token has expired',
          code: 'TOKEN_EXPIRED',
          isAuthenticated: false
        });
      }

      throw error;
    }
  } catch (error) {
    console.error('Session validation error:', error);
    return res.status(500).json({ 
      message: 'Authentication failed',
      code: 'AUTH_ERROR',
      isAuthenticated: false
    });
  }
};

/**
 * Optional authentication middleware
 * Allows requests to proceed even without authentication
 * but attaches user info if available
 */
export const optionalAuth = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const token = 
      req.cookies?.accessToken || 
      req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return next();
    }

    // No demo tokens - real authentication only

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
        req.token = token;
      }
    } catch {
      // Ignore token errors for optional auth
    }

    next();
  } catch (error) {
    // Log error but continue
    console.error('Optional auth error:', error);
    next();
  }
};

/**
 * Role-based access control middleware
 * Must be used after validateSession
 */
export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required',
        code: 'NOT_AUTHENTICATED',
        isAuthenticated: false
      });
    }

    const userRole = req.user.role || 'user';
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        message: 'Insufficient permissions',
        code: 'FORBIDDEN',
        isAuthenticated: true
      });
    }

    next();
  };
};