import { Request, Response, NextFunction } from 'express';
import { db } from '@/services/database';
import { logger } from '@/utils/logger';
import { appConfig } from '@/config/environment';

/**
 * Agent Authentication Middleware
 * Validates API key in Authorization header
 */
export const agentAuthMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: 'Missing authorization header'
      });
      return;
    }

    // Check format (should be "Bearer API_KEY")
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({
        success: false,
        error: 'Invalid authorization format. Use: Bearer API_KEY'
      });
      return;
    }

    const apiKey = parts[1];
    
    // Validate API key format (should start with the configured prefix)
    if (!apiKey.startsWith(appConfig.security.apiKeyPrefix)) {
      res.status(401).json({
        success: false,
        error: 'Invalid API key format'
      });
      return;
    }

    // Lookup agent by API key
    try {
      const agent = await db.getAgentByApiKey(apiKey);
      
      // Attach agent to request for use in route handlers
      req.agent = agent;
      
      // Update last_seen timestamp for the agent
      await db.updateAgent(agent.id, {
        last_seen: new Date().toISOString()
      });

      // Continue to route handler
      next();
    } catch (error) {
      logger.warn('Authentication failed with invalid API key', {
        apiKey: apiKey.substring(0, 8) + '...',
        ip: req.ip
      });
      
      res.status(401).json({
        success: false,
        error: 'Invalid API key'
      });
    }
  } catch (error) {
    logger.error('Error in authentication middleware', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error during authentication'
    });
  }
};

/**
 * Extend Express Request interface to include agent
 */
declare global {
  namespace Express {
    interface Request {
      agent?: any; // Will be replaced with proper typing later
      correlationId?: string;
    }
  }
}