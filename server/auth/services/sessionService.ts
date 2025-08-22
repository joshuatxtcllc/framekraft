import { db } from '../../db';
import { authSessions, authUsers, authCsrfTokens } from '../schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { AuthSession, AuthUser } from '../types';
import { jwtService } from './jwtService';
import { securityConfig } from '../config';
import crypto from 'crypto';

export class SessionService {
  /**
   * Create a new session
   */
  async createSession(
    userId: string,
    userAgent?: string,
    ipAddress?: string,
    fingerprint?: string,
    rememberMe: boolean = false
  ): Promise<{
    session: AuthSession;
    accessToken: string;
    refreshToken: string;
    csrfToken: string;
  }> {
    // Generate tokens
    const sessionId = crypto.randomUUID();
    const refreshTokenFamily = crypto.randomUUID();
    
    // Get user details for token
    const user = await db.select().from(authUsers).where(eq(authUsers.id, userId)).limit(1);
    if (!user.length) {
      throw new Error('User not found');
    }

    const { accessToken, refreshToken, expiresIn } = jwtService.generateTokenPair(
      userId,
      user[0].email,
      user[0].role,
      sessionId,
      fingerprint
    );

    // Calculate session expiry
    const sessionDuration = rememberMe 
      ? securityConfig.refreshTokenExpiry 
      : securityConfig.sessionTimeout;
    
    const expiresAt = new Date(Date.now() + sessionDuration);

    // Create session in database
    const [session] = await db.insert(authSessions).values({
      id: sessionId,
      userId,
      refreshToken: jwtService.hashToken(refreshToken),
      refreshTokenFamily,
      userAgent,
      ipAddress,
      fingerprint,
      expiresAt,
      isValid: true,
    }).returning();

    // Generate CSRF token
    const csrfToken = await this.generateCsrfToken(sessionId);

    // Update user's last login
    await db.update(authUsers)
      .set({
        lastLogin: new Date(),
        lastLoginIp: ipAddress,
        loginAttempts: 0,
        lockedUntil: null,
      })
      .where(eq(authUsers.id, userId));

    return {
      session,
      accessToken,
      refreshToken,
      csrfToken,
    };
  }

  /**
   * Validate and refresh session
   */
  async refreshSession(
    refreshToken: string,
    fingerprint?: string
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    // Verify the refresh token
    const verification = jwtService.verifyRefreshToken(refreshToken);
    if (!verification.valid || !verification.payload) {
      throw new Error('Invalid refresh token');
    }

    const hashedToken = jwtService.hashToken(refreshToken);
    
    // Find the session
    const [session] = await db.select()
      .from(authSessions)
      .where(
        and(
          eq(authSessions.refreshToken, hashedToken),
          eq(authSessions.isValid, true),
          gte(authSessions.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!session) {
      // Possible token reuse attack - invalidate all sessions in the family
      await this.invalidateTokenFamily(verification.payload.sessionId);
      throw new Error('Session not found or expired');
    }

    // Verify fingerprint if provided
    if (fingerprint && session.fingerprint && session.fingerprint !== fingerprint) {
      await this.invalidateSession(session.id);
      throw new Error('Device fingerprint mismatch');
    }

    // Get user details
    const [user] = await db.select()
      .from(authUsers)
      .where(eq(authUsers.id, session.userId))
      .limit(1);

    if (!user) {
      throw new Error('User not found');
    }

    // Generate new token pair (token rotation)
    const newTokens = jwtService.generateTokenPair(
      user.id,
      user.email,
      user.role,
      session.id,
      fingerprint
    );

    // Update session with new refresh token
    await db.update(authSessions)
      .set({
        refreshToken: jwtService.hashToken(newTokens.refreshToken),
        lastActivity: new Date(),
      })
      .where(eq(authSessions.id, session.id));

    return newTokens;
  }

  /**
   * Invalidate a session
   */
  async invalidateSession(sessionId: string, reason?: string): Promise<void> {
    await db.update(authSessions)
      .set({
        isValid: false,
        revokedAt: new Date(),
        revokedReason: reason,
      })
      .where(eq(authSessions.id, sessionId));

    // Also invalidate all CSRF tokens for this session
    await db.delete(authCsrfTokens)
      .where(eq(authCsrfTokens.sessionId, sessionId));
  }

  /**
   * Invalidate all sessions for a user
   */
  async invalidateUserSessions(userId: string, reason?: string): Promise<void> {
    await db.update(authSessions)
      .set({
        isValid: false,
        revokedAt: new Date(),
        revokedReason: reason,
      })
      .where(
        and(
          eq(authSessions.userId, userId),
          eq(authSessions.isValid, true)
        )
      );
  }

  /**
   * Invalidate all sessions in a token family (for token rotation security)
   */
  async invalidateTokenFamily(sessionId: string): Promise<void> {
    const [session] = await db.select()
      .from(authSessions)
      .where(eq(authSessions.id, sessionId))
      .limit(1);

    if (session) {
      await db.update(authSessions)
        .set({
          isValid: false,
          revokedAt: new Date(),
          revokedReason: 'Token reuse detected',
        })
        .where(eq(authSessions.refreshTokenFamily, session.refreshTokenFamily));
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    const result = await db.delete(authSessions)
      .where(lte(authSessions.expiresAt, new Date()))
      .returning();

    return result.length;
  }

  /**
   * Get active sessions for a user
   */
  async getUserSessions(userId: string): Promise<AuthSession[]> {
    return db.select()
      .from(authSessions)
      .where(
        and(
          eq(authSessions.userId, userId),
          eq(authSessions.isValid, true),
          gte(authSessions.expiresAt, new Date())
        )
      );
  }

  /**
   * Generate CSRF token for a session
   */
  async generateCsrfToken(sessionId: string): Promise<string> {
    const token = jwtService.generateCsrfToken();
    const expiresAt = new Date(Date.now() + securityConfig.sessionTimeout);

    await db.insert(authCsrfTokens).values({
      token,
      sessionId,
      expiresAt,
      used: false,
    });

    return token;
  }

  /**
   * Validate CSRF token
   */
  async validateCsrfToken(token: string, sessionId: string): Promise<boolean> {
    const [csrfToken] = await db.select()
      .from(authCsrfTokens)
      .where(
        and(
          eq(authCsrfTokens.token, token),
          eq(authCsrfTokens.sessionId, sessionId),
          eq(authCsrfTokens.used, false),
          gte(authCsrfTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!csrfToken) {
      return false;
    }

    // Mark token as used (single-use tokens)
    await db.update(authCsrfTokens)
      .set({ used: true })
      .where(eq(authCsrfTokens.id, csrfToken.id));

    return true;
  }

  /**
   * Update session activity
   */
  async updateSessionActivity(sessionId: string): Promise<void> {
    await db.update(authSessions)
      .set({ lastActivity: new Date() })
      .where(eq(authSessions.id, sessionId));
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<AuthSession | null> {
    const [session] = await db.select()
      .from(authSessions)
      .where(
        and(
          eq(authSessions.id, sessionId),
          eq(authSessions.isValid, true),
          gte(authSessions.expiresAt, new Date())
        )
      )
      .limit(1);

    return session || null;
  }

  /**
   * Count active sessions
   */
  async countActiveSessions(userId?: string): Promise<number> {
    const conditions = [
      eq(authSessions.isValid, true),
      gte(authSessions.expiresAt, new Date())
    ];

    if (userId) {
      conditions.push(eq(authSessions.userId, userId));
    }

    const result = await db.select()
      .from(authSessions)
      .where(and(...conditions));

    return result.length;
  }
}

// Export singleton instance
export const sessionService = new SessionService();