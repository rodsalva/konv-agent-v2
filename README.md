# MercadoLivre AI Agent Analysis System

A comprehensive multi-agent AI system that simulates different user personas exploring MercadoLivre marketplace, collects their feedback, and generates actionable business insights for department-specific strategic recommendations.

## 🎯 What This System Does

This system creates a sophisticated AI-driven market research platform that:

1. **Simulates Real User Behavior**: Deploys 3 distinct AI personas (Tech Enthusiast, Budget Shopper, Gift Buyer) that explore MercadoLivre like real users
2. **Collects Structured Feedback**: Each persona answers consistent questions about their shopping experience
3. **Analyzes Business Impact**: A company analysis agent curates the feedback and translates it into strategic business recommendations
4. **Generates Department-Specific Actions**: Provides concrete action items for 6 different MercadoLivre departments with timelines and KPIs

## 🏗️ System Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                 MercadoLivre AI Analysis System             │
├─────────────────────────────────────────────────────────────┤
│  Web Interface (Express.js + Beautiful HTML/CSS)           │
│  ┌─────────────────┐  ┌─────────────────────────────────┐   │
│  │ Conversations   │  │ Departmental Recommendations    │   │
│  │ View            │  │ View                            │   │
│  └─────────────────┘  └─────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  Python Agent Orchestra (7 Specialized AI Agents)         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │ Context     │ │ Tech        │ │ Budget Shopper      │   │
│  │ Agent       │ │ Enthusiast  │ │ Agent               │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │ Gift Buyer  │ │ Communication│ │ Company Analysis    │   │
│  │ Agent       │ │ Agent       │ │ Agent               │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
│  ┌─────────────┐                                           │
│  │ Oversight   │                                           │
│  │ Agent       │                                           │
│  └─────────────┘                                           │
└─────────────────────────────────────────────────────────────┘
```

### 🤖 AI Agent Roles

| Agent | Role | Key Functions |
|-------|------|---------------|
| **MercadoLivre Context Agent** | Marketplace Intelligence | Provides categories, statistics, user behavior patterns |
| **Tech Enthusiast Agent** | Electronics Specialist | Analyzes tech specs, pricing, and product comparisons |
| **Budget Shopper Agent** | Deal Hunter | Focuses on discounts, value propositions, and savings |
| **Gift Buyer Agent** | Gift Experience Expert | Evaluates gift services, wrapping, and discovery tools |
| **Communication Agent** | Orchestrator | Coordinates exploration and synthesizes insights |
| **Company Analysis Agent** | Business Strategist | Curates data and generates departmental recommendations |
| **Oversight Agent** | Quality Validator | Ensures data quality and process completeness |

## 🌐 Web Interfaces & URLs

### Main Access Points

| Interface | URL | Description |
|-----------|-----|-------------|
| **System Overview** | `http://localhost:3001/` | Main dashboard with all endpoints |
| **Agent Conversations** | `http://localhost:3001/conversations` | Q&A between research agents and personas |
| **Department Strategy** | `http://localhost:3001/departments` | Strategic recommendations by department |

### API Documentation

The system includes comprehensive API documentation using OpenAPI (Swagger) specification. You can access the interactive documentation at the following endpoints:

| Documentation | URL | Description |
|---------------|-----|-------------|
| **Swagger UI** | `/api-docs` | Interactive API documentation |
| **ReDoc UI** | `/api-docs-redoc` | Alternative documentation UI |
| **OpenAPI JSON** | `/api-docs.json` | Raw OpenAPI specification |

For a complete reference of all API endpoints, see the [API Documentation](API.md) or visit the Swagger UI when the server is running.

### Key API Endpoints

| Endpoint | URL | Purpose |
|----------|-----|---------|
| **Health Check** | `GET /health` | System status and information |
| **Conversations JSON** | `GET /api/v1/mercadolivre/conversations` | Raw conversation data |
| **Conversations View** | `GET /api/v1/mercadolivre/conversations/view` | Formatted conversation interface |
| **Departments JSON** | `GET /api/v1/mercadolivre/departments` | Raw departmental recommendations |
| **Departments View** | `GET /api/v1/mercadolivre/departments/view` | Formatted departmental interface |
| **Competitive Benchmarking** | `GET /api/v1/competitors/benchmark` | Competitive analysis data |
| **Sentiment Analysis** | `POST /api/v1/sentiment/analyze` | Analyze sentiment of text |
| **Sentiment Dashboard** | `GET /api/v1/sentiment/dashboard/view` | Sentiment analysis visualization |
| **Agents API** | `GET /api/v1/agents` | List and manage agents |
| **MCP Protocol** | `POST /api/v1/mcp/session/initialize` | Initialize MCP agent session |

