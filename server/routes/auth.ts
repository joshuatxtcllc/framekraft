import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import crypto from 'crypto';
import User from '../models/User';
import { 
  generateAccessToken, 
  generateRefreshToken, 
  authenticate, 
  refreshAuth,
  logoutAllDevices 
} from '../middleware/authMongoDB';
import { sendEmail } from '../services/email';
import { rateLimit } from '../middleware/rateLimiting';

const router = express.Router();

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
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ 
        message: 'Email already registered',
        code: 'EMAIL_EXISTS'
      });
    }

    // Create verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create new user
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      businessName,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires
    });

    await user.save();

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token
    user.refreshTokens.push({
      token: refreshToken,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      userAgent: req.get('user-agent'),
      ipAddress: req.ip
    });

    await user.save();

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

    // Set secure cookie
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
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Registration error:', error);
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

    // Find user with password field
    const user = await User.findOne({ email }).select('+password +refreshTokens');
    
    if (!user) {
      return res.status(401).json({ 
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Check if account is locked
    if (user.isLocked()) {
      return res.status(423).json({ 
        message: 'Account is locked due to multiple failed login attempts. Please try again later.',
        code: 'ACCOUNT_LOCKED',
        lockUntil: user.lockUntil
      });
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password);
    
    if (!isValidPassword) {
      await user.incrementLoginAttempts();
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
    await user.resetLoginAttempts();

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token
    user.refreshTokens.push({
      token: refreshToken,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      userAgent: req.get('user-agent'),
      ipAddress: req.ip
    });

    // Limit stored refresh tokens to 5 per user
    if (user.refreshTokens.length > 5) {
      user.refreshTokens = user.refreshTokens.slice(-5);
    }

    await user.save();

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
      user: user.toJSON()
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
    
    if (refreshToken && req.user) {
      // Remove specific refresh token
      req.user.refreshTokens = req.user.refreshTokens.filter(
        tokenData => tokenData.token !== refreshToken
      );
      await req.user.save();
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

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ 
        message: 'Invalid or expired verification token',
        code: 'INVALID_TOKEN'
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

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

    const user = await User.findOne({ email });

    // Don't reveal if user exists
    if (!user) {
      return res.json({ 
        message: 'If an account exists with this email, you will receive a password reset link.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetExpires;
    await user.save();

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

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() }
    }).select('+refreshTokens');

    if (!user) {
      return res.status(400).json({ 
        message: 'Invalid or expired reset token',
        code: 'INVALID_TOKEN'
      });
    }

    // Update password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.refreshTokens = []; // Invalidate all refresh tokens
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    
    await user.save();

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
    user: req.user?.toJSON()
  });
});

// Update user profile
router.put('/profile', authenticate, async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, businessName, preferences } = req.body;
    
    if (!req.user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Update allowed fields
    if (firstName) req.user.firstName = firstName;
    if (lastName) req.user.lastName = lastName;
    if (businessName !== undefined) req.user.businessName = businessName;
    if (preferences) req.user.preferences = { ...req.user.preferences, ...preferences };

    await req.user.save();

    res.json({
      message: 'Profile updated successfully',
      user: req.user.toJSON()
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

    if (!req.user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Get user with password field
    const user = await User.findById(req.user._id).select('+password +refreshTokens');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isValid = await user.comparePassword(currentPassword);
    
    if (!isValid) {
      return res.status(401).json({ 
        message: 'Current password is incorrect',
        code: 'INVALID_PASSWORD'
      });
    }

    // Update password
    user.password = newPassword;
    user.refreshTokens = []; // Invalidate all refresh tokens
    await user.save();

    res.json({ message: 'Password changed successfully. Please login again.' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ 
      message: 'Failed to change password',
      code: 'PASSWORD_CHANGE_ERROR'
    });
  }
});

export default router;