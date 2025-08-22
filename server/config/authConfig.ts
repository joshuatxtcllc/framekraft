import { Express } from 'express';

// Determine which auth system to use based on environment variable
export const AUTH_PROVIDER = process.env.AUTH_PROVIDER || 'replit'; // 'dynamodb', 'mongodb', or 'replit'

export async function setupAuthentication(app: Express) {
  console.log(`🔐 Setting up authentication with provider: ${AUTH_PROVIDER}`);
  
  switch (AUTH_PROVIDER) {
    case 'dynamodb':
      // Use DynamoDB authentication
      const { initializeTables } = await import('./dynamodb');
      const authDynamoDBRoutes = (await import('../routes/authDynamoDB')).default;
      
      // Initialize DynamoDB tables
      await initializeTables();
      
      // Register DynamoDB auth routes
      app.use('/api/auth', authDynamoDBRoutes);
      
      console.log('✅ DynamoDB authentication configured');
      break;
      
    case 'mongodb':
      // Use MongoDB authentication
      const { connectMongoDB } = await import('./mongodb');
      const authMongoDBRoutes = (await import('../routes/auth')).default;
      
      // Connect to MongoDB
      await connectMongoDB();
      
      // Register MongoDB auth routes
      app.use('/api/auth', authMongoDBRoutes);
      
      console.log('✅ MongoDB authentication configured');
      break;
      
    case 'replit':
      // Use Replit authentication
      const { setupAuth } = await import('../replitAuth');
      await setupAuth(app);
      
      console.log('✅ Replit authentication configured');
      break;
      
    default:
      throw new Error(`Unknown auth provider: ${AUTH_PROVIDER}`);
  }
}

// Export the appropriate authentication middleware based on provider
export async function getAuthMiddleware() {
  switch (AUTH_PROVIDER) {
    case 'dynamodb':
      return (await import('../middleware/authDynamoDB')).authenticate;
      
    case 'mongodb':
      return (await import('../middleware/authMongoDB')).authenticate;
      
    case 'replit':
      return (await import('../replitAuth')).isAuthenticated;
      
    default:
      throw new Error(`Unknown auth provider: ${AUTH_PROVIDER}`);
  }
}

// Export authorization middleware
export async function getAuthorizationMiddleware() {
  switch (AUTH_PROVIDER) {
    case 'dynamodb':
      return (await import('../middleware/authDynamoDB')).authorize;
      
    case 'mongodb':
      return (await import('../middleware/authMongoDB')).authorize;
      
    default:
      // Return a no-op for providers that don't support authorization
      return () => (_req: any, _res: any, next: any) => next();
  }
}