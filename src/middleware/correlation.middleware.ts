import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/utils/logger';

/**
 * Correlation ID Middleware
 * Adds a correlation ID to each request for distributed tracing
 */
export const correlationMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Check if correlation ID exists in headers, otherwise generate a new one
  const correlationId = req.headers['x-correlation-id'] as string || uuidv4();
  
  // Attach to request object for use in route handlers
  req.correlationId = correlationId;
  
  // Set as response header so clients can track
  res.setHeader('x-correlation-id', correlationId);
  
  // Create a child logger with the correlation ID for this request
  const requestLogger = logger.child({ correlationId });
  
  // Log the incoming request with useful information
  requestLogger.info('Request received', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });
  
  // Time the request duration
  const startTime = process.hrtime();
  
  // Monkey patch res.end to calculate duration and log response
  const originalEnd = res.end;
  res.end = function (...args) {
    const diff = process.hrtime(startTime);
    const responseTime = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);
    
    requestLogger.info('Response sent', {
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
    });
    
    return originalEnd.apply(res, args);
  };
  
  next();
};