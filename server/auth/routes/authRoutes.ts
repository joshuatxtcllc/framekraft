import { Router, Request, Response } from 'express';
import { authService } from '../services/authService';
import { demoAuthService } from '../services/demoAuthService';
import { sessionService } from '../services/sessionService';
import { 
  loginSchema, 
  registerSchema, 
  passwordResetRequestSchema, 
  passwordResetConfirmSchema,
  changePasswordSchema 
} from '../schema';
import { 
  authenticate, 
  verifyCsrf, 
  refreshToken,
  logAuthAttempt 
} from '../middleware/authMiddleware';
import { 
  authRateLimiter, 
  passwordResetRateLimiter,
  emailVerificationRateLimiter,
  customLoginRateLimiter 
} from '../middleware/rateLimiting';
import { AuthenticatedRequest } from '../types';
import { cookieConfig } from '../config';
import { z } from 'zod';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', 
  authRateLimiter,
  logAuthAttempt,
  async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validatedData = registerSchema.parse(req.body);
      
      // Get client info
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];
      
      // Register user - use demo service if database is not available
      let result;
      try {
        result = await authService.register(validatedData, ipAddress, userAgent);
      } catch (dbError: any) {
        if (dbError.message?.includes('DATABASE_URL') || dbError.code === 'ECONNREFUSED') {
          console.log('Using demo auth service for registration');
          result = await demoAuthService.register(validatedData);
        } else {
          throw dbError;
        }
      }
      
      // Set cookies
      res.cookie('accessToken', result.accessToken, {
        ...cookieConfig,
        maxAge: result.expiresIn! * 1000
      });
      
      res.cookie('refreshToken', result.refreshToken, {
        ...cookieConfig,
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });
      
      res.status(201).json({
        success: true,
        message: result.message,
        user: result.user,
        csrfToken: result.csrfToken,
        expiresIn: result.expiresIn
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors
        });
      } else {
        res.status(400).json({
          success: false,
          message: error.message || 'Registration failed'
        });
      }
    }
  }
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login',
  authRateLimiter,
  customLoginRateLimiter,
  logAuthAttempt,
  async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validatedData = loginSchema.parse(req.body);
      
      // Get client info
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];
      
      // Login user - use demo service if database is not available
      let result;
      try {
        result = await authService.login(validatedData, ipAddress, userAgent);
      } catch (dbError: any) {
        if (dbError.message?.includes('DATABASE_URL') || dbError.code === 'ECONNREFUSED') {
          console.log('Using demo auth service for login');
          result = await demoAuthService.login(validatedData.email, validatedData.password);
        } else {
          throw dbError;
        }
      }
      
      // Handle 2FA requirement
      if (result.requiresTwoFactor) {
        res.json({
          success: true,
          requiresTwoFactor: true,
          message: result.message
        });
        return;
      }
      
      // Set cookies
      const cookieOptions = {
        ...cookieConfig,
        maxAge: validatedData.rememberMe 
          ? 30 * 24 * 60 * 60 * 1000 // 30 days
          : result.expiresIn! * 1000
      };
      
      res.cookie('accessToken', result.accessToken, cookieOptions);
      res.cookie('refreshToken', result.refreshToken, cookieOptions);
      
      res.json({
        success: true,
        message: result.message,
        user: result.user,
        csrfToken: result.csrfToken,
        expiresIn: result.expiresIn
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors
        });
      } else {
        const statusCode = error.message.includes('locked') ? 423 : 401;
        res.status(statusCode).json({
          success: false,
          message: error.message || 'Login failed'
        });
      }
    }
  }
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout',
  authenticate,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (req.session && req.user) {
        const ipAddress = req.ip || req.socket.remoteAddress;
        const userAgent = req.headers['user-agent'];
        
        await authService.logout(req.session.id, req.user.id, ipAddress, userAgent);
      }
      
      // Clear cookies
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      
      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }
  }
);

/**
 * @route   POST /api/auth/logout-all
 * @desc    Logout from all devices
 * @access  Private
 */
