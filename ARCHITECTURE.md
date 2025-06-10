# MercadoLivre AI Agent Analysis System - Architecture Documentation

Technical architecture and design decisions for the MercadoLivre AI Agent Analysis System.

## 🏗️ System Architecture Overview

The system is built using a hybrid architecture combining TypeScript/Node.js backend with Python AI agents, creating a robust platform for multi-agent analysis.

```
┌─────────────────────────────────────────────────────────────────┐
│                          Frontend Layer                        │
├─────────────────────────────────────────────────────────────────┤
│  🌐 Web Interfaces (HTML/CSS/JS)                              │
│  ┌─────────────────┐ ┌─────────────────────────────────────┐   │
│  │ Conversations   │ │ Departmental Recommendations        │   │
│  │ localhost:3001/ │ │ localhost:3001/departments          │   │
│  │ conversations   │ │                                     │   │
│  └─────────────────┘ └─────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                       Backend Layer                           │
├─────────────────────────────────────────────────────────────────┤
│  🚀 Express.js API Server (TypeScript)                        │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │ REST API        │ │ Route Handlers  │ │ Middleware      │   │
│  │ Endpoints       │ │ & Controllers   │ │ Stack           │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                     Agent Orchestration Layer                 │
├─────────────────────────────────────────────────────────────────┤
│  🤖 Python AI Agents (7 Specialized Agents)                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐     │
│  │ Context     │ │ Tech        │ │ Budget Shopper      │     │
│  │ Agent       │ │ Enthusiast  │ │ Agent               │     │
│  └─────────────┘ └─────────────┘ └─────────────────────┘     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐     │
│  │ Gift Buyer  │ │ Communication│ │ Company Analysis    │     │
│  │ Agent       │ │ Agent       │ │ Agent               │     │
│  └─────────────┘ └─────────────┘ └─────────────────────┘     │
│  ┌─────────────┐                                             │
│  │ Oversight   │      Agent Framework & Orchestrator        │
│  │ Agent       │                                             │
│  └─────────────┘                                             │
├─────────────────────────────────────────────────────────────────┤
│                        Data Layer                             │
├─────────────────────────────────────────────────────────────────┤
│  💾 Supabase Database (PostgreSQL)                            │
│  ┌─────────────────┐ ┌─────────────────────────────────────┐   │
│  │ Agent Data      │ │ Feedback & Analytics Data           │   │
│  │ Management      │ │ Storage                             │   │
│  └─────────────────┘ └─────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## 🧩 Component Details

### API Documentation Layer

#### OpenAPI (Swagger) Implementation
- **Technology**: OpenAPI 3.0 specification with Swagger UI and ReDoc
- **Integration**: Express middleware for interactive documentation
- **Organization**: JSDoc annotations and dedicated Swagger files
- **Coverage**: Complete API endpoint documentation with examples

**Key Components:**
- **Swagger Configuration** (`src/utils/swagger.ts`): Central configuration for OpenAPI specification
- **Interactive UI Endpoints**:
  - Swagger UI: `/api-docs`
  - ReDoc UI: `/api-docs-redoc`
  - Raw OpenAPI JSON: `/api-docs.json`
- **Comprehensive Schema Definitions**: Detailed type definitions for all models
- **Security Scheme Documentation**: API key authentication details
- **Standardized Responses**: Common error and success response formats

#### Access Points
```typescript
// Root endpoint shows documentation locations
app.get('/', (req, res) => {
  res.json({
    message: 'MCP Agent Backend - Feedback Intelligence Platform',
    // ... other information
    endpoints: {
      health: '/health',
      api_docs: '/api-docs',
      api_docs_json: '/api-docs.json',
      api_docs_redoc: '/api-docs-redoc',
      // ... other endpoints
    }
  });
});
```

### Frontend Layer

#### Web Interfaces
- **Technology**: Server-side rendered HTML with embedded CSS/JavaScript
- **Styling**: Custom CSS with modern gradients, responsive design
- **Interactivity**: Pure JavaScript for hover effects and smooth scrolling
- **Design Philosophy**: Clean, professional, mobile-first responsive design

**Key Features:**
- Color-coded persona representation
- Real-time data display
- Responsive grid layouts
- Professional typography and spacing

### Backend Layer (TypeScript/Express.js)

#### Core Components

**1. Express.js Server (`src/index.ts`)**
```typescript
// Main application server
const app = express();

