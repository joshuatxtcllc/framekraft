import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { jwtConfig } from '../config';
import { AuthTokenPayload, RefreshTokenPayload, TokenVerificationResult } from '../types';

export class JwtService {
  /**
   * Generate access token with short expiry
   */
  generateAccessToken(payload: Omit<AuthTokenPayload, 'type' | 'iat' | 'exp'>): string {
    const tokenPayload: AuthTokenPayload = {
      ...payload,
      type: 'access'
    };

    return jwt.sign(tokenPayload, jwtConfig.accessSecret, {
      expiresIn: jwtConfig.accessExpiresIn,
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
      algorithm: 'HS256'
    });
  }

  /**
   * Generate refresh token with longer expiry
   */
  generateRefreshToken(payload: Omit<RefreshTokenPayload, 'type' | 'iat' | 'exp'>): string {
    const tokenPayload: RefreshTokenPayload = {
      ...payload,
      type: 'refresh'
    };

    return jwt.sign(tokenPayload, jwtConfig.refreshSecret, {
      expiresIn: jwtConfig.refreshExpiresIn,
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
      algorithm: 'HS256'
    });
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token: string): TokenVerificationResult {
    try {
      const payload = jwt.verify(token, jwtConfig.accessSecret, {
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience,
        algorithms: ['HS256']
      }) as AuthTokenPayload;

      if (payload.type !== 'access') {
        return {
          valid: false,
          error: 'Invalid token type'
        };
      }

      return {
        valid: true,
        payload
      };
    } catch (error: any) {
      return {
        valid: false,
        error: error.message,
        expired: error.name === 'TokenExpiredError'
      };
    }
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token: string): TokenVerificationResult {
    try {
      const payload = jwt.verify(token, jwtConfig.refreshSecret, {
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience,
        algorithms: ['HS256']
      }) as RefreshTokenPayload;

      if (payload.type !== 'refresh') {
        return {
          valid: false,
          error: 'Invalid token type'
        };
      }

      return {
        valid: true,
        payload
      };
    } catch (error: any) {
      return {
        valid: false,
        error: error.message,
        expired: error.name === 'TokenExpiredError'
      };
    }
  }

  /**
   * Decode token without verification (for debugging)
   */
  decodeToken(token: string): any {
    return jwt.decode(token);
  }

  /**
   * Generate secure random token for various purposes
   */
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate CSRF token
   */
  generateCsrfToken(): string {
    return this.generateSecureToken(32);
  }

  /**
   * Generate email verification token
   */
  generateEmailVerificationToken(): string {
    return this.generateSecureToken(32);
  }

  /**
   * Generate password reset token
   */
  generatePasswordResetToken(): string {
    return this.generateSecureToken(32);
  }

  /**
   * Hash token for database storage (for sensitive tokens)
   */
  hashToken(token: string): string {
    return crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
  }

  /**
   * Compare token with hash
   */
  compareTokenHash(token: string, hash: string): boolean {
    const tokenHash = this.hashToken(token);
    return crypto.timingSafeEqual(
      Buffer.from(tokenHash),
      Buffer.from(hash)
    );
  }

  /**
   * Generate token pair (access + refresh)
   */
  generateTokenPair(userId: string, email: string, role: string, sessionId: string, fingerprint?: string): {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  } {
    const accessToken = this.generateAccessToken({
      userId,
      email,
      role,
      sessionId
    });

    const refreshToken = this.generateRefreshToken({
      userId,
      email,
      role,
      sessionId,
      fingerprint
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: parseInt(process.env.ACCESS_TOKEN_MINUTES || '15') * 60
    };
  }

  /**
   * Extract token from Authorization header
   */
  extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  /**
   * Validate token expiry with grace period
   */
  isTokenExpiringSoon(token: string, gracePeriodMinutes: number = 5): boolean {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) {
      return true;
    }

    const expiryTime = decoded.exp * 1000;
    const gracePeriod = gracePeriodMinutes * 60 * 1000;
    const now = Date.now();

    return (expiryTime - now) <= gracePeriod;
  }
}

// Export singleton instance
export const jwtService = new JwtService();