import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { 
  PutCommand, 
  GetCommand, 
  QueryCommand, 
  UpdateCommand,
  DeleteCommand,
  BatchWriteCommand
} from '@aws-sdk/lib-dynamodb';
import { dynamodb, TABLES, getTTL } from '../config/dynamodb';
import crypto from 'crypto';

// User interface
export interface IUser {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  businessName?: string;
  role: 'admin' | 'owner' | 'employee' | 'viewer';
  profileImageUrl?: string;
  isEmailVerified: boolean;
  isActive: boolean;
  loginAttempts: number;
  lockUntil?: number;
  lastLogin?: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  preferences: {
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
    theme: 'light' | 'dark' | 'system';
    language: string;
  };
  createdAt: number;
  updatedAt: number;
}

// User input types
export interface CreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  businessName?: string;
  role?: 'admin' | 'owner' | 'employee' | 'viewer';
}

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  businessName?: string;
  profileImageUrl?: string;
  preferences?: Partial<IUser['preferences']>;
}

// RefreshToken interface
export interface IRefreshToken {
  token: string;
  userId: string;
  userAgent?: string;
  ipAddress?: string;
  createdAt: number;
  expiresAt: number;
  ttl: number;
}

export class UserModel {
  // Create a new user
  static async create(input: CreateUserInput): Promise<IUser> {
    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash(input.password, 12);
    const now = Date.now();
    
    const user: IUser = {
      id: userId,
      email: input.email.toLowerCase(),
      password: hashedPassword,
      firstName: input.firstName,
      lastName: input.lastName,
      businessName: input.businessName,
      role: input.role || 'owner',
      isEmailVerified: false,
      isActive: true,
      loginAttempts: 0,
      preferences: {
        notifications: {
          email: true,
          sms: false,
          push: true
        },
        theme: 'system',
        language: 'en'
      },
      createdAt: now,
      updatedAt: now
    };
    
    await dynamodb.send(new PutCommand({
      TableName: TABLES.USERS,
      Item: user,
      ConditionExpression: 'attribute_not_exists(id)'
    }));
    
    return user;
  }
  
  // Find user by ID
  static async findById(id: string): Promise<IUser | null> {
    const response = await dynamodb.send(new GetCommand({
      TableName: TABLES.USERS,
      Key: { id }
    }));
    
    return response.Item as IUser || null;
  }
  
  // Find user by email using GSI
  static async findByEmail(email: string): Promise<IUser | null> {
    const response = await dynamodb.send(new QueryCommand({
      TableName: TABLES.USERS,
      IndexName: 'email-index',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email.toLowerCase()
      },
      Limit: 1
    }));
    
