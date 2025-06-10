# MercadoLivre AI Agent Analysis System - API Documentation

Complete API reference for the MercadoLivre AI Agent Analysis System endpoints.

## 🌐 Base URL

All API endpoints are available at:
```
http://localhost:3001/api/v1
```

For production deployments:
```
https://your-deployment-url.com/api/v1
```

## 📋 API Overview

The system provides two main types of interfaces:
1. **Web Interfaces**: Beautiful HTML pages for human interaction
2. **JSON APIs**: Raw data endpoints for programmatic access

## 🔑 Authentication

The API uses API key authentication. Include your API key in the request header:

```
Authorization: Bearer YOUR_API_KEY
```

API keys are generated when creating an agent and are prefixed with `mcp_agent_`.

## 📚 Interactive API Documentation

Interactive API documentation is available at the following endpoints:

- Swagger UI: `/api-docs`
- OpenAPI Specification: `/api-docs.json`
- ReDoc UI: `/api-docs-redoc`

## 🔗 Quick Access URLs

| Type | URL | Description |
|------|-----|-------------|
| **Main Dashboard** | `GET /` | System overview with all available endpoints |
| **Conversations UI** | `GET /conversations` | User-friendly conversation interface |
| **Departments UI** | `GET /departments` | Strategic recommendations interface |
| **API Documentation** | `GET /api-docs` | Interactive API documentation (Swagger UI) |

## 📊 Core API Endpoints

### System Health

#### `GET /health`
Get system health status and service information.

**Response Example:**
```json
{
  "status": "ok",
  "timestamp": "2025-06-10T15:19:31.635Z",
  "services": {
    "database": "healthy",
    "mcp": {
      "name": "feedback-intelligence-backend",
      "version": "1.0.0",
      "transport": "stdio",
      "capabilities": ["tools", "resources", "prompts"]
    }
  },
  "version": "1.0.0",
  "correlationId": "0b8b02d1-cae8-4ee3-9a84-898e9839960f"
}
```

### Root System Information

#### `GET /`
Get system overview with all available endpoints.

**Response Example:**
```json
{
  "message": "MCP Agent Backend - Feedback Intelligence Platform",
  "version": "1.0.0",
  "status": "running",
  "timestamp": "2025-06-10T15:19:31.635Z",
  "endpoints": {
    "health": "/health",
    "api_docs": "/api-docs",
    "api_docs_json": "/api-docs.json",
    "api_docs_redoc": "/api-docs-redoc",
    "mercadolivre_conversations": "/api/v1/mercadolivre/conversations/view",
    "departmental_recommendations": "/api/v1/departments/recommendations/view",
    "competitive_benchmarking": "/api/v1/competitors/benchmark/visualization",
    "api": {
      "agents": "/api/v1/agents",
      "mcp": "/api/v1/mcp",
      "feedback": "/api/v1/feedback",
      "mercadolivre": "/api/v1/mercadolivre",
      "competitors": "/api/v1/competitors",
      "departments": "/api/v1/departments",
      "sentiment": "/api/v1/sentiment"
    }
  },
  "correlationId": "correlation-id-here"
}
```

## 🤖 Agent API

### List Agents

#### `GET /api/v1/agents`
Get a list of all agents with optional filtering.

**Query Parameters:**
- `type` (optional): Filter by agent type (company, customer, insight, product, support, sales)
- `status` (optional): Filter by agent status (active, inactive, suspended)

**Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Company Survey Agent",
      "type": "company",
      "status": "active",
      "capabilities": ["feedback_collection", "survey_management"],
      "metadata": {},
      "created_at": "2023-01-01T00:00:00.000Z",
      "updated_at": "2023-01-01T00:00:00.000Z"
    }
  ],
  "total": 1,
  "correlationId": "correlation-id-here"
}
```

### Get Agent

#### `GET /api/v1/agents/:id`
Get a single agent by ID.

**Response Example:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Company Survey Agent",
    "type": "company",
    "status": "active",
    "capabilities": ["feedback_collection", "survey_management"],
    "metadata": {},
    "created_at": "2023-01-01T00:00:00.000Z",
    "updated_at": "2023-01-01T00:00:00.000Z"
  },
  "correlationId": "correlation-id-here"
}
```

