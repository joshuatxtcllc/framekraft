import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      token?: string;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  type: 'access' | 'refresh';
}

// Generate access token (15 minutes)
export const generateAccessToken = (user: IUser): string => {
  const payload: TokenPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    type: 'access'
  };
  
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: '15m',
    issuer: 'framekraft',
    audience: 'framekraft-app'
  });
};

// Generate refresh token (7 days)
export const generateRefreshToken = (user: IUser): string => {
  const payload: TokenPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    type: 'refresh'
  };
  
  return jwt.sign(payload, JWT_REFRESH_SECRET, { 
    expiresIn: '7d',
    issuer: 'framekraft',
    audience: 'framekraft-app'
  });
};

// Verify JWT token
export const verifyToken = (token: string, isRefreshToken = false): TokenPayload => {
  const secret = isRefreshToken ? JWT_REFRESH_SECRET : JWT_SECRET;
  return jwt.verify(token, secret, {
    issuer: 'framekraft',
    audience: 'framekraft-app'
  }) as TokenPayload;
};

// Authentication middleware
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from header, cookie, or query
    let token = req.headers.authorization?.replace('Bearer ', '') ||
                req.cookies?.accessToken ||
                req.query.token as string;

    if (!token) {
      return res.status(401).json({ 
        message: 'Authentication required',
        code: 'NO_TOKEN'
      });
    }

    // Verify token
    const decoded = verifyToken(token);
    
    if (decoded.type !== 'access') {
      return res.status(401).json({ 
        message: 'Invalid token type',
        code: 'INVALID_TOKEN_TYPE'
      });
    }

    // Get user from database
    const user = await User.findById(decoded.userId)
      .select('+refreshTokens')
      .exec();

    if (!user) {
      return res.status(401).json({ 
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({ 
        message: 'Account is deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    if (user.isLocked()) {
      return res.status(403).json({ 
        message: 'Account is locked due to multiple failed login attempts',
        code: 'ACCOUNT_LOCKED'
      });
    }

    // Attach user to request
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ 
        message: 'Token has expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ 
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }

    console.error('Authentication error:', error);
    return res.status(500).json({ 
      message: 'Authentication failed',
      code: 'AUTH_ERROR'
    });
  }
};

// Authorization middleware - check user roles
export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required',
        code: 'NO_AUTH'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Insufficient permissions',
        code: 'FORBIDDEN',
        required: allowedRoles,
        current: req.user.role
      });
    }

    next();
  };
};

// Optional authentication - doesn't fail if no token
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') ||
                  req.cookies?.accessToken ||
                  req.query.token as string;

    if (!token) {
      return next();
    }

    const decoded = verifyToken(token);
    
    if (decoded.type === 'access') {
      const user = await User.findById(decoded.userId).exec();
      if (user && user.isActive && !user.isLocked()) {
        req.user = user;
        req.token = token;
      }
    }
  } catch (error) {
    // Silently continue without authentication
    console.debug('Optional auth failed:', error);
  }
  
  next();
};

// Refresh token middleware
export const refreshAuth = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ 
        message: 'Refresh token required',
        code: 'NO_REFRESH_TOKEN'
      });
    }

    // Verify refresh token
    const decoded = verifyToken(refreshToken, true);
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ 
        message: 'Invalid token type',
        code: 'INVALID_TOKEN_TYPE'
      });
    }

    // Get user and check if refresh token exists
    const user = await User.findById(decoded.userId)
      .select('+refreshTokens')
      .exec();

    if (!user) {
      return res.status(401).json({ 
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check if refresh token is in user's token list
    const tokenExists = user.refreshTokens.some(
      tokenData => tokenData.token === refreshToken && tokenData.expiresAt > new Date()
    );

    if (!tokenExists) {
      return res.status(401).json({ 
        message: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Update refresh tokens in database
    user.refreshTokens = user.refreshTokens.filter(
      tokenData => tokenData.token !== refreshToken
    );
    
    user.refreshTokens.push({
      token: newRefreshToken,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      userAgent: req.get('user-agent'),
      ipAddress: req.ip
    });

    await user.save();

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ 
      message: 'Failed to refresh token',
      code: 'REFRESH_FAILED'
    });
  }
};

// Logout from all devices
export const logoutAllDevices = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required',
        code: 'NO_AUTH'
      });
    }

    // Clear all refresh tokens
    req.user.refreshTokens = [];
    await req.user.save();

    res.json({ message: 'Logged out from all devices' });
  } catch (error) {
    console.error('Logout all devices error:', error);
    res.status(500).json({ 
      message: 'Failed to logout from all devices',
      code: 'LOGOUT_FAILED'
    });
  }
};