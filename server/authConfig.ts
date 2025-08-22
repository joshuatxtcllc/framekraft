import { Express } from 'express';
import { connectMongoDB } from './config/mongodb';
import authRoutes from './routes/auth';
import { authenticate } from './middleware/authMongoDB';

// Export a flag to determine which auth system to use
export const USE_MONGODB_AUTH = process.env.USE_MONGODB_AUTH === 'true' || true; // Default to MongoDB

export async function setupMongoDBAuth(app: Express) {
  // Connect to MongoDB
  await connectMongoDB();
  
  // Register auth routes
  app.use('/api/auth', authRoutes);
  
  console.log('✅ MongoDB authentication configured');
}

// Export the appropriate authentication middleware
export const isAuthenticated = USE_MONGODB_AUTH 
  ? authenticate 
  : (await import('./replitAuth')).isAuthenticated;