// Middleware stack
app.use(helmet());           // Security headers
app.use(cors());             // Cross-origin requests
app.use(rateLimit());        // Rate limiting
app.use(express.json());     // JSON parsing
app.use(correlationMiddleware); // Request tracking

// API Documentation setup
setupSwagger(app);

// Route registration
app.use('/api/v1/mercadolivre', mercadolivreRoutes);
app.use('/api/v1/agents', agentRoutes);
app.use('/api/v1/competitors', competitorRoutes);
app.use('/api/v1/sentiment', sentimentRoutes);
```

**2. Route Handlers with OpenAPI Annotations**
```typescript
/**
 * @swagger
 * /agents:
 *   get:
 *     summary: List all agents
 *     description: Retrieves a list of all agents with optional filtering
 *     tags: [Agents]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [company, customer, insight, product, support, sales]
 *         description: Filter by agent type
 *     responses:
 *       200:
 *         description: A list of agents
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AgentListResponse'
 */
router.get('/', agentAuthMiddleware, async (req: Request, res: Response) => {
  // Handler implementation
});
```

**3. Swagger Configuration (`src/utils/swagger.ts`)**
```typescript
// OpenAPI specification setup
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MCP Agent Backend API',
      version: appConfig.mcp.serverVersion,
      description: 'API documentation for the MCP Agent Backend',
    },
    // Component schemas, security definitions, etc.
  },
  apis: ['./src/routes/*.ts', './src/routes/*.swagger.ts'],
};

// Setup Swagger middleware
export function setupSwagger(app: Express): void {
  const swaggerSpec = swaggerJsdoc(options);

  // Serve Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Serve ReDoc UI
  app.use('/api-docs-redoc',
    (req, res) => {
      res.send(generateReDocHTML(swaggerSpec));
    }
  );

  // Serve raw OpenAPI spec
  app.get('/api-docs.json', (req, res) => {
    res.json(swaggerSpec);
  });
}
```

**3. Middleware Stack**
- **Security**: Helmet.js for security headers
- **CORS**: Configured for localhost development
- **Rate Limiting**: 100 requests per 15-minute window
- **Correlation IDs**: Request tracking and debugging
- **JSON Parsing**: Body parsing with 10MB limit

#### Configuration Management (`src/config/environment.ts`)
```typescript
// Environment validation with Zod
const envSchema = z.object({
  PORT: z.string().transform(Number).default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']),
  SUPABASE_URL: z.string().url(),
  // ... other configurations
});
```

### Agent Orchestration Layer (Python)

#### Agent Framework (`python-agents/agents.py`)

**Core Classes:**
```python
class Agent:
    def __init__(self, name: str, instructions: str, tools: List[Callable]):
        self.name = name
        self.instructions = instructions
        self.tools = tools

class Runner:
    @staticmethod
    async def run(agent: Agent, prompt: str) -> AgentResult:
        # Execute agent with tools and return structured result
```

**Function Tool Decorator:**
```python
def function_tool(func: Callable) -> Callable:
    """Decorator to mark functions as tools for agents"""
    func.is_tool = True
    return func
