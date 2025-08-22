import { Request } from 'express';

export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'owner' | 'admin' | 'employee' | 'viewer';
  profileImageUrl?: string;
  businessName?: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: string;
  sessionId: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload extends AuthTokenPayload {
  type: 'refresh';
  fingerprint?: string;
}

export interface AuthSession {
  id: string;
  userId: string;
  refreshToken: string;
  deviceInfo?: {
    userAgent: string;
    ip: string;
    fingerprint?: string;
  };
  expiresAt: Date;
  createdAt: Date;
  lastActivity: Date;
  isValid: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
  fingerprint?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  businessName?: string;
  role?: 'owner' | 'admin' | 'employee' | 'viewer';
  agreeToTerms: boolean;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  password: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
  session?: AuthSession;
  accessToken?: string;
  refreshToken?: string;
  csrfToken?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: AuthUser;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  message?: string;
  requiresTwoFactor?: boolean;
  csrfToken?: string;
}

export interface TokenVerificationResult {
  valid: boolean;
  payload?: AuthTokenPayload;
  error?: string;
  expired?: boolean;
}

export interface SecurityConfig {
  bcryptRounds: number;
  sessionTimeout: number;
  refreshTokenExpiry: number;
  accessTokenExpiry: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
  passwordMinLength: number;
  passwordRequireNumbers: boolean;
  passwordRequireSpecialChars: boolean;
  passwordRequireUppercase: boolean;
  csrfEnabled: boolean;
  cookieSecure: boolean;
  cookieHttpOnly: boolean;
  cookieSameSite: 'strict' | 'lax' | 'none';
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message: string;
  skipSuccessfulRequests: boolean;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}