import type { Request, Response, NextFunction } from 'express';

// For local development, we'll use a simple mock authentication
const isLocalDevelopment = process.env.NODE_ENV === 'development' && !process.env.REPL_ID?.startsWith('repl-');

export function isAuthenticated(req: Request & { user?: any }, res: Response, next: NextFunction) {
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

  // Check if user is authenticated via the auth system
  if (req.user) {
    return next();
  }

  // Not authenticated
  res.status(401).json({ message: 'Unauthorized' });
}