    return response.Items?.[0] as IUser || null;
  }
  
  // Update user
  static async update(id: string, updates: UpdateUserInput): Promise<IUser | null> {
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};
    
    // Build update expressions dynamically
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        updateExpressions.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = value;
      }
    });
    
    // Always update the updatedAt timestamp
    updateExpressions.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = Date.now();
    
    const response = await dynamodb.send(new UpdateCommand({
      TableName: TABLES.USERS,
      Key: { id },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    }));
    
    return response.Attributes as IUser || null;
  }
  
  // Verify password
  static async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
  
  // Increment login attempts
  static async incrementLoginAttempts(userId: string): Promise<void> {
    const user = await this.findById(userId);
    if (!user) return;
    
    const attempts = (user.loginAttempts || 0) + 1;
    const updates: any = {
      loginAttempts: attempts
    };
    
    // Lock account after 5 attempts for 2 hours
    if (attempts >= 5) {
      updates.lockUntil = Date.now() + (2 * 60 * 60 * 1000);
    }
    
    await this.update(userId, updates);
  }
  
  // Reset login attempts
  static async resetLoginAttempts(userId: string): Promise<void> {
    await dynamodb.send(new UpdateCommand({
      TableName: TABLES.USERS,
      Key: { id: userId },
      UpdateExpression: 'SET loginAttempts = :zero, lastLogin = :now REMOVE lockUntil',
      ExpressionAttributeValues: {
        ':zero': 0,
        ':now': Date.now()
      }
    }));
  }
  
  // Check if account is locked
  static isLocked(user: IUser): boolean {
    return !!(user.lockUntil && user.lockUntil > Date.now());
  }
  
  // Update password
  static async updatePassword(userId: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    await dynamodb.send(new UpdateCommand({
      TableName: TABLES.USERS,
      Key: { id: userId },
      UpdateExpression: 'SET password = :password, updatedAt = :now',
      ExpressionAttributeValues: {
        ':password': hashedPassword,
        ':now': Date.now()
      }
    }));
  }
  
  // Create email verification token
  static async createEmailVerificationToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
    
    await dynamodb.send(new PutCommand({
      TableName: TABLES.EMAIL_VERIFICATIONS,
      Item: {
        token,
        userId,
        createdAt: Date.now(),
        expiresAt,
        ttl: getTTL(24 * 60 * 60) // 24 hours TTL
      }
    }));
    
    return token;
  }
  
  // Verify email token
  static async verifyEmailToken(token: string): Promise<string | null> {
    const response = await dynamodb.send(new GetCommand({
      TableName: TABLES.EMAIL_VERIFICATIONS,
      Key: { token }
    }));
    
    if (!response.Item || response.Item.expiresAt < Date.now()) {
      return null;
    }
    
    // Mark user as verified
    await dynamodb.send(new UpdateCommand({
      TableName: TABLES.USERS,
      Key: { id: response.Item.userId },
      UpdateExpression: 'SET isEmailVerified = :true, updatedAt = :now',
      ExpressionAttributeValues: {
        ':true': true,
        ':now': Date.now()
      }
    }));
    
    // Delete the verification token
    await dynamodb.send(new DeleteCommand({
      TableName: TABLES.EMAIL_VERIFICATIONS,
      Key: { token }
    }));
    
    return response.Item.userId;
  }
  
  // Create password reset token
  static async createPasswordResetToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + (60 * 60 * 1000); // 1 hour
    
    await dynamodb.send(new PutCommand({
      TableName: TABLES.PASSWORD_RESETS,
      Item: {
        token,
        userId,
        createdAt: Date.now(),
        expiresAt,
        ttl: getTTL(60 * 60) // 1 hour TTL
      }
    }));
    
    return token;
  }
  
  // Verify password reset token
  static async verifyPasswordResetToken(token: string): Promise<string | null> {
    const response = await dynamodb.send(new GetCommand({
      TableName: TABLES.PASSWORD_RESETS,
      Key: { token }
    }));
    
    if (!response.Item || response.Item.expiresAt < Date.now()) {
      return null;
    }
    
    return response.Item.userId;
  }
  
  // Reset password with token
  static async resetPasswordWithToken(token: string, newPassword: string): Promise<boolean> {
    const userId = await this.verifyPasswordResetToken(token);
    if (!userId) return false;
    
    await this.updatePassword(userId, newPassword);
    
    // Delete the reset token
    await dynamodb.send(new DeleteCommand({
      TableName: TABLES.PASSWORD_RESETS,
      Key: { token }
    }));
    
    // Clear all refresh tokens for this user
    await this.clearAllRefreshTokens(userId);
    
    return true;
  }
  
  // Save refresh token
  static async saveRefreshToken(
    userId: string, 
    token: string, 
    userAgent?: string, 
    ipAddress?: string
  ): Promise<void> {
    const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days
    
    await dynamodb.send(new PutCommand({
      TableName: TABLES.REFRESH_TOKENS,
      Item: {
        token,
        userId,
        userAgent,
        ipAddress,
        createdAt: Date.now(),
        expiresAt,
        ttl: getTTL(7 * 24 * 60 * 60) // 7 days TTL
      }
    }));
    
    // Clean up old tokens (keep only last 5)
    await this.cleanupOldRefreshTokens(userId);
  }
  
  // Verify refresh token
  static async verifyRefreshToken(token: string): Promise<IRefreshToken | null> {
    const response = await dynamodb.send(new GetCommand({
      TableName: TABLES.REFRESH_TOKENS,
      Key: { token }
    }));
    
    if (!response.Item || response.Item.expiresAt < Date.now()) {
      return null;
    }
    
    return response.Item as IRefreshToken;
  }
  
  // Delete refresh token
  static async deleteRefreshToken(token: string): Promise<void> {
    await dynamodb.send(new DeleteCommand({
      TableName: TABLES.REFRESH_TOKENS,
      Key: { token }
    }));
  }
  
  // Clear all refresh tokens for a user
  static async clearAllRefreshTokens(userId: string): Promise<void> {
    // Query all tokens for the user
    const response = await dynamodb.send(new QueryCommand({
      TableName: TABLES.REFRESH_TOKENS,
      IndexName: 'userId-index',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }));
    
    if (!response.Items || response.Items.length === 0) return;
    
    // Delete all tokens in batches
    const deleteRequests = response.Items.map(item => ({
      DeleteRequest: {
        Key: { token: item.token }
      }
    }));
    
    // DynamoDB batch write supports max 25 items
    for (let i = 0; i < deleteRequests.length; i += 25) {
      const batch = deleteRequests.slice(i, i + 25);
      await dynamodb.send(new BatchWriteCommand({
        RequestItems: {
          [TABLES.REFRESH_TOKENS]: batch
        }
      }));
    }
  }
  
  // Cleanup old refresh tokens (keep only last 5)
  private static async cleanupOldRefreshTokens(userId: string): Promise<void> {
    const response = await dynamodb.send(new QueryCommand({
      TableName: TABLES.REFRESH_TOKENS,
      IndexName: 'userId-index',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      },
      ScanIndexForward: false // Sort by expiresAt descending
    }));
    
    if (!response.Items || response.Items.length <= 5) return;
    
    // Delete tokens beyond the 5th
    const tokensToDelete = response.Items.slice(5);
    const deleteRequests = tokensToDelete.map(item => ({
      DeleteRequest: {
        Key: { token: item.token }
      }
    }));
    
    for (let i = 0; i < deleteRequests.length; i += 25) {
      const batch = deleteRequests.slice(i, i + 25);
      await dynamodb.send(new BatchWriteCommand({
        RequestItems: {
          [TABLES.REFRESH_TOKENS]: batch
        }
      }));
    }
  }
  
  // Sanitize user object for response (remove sensitive fields)
  static sanitizeUser(user: IUser): Partial<IUser> {
    const { password, ...sanitized } = user;
    return sanitized;
  }
}