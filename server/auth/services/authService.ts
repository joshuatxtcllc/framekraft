import { db } from '../../db';
import { authUsers, authAuditLog, authLoginAttempts } from '../schema';
import { eq, and, gte, desc } from 'drizzle-orm';
import { 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  AuthUser,
  PasswordResetRequest,
  PasswordResetConfirm
} from '../types';
import { passwordService } from './passwordService';
import { sessionService } from './sessionService';
import { jwtService } from './jwtService';
import { emailService } from './emailService';
import { securityConfig, frontendUrl } from '../config';
import crypto from 'crypto';

export class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterRequest, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    try {
      // Check if user already exists
      const existingUser = await db.select()
        .from(authUsers)
        .where(eq(authUsers.email, data.email.toLowerCase()))
        .limit(1);

      if (existingUser.length > 0) {
        await this.logAuthEvent(null, 'register', 'failure', ipAddress, userAgent, { 
          reason: 'Email already exists' 
        });
        throw new Error('Email already registered');
      }

      // Validate password strength
      const passwordValidation = passwordService.validatePasswordStrength(data.password);
      if (!passwordValidation.valid) {
        throw new Error(passwordValidation.errors.join(', '));
      }

      // Check if password has been compromised
      const isCompromised = await passwordService.isPasswordCompromised(data.password);
      if (isCompromised) {
        throw new Error('This password has been found in data breaches. Please choose a different password.');
      }

      // Hash password
      const passwordHash = await passwordService.hashPassword(data.password);

      // Generate email verification token
      const emailVerificationToken = jwtService.generateEmailVerificationToken();
      const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Create user
      const [newUser] = await db.insert(authUsers).values({
        email: data.email.toLowerCase(),
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        businessName: data.businessName,
        role: data.role || 'owner',
        emailVerified: false,
        emailVerificationToken,
        emailVerificationExpires,
      }).returning();

      // Send verification email
      await emailService.sendVerificationEmail(
        newUser.email,
        newUser.firstName || 'User',
        emailVerificationToken
      );

      // Log successful registration
      await this.logAuthEvent(newUser.id, 'register', 'success', ipAddress, userAgent);

      // Create session
      const sessionData = await sessionService.createSession(
        newUser.id,
        userAgent,
        ipAddress
      );

