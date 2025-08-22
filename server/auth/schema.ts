import {
  pgTable,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  uniqueIndex,
  index,
  uuid,
  jsonb
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Enhanced user table with proper authentication fields
export const authUsers = pgTable("auth_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  role: varchar("role", { length: 50 }).default("owner").notNull(),
  businessName: varchar("business_name", { length: 255 }),
  profileImageUrl: text("profile_image_url"),
  
  // Authentication fields
  emailVerified: boolean("email_verified").default(false).notNull(),
  emailVerificationToken: varchar("email_verification_token", { length: 255 }),
  emailVerificationExpires: timestamp("email_verification_expires"),
  
  // Password reset
  passwordResetToken: varchar("password_reset_token", { length: 255 }),
  passwordResetExpires: timestamp("password_reset_expires"),
  
  // Two-factor authentication
  twoFactorEnabled: boolean("two_factor_enabled").default(false).notNull(),
  twoFactorSecret: text("two_factor_secret"),
  
  // Account security
  loginAttempts: integer("login_attempts").default(0).notNull(),
  lockedUntil: timestamp("locked_until"),
  lastLogin: timestamp("last_login"),
  lastLoginIp: varchar("last_login_ip", { length: 45 }),
  
  // Stripe integration
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"), // Soft delete
}, (table) => [
  index("idx_auth_users_email").on(table.email),
  index("idx_auth_users_email_verification_token").on(table.emailVerificationToken),
  index("idx_auth_users_password_reset_token").on(table.passwordResetToken),
]);

// Session management table
export const authSessions = pgTable("auth_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => authUsers.id, { onDelete: "cascade" }).notNull(),
  refreshToken: text("refresh_token").notNull().unique(),
  refreshTokenFamily: uuid("refresh_token_family").notNull(), // For rotation tracking
  
  // Device/Client information
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address", { length: 45 }),
  fingerprint: text("fingerprint"), // Browser fingerprint for device tracking
  
  // Session metadata
  isValid: boolean("is_valid").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastActivity: timestamp("last_activity").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  
  // Revocation tracking
  revokedAt: timestamp("revoked_at"),
  revokedReason: varchar("revoked_reason", { length: 255 }),
}, (table) => [
  index("idx_auth_sessions_user_id").on(table.userId),
  index("idx_auth_sessions_refresh_token").on(table.refreshToken),
  index("idx_auth_sessions_refresh_token_family").on(table.refreshTokenFamily),
  index("idx_auth_sessions_expires_at").on(table.expiresAt),
]);

// Audit log for security events
export const authAuditLog = pgTable("auth_audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => authUsers.id, { onDelete: "set null" }),
  eventType: varchar("event_type", { length: 50 }).notNull(), // login, logout, password_change, etc.
  eventStatus: varchar("event_status", { length: 20 }).notNull(), // success, failure, blocked
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  metadata: jsonb("metadata"), // Additional event-specific data
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_auth_audit_log_user_id").on(table.userId),
  index("idx_auth_audit_log_event_type").on(table.eventType),
  index("idx_auth_audit_log_created_at").on(table.createdAt),
]);

// Login attempts tracking for rate limiting
export const authLoginAttempts = pgTable("auth_login_attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull(),
  ipAddress: varchar("ip_address", { length: 45 }).notNull(),
  attemptTime: timestamp("attempt_time").defaultNow().notNull(),
  success: boolean("success").notNull(),
  userAgent: text("user_agent"),
}, (table) => [
  index("idx_auth_login_attempts_email").on(table.email),
  index("idx_auth_login_attempts_ip").on(table.ipAddress),
  index("idx_auth_login_attempts_time").on(table.attemptTime),
]);

// CSRF tokens for form protection
export const authCsrfTokens = pgTable("auth_csrf_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  sessionId: uuid("session_id").references(() => authSessions.id, { onDelete: "cascade" }).notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
}, (table) => [
  uniqueIndex("unq_auth_csrf_token").on(table.token),
  index("idx_auth_csrf_session_id").on(table.sessionId),
  index("idx_auth_csrf_expires_at").on(table.expiresAt),
]);

// Zod schemas for validation
export const insertAuthUserSchema = createInsertSchema(authUsers, {
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  role: z.enum(["owner", "admin", "employee", "viewer"]).default("owner"),
  businessName: z.string().min(1).max(255).optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  rememberMe: z.boolean().optional().default(false),
  fingerprint: z.string().optional(),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[!@#$%^&*]/, "Password must contain at least one special character"),
  confirmPassword: z.string(),
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  businessName: z.string().min(1).max(255).optional(),
  role: z.enum(["owner", "admin", "employee", "viewer"]).optional().default("owner"),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: "You must agree to the terms and conditions"
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const passwordResetRequestSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const passwordResetConfirmSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[!@#$%^&*]/, "Password must contain at least one special character"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[!@#$%^&*]/, "Password must contain at least one special character"),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
}).refine(data => data.currentPassword !== data.newPassword, {
  message: "New password must be different from current password",
  path: ["newPassword"],
});

// TypeScript types
export type AuthUser = typeof authUsers.$inferSelect;
export type InsertAuthUser = z.infer<typeof insertAuthUserSchema>;
export type AuthSession = typeof authSessions.$inferSelect;
export type AuthAuditLog = typeof authAuditLog.$inferSelect;
export type AuthLoginAttempt = typeof authLoginAttempts.$inferSelect;
export type AuthCsrfToken = typeof authCsrfTokens.$inferSelect;