```

#### Agent Types and Responsibilities

**1. Context Agent (`mercadolivre_context_agent.py`)**
- **Purpose**: Marketplace intelligence gathering
- **Tools**: 
  - `get_mercadolivre_categories()`
  - `get_marketplace_stats()`
  - `analyze_user_behavior_patterns()`

**2. Persona Agents**
- **Tech Enthusiast** (`tech_enthusiast_agent.py`)
  - Tools: Electronics analysis, spec comparison, tech trends
- **Budget Shopper** (`budget_shopper_agent.py`)
  - Tools: Deal hunting, price comparison, value assessment
- **Gift Buyer** (`gift_buyer_agent.py`)
  - Tools: Gift category exploration, service evaluation, discovery analysis

**3. Analysis Agents**
- **Communication Agent** (`communication_agent.py`)
  - Tools: Exploration coordination, question formulation, synthesis
- **Company Analysis Agent** (`company_analysis_agent.py`)
  - Tools: Data curation, business impact analysis, departmental recommendations
- **Oversight Agent** (`oversight_agent.py`)
  - Tools: Quality validation, completeness checking

#### Orchestration Flow (`mercadolivre_orchestrator.py`)

```python
async def run_mercadolivre_exploration():
    # Phase 1: Context Gathering
    context_result = await Runner.run(ml_context_agent, "Analyze marketplace")
    
    # Phase 2: Strategy Planning
    comm_result = await Runner.run(ml_comm_agent, "Create exploration strategy")
    
    # Phase 3: Multi-Persona Exploration (Parallel)
    tech_result = await Runner.run(tech_agent, "Explore electronics")
    budget_result = await Runner.run(budget_agent, "Hunt for deals")
    gift_result = await Runner.run(gift_agent, "Evaluate gift services")
    
    # Phase 4: Synthesis
    synthesis_result = await Runner.run(ml_comm_agent, "Synthesize feedback")
    
    # Phase 5: Business Analysis
    company_analysis_result = await Runner.run(company_analysis_agent, "Generate recommendations")
    
    # Phase 6: Quality Validation
    oversight_result = await Runner.run(oversight_agent, "Validate quality")
