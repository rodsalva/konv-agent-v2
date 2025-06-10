/**
 * OpenAPI (Swagger) Configuration Utility
 * 
 * This utility sets up the OpenAPI documentation for the MCP Agent Backend
 */
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import { appConfig } from '../config/environment';
import path from 'path';
import fs from 'fs';

// Read package.json for version info
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf8')
);

// OpenAPI Definition
const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MCP Agent Backend API',
      version: packageJson.version,
      description: 'API documentation for the MCP Agent Backend system',
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
      contact: {
        name: 'MercadoLivre AI Agent Team',
        url: 'https://github.com/mercadolivre/mcp-agent-backend',
        email: 'mcp-agent@mercadolivre.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${appConfig.server.port}/api/${appConfig.server.apiVersion}`,
        description: 'Development Server',
      },
      {
        url: `https://staging-api.example.com/api/${appConfig.server.apiVersion}`,
        description: 'Staging Server',
      },
      {
        url: `https://api.example.com/api/${appConfig.server.apiVersion}`,
        description: 'Production Server',
      },
    ],
    tags: [
      {
        name: 'Agents',
        description: 'Agent management operations',
      },
      {
        name: 'Feedback',
        description: 'Feedback processing operations',
      },
      {
        name: 'MCP',
        description: 'Model Context Protocol operations',
      },
      {
        name: 'Competitors',
        description: 'Competitor benchmarking operations',
      },
      {
        name: 'Sentiment',
        description: 'Sentiment analysis operations',
      },
      {
        name: 'Personas',
        description: 'Persona management operations',
      },
      {
        name: 'Departments',
        description: 'Department insight operations',
      },
      {
        name: 'MercadoLivre',
        description: 'MercadoLivre specific operations',
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
          description: 'API key authentication',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
              example: 'Error message',
            },
            correlationId: {
              type: 'string',
              example: '550e8400-e29b-41d4-a716-446655440000',
            },
          },
        },
        Agent: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '550e8400-e29b-41d4-a716-446655440000',
            },
            name: {
              type: 'string',
              example: 'Company Survey Agent',
            },
            type: {
              type: 'string',
              enum: ['company', 'customer', 'insight', 'product', 'support', 'sales'],
              example: 'company',
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'suspended'],
              example: 'active',
            },
            capabilities: {
              type: 'array',
              items: {
                type: 'string',
              },
              example: ['feedback_collection', 'survey_management'],
            },
            metadata: {
              type: 'object',
              example: {},
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              example: '2023-01-01T00:00:00Z',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              example: '2023-01-01T00:00:00Z',
            },
            last_seen: {
              type: 'string',
              format: 'date-time',
              example: '2023-01-01T00:00:00Z',
            },
          },
        },
        // Feedback schemas
        FeedbackData: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '550e8400-e29b-41d4-a716-446655440000',
            },
            customer_agent_id: {
              type: 'string',
              format: 'uuid',
              example: '550e8400-e29b-41d4-a716-446655440000',
            },
            company_agent_id: {
              type: 'string',
              format: 'uuid',
              example: '550e8400-e29b-41d4-a716-446655440000',
            },
            raw_feedback: {
              type: 'object',
              example: {
                text: 'Great product, but shipping was slow',
                rating: 4,
                channel: 'email',
              },
            },
            processed_feedback: {
              type: 'object',
              example: {
                text: 'Great product, but shipping was slow',
                rating: 4,
                channel: 'email',
                processed: true,
              },
            },
            feedback_type: {
              type: 'string',
              example: 'survey',
            },
            status: {
              type: 'string',
              enum: ['raw', 'processed', 'analyzed', 'archived'],
              example: 'processed',
            },
            sentiment_score: {
              type: 'number',
              format: 'float',
              minimum: -1,
              maximum: 1,
              example: 0.75,
            },
            confidence_score: {
              type: 'number',
              format: 'float',
              minimum: 0,
              maximum: 1,
              example: 0.85,
            },
            tags: {
              type: 'array',
              items: {
                type: 'string',
              },
              example: ['product', 'shipping', 'positive'],
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              example: '2023-01-01T00:00:00Z',
            },
            processed_at: {
              type: 'string',
              format: 'date-time',
              example: '2023-01-01T00:00:00Z',
            },
          },
        },
        // Competitor schemas
        Competitor: {
          type: 'object',
          properties: {
            competitor_id: {
              type: 'string',
              example: 'comp_550e8400-e29b-41d4-a716-446655440000',
            },
            name: {
              type: 'string',
              example: 'Amazon',
            },
            url: {
              type: 'string',
              format: 'uri',
              example: 'https://www.amazon.com',
            },
            logo_url: {
              type: 'string',
              format: 'uri',
              example: 'https://example.com/logo.png',
            },
            description: {
              type: 'string',
              example: 'Global e-commerce marketplace',
            },
            primary_market: {
              type: 'string',
              example: 'Global',
            },
            secondary_markets: {
              type: 'array',
              items: {
                type: 'string',
              },
              example: ['North America', 'Europe', 'Asia'],
            },
            company_size: {
              type: 'string',
              enum: ['small', 'medium', 'large', 'enterprise'],
              example: 'enterprise',
            },
            is_active: {
              type: 'boolean',
              example: true,
            },
            tags: {
              type: 'array',
              items: {
                type: 'string',
              },
              example: ['marketplace', 'global', 'tech-giant'],
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              example: '2023-01-01T00:00:00Z',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              example: '2023-01-01T00:00:00Z',
            },
            last_analyzed: {
              type: 'string',
              format: 'date-time',
              example: '2023-01-01T00:00:00Z',
            },
          },
        },
        // Sentiment Analysis schemas
        SentimentAnalysis: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'sentiment_550e8400-e29b-41d4-a716-446655440000',
            },
            feedback_id: {
              type: 'string',
              example: '550e8400-e29b-41d4-a716-446655440000',
            },
            feedback_source: {
              type: 'string',
              enum: [
                'product_review',
                'customer_support',
                'survey',
                'app_review',
                'social_media',
                'chat',
                'email',
                'other'
              ],
              example: 'product_review',
            },
            feedback_text: {
              type: 'string',
              example: 'Great product, but shipping was slow',
            },
            language: {
              type: 'string',
              enum: ['pt', 'es', 'en', 'unknown'],
              example: 'en',
            },
            overall_sentiment: {
              type: 'number',
              format: 'float',
              minimum: -1,
              maximum: 1,
              example: 0.75,
            },
            confidence: {
              type: 'number',
              format: 'float',
              minimum: 0,
              maximum: 1,
              example: 0.85,
            },
            category_sentiment: {
              type: 'object',
              example: {
                'overall': 0.75,
                'product_quality': 0.8,
                'shipping': -0.2,
              },
            },
            aspects: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  aspect: {
                    type: 'string',
                    example: 'shipping',
                  },
                  sentiment: {
                    type: 'number',
                    format: 'float',
                    minimum: -1,
                    maximum: 1,
                    example: -0.2,
                  },
                  confidence: {
                    type: 'number',
                    format: 'float',
                    minimum: 0,
                    maximum: 1,
                    example: 0.85,
                  },
                  excerpts: {
                    type: 'array',
                    items: {
                      type: 'string',
                    },
                    example: ['shipping was slow'],
                  },
                },
              },
            },
            analyzed_at: {
              type: 'string',
              format: 'date-time',
              example: '2023-01-01T00:00:00Z',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              example: '2023-01-01T00:00:00Z',
            },
          },
        },
        // Persona schemas
        Persona: {
          type: 'object',
          properties: {
            persona_id: {
              type: 'string',
              example: 'persona_550e8400-e29b-41d4-a716-446655440000',
            },
            name: {
              type: 'string',
              example: 'Tech Enthusiast',
            },
            description: {
              type: 'string',
              example: 'Early adopter who values cutting-edge technology',
            },
            preferences: {
              type: 'array',
              items: {
                type: 'string',
              },
              example: ['technology', 'innovation', 'quality'],
            },
            demographics: {
              type: 'object',
              example: {
                'age_range': '25-34',
                'income_level': 'high',
                'education': 'college',
              },
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              example: '2023-01-01T00:00:00Z',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              example: '2023-01-01T00:00:00Z',
            },
          },
        },
      },
      responses: {
        BadRequest: {
          description: 'Bad request',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: 'Validation failed',
                details: {
                  field: {
                    _errors: ['Invalid field value'],
                  },
                },
                correlationId: '550e8400-e29b-41d4-a716-446655440000',
              },
            },
          },
        },
        Unauthorized: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: 'Unauthorized',
                correlationId: '550e8400-e29b-41d4-a716-446655440000',
              },
            },
          },
        },
        NotFound: {
          description: 'Not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: 'Resource not found',
                correlationId: '550e8400-e29b-41d4-a716-446655440000',
              },
            },
          },
        },
        InternalServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: 'Internal server error',
                correlationId: '550e8400-e29b-41d4-a716-446655440000',
              },
            },
          },
        },
      },
    },
    security: [
      {
        ApiKeyAuth: [],
      },
    ],
  },
  apis: [
    './src/routes/*.ts',
    './src/routes/*.js',
    './dist/routes/*.js',
  ],
};

// Initialize Swagger specification
const swaggerSpec = swaggerJsdoc(options);

/**
 * Configure Swagger UI
 * @param app Express application
 */
export function setupSwagger(app: Express): void {
  // Serve Swagger specification
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Serve Swagger UI
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      swaggerOptions: {
        persistAuthorization: true,
      },
    })
  );

  // Serve ReDoc UI (alternative API documentation)
  app.get('/api-docs-redoc', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>MCP Agent Backend API Documentation</title>
          <meta charset="utf-8"/>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
          <style>
            body {
              margin: 0;
              padding: 0;
            }
          </style>
        </head>
        <body>
          <redoc spec-url='/api-docs.json'></redoc>
          <script src="https://cdn.jsdelivr.net/npm/redoc@next/bundles/redoc.standalone.js"></script>
        </body>
      </html>
    `);
  });
}