      return {
        success: true,
        user: this.sanitizeUser(newUser),
        accessToken: sessionData.accessToken,
        refreshToken: sessionData.refreshToken,
        csrfToken: sessionData.csrfToken,
        expiresIn: parseInt(process.env.ACCESS_TOKEN_MINUTES || '15') * 60,
        message: 'Registration successful. Please check your email to verify your account.',
      };
    } catch (error: any) {
      await this.logAuthEvent(null, 'register', 'failure', ipAddress, userAgent, { 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Login user
   */
  async login(data: LoginRequest, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    try {
      // Check login attempts
      await this.checkLoginAttempts(data.email, ipAddress || '');

      // Find user
      const [user] = await db.select()
        .from(authUsers)
        .where(eq(authUsers.email, data.email.toLowerCase()))
        .limit(1);

      if (!user) {
        await this.recordLoginAttempt(data.email, ipAddress || '', false, userAgent);
        await this.logAuthEvent(null, 'login', 'failure', ipAddress, userAgent, { 
          reason: 'User not found' 
        });
        throw new Error('Invalid email or password');
      }

      // Check if account is locked
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        await this.recordLoginAttempt(data.email, ipAddress || '', false, userAgent);
        await this.logAuthEvent(user.id, 'login', 'blocked', ipAddress, userAgent, { 
          reason: 'Account locked' 
        });
        const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
        throw new Error(`Account is locked. Please try again in ${minutesLeft} minutes.`);
      }

      // Verify password
      const isValidPassword = await passwordService.comparePassword(data.password, user.passwordHash);
      if (!isValidPassword) {
        await this.recordLoginAttempt(data.email, ipAddress || '', false, userAgent);
        await this.incrementLoginAttempts(user.id);
        await this.logAuthEvent(user.id, 'login', 'failure', ipAddress, userAgent, { 
          reason: 'Invalid password' 
        });
        throw new Error('Invalid email or password');
      }

      // Check if email is verified
      if (!user.emailVerified) {
        await this.logAuthEvent(user.id, 'login', 'blocked', ipAddress, userAgent, { 
          reason: 'Email not verified' 
        });
        throw new Error('Please verify your email before logging in');
      }

      // Check if 2FA is enabled
      if (user.twoFactorEnabled) {
        // Handle 2FA flow (to be implemented)
        return {
          success: true,
          requiresTwoFactor: true,
          message: 'Two-factor authentication required',
        };
      }

      // Record successful login
      await this.recordLoginAttempt(data.email, ipAddress || '', true, userAgent);
      
      // Create session
      const sessionData = await sessionService.createSession(
        user.id,
        userAgent,
        ipAddress,
        data.fingerprint,
        data.rememberMe || false
      );

      // Log successful login
      await this.logAuthEvent(user.id, 'login', 'success', ipAddress, userAgent);

      return {
        success: true,
        user: this.sanitizeUser(user),
        accessToken: sessionData.accessToken,
        refreshToken: sessionData.refreshToken,
        csrfToken: sessionData.csrfToken,
        expiresIn: parseInt(process.env.ACCESS_TOKEN_MINUTES || '15') * 60,
        message: 'Login successful',
      };
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(sessionId: string, userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await sessionService.invalidateSession(sessionId, 'User logout');
    await this.logAuthEvent(userId, 'logout', 'success', ipAddress, userAgent);
  }

  /**
   * Logout from all devices
   */
  async logoutAllDevices(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await sessionService.invalidateUserSessions(userId, 'User logout from all devices');
    await this.logAuthEvent(userId, 'logout_all', 'success', ipAddress, userAgent);
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(data: PasswordResetRequest, ipAddress?: string): Promise<void> {
    const [user] = await db.select()
      .from(authUsers)
      .where(eq(authUsers.email, data.email.toLowerCase()))
      .limit(1);

    // Don't reveal if user exists
    if (!user) {
      // Still log the attempt
      await this.logAuthEvent(null, 'password_reset_request', 'failure', ipAddress, undefined, { 
        reason: 'User not found' 
      });
      return;
    }

    // Generate reset token
    const resetToken = jwtService.generatePasswordResetToken();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save reset token
    await db.update(authUsers)
      .set({
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      })
      .where(eq(authUsers.id, user.id));

    // Send reset email
    await emailService.sendPasswordResetEmail(
      user.email,
      user.firstName || 'User',
      resetToken
    );

    await this.logAuthEvent(user.id, 'password_reset_request', 'success', ipAddress);
  }

  /**
   * Reset password with token
   */
  async resetPassword(data: PasswordResetConfirm, ipAddress?: string): Promise<void> {
    const [user] = await db.select()
      .from(authUsers)
      .where(
        and(
          eq(authUsers.passwordResetToken, data.token),
          gte(authUsers.passwordResetExpires!, new Date())
        )
      )
      .limit(1);

    if (!user) {
      await this.logAuthEvent(null, 'password_reset', 'failure', ipAddress, undefined, { 
        reason: 'Invalid or expired token' 
      });
      throw new Error('Invalid or expired reset token');
    }

    // Validate new password
    const passwordValidation = passwordService.validatePasswordStrength(data.password);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.errors.join(', '));
    }

    // Hash new password
    const passwordHash = await passwordService.hashPassword(data.password);

    // Update password and clear reset token
    await db.update(authUsers)
      .set({
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
        updatedAt: new Date(),
      })
      .where(eq(authUsers.id, user.id));

    // Invalidate all sessions
    await sessionService.invalidateUserSessions(user.id, 'Password reset');

    // Send confirmation email
    await emailService.sendPasswordChangedEmail(user.email, user.firstName || 'User');

    await this.logAuthEvent(user.id, 'password_reset', 'success', ipAddress);
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string, ipAddress?: string): Promise<void> {
    const [user] = await db.select()
      .from(authUsers)
      .where(
        and(
          eq(authUsers.emailVerificationToken, token),
          gte(authUsers.emailVerificationExpires!, new Date())
        )
      )
      .limit(1);

    if (!user) {
      await this.logAuthEvent(null, 'email_verification', 'failure', ipAddress, undefined, { 
        reason: 'Invalid or expired token' 
      });
      throw new Error('Invalid or expired verification token');
    }

    await db.update(authUsers)
      .set({
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
        updatedAt: new Date(),
      })
      .where(eq(authUsers.id, user.id));

    await this.logAuthEvent(user.id, 'email_verification', 'success', ipAddress);
  }

  /**
   * Change password for authenticated user
   */
  async changePassword(
    userId: string, 
    currentPassword: string, 
    newPassword: string,
    ipAddress?: string
  ): Promise<void> {
    const [user] = await db.select()
      .from(authUsers)
      .where(eq(authUsers.id, userId))
      .limit(1);

    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValid = await passwordService.comparePassword(currentPassword, user.passwordHash);
    if (!isValid) {
      await this.logAuthEvent(userId, 'password_change', 'failure', ipAddress, undefined, { 
        reason: 'Invalid current password' 
      });
      throw new Error('Current password is incorrect');
    }

    // Validate new password
    const passwordValidation = passwordService.validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.errors.join(', '));
    }

    // Hash new password
    const passwordHash = await passwordService.hashPassword(newPassword);

    // Update password
    await db.update(authUsers)
      .set({
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(authUsers.id, userId));

    // Send notification email
    await emailService.sendPasswordChangedEmail(user.email, user.firstName || 'User');

    await this.logAuthEvent(userId, 'password_change', 'success', ipAddress);
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<AuthUser | null> {
    const [user] = await db.select()
      .from(authUsers)
      .where(eq(authUsers.id, userId))
      .limit(1);

    return user ? this.sanitizeUser(user) : null;
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: Partial<AuthUser>): Promise<AuthUser> {
    const [updatedUser] = await db.update(authUsers)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(authUsers.id, userId))
      .returning();

    return this.sanitizeUser(updatedUser);
  }

  /**
   * Check login attempts and lock account if necessary
   */
  private async checkLoginAttempts(email: string, ipAddress: string): Promise<void> {
    const recentAttempts = await db.select()
      .from(authLoginAttempts)
      .where(
        and(
          eq(authLoginAttempts.email, email.toLowerCase()),
          eq(authLoginAttempts.ipAddress, ipAddress),
          gte(authLoginAttempts.attemptTime, new Date(Date.now() - securityConfig.lockoutDuration))
        )
      )
      .orderBy(desc(authLoginAttempts.attemptTime));

    const failedAttempts = recentAttempts.filter(a => !a.success).length;

    if (failedAttempts >= securityConfig.maxLoginAttempts) {
      throw new Error('Too many failed login attempts. Please try again later.');
    }
  }

  /**
   * Record login attempt
   */
  private async recordLoginAttempt(
    email: string, 
    ipAddress: string, 
    success: boolean, 
    userAgent?: string
  ): Promise<void> {
    await db.insert(authLoginAttempts).values({
      email: email.toLowerCase(),
      ipAddress,
      success,
      userAgent,
    });
  }

  /**
   * Increment login attempts and lock account if necessary
   */
  private async incrementLoginAttempts(userId: string): Promise<void> {
    const [user] = await db.select()
      .from(authUsers)
      .where(eq(authUsers.id, userId))
      .limit(1);

    if (!user) return;

    const attempts = (user.loginAttempts || 0) + 1;
    const updates: any = { loginAttempts: attempts };

    if (attempts >= securityConfig.maxLoginAttempts) {
      updates.lockedUntil = new Date(Date.now() + securityConfig.lockoutDuration);
    }

    await db.update(authUsers)
      .set(updates)
      .where(eq(authUsers.id, userId));
  }

  /**
   * Log authentication event
   */
  private async logAuthEvent(
    userId: string | null,
    eventType: string,
    eventStatus: string,
    ipAddress?: string,
    userAgent?: string,
    metadata?: any
  ): Promise<void> {
    await db.insert(authAuditLog).values({
      userId,
      eventType,
      eventStatus,
      ipAddress,
      userAgent,
      metadata,
    });
  }

  /**
   * Sanitize user object to remove sensitive fields
   */
  private sanitizeUser(user: any): AuthUser {
    const { 
      passwordHash, 
      passwordResetToken, 
      passwordResetExpires,
      emailVerificationToken,
      emailVerificationExpires,
      twoFactorSecret,
      loginAttempts,
      lockedUntil,
      ...sanitized 
    } = user;
    
    return sanitized as AuthUser;
  }
}

// Export singleton instance
export const authService = new AuthService();