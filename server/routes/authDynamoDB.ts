import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { UserModel } from '../models/UserDynamoDB';
import { 
  generateAccessToken, 
  generateRefreshToken, 
  authenticate, 
  refreshAuth,
  logoutAllDevices 
} from '../middleware/authDynamoDB';
import { sendEmail } from '../services/email';
import { rateLimit } from '../middleware/rateLimiting';
import { initializeTables } from '../config/dynamodb';

const router = express.Router();

// Initialize DynamoDB tables on startup
initializeTables().catch(console.error);

// Validation rules
const validateRegister = [
  body('email').isEmail().normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number and special character'),
  body('firstName').trim().notEmpty(),
  body('lastName').trim().notEmpty(),
  body('businessName').optional().trim()
];

const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

// Rate limiting for auth endpoints
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many authentication attempts, please try again later.'
});

// Register new user
router.post('/register', authRateLimit, validateRegister, async (req: Request, res: Response) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { email, password, firstName, lastName, businessName } = req.body;

    // Check if user already exists
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ 
        message: 'Email already registered',
        code: 'EMAIL_EXISTS'
      });
    }

    // Create new user
    const user = await UserModel.create({
      email,
      password,
      firstName,
      lastName,
      businessName
    });

    // Create email verification token
    const verificationToken = await UserModel.createEmailVerificationToken(user.id);

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token in DynamoDB
    await UserModel.saveRefreshToken(
      user.id,
      refreshToken,
      req.get('user-agent'),
      req.ip
    );

    // Send verification email (async, don't wait)
    const verificationUrl = `${process.env.APP_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;
    sendEmail({
      to: email,
      subject: 'Verify your FrameKraft account',
      html: `
        <h1>Welcome to FrameKraft!</h1>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
        <p>Or copy this link: ${verificationUrl}</p>
        <p>This link expires in 24 hours.</p>
      `
    }).catch(err => console.error('Failed to send verification email:', err));

    // Set secure cookies
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      message: 'Registration successful',
      accessToken,
      refreshToken,
      user: UserModel.sanitizeUser(user)
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    
    // Handle DynamoDB specific errors
    if (error.name === 'ConditionalCheckFailedException') {
      return res.status(409).json({ 
        message: 'User already exists',
        code: 'USER_EXISTS'
      });
    }
    
    res.status(500).json({ 
      message: 'Registration failed',
      code: 'REGISTRATION_ERROR'
    });
  }
});

// Login
router.post('/login', authRateLimit, validateLogin, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await UserModel.findByEmail(email);
    
    if (!user) {
      return res.status(401).json({ 
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Check if account is locked
    if (UserModel.isLocked(user)) {
      return res.status(423).json({ 
        message: 'Account is locked due to multiple failed login attempts. Please try again later.',
        code: 'ACCOUNT_LOCKED',
        lockUntil: user.lockUntil
      });
    }

    // Verify password
    const isValidPassword = await UserModel.verifyPassword(password, user.password);
    
    if (!isValidPassword) {
      await UserModel.incrementLoginAttempts(user.id);
      return res.status(401).json({ 
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({ 
        message: 'Account is deactivated. Please contact support.',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Reset login attempts on successful login
    await UserModel.resetLoginAttempts(user.id);

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token in DynamoDB
    await UserModel.saveRefreshToken(
      user.id,
      refreshToken,
      req.get('user-agent'),
      req.ip
    );

    // Set secure cookies
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: UserModel.sanitizeUser(user)
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Login failed',
      code: 'LOGIN_ERROR'
    });
  }
});

// Logout
router.post('/logout', authenticate, async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    
    if (refreshToken) {
      // Delete specific refresh token from DynamoDB
      await UserModel.deleteRefreshToken(refreshToken);
    }

    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      message: 'Logout failed',
      code: 'LOGOUT_ERROR'
    });
  }
});

// Logout from all devices
router.post('/logout-all', authenticate, logoutAllDevices);

// Refresh token
router.post('/refresh', refreshAuth);

// Verify email
router.post('/verify-email', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ 
        message: 'Verification token required',
        code: 'NO_TOKEN'
      });
    }

    const userId = await UserModel.verifyEmailToken(token);

    if (!userId) {
      return res.status(400).json({ 
        message: 'Invalid or expired verification token',
        code: 'INVALID_TOKEN'
      });
    }

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ 
      message: 'Email verification failed',
      code: 'VERIFICATION_ERROR'
    });
  }
});

// Request password reset
router.post('/forgot-password', authRateLimit, async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        message: 'Email required',
        code: 'EMAIL_REQUIRED'
      });
    }

    const user = await UserModel.findByEmail(email);

    // Don't reveal if user exists
    if (!user) {
      return res.json({ 
        message: 'If an account exists with this email, you will receive a password reset link.'
      });
    }

    // Create password reset token
    const resetToken = await UserModel.createPasswordResetToken(user.id);

    // Send reset email
    const resetUrl = `${process.env.APP_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    
    await sendEmail({
      to: email,
      subject: 'Reset your FrameKraft password',
      html: `
        <h1>Password Reset Request</h1>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>Or copy this link: ${resetUrl}</p>
        <p>This link expires in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    });

    res.json({ 
      message: 'If an account exists with this email, you will receive a password reset link.'
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ 
      message: 'Failed to process password reset request',
      code: 'RESET_REQUEST_ERROR'
    });
  }
});

// Reset password
router.post('/reset-password', authRateLimit, async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ 
        message: 'Token and new password required',
        code: 'MISSING_FIELDS'
      });
    }

    // Validate password
    if (password.length < 8) {
      return res.status(400).json({ 
        message: 'Password must be at least 8 characters',
        code: 'WEAK_PASSWORD'
      });
    }

    const success = await UserModel.resetPasswordWithToken(token, password);

    if (!success) {
      return res.status(400).json({ 
        message: 'Invalid or expired reset token',
        code: 'INVALID_TOKEN'
      });
    }

    res.json({ message: 'Password reset successful. Please login with your new password.' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ 
      message: 'Failed to reset password',
      code: 'RESET_ERROR'
    });
  }
});

// Get current user
router.get('/me', authenticate, async (req: Request, res: Response) => {
  res.json({
    user: req.user
  });
});

// Update user profile
router.put('/profile', authenticate, async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, businessName, preferences } = req.body;
    
    if (!req.user?.id) {
      return res.status(401).json({ message: 'User not found' });
    }

    const updates: any = {};
    if (firstName) updates.firstName = firstName;
    if (lastName) updates.lastName = lastName;
    if (businessName !== undefined) updates.businessName = businessName;
    if (preferences) updates.preferences = preferences;

    const updatedUser = await UserModel.update(req.user.id, updates);

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: UserModel.sanitizeUser(updatedUser)
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ 
      message: 'Failed to update profile',
      code: 'UPDATE_ERROR'
    });
  }
});

// Change password
router.post('/change-password', authenticate, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        message: 'Current and new password required',
        code: 'MISSING_FIELDS'
      });
    }

    if (!req.user?.id) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Get full user with password
    const user = await UserModel.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isValid = await UserModel.verifyPassword(currentPassword, user.password);
    
    if (!isValid) {
      return res.status(401).json({ 
        message: 'Current password is incorrect',
        code: 'INVALID_PASSWORD'
      });
    }

    // Update password
    await UserModel.updatePassword(user.id, newPassword);
    
    // Clear all refresh tokens
    await UserModel.clearAllRefreshTokens(user.id);

    res.json({ message: 'Password changed successfully. Please login again.' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ 
      message: 'Failed to change password',
      code: 'PASSWORD_CHANGE_ERROR'
    });
  }
});

// Health check for auth service
router.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'healthy',
    service: 'auth-dynamodb',
    timestamp: new Date().toISOString()
  });
});

export default router;