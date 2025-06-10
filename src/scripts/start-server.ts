/**
 * Start Server Script
 * Runs the MCP Agent Backend server with all components initialized
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import http from 'http';
import dotenv from 'dotenv';
import { appConfig } from '../config/environment';
import { logger } from '../utils/logger';
import { db } from '../services/database';
import { WebSocketService } from '../services/websocket';
import { feedbackService } from '../services/feedback';
import { correlationMiddleware } from '../middleware/correlation.middleware';

// Import routes
import agentRoutes from '../routes/agent.routes';
import mcpRoutes from '../routes/mcp.routes';
import feedbackRoutes from '../routes/feedback.routes';

// Load environment variables
dotenv.config();

async function startServer() {
  console.log('Starting MCP Agent Backend Server');
  console.log('================================');
  
  // Test database connection
  try {
    const dbHealthy = await db.healthCheck();
    if (!dbHealthy) {
      throw new Error('Database connection failed');
    }
    console.log('✅ Database connection successful');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
  
  // Create Express app
  const app = express();
  
  // Security middleware
  app.use(helmet());
  app.use(cors({
    origin: appConfig.server.corsOrigins,
    credentials: true,
  }));
  
  // Rate limiting
  const limiter = rateLimit({
    windowMs: appConfig.rateLimit.windowMs,
    max: appConfig.rateLimit.maxRequests,
    message: 'Too many requests from this IP, please try again later.',
  });
  app.use(limiter);
  
  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  
  // Add correlation ID middleware for request tracing
  app.use(correlationMiddleware);
  
  // Health check endpoint
  app.get('/health', async (req: express.Request, res: express.Response) => {
    try {
      const dbHealthy = await db.healthCheck();
      
      const mcpStatus = {
        name: appConfig.mcp.serverName,
        version: appConfig.mcp.serverVersion,
        transport: appConfig.mcp.transport,
        capabilities: appConfig.mcp.capabilities,
      };
      
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
          database: dbHealthy ? 'healthy' : 'unhealthy',
          mcp: mcpStatus,
          feedback: {
            pipeline: feedbackService.getPipelineInfo(),
          },
        },
        version: appConfig.mcp.serverVersion,
        correlationId: req.correlationId,
      });
    } catch (error) {
      logger.error('Health check failed', { error, correlationId: req.correlationId });
      res.status(500).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Internal server error',
        correlationId: req.correlationId,
      });
    }
  });
  
  // Register API routes
  app.use(`/api/${appConfig.server.apiVersion}/agents`, agentRoutes);
  app.use(`/api/${appConfig.server.apiVersion}/mcp`, mcpRoutes);
  app.use(`/api/${appConfig.server.apiVersion}/feedback`, feedbackRoutes);
  
  // Create HTTP server
  const server = http.createServer(app);
  
  // Initialize WebSocket service
  const wsService = new WebSocketService(server);
  console.log('✅ WebSocket service initialized');
  
  // Initialize feedback service
  feedbackService.initialize(wsService);
  console.log('✅ Feedback service initialized');
  
  // Use a different port if specified or default is already in use
  const port = parseInt(process.env.PORT || '3001');

  // Start listening
  server.listen(port, () => {
    console.log(`🚀 MCP Agent Backend started on port ${port}`);
    console.log(`Environment: ${appConfig.server.env}`);
    console.log(`Version: ${appConfig.mcp.serverVersion}`);
    console.log(`API Version: ${appConfig.server.apiVersion}`);
    console.log(`Transport: HTTP/REST, WebSocket, ${appConfig.mcp.transport}`);
    console.log('\nAvailable endpoints:');
    console.log(`- Health check: GET http://localhost:${port}/health`);
    console.log(`- Agents API: http://localhost:${port}/api/${appConfig.server.apiVersion}/agents`);
    console.log(`- MCP API: http://localhost:${port}/api/${appConfig.server.apiVersion}/mcp`);
    console.log(`- Feedback API: http://localhost:${port}/api/${appConfig.server.apiVersion}/feedback`);
    console.log(`- WebSocket: ws://localhost:${port}/api/${appConfig.server.apiVersion}/ws`);
  });
  
  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    wsService.shutdown();
    process.exit(0);
  });
  
  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    wsService.shutdown();
    process.exit(0);
  });
}

// Start the server
startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});