### Create Agent

#### `POST /api/v1/agents`
Create a new agent.

**Request Body:**
```json
{
  "name": "Company Survey Agent",
  "type": "company",
  "capabilities": ["feedback_collection", "survey_management"],
  "metadata": {}
}
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Company Survey Agent",
    "type": "company",
    "status": "active",
    "capabilities": ["feedback_collection", "survey_management"],
    "metadata": {},
    "created_at": "2023-01-01T00:00:00.000Z",
    "updated_at": "2023-01-01T00:00:00.000Z",
    "api_key": "mcp_agent_550e8400e29b41d4a716446655440000"
  },
  "message": "Agent created successfully. Save the API key as it won't be shown again.",
  "correlationId": "correlation-id-here"
}
```

## 🔄 MercadoLivre Agent API

### Agent Conversations

#### `GET /api/v1/mercadolivre/conversations`
Get raw conversation data between research agents and persona agents.

**Response Example:**
```json
{
  "status": "success",
  "timestamp": "2025-06-10T15:19:31.635Z",
  "data": {
    "title": "MercadoLivre Multi-Persona Agent Conversations",
    "description": "Research conversations between communication agents and MercadoLivre shopping personas",
    "conversations": {
      "tech_enthusiast": {
        "name": "Tech Enthusiast Agent",
        "emoji": "💻",
        "questions_answers": [
          {
            "question": "What specific features on MercadoLivre do you find most valuable for your shopping needs?",
            "answer": "The technical specification sections are incredibly detailed! I love how I can filter products by exact specs like RAM, processor type, and graphics cards..."
          }
        ]
      }
    },
    "totalAgents": 3,
    "questionsPerAgent": 4
  },
  "correlationId": "correlation-id-here"
}
```

### Departmental Recommendations

#### `GET /api/v1/mercadolivre/departments`
Get raw departmental recommendations data.

**Response Example:**
```json
{
  "status": "success",
  "data": {
    "departments": {
      "product_department": {
        "name": "Product Department",
        "icon": "🎯",
        "immediate_actions": [
          "Implement price history graphs for all products",
          "Enhance battery life comparison tools for electronics"
        ],
        "medium_term_initiatives": [
          "Build AI-powered product recommendation engine"
        ],
        "kpis": [
          "Product discovery conversion rate",
          "Average time to purchase decision"
        ]
      }
    }
  },
  "correlationId": "correlation-id-here"
}
```

## 📊 Sentiment Analysis API

### Analyze Sentiment

#### `POST /api/v1/sentiment/analyze`
Analyze sentiment of provided text.

**Request Body:**
```json
{
  "text": "I really love the new feature, it's made my workflow much more efficient!",
  "context": {
    "source": "customer_feedback",
    "product_id": "prod_123"
  }
}
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "text": "I really love the new feature, it's made my workflow much more efficient!",
    "sentiment": {
      "score": 0.92,
      "label": "positive",
      "confidence": 0.95
    },
    "entities": [
      {
        "text": "new feature",
        "type": "feature",
        "sentiment": "positive",
        "confidence": 0.89
      },
      {
        "text": "workflow",
        "type": "process",
        "sentiment": "positive",
        "confidence": 0.82
      }
    ],
    "keywords": ["love", "feature", "workflow", "efficient"],
    "analysis_timestamp": "2023-01-01T00:00:00.000Z"
  },
  "correlationId": "correlation-id-here"
}
```

### Get Sentiment Trends

#### `GET /api/v1/sentiment/trends`
Get sentiment trends over time.

**Query Parameters:**
- `timeframe` (optional): Analysis timeframe (last_week, last_month, last_quarter, last_year)
- `source` (optional): Filter by data source