```

### Data Layer

#### Supabase Integration
- **Database**: PostgreSQL with real-time capabilities
- **Authentication**: JWT-based with API keys
- **Storage**: Agent configurations, feedback data, analytics
- **Real-time**: WebSocket connections for live updates

#### Data Models
```sql
-- Agent management
CREATE TABLE agents (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  configuration JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Feedback storage
CREATE TABLE feedback (
  id UUID PRIMARY KEY,
  agent_id UUID REFERENCES agents(id),
  feedback_data JSONB,
  processed_at TIMESTAMP DEFAULT NOW()
);
```

## 🔄 Communication Patterns

### Inter-Layer Communication

**1. Frontend ↔ Backend**
- Protocol: HTTP/HTTPS REST API
- Data Format: JSON
- Authentication: Optional (currently open for development)
- Error Handling: Structured error responses with correlation IDs

**2. Backend ↔ Python Agents**
- Communication: Direct function calls (same-process)
- Data Exchange: Python dictionaries/JSON
- Orchestration: Async/await patterns
- Error Propagation: Exception handling with graceful degradation

**3. Agent ↔ Agent Communication**
- Method: Through orchestrator coordination
- Data Sharing: Structured results passed between phases
- Synchronization: Sequential execution with dependency management

### Request Flow Example

```
1. User visits /conversations
   ↓
2. Express.js handles route
   ↓
3. Route handler calls generateConversations()
   ↓
4. Function returns structured conversation data
   ↓
5. HTML template renders with data
   ↓
6. Response sent to browser
```

## 🛡️ Security Architecture

### Defense in Depth

**1. Network Level**
- CORS configuration for allowed origins
- Rate limiting to prevent abuse
- Helmet.js for security headers

**2. Application Level**
- Input validation with Zod schemas
- Environment variable validation
- Correlation ID tracking for audit trails

**3. Data Level**
- Supabase Row Level Security (RLS)
- API key authentication
- JWT token validation

### Security Headers
```http
Content-Security-Policy: default-src 'self'
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
Strict-Transport-Security: max-age=15552000
```

## 📊 Performance Considerations

### Scalability Patterns

**1. Horizontal Scaling**
- Stateless Express.js servers
- Agent processes can be distributed
- Database connection pooling

**2. Caching Strategy**
- Static asset caching
- API response caching for stable data
- Agent result memoization

**3. Resource Optimization**
- Lazy loading of Python virtual environment
- Connection pooling for database
- Gzip compression for responses

### Performance Metrics

**Expected Performance:**
- API Response Time: < 200ms for static data
- Agent Orchestration: 30-60 seconds for full analysis
- Concurrent Users: 50-100 (development), 1000+ (production with scaling)
- Memory Usage: ~200MB Node.js + ~100MB per Python agent

## 🔧 Development Patterns

### Code Organization

**TypeScript/Node.js:**
```
src/
├── index.ts                 # Application entry point
├── config/                  # Configuration management
├── routes/                  # API route handlers
├── middleware/              # Express middleware
├── services/                # Business logic services
├── types/                   # TypeScript type definitions
└── utils/                   # Utility functions
```

**Python Agents:**
```
python-agents/
├── agents.py               # Core agent framework
├── *_agent.py             # Individual agent implementations
├── mercadolivre_orchestrator.py  # Main orchestration logic
├── requirements.txt        # Dependencies
└── env/                   # Virtual environment
```

### Design Principles

**1. Separation of Concerns**
- Web layer handles HTTP/presentation
- Agent layer handles AI logic
- Data layer handles persistence

**2. Single Responsibility**
- Each agent has a specific role
- Routes handle specific endpoints
- Middleware handles cross-cutting concerns

**3. Dependency Injection**
- Environment-based configuration
- Tool injection into agents
- Service layer abstraction

**4. Error Handling**
- Graceful degradation
- Correlation ID tracking
- Structured error responses

## 🚀 Deployment Architecture

### Development Environment
```
Local Machine:
├── Node.js (Express server)    :3001
├── Python (Agent processes)    :local
└── Supabase (Cloud database)   :cloud
```

### Production Considerations

**Infrastructure:**
- **Application Server**: Node.js cluster with PM2
- **Agent Processing**: Separate Python service/container
- **Database**: Supabase (managed PostgreSQL)
- **Reverse Proxy**: Nginx for static assets and SSL
- **Monitoring**: Application insights and logging

**Scaling Strategy:**
- **Horizontal**: Multiple Node.js instances behind load balancer
- **Vertical**: Increased resources for agent processing
- **Database**: Read replicas for analytics queries

## 📈 Monitoring and Observability

### Logging Strategy
- **Structured Logging**: JSON format with correlation IDs
- **Log Levels**: Error, Warn, Info, Debug
- **Context**: Request/response data, agent execution traces

### TypeScript Configuration for Testing
- **Dual Configuration Approach**: Separate configs for source and tests
- **Main Configuration** (`tsconfig.json`): For source code with `rootDir` set to `./src`
- **Test Configuration** (`tsconfig.test.json`): For tests with `rootDir` set to project root
- **Jest Integration**: Test runner configured to use the test TypeScript configuration

### Metrics Collection
- **Application Metrics**: Response times, error rates
- **Business Metrics**: Agent execution success, analysis completion
- **Infrastructure Metrics**: CPU, memory, database performance

### Health Checks
```typescript
// Comprehensive health check endpoint
app.get('/health', async (req, res) => {
  const checks = {
    database: await db.healthCheck(),
    agents: await checkAgentAvailability(),
    services: await checkExternalServices()
  };
  
  res.json({
    status: allHealthy(checks) ? 'ok' : 'degraded',
    checks,
    timestamp: new Date().toISOString()
  });
});
```

---

🏗️ **This architecture supports the complete MercadoLivre AI analysis workflow from data collection through business insights generation.** 