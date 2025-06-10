// Main entry point for MCP Agent Backend
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { appConfig } from './config/environment';
import { logger } from './utils/logger';
import { db } from './services/database';
import { setupSwagger } from './utils/swagger';

// Import routes
import agentRoutes from './routes/agent.routes';
import mcpRoutes from './routes/mcp.routes';
import feedbackRoutes from './routes/feedback.routes';
import mercadolivreRoutes from './routes/mercadolivre.routes';
import personaRoutes from './routes/persona.routes';
import departmentRoutes from './routes/department.routes';
import competitorRoutes from './routes/competitor.routes';
import sentimentRoutes from './routes/sentiment.routes';
import a2aRoutes from './routes/a2a.routes';

// Import middleware
import { correlationMiddleware } from './middleware/correlation.middleware';

// Import services
import { feedbackService } from './services/feedback';
import { personaService } from './services/persona';
import { departmentInsightService } from './services/department-insight';
import { competitorBenchmarkService } from './services/competitor-benchmark';
import { sentimentAnalysisService } from './services/sentiment-analysis';

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

// Set up Swagger documentation
setupSwagger(app);

// Root endpoint
app.get('/', (req: express.Request, res: express.Response) => {
  res.json({
    message: 'MCP Agent Backend - Feedback Intelligence Platform',
    version: appConfig.mcp.serverVersion,
    status: 'running',
    timestamp: new Date().toISOString(),
          endpoints: {
        health: '/health',
        api_docs: '/api-docs',
        api_docs_json: '/api-docs.json',
        api_docs_redoc: '/api-docs-redoc',
        mercadolivre_conversations: `/api/${appConfig.server.apiVersion}/mercadolivre/conversations/view`,
        departmental_recommendations: `/api/${appConfig.server.apiVersion}/departments/recommendations/view`,
        competitive_benchmarking: `/api/${appConfig.server.apiVersion}/competitors/benchmark/visualization`,
        sentiment_dashboard: `/api/${appConfig.server.apiVersion}/sentiment/dashboard/view`,
        api: {
          agents: `/api/${appConfig.server.apiVersion}/agents`,
          mcp: `/api/${appConfig.server.apiVersion}/mcp`,
          feedback: `/api/${appConfig.server.apiVersion}/feedback`,
          mercadolivre: `/api/${appConfig.server.apiVersion}/mercadolivre`,
          personas: `/api/${appConfig.server.apiVersion}/personas`,
          departments: `/api/${appConfig.server.apiVersion}/departments`,
          competitors: `/api/${appConfig.server.apiVersion}/competitors`,
          sentiment: `/api/${appConfig.server.apiVersion}/sentiment`,
        }
      },
    correlationId: req.correlationId,
  });
});

// Convenient redirect for MercadoLivre conversations
app.get('/conversations', (req: express.Request, res: express.Response) => {
  res.redirect(`/api/${appConfig.server.apiVersion}/mercadolivre/conversations/view`);
});

// Convenient redirect for departmental recommendations
app.get('/departments', (req: express.Request, res: express.Response) => {
  res.redirect(`/api/${appConfig.server.apiVersion}/departments/recommendations/view`);
});

// Convenient redirect for competitive benchmarking
app.get('/competitors', (req: express.Request, res: express.Response) => {
  res.redirect(`/api/${appConfig.server.apiVersion}/competitors/benchmark/visualization`);
});

// Convenient redirect for sentiment dashboard
app.get('/sentiment', (req: express.Request, res: express.Response) => {
  res.redirect(`/api/${appConfig.server.apiVersion}/sentiment/dashboard/view`);
});

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
app.use(`/api/${appConfig.server.apiVersion}/mercadolivre`, mercadolivreRoutes);
app.use(`/api/${appConfig.server.apiVersion}/personas`, personaRoutes);
app.use(`/api/${appConfig.server.apiVersion}/departments`, departmentRoutes);
app.use(`/api/${appConfig.server.apiVersion}/competitors`, competitorRoutes);
app.use(`/api/${appConfig.server.apiVersion}/sentiment`, sentimentRoutes);
app.use(`/api/${appConfig.server.apiVersion}/a2a`, a2aRoutes);

// Import WebSocket service
import http from 'http';
import { WebSocketService } from './services/websocket';

// WebSocket server instance
let wsService: WebSocketService;

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const dbHealthy = await db.healthCheck();
    if (!dbHealthy) {
      throw new Error('Database connection failed');
    }

    // Create HTTP server
    const server = http.createServer(app);

    // Initialize WebSocket service
    wsService = new WebSocketService(server);

    // Initialize services
    feedbackService.initialize(wsService);
    personaService.initialize(wsService);
    departmentInsightService.initialize(wsService);
    competitorBenchmarkService.initialize(wsService);
    sentimentAnalysisService.initialize(wsService);

    // Start listening
    server.listen(appConfig.server.port, () => {
      logger.info('🚀 MCP Agent Backend started', {
        port: appConfig.server.port,
        env: appConfig.server.env,
        version: appConfig.mcp.serverVersion,
        transport: [
          'HTTP/REST',
          'WebSocket',
          appConfig.mcp.transport
        ],
      });
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  if (wsService) {
    wsService.shutdown();
  }
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  if (wsService) {
    wsService.shutdown();
  }
  process.exit(0);
});

// Start the server
startServer();

export default app; 