**Response Example:**
```json
{
  "success": true,
  "data": {
    "timeframe": "last_month",
    "trends": [
      {
        "date": "2023-01-01",
        "average_score": 0.78,
        "volume": 235,
        "distribution": {
          "positive": 0.65,
          "neutral": 0.25,
          "negative": 0.10
        }
      },
      {
        "date": "2023-01-02",
        "average_score": 0.82,
        "volume": 258,
        "distribution": {
          "positive": 0.72,
          "neutral": 0.18,
          "negative": 0.10
        }
      }
    ],
    "overall": {
      "average_score": 0.80,
      "volume_trend": "increasing",
      "top_entities": [
        {
          "text": "user interface",
          "type": "feature",
          "sentiment_trend": "improving",
          "mention_count": 187
        }
      ]
    }
  },
  "correlationId": "correlation-id-here"
}
```

## 🏆 Competitive Benchmarking API

### Get Competitive Analysis

#### `GET /api/v1/competitors/benchmark`
Get competitive analysis benchmarking data.

**Query Parameters:**
- `timeframe` (optional): Analysis timeframe (last_week, last_month, last_quarter, last_year)
- `category` (optional): Product category

**Response Example:**
```json
{
  "success": true,
  "data": {
    "company_name": "Our Company",
    "analysis_timestamp": "2023-01-01T00:00:00.000Z",
    "timeframe": "last_month",
    "competitors": [
      {
        "name": "Competitor A",
        "market_share": 0.28,
        "sentiment_score": 0.76,
        "strengths": ["pricing", "customer service"],
        "weaknesses": ["app performance"]
      },
      {
        "name": "Competitor B",
        "market_share": 0.17,
        "sentiment_score": 0.68,
        "strengths": ["product features", "integration"],
        "weaknesses": ["pricing", "complexity"]
      }
    ],
    "company_metrics": {
      "market_share": 0.35,
      "sentiment_score": 0.82,
      "strengths": ["product features", "app performance", "user experience"],
      "weaknesses": ["pricing", "documentation"]
    },
    "recommendations": [
      "Consider adjusting pricing strategies based on competitive analysis",
      "Improve documentation to address current weaknesses"
    ]
  },
  "correlationId": "correlation-id-here"
}
```

## 🔄 MCP Protocol API

### Initialize Agent Session

#### `POST /api/v1/mcp/session/initialize`
Initialize a new MCP agent session.

**Request Body:**
```json
{
  "agent_id": "550e8400-e29b-41d4-a716-446655440000",
  "capabilities_requested": ["feedback_analysis", "customer_communication"],
  "metadata": {
    "client_version": "1.0.0",
    "client_name": "Web Client"
  }
}
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "session_id": "sess_550e8400e29b41d4a716446655440000",
    "capabilities_granted": ["feedback_analysis", "customer_communication"],
    "expiration": "2023-01-01T01:00:00.000Z"
  },
  "correlationId": "correlation-id-here"
}
```

## ⚠️ Error Responses

All endpoints return standard error responses:

### 400 Bad Request

```json
{
  "success": false,
  "error": "Invalid request parameters",
  "details": {
    "name": "Name is required"
  },
  "correlationId": "correlation-id-here"
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "error": "Authentication failed",
  "message": "Invalid or missing API key",
  "correlationId": "correlation-id-here"
}
```

### 404 Not Found

```json
{
  "success": false,
  "error": "Resource not found",
  "message": "Agent with ID 550e8400-e29b-41d4-a716-446655440000 not found",
  "correlationId": "correlation-id-here"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "error": "Internal server error",
  "message": "An unexpected error occurred",
  "correlationId": "correlation-id-here"
}
```

## 🚫 Rate Limiting

The API implements rate limiting to prevent abuse. Rate limits are specified in the response headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1609459200
```

Exceeding the rate limit results in a 429 Too Many Requests response:

```json
{
  "success": false,
  "error": "Too many requests",
  "message": "Rate limit exceeded. Try again in 60 seconds.",
  "correlationId": "correlation-id-here"
}
```

## 📌 Versioning

API versioning is handled through the URL path (e.g., `/api/v1/agents`). When a new version is released, the documentation will be updated accordingly.

## 🔔 Webhooks

The system supports webhooks for event notifications. Webhook endpoints and event types are configured through the API.

---

🔗 **Ready to integrate?** Start by exploring the interactive API documentation at `/api-docs`!