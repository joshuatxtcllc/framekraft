import { Request, Response, NextFunction } from 'express';

// For local development, we'll use a simple mock authentication
const isLocalDevelopment = process.env.NODE_ENV === 'development' && !process.env.REPL_ID?.startsWith('repl-');

export const setupAuthenticationSystem = async (app: any) => {
  // Authentication is already set up in replitAuth.ts
  console.log('Authentication system initialized');
};

export const authenticate = async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
  // In local development, bypass authentication
  if (isLocalDevelopment) {
    // Mock a local user for development
    req.user = {
      id: 'local-dev-user',
      email: 'dev@localhost',
      firstName: 'Local',
      lastName: 'Developer',
      claims: {
        sub: 'local-dev-user',
        email: 'dev@localhost',
        name: 'Local Developer'
      }
    };
    return next();
  }

  // Check if user is authenticated via Replit auth
  if (req.user) {
    return next();
  }

  // Not authenticated
  return res.status(401).json({ message: "Unauthorized" });
};

export const migrateAuthentication = async () => {
  // No migration needed
  console.log('No authentication migration needed');
};