router.post('/logout-all',
  authenticate,
  verifyCsrf,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (req.user) {
        const ipAddress = req.ip || req.socket.remoteAddress;
        const userAgent = req.headers['user-agent'];
        
        await authService.logoutAllDevices(req.user.id, ipAddress, userAgent);
      }
      
      // Clear cookies
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      
      res.json({
        success: true,
        message: 'Logged out from all devices successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }
  }
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', refreshToken);

/**
 * @route   GET /api/auth/user
 * @desc    Get current user (alias for /me)
 * @access  Private or Public (returns null for unauthenticated)
 */
router.get('/user',
  async (req: Request & { user?: any }, res: Response) => {
    // For development, return a mock user if not authenticated
    if (process.env.NODE_ENV === 'development' && !req.user) {
      return res.json({
        id: 'local-dev-user',
        email: 'dev@localhost',
        firstName: 'Local',
        lastName: 'Developer',
        businessName: 'Dev Business',
        role: 'owner'
      });
    }
    
    // Return authenticated user or null
    res.json(req.user || null);
  }
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me',
  authenticate,
  async (req: AuthenticatedRequest, res: Response) => {
    res.json({
      success: true,
      user: req.user
    });
  }
);

/**
 * @route   POST /api/auth/password/reset
 * @desc    Request password reset
 * @access  Public
 */
router.post('/password/reset',
  passwordResetRateLimiter,
  async (req: Request, res: Response) => {
    try {
      const validatedData = passwordResetRequestSchema.parse(req.body);
      const ipAddress = req.ip || req.socket.remoteAddress;
      
      await authService.requestPasswordReset(validatedData, ipAddress);
      
      // Always return success to prevent email enumeration
      res.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.'
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      } else {
        // Still return success to prevent enumeration
        res.json({
          success: true,
          message: 'If an account exists with this email, a password reset link has been sent.'
        });
      }
    }
  }
);

/**
 * @route   POST /api/auth/password/confirm
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/password/confirm',
  passwordResetRateLimiter,
  async (req: Request, res: Response) => {
    try {
      const validatedData = passwordResetConfirmSchema.parse(req.body);
      const ipAddress = req.ip || req.socket.remoteAddress;
      
      await authService.resetPassword(validatedData, ipAddress);
      
      res.json({
        success: true,
        message: 'Password reset successfully. Please login with your new password.'
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors
        });
      } else {
        res.status(400).json({
          success: false,
          message: error.message || 'Password reset failed'
        });
      }
    }
  }
);

/**
 * @route   POST /api/auth/password/change
 * @desc    Change password for authenticated user
 * @access  Private
 */
router.post('/password/change',
  authenticate,
  verifyCsrf,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const validatedData = changePasswordSchema.parse(req.body);
      const ipAddress = req.ip || req.socket.remoteAddress;
      
      await authService.changePassword(
        req.user!.id,
        validatedData.currentPassword,
        validatedData.newPassword,
        ipAddress
      );
      
      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors
        });
      } else {
        const statusCode = error.message.includes('incorrect') ? 401 : 400;
        res.status(statusCode).json({
          success: false,
          message: error.message || 'Password change failed'
        });
      }
    }
  }
);

/**
 * @route   POST /api/auth/email/verify
 * @desc    Verify email with token
 * @access  Public
 */
router.post('/email/verify',
  emailVerificationRateLimiter,
  async (req: Request, res: Response) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        res.status(400).json({
          success: false,
          message: 'Verification token required'
        });
        return;
      }
      
      const ipAddress = req.ip || req.socket.remoteAddress;
      await authService.verifyEmail(token, ipAddress);
      
      res.json({
        success: true,
        message: 'Email verified successfully. You can now login.'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Email verification failed'
      });
    }
  }
);

/**
 * @route   POST /api/auth/email/resend
 * @desc    Resend verification email
 * @access  Public
 */
router.post('/email/resend',
  emailVerificationRateLimiter,
  async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        res.status(400).json({
          success: false,
          message: 'Email required'
        });
        return;
      }
      
      // TODO: Implement resend verification email
      
      // Always return success to prevent enumeration
      res.json({
        success: true,
        message: 'If an unverified account exists with this email, a new verification link has been sent.'
      });
    } catch (error: any) {
      res.json({
        success: true,
        message: 'If an unverified account exists with this email, a new verification link has been sent.'
      });
    }
  }
);

/**
 * @route   GET /api/auth/sessions
 * @desc    Get active sessions for current user
 * @access  Private
 */
router.get('/sessions',
  authenticate,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const sessions = await sessionService.getUserSessions(req.user!.id);
      
      // Sanitize session data
      const sanitizedSessions = sessions.map(session => ({
        id: session.id,
        userAgent: session.userAgent,
        ipAddress: session.ipAddress,
        createdAt: session.createdAt,
        lastActivity: session.lastActivity,
        expiresAt: session.expiresAt,
        isCurrent: session.id === req.session?.id
      }));
      
      res.json({
        success: true,
        sessions: sanitizedSessions
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch sessions'
      });
    }
  }
);

/**
 * @route   DELETE /api/auth/sessions/:sessionId
 * @desc    Revoke a specific session
 * @access  Private
 */
router.delete('/sessions/:sessionId',
  authenticate,
  verifyCsrf,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { sessionId } = req.params;
      
      // Verify the session belongs to the current user
      const sessions = await sessionService.getUserSessions(req.user!.id);
      const sessionToRevoke = sessions.find(s => s.id === sessionId);
      
      if (!sessionToRevoke) {
        res.status(404).json({
          success: false,
          message: 'Session not found'
        });
        return;
      }
      
      await sessionService.invalidateSession(sessionId, 'User revoked session');
      
      res.json({
        success: true,
        message: 'Session revoked successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to revoke session'
      });
    }
  }
);

/**
 * @route   GET /api/auth/csrf
 * @desc    Get CSRF token
 * @access  Private
 */
router.get('/csrf',
  authenticate,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const csrfToken = await sessionService.generateCsrfToken(req.session!.id);
      
      res.json({
        success: true,
        csrfToken
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to generate CSRF token'
      });
    }
  }
);

export default router;