# How to Get Agents in the MCP Feedback Platform

## Overview

There are several ways to "get agents" within this platform:

1. **List existing agents** - View agents already in the system
2. **Create new agents** - Add new AI agents to the platform  
3. **Connect external agents** - Integrate agents from other systems
4. **Discover agents by capabilities** - Find agents with specific skills

## Current Agents in Your Platform

You already have **4 active agents**:

- **Company Survey Agent** (company) - feedback_collection, survey_management
- **Customer Feedback Agent** (customer) - feedback_response, data_sharing  
- **Insight Analysis Agent** (insight) - data_analysis, pattern_recognition, report_generation
- **Product Team Agent** (product) - insight_consumption, feedback_review

## Method 1: List Existing Agents

### Via Command Line
```bash
npm run agents:list
```

### Via REST API
```bash
curl -X GET http://localhost:3001/api/v1/agents \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Via Script
```typescript
import { db } from './src/services/database';

const agents = await db.listAgents();
console.log(`Found ${agents.length} agents`);
```

## Method 2: Create New Agents

### Step 1: Create Agent via API

```bash
curl -X POST http://localhost:3001/api/v1/agents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "name": "Support Ticket Agent",
    "type": "support", 
    "capabilities": [
      "ticket_processing",
      "customer_communication", 
      "escalation_handling"
    ],
    "metadata": {
      "department": "customer_support",
      "priority_level": "high",
      "languages": ["en", "es", "fr"]
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "name": "Support Ticket Agent",
    "type": "support",
    "status": "active",
    "api_key": "fbk_abc123xyz789...",
    "capabilities": ["ticket_processing", "customer_communication"],
    "created_at": "2025-06-09T23:30:00Z"
  },
  "message": "Agent created successfully. Save the API key as it won't be shown again."
}
```

### Step 2: Save the API Key
⚠️ **IMPORTANT**: The API key is only shown once! Save it immediately.

## Method 3: Connect External Agents

### WebSocket Connection Example

```javascript
const WebSocket = require('ws');

// Connect to the platform
const ws = new WebSocket('ws://localhost:3001/api/v1/ws');

ws.on('open', function open() {
  // Authenticate with your API key
  ws.send(JSON.stringify({
    "jsonrpc": "2.0",
    "method": "system/authenticate", 
    "id": "auth-1",
    "params": {
      "api_key": "fbk_your_api_key_here"
    }
  }));
});

ws.on('message', function message(data) {
  const response = JSON.parse(data);
  console.log('Received:', response);
  
  if (response.method === 'system/welcome') {
    console.log('Connected to MCP platform!');
  }
});
```

### Python Agent Example

```python
import asyncio
import websockets
import json

class MCPAgent:
    def __init__(self, api_key):
        self.api_key = api_key
        self.ws = None
    
    async def connect(self):
        uri = "ws://localhost:3001/api/v1/ws"
        self.ws = await websockets.connect(uri)
        
        # Authenticate
        auth_msg = {
            "jsonrpc": "2.0",
            "method": "system/authenticate",
            "id": "auth-1", 
            "params": {"api_key": self.api_key}
        }
        await self.ws.send(json.dumps(auth_msg))
        
        # Listen for messages
        async for message in self.ws:
            await self.handle_message(json.loads(message))
    
    async def handle_message(self, message):
        print(f"Received: {message}")
        
        # Process feedback requests, etc.
        if message.get('method') == 'feedback/process':
            await self.process_feedback(message)

# Usage
agent = MCPAgent("fbk_your_api_key_here")
asyncio.run(agent.connect())
```

## Method 4: Discover Agents by Capabilities

### Find Agents with Specific Skills

```bash
curl -X GET "http://localhost:3001/api/v1/agents/discover?capabilities=data_analysis" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Filter by Multiple Capabilities

```bash
curl -X GET "http://localhost:3001/api/v1/agents/discover?capabilities=feedback_collection&capabilities=survey_management" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## Agent Types and Their Purposes

| Type | Purpose | Typical Capabilities |
|------|---------|---------------------|
| `company` | Collect feedback from customers | feedback_collection, survey_management |
| `customer` | Respond to feedback requests | feedback_response, data_sharing |
| `insight` | Analyze and generate insights | data_analysis, pattern_recognition |  
| `product` | Consume insights for decisions | insight_consumption, feedback_review |
| `support` | Handle support tickets | ticket_processing, escalation_handling |
| `sales` | Sales analytics and tracking | lead_scoring, conversion_tracking |

## Integration Patterns

### 1. Polling Pattern (Simple)
```javascript
// Check for new feedback every 30 seconds
setInterval(async () => {
  const response = await fetch('/api/v1/feedback?status=raw');
  const feedback = await response.json();
  
  if (feedback.data.length > 0) {
    await processFeedback(feedback.data);
  }
}, 30000);
```

### 2. WebSocket Pattern (Real-time)
```javascript
// Real-time notifications
ws.on('message', (data) => {
  const message = JSON.parse(data);
  
  if (message.method === 'feedback/new') {
    processFeedback(message.params.feedback);
  }
});
```

### 3. MCP Protocol Pattern (Advanced)
```javascript
// Send MCP request
const request = {
  "jsonrpc": "2.0",
  "method": "tools/call",
  "id": "req-1",
  "params": {
    "name": "process_feedback",
    "arguments": {
      "feedback_id": "uuid-here"
    }
  }
};

ws.send(JSON.stringify(request));
```

## Quick Start Commands

```bash
# 1. Start the server
npm run start:dev

# 2. List current agents  
npm run agents:list

# 3. Run the complete demo
npm run agents:demo

# 4. Test feedback processing
npm run feedback:test

# 5. Check database health
npm run db:check
```

## Next Steps

1. **Start the server**: `npm run start:dev`
2. **Create your first custom agent** using the API
3. **Connect your agent** via WebSocket  
4. **Start processing feedback** using the MCP protocol
5. **Monitor agent activity** through the dashboard

The platform is ready for you to integrate new agents and start processing feedback! 