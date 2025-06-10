# MercadoLivre AI Agent Analysis System - Setup Guide

This guide provides detailed instructions for setting up and running the MercadoLivre AI Agent Analysis System.

## 📋 Prerequisites

### System Requirements
- **Operating System**: macOS, Linux, or Windows with WSL2
- **Node.js**: Version 18.0.0 or higher
- **Python**: Version 3.9 or higher
- **npm**: Version 9.0.0 or higher
- **Git**: For cloning the repository

### Recommended Tools
- **VS Code**: For code editing with TypeScript and Python extensions
- **Terminal/Command Line**: For running commands
- **Web Browser**: Chrome, Firefox, Safari, or Edge for viewing interfaces

## 🔧 Step-by-Step Installation

### 1. Clone the Repository

```bash
git clone [your-repository-url]
cd Konv-agent
```

### 2. Backend Setup (TypeScript/Express.js)

```bash
# Install Node.js dependencies
npm install

# Verify installation
npm list --depth=0
```

Expected output should show dependencies like:
- express
- typescript
- cors
- helmet
- etc.

### 3. Python Environment Setup

```bash
# Navigate to Python agents directory
cd python-agents

# Create virtual environment
python -m venv env

# Activate virtual environment
# On macOS/Linux:
source env/bin/activate
# On Windows:
env\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Verify installation
pip list

# Return to main directory
cd ..
```

Expected Python packages:
- websockets==12.0
- requests==2.31.0
- python-dotenv==1.0.0

### 4. Environment Configuration

Create a `.env` file in the root directory:

```bash
cp env.example .env
```

Edit `.env` with your configuration:

```env
# Server Configuration
NODE_ENV=development
PORT=3001
API_VERSION=v1

# Database Configuration (Supabase)
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Security Configuration
JWT_SECRET=your_jwt_secret_minimum_32_characters_long
API_KEY_PREFIX=mcp_agent_

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Agent Configuration
MAX_AGENTS_PER_TYPE=50
AGENT_TIMEOUT_MS=30000
MESSAGE_QUEUE_SIZE=1000

# Logging Configuration
LOG_LEVEL=info
LOG_FORMAT=json
```

### 5. Database Setup (Optional)

If you want to use the full database functionality:

```bash
# Set up database schema
npm run db:setup

# Generate TypeScript types
npm run db:generate

# Check database connection
npm run db:check
```

## 🚀 Running the System

### Option 1: Quick Start (Recommended)

1. **Start the Backend Server**
   ```bash
   PORT=3001 npm run dev
   ```
   
   You should see output like:
   ```
   🚀 MCP Agent Backend started
   Port: 3001
   Environment: development
   ```

2. **Run the AI Agent Analysis**
   ```bash
   # In a new terminal window
   cd python-agents
   source env/bin/activate  # On Windows: env\Scripts\activate
   python mercadolivre_orchestrator.py
   ```

3. **Access the Web Interfaces**
   - Main Dashboard: `http://localhost:3001/`
   - Agent Conversations: `http://localhost:3001/conversations`
   - Department Recommendations: `http://localhost:3001/departments`

### Option 2: Step-by-Step Execution

1. **Start Backend Only**
   ```bash
   npm run dev
   ```

2. **Test Individual Agents**
   ```bash
   cd python-agents
   source env/bin/activate
   
   # Test individual agents
   python mercadolivre_context_agent.py
   python tech_enthusiast_agent.py
   python budget_shopper_agent.py
   python gift_buyer_agent.py
   python company_analysis_agent.py
   ```

3. **Run Full Orchestration**
   ```bash
   python mercadolivre_orchestrator.py
   ```

## 🔍 Verification Steps

### 1. Backend Health Check

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-06-10T...",
  "services": {
    "database": "healthy",
    "mcp": {...}
  }
}
```

### 2. Test API Endpoints

```bash
# Test conversations endpoint
curl http://localhost:3001/api/v1/mercadolivre/conversations

# Test departments endpoint  
curl http://localhost:3001/api/v1/mercadolivre/departments
```

### 3. Verify Python Environment

```bash
cd python-agents
source env/bin/activate
python -c "import websockets, requests; print('Python dependencies OK')"
```

### 4. Test Agent Framework

```bash
python -c "from agents import Agent, Runner; print('Agent framework OK')"
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Check what's using port 3001
lsof -ti:3001

# Kill process if needed
kill $(lsof -ti:3001)
```

#### 2. Python Virtual Environment Issues
```bash
# Recreate virtual environment
rm -rf python-agents/env
cd python-agents
python -m venv env
source env/bin/activate
pip install -r requirements.txt
```

#### 3. Node.js Dependencies Issues
```bash
# Clear npm cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

#### 4. TypeScript Compilation Errors
```bash
# Check TypeScript configuration
npm run typecheck

# Rebuild if needed
npm run build
```

### Environment-Specific Solutions

#### macOS
```bash
# If Python virtual environment fails
brew install python@3.9
python3.9 -m venv python-agents/env
```

#### Windows (WSL2)
```bash
# If pip install fails
sudo apt update
sudo apt install python3-pip python3-venv
```

#### Linux
```bash
# If Node.js is outdated
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## 📊 Performance Optimization

### Development Settings

For optimal development experience:

```bash
# Use development mode with hot reload
npm run dev

# Enable verbose logging
LOG_LEVEL=debug npm run dev

# Monitor file changes
npm install -g nodemon  # if not already installed
```

### Production Considerations

For production deployment:

```bash
# Build optimized version
npm run build

# Use production environment
NODE_ENV=production npm start

# Consider using PM2 for process management
npm install -g pm2
pm2 start dist/index.js --name "mercadolivre-agents"
```

## 🔧 Development Workflow

### Making Changes

1. **Backend Changes**
   ```bash
   # Edit files in src/
   # Server automatically reloads with npm run dev
   ```

2. **Python Agent Changes**
   ```bash
   # Edit files in python-agents/
   # Restart orchestrator to see changes
   python mercadolivre_orchestrator.py
   ```

3. **Testing Changes**
   ```bash
   # Test TypeScript
   npm run typecheck
   npm run lint
   
   # Test Python
   cd python-agents && source env/bin/activate
   python -m pytest  # if you add tests
   ```

## 📈 Monitoring and Logs

### Log Locations
- **Application Logs**: Console output (can be redirected to files)
- **Express Server**: Built-in request logging
- **Python Agents**: Console output with correlation IDs

### Monitoring Commands
```bash
# Monitor backend health
watch -n 5 'curl -s http://localhost:3001/health | jq .status'

# Monitor system resources
top -p $(pgrep -f "node\|python")
```

## 🆘 Getting Help

### Self-Diagnosis
1. Check all prerequisites are installed correctly
2. Verify environment variables are set
3. Ensure ports 3001 is available
4. Check Python virtual environment is activated
5. Verify all dependencies are installed

### Common Commands Summary
```bash
# Check Node.js version
node --version

# Check Python version  
python --version

# Check npm version
npm --version

# Check if port is free
netstat -an | grep 3001

# Restart everything fresh
pkill -f "node\|python"
npm run dev &
cd python-agents && source env/bin/activate && python mercadolivre_orchestrator.py
```

---

🎉 **You're all set!** Visit `http://localhost:3001/` to start exploring your AI agents! 