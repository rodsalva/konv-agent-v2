# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚀 Commands

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Type checking
npm run typecheck

# Linting
npm run lint
npm run lint:fix
```

### Database Operations

```bash
# Check database connection
npm run db:check

# Initialize database
npm run db:setup

# Generate TypeScript types from Supabase
npm run db:generate

# Create migration
npm run db:migrate
```

### Agent Management

```bash
# List all agents
npm run agents:list

# Demo agent management
npm run agents:demo

# Create company agents
npm run agents:create-company

# Test feedback pipeline
npm run feedback:test
```

### Testing

```bash
# Run tests
npm test

# Watch tests
npm run test:watch
```

## 🏗️ Project Architecture

The Konv Agent project is a Model Context Protocol (MCP) Agent Backend system that enables intelligent feedback processing and inter-company agent communication using AI integration.

### Core Components:

1. **TypeScript/Node.js Backend** - Express.js based HTTP and WebSocket server
2. **Python AI Agents** - AI-powered agents using OpenAI's GPT models
3. **Supabase Database** - Persistent storage for agents and feedback data
4. **MCP Protocol Implementation** - Compliant with MCP specification for agent interoperability
5. **Event-driven Pipeline Architecture** - For feedback processing

### Key Services:

- **WebSocket Service** (`/src/services/websocket.ts`) - Real-time communication between agents
- **Database Service** (`/src/services/database.ts`) - Supabase database integration
- **Feedback Service** (`/src/services/feedback.ts`) - Handles feedback processing pipeline

### Pipeline Architecture:

The system implements a pipeline architecture for feedback processing:
- **Collection Stage** - Raw feedback ingestion
- **Processing Stage** - AI-powered analysis
- **Analysis Stage** - Sentiment analysis and pattern recognition
- **Distribution Stage** - Routing to appropriate agents
- **Response Stage** - Human verification and final processing

### Agent System:

The project uses three main AI agents:
1. **Company Context Agent** - Gathers company intelligence and market analysis
2. **Communication Agent** - Manages cross-company communication
3. **Oversight Agent** - Ensures data quality and verification

## 🔒 Environment Setup

The project requires these environment variables in a `.env` file:

```
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Application Configuration
NODE_ENV=development
PORT=3000
API_VERSION=v1

# MCP Protocol Configuration
MCP_SERVER_NAME=feedback-intelligence-backend
MCP_SERVER_VERSION=1.0.0
MCP_TRANSPORT=stdio

# Security Configuration
JWT_SECRET=your_jwt_secret
API_KEY_PREFIX=mcp_agent_
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Additional configs for rate limiting, logging, etc.
```

For Python agents, create `python-agents/.env` with:
```
OPENAI_API_KEY=your_openai_api_key
MCP_PLATFORM_URL=http://localhost:3001
WEBSOCKET_URL=ws://localhost:3001
```

## 📋 MCP Protocol Implementation Guidelines

The MCP implementation must adhere to these requirements:

1. **MCP Protocol Compliance**
   - Use JSON-RPC 2.0 as the base protocol for all agent communications
   - Implement proper capability negotiation during initialization
   - Handle MCP lifecycle phases correctly

2. **Message Handling**
   - Use strong typing for all MCP messages
   - Validate all message formats against the specification

3. **Security Practices**
   - Validate all tool parameters using strict schema validation
   - Implement proper authentication before any agent communication
   - Sanitize all logs to prevent sensitive data leakage
   - Implement rate limiting to prevent abuse

4. **Error Handling**
   - Use proper error classification and recovery strategies
   - Implement graceful degradation when agents are unavailable
   - Log all errors with correlation IDs for debugging

## 🧪 Testing Standards

- Write unit tests for all critical agent communication paths
- Implement integration tests for MCP protocol compliance
- Test error scenarios and edge cases in agent interactions
- Use contract testing between agent services