## 📁 Project Structure & Key Files

### Backend (TypeScript/Express.js)
```
src/
├── index.ts                          # 🔥 Main Express server
├── routes/
│   └── mercadolivre.routes.ts       # 🔥 MercadoLivre-specific routes & web interfaces
├── config/
│   └── environment.ts               # Environment configuration
├── middleware/
│   ├── correlation.middleware.ts    # Request tracking
│   └── [other middleware files]
└── [other backend infrastructure]
```

### Python AI Agents
```
python-agents/
├── mercadolivre_orchestrator.py     # 🔥 Main orchestrator (run this!)
├── agents.py                        # 🔥 Core agent framework
├── mercadolivre_context_agent.py    # 🔥 Marketplace intelligence
├── tech_enthusiast_agent.py         # 🔥 Tech persona agent
├── budget_shopper_agent.py          # 🔥 Budget persona agent  
├── gift_buyer_agent.py              # 🔥 Gift persona agent
├── company_analysis_agent.py        # 🔥 Business analysis agent
├── communication_agent.py           # 🔥 Coordination agent
├── oversight_agent.py               # Quality validation agent
├── requirements.txt                 # Python dependencies
└── env/                            # Python virtual environment
```

### Configuration Files
```
├── package.json                     # Node.js dependencies & scripts
├── tsconfig.json                   # TypeScript configuration
├── env.example                     # Environment variables template
└── README.md                       # This documentation
```

## 🚀 Installation & Setup

### Prerequisites
- **Node.js** >= 18.0.0
- **Python** 3.9+
- **npm** >= 9.0.0

### Quick Start

1. **Clone and Setup Backend**
   ```bash
   git clone [repository-url]
   cd Konv-agent
   npm install
   ```

2. **Fix TypeScript Configuration for Tests** (if needed)
   ```bash
   # This script creates a separate TypeScript config for tests
   ./scripts/fix-tsconfig.sh
   ```

3. **Setup Python Environment**
   ```bash
   cd python-agents
   python -m venv env
   source env/bin/activate  # On Windows: env\Scripts\activate
   pip install -r requirements.txt
   ```

4. **Start Backend Server**
   ```bash
   # In main directory
   PORT=3001 npm run dev
   ```

5. **Run AI Agent Analysis**
   ```bash
   # In python-agents directory with virtual env activated
   python mercadolivre_orchestrator.py
   ```

### Environment Configuration
The system uses environment variables for configuration. Key variables:

```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# Database (Supabase)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Security
JWT_SECRET=your_jwt_secret_minimum_32_characters
```

## 📊 How It Works - The Complete Flow

### 6-Phase Analysis Process

1. **📊 Context Gathering**
   - MercadoLivre Context Agent analyzes marketplace data
   - Provides categories, statistics, user behavior patterns

2. **🎯 Strategy Planning** 
   - Communication Agent creates exploration strategy
   - Formulates specific questions for each persona

3. **🔍 Multi-Persona Exploration**
   - 3 persona agents explore MercadoLivre simultaneously
   - Each provides detailed feedback from their perspective

4. **📋 Synthesis**
   - Communication Agent combines all feedback
   - Identifies cross-cutting themes and insights

5. **🏢 Business Analysis**
   - Company Analysis Agent curates and cleans data
   - Generates departmental recommendations with timelines

6. **✅ Quality Validation**
   - Oversight Agent validates completeness and quality
   - Provides final assessment and confidence scores

### Sample Questions Asked to Each Persona

All personas answer these 4 consistent questions:
1. "What specific features on MercadoLivre do you find most valuable for your shopping needs?"
2. "How would you rate the user experience and navigation compared to other e-commerce platforms?"
3. "What improvements would you suggest to enhance your shopping experience on MercadoLivre?"
4. "How do you typically discover new products and deals on the platform?"

## 🎯 Business Output - Departmental Recommendations

The system generates specific recommendations for 6 MercadoLivre departments:

### 🎯 Product Department
- **Immediate**: Price history graphs, bundle builder, gift customization
- **Medium-term**: AI recommendation engine, persona landing pages
- **KPIs**: Product discovery conversion, time to purchase, return rate reduction

