import type { Request, Response, NextFunction } from 'express';

export function isAuthenticated(req: Request & { user?: any }, res: Response, next: NextFunction) {
  // Check if user is authenticated via the auth system
  if (req.user) {
    return next();
  }

  // Not authenticated
  res.status(401).json({ message: 'Unauthorized' });
}