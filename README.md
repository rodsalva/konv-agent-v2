# 🤖 Konv Agent v2 - MCP Agent Backend

A comprehensive **Model Context Protocol (MCP) Agent Backend** system that enables intelligent feedback processing and inter-company agent communication using **OpenAI GPT-4** integration.

## 🌟 Features

### 🧠 AI-Powered Agents
- **Company Context Agent**: Gathers comprehensive company intelligence and market analysis
- **Inter-Agent Communication Agent**: Manages cross-company communication and feedback routing
- **Data Processing & Oversight Agent**: Ensures data quality (98.5% completeness) and human verification

### 🔧 Core Infrastructure
- **TypeScript/Node.js Backend** with Express.js
- **Supabase Database Integration** for persistent storage
- **WebSocket Real-time Communication** 
- **MCP Protocol Implementation** for agent interoperability
- **Event-driven Pipeline Architecture**
- **Comprehensive API Routes** with authentication

### 🚀 Advanced Capabilities
- **Real-time Feedback Processing Pipeline**
- **Sentiment Analysis & Data Classification**
- **Cross-company Agent Negotiation**
- **Human-in-the-loop Verification**
- **Comprehensive Audit Trails**

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   TypeScript    │◄──►│   Python AI      │◄──►│    Supabase     │
│   MCP Platform  │    │   Agents (GPT-4) │    │    Database     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   WebSocket     │    │   Agent API      │    │   Feedback      │
│   Service       │    │   Orchestrator   │    │   Pipeline      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and **npm**
- **Python** 3.8+ for AI agents
- **Supabase** account and project
- **OpenAI API Key** for GPT-4 access

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/rodsalva/konv-agent-v2.git
cd konv-agent-v2

# Install Node.js dependencies
npm install

# Set up Python AI agents environment
cd python-agents
python -m venv env
source env/bin/activate # On Windows: env\Scripts\activate
pip install -r requirements.txt
cd ..
```

### 2. Environment Configuration

Create `.env` file:
```env
# Database Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Server Configuration
PORT=3001
NODE_ENV=development

# OpenAI Configuration (for AI agents)
OPENAI_API_KEY=your_openai_api_key
```

Create `python-agents/.env` file:
```env
OPENAI_API_KEY=your_openai_api_key
MCP_PLATFORM_URL=http://localhost:3001
WEBSOCKET_URL=ws://localhost:3001
```

### 3. Database Setup

```bash
npm run db:setup
```

### 4. Start the System

```bash
# Terminal 1: Start TypeScript MCP Platform
npm run dev

# Terminal 2: Start Python AI Agents
npm run agents:start

# Terminal 3: Start Agent Orchestrator
npm run orchestrator:start
```

## 📚 API Documentation

### Agent Management
- `GET /api/v1/agents` - List all agents
- `POST /api/v1/agents` - Create new agent
- `GET /api/v1/agents/:id` - Get specific agent
- `PATCH /api/v1/agents/:id` - Update agent
- `DELETE /api/v1/agents/:id` - Delete agent

### Feedback Processing
- `POST /api/v1/feedback` - Submit feedback
- `GET /api/v1/feedback/:id` - Get feedback status
- `GET /api/v1/feedback` - List feedback entries

### Agent Communication
- `POST /api/v1/messages` - Send inter-agent message
- `GET /api/v1/messages/:agentId` - Get agent messages
- `WebSocket /ws` - Real-time communication

## 🛠️ Available Scripts

### Core Operations
```bash
npm run dev              # Start development server
npm run build            # Build for production  
npm run start            # Start production server
npm test                 # Run test suite
```

### Agent Management
```bash
npm run agents:create    # Create new AI agents
npm run agents:list      # List all agents
npm run agents:test      # Test agent functionality
npm run agents:start     # Start Python AI agents
```

### Database Operations
```bash
npm run db:setup         # Initialize database
npm run db:health        # Check database connection
npm run db:migrate       # Run database migrations
```

### Pipeline Operations
```bash
npm run pipeline:test    # Test feedback pipeline
npm run pipeline:health  # Check pipeline status
npm run orchestrator:start # Start agent orchestrator
```

## 🤖 AI Agents

### Company Context Agent
- **Purpose**: Comprehensive company intelligence gathering
- **Capabilities**: Market research, competitive analysis, stakeholder mapping
- **AI Model**: GPT-4 for intelligent context analysis

### Inter-Agent Communication Agent  
- **Purpose**: Cross-company communication coordination
- **Capabilities**: Feedback routing, negotiation protocols, relationship management
- **AI Model**: GPT-4 for communication optimization

### Data Processing & Oversight Agent
- **Purpose**: Data quality assurance and human verification
- **Capabilities**: Data cleaning, process documentation, audit trails
- **AI Model**: GPT-4 for comprehensive analysis

## 🔧 Configuration

### Agent Capabilities Matrix
```typescript
{
  "company": ["context_gathering", "market_research", "competitive_analysis"],
  "insight": ["agent_communication", "feedback_orchestration", "priority_assessment"], 
  "product": ["data_quality_assurance", "process_documentation", "human_verification_routing"]
}
```

### Pipeline Stages
1. **Collection Stage**: Raw feedback ingestion
2. **Processing Stage**: AI-powered analysis and classification
3. **Analysis Stage**: Sentiment analysis and pattern recognition
4. **Distribution Stage**: Intelligent routing to appropriate agents
5. **Response Stage**: Human verification and final processing

## 🧪 Testing

```bash
# Run all tests
npm test

# Test specific components
npm run test:agents      # Test agent functionality
npm run test:pipeline    # Test feedback pipeline
npm run test:api         # Test API endpoints
npm run test:integration # Full integration test
```

## 📊 Monitoring & Health Checks

### System Health
```bash
npm run health:check     # Complete system health check
npm run db:health        # Database connectivity
npm run agents:health    # AI agents status
npm run pipeline:health  # Pipeline processing status
```

### Logs & Debugging
- Application logs: `logs/application.log`
- Agent logs: `python-agents/logs/`
- Database queries: Enable via `DEBUG=true`

## 🔐 Security

- **API Key Authentication** for agent access
- **Rate limiting** on all endpoints
- **Input validation** and sanitization
- **CORS protection** for web requests
- **Environment variable protection**

## 🚀 Deployment

### Production Setup
```bash
# Build the application  
npm run build

# Set production environment
export NODE_ENV=production

# Start with PM2 (recommended)
pm2 start ecosystem.config.js
```

### Docker Deployment (Optional)
```bash
docker build -t konv-agent-v2 .
docker run -p 3001:3001 --env-file .env konv-agent-v2
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the `/docs` directory for detailed guides
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Join community discussions in GitHub Discussions

## 🎯 Roadmap

- [ ] Multi-tenant agent support
- [ ] Advanced analytics dashboard
- [ ] Plugin system for custom agents
- [ ] GraphQL API support
- [ ] Mobile app integration
- [ ] Enterprise SSO integration

---

**Built with ❤️ using TypeScript, Node.js, Python, and OpenAI GPT-4**