### ⚙️ Engineering Department  
- **Immediate**: Mobile optimization (75% traffic), price comparison algorithms
- **Medium-term**: Enhanced product specs, recommendation algorithms
- **KPIs**: Mobile page speed, search relevance, API response times

### 📢 Marketing Department
- **Immediate**: Persona-targeted campaigns, PIX discount messaging
- **Medium-term**: Tech review partnerships, cultural gift guides
- **KPIs**: Campaign conversion by persona, email engagement, brand awareness

### 🎧 Customer Service
- **Immediate**: Tech spec training, gift service protocols
- **Medium-term**: Self-service tools, automated gift tracking
- **KPIs**: First contact resolution, satisfaction scores, response time

### 📊 Business Intelligence
- **Immediate**: Persona conversion analysis, price sensitivity modeling
- **Medium-term**: Real-time segmentation, predictive pricing
- **KPIs**: Data accuracy, report speed, insight actionability

### 🚚 Operations
- **Immediate**: Tech lifecycle management, seasonal gift planning
- **Medium-term**: Gift delivery enhancement, packaging customization
- **KPIs**: Inventory turnover, delivery performance, return efficiency

## 💡 Key Features

### 🎨 Beautiful Web Interfaces
- **Responsive Design**: Works on desktop and mobile
- **Color-Coded Personas**: Each agent has distinct visual styling
- **Interactive Elements**: Hover effects and smooth transitions
- **Professional Styling**: Modern gradients and clean typography

### 🤖 Intelligent Agent Framework
- **Persona Consistency**: Each agent maintains character throughout
- **Structured Output**: Consistent JSON responses for analysis
- **Cross-Agent Communication**: Agents build on each other's insights
- **Quality Validation**: Built-in oversight and validation

### 📈 Business Intelligence
- **Actionable Insights**: Specific, implementable recommendations
- **Timeline Planning**: Clear 3-6 month implementation roadmaps
- **ROI Projections**: 15-25% improvement targets
- **Resource Planning**: Engineering months, design resources, budget estimates

### 📚 Comprehensive API Documentation
- **OpenAPI/Swagger**: Interactive API documentation
- **ReDoc UI**: Alternative documentation view
- **Documented Endpoints**: Complete reference for all API endpoints
- **Request/Response Examples**: Clear examples for all operations
- **Schema Definitions**: Detailed data models and type definitions

## 🛠️ Development & Customization

### Adding New Personas
1. Create new agent file in `python-agents/`
2. Follow the existing agent pattern with `@function_tool` decorators
3. Add agent to `mercadolivre_orchestrator.py`
4. Update the agents framework in `agents.py`

### Modifying Questions
Update the questions array in `src/routes/mercadolivre.routes.ts`:
```typescript
const questions = [
  "Your new question 1?",
  "Your new question 2?",
  // ... up to 4 questions
];
```

### Customizing Departments
Modify the `generateDepartmentalRecommendations()` function in `mercadolivre.routes.ts` to add new departments or change recommendations.

## 📈 Expected Business Impact

### ROI Projections
- **15-25% improvement** in key metrics within 6 months
- **R$ 800K - 1.2M** total implementation budget
- **15-20 engineering months** required for full implementation

### Success Metrics
- **Conversion Rate**: +20% for each persona
- **Average Order Value**: +15% through better discovery  
- **Customer Satisfaction**: 4.5+ rating across all personas
- **Retention Rate**: +25% through personalization

## 🛠️ Available Scripts

### Core Operations
```bash
npm run dev                          # Start development server
npm run build                        # Build for production
npm run start                        # Start production server
npm test                            # Run test suite
```

### MercadoLivre Analysis
```bash
npm run mercadolivre:explore        # Run complete analysis (Python)
# Or manually:
cd python-agents && source env/bin/activate && python mercadolivre_orchestrator.py
```

### Agent Management
```bash
npm run agents:list                 # List available agents
npm run agents:demo                 # Run agent demo
npm run agents:create-company       # Create company agents
```

### Persona Management
```bash
npm run personas:test               # Test persona API functionality
npm run departments:test            # Test department insights functionality
```

### Database Operations
```bash
npm run db:setup                    # Initialize database
npm run db:check                    # Check database connection
npm run db:generate                 # Generate database types
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test both backend and Python agents
5. Submit pull request

## 📄 License

MIT License - see LICENSE file for details

---

**🎊 Ready to explore? Visit `http://localhost:3001/` to see your AI agents in action!**