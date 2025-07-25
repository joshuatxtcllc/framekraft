import { Request, Response, NextFunction } from "express";

// Security headers middleware
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy (relaxed for development)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
    );
  }
  
  next();
}

// Request sanitization
export function sanitizeRequest(req: Request, res: Response, next: NextFunction) {
  // Remove null bytes from request body
  if (req.body && typeof req.body === 'object') {
    req.body = JSON.parse(JSON.stringify(req.body).replace(/\0/g, ''));
  }
  
  next();
}

// API security for sensitive endpoints
export function apiSecurity(req: Request, res: Response, next: NextFunction) {
  // Require Content-Type for POST/PUT requests
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.get('Content-Type');
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(415).json({
        message: 'Content-Type must be application/json'
      });
    }
  }
  
  next();
}