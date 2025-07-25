import { Request, Response, NextFunction } from "express";

export interface RequestLog {
  timestamp: string;
  method: string;
  url: string;
  userAgent?: string;
  ip: string;
  userId?: string;
  duration?: number;
  statusCode?: number;
  error?: string;
}

// In production, you might want to use a proper logging service like Winston
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  const log: RequestLog = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip || 'unknown',
    userId: (req as any).user?.id
  };
  
  const originalSend = res.send;
  res.send = function(body) {
    log.duration = Date.now() - start;
    log.statusCode = res.statusCode;
    
    // Log suspicious activity
    if (res.statusCode >= 400) {
      if (res.statusCode === 429) {
        console.warn('Rate limit exceeded:', log);
      } else if (res.statusCode >= 500) {
        console.error('Server error:', log);
      } else if (res.statusCode === 401 || res.statusCode === 403) {
        console.warn('Authentication/Authorization failed:', log);
      }
    }
    
    // Log slow requests (>1 second)
    if (log.duration && log.duration > 1000) {
      console.warn('Slow request:', log);
    }
    
    return originalSend.call(this, body);
  };
  
  next();
}

export function errorLogger(err: any, req: Request, res: Response, next: NextFunction) {
  const log: RequestLog = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip || 'unknown',
    userId: (req as any).user?.id,
    statusCode: err.status || 500,
    error: err.message || 'Unknown error'
  };
  
  console.error('Request error:', log);
  console.error('Stack trace:', err.stack);
  
  next(err);
}