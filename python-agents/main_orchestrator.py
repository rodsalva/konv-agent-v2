import asyncio
import json
import websockets
from agents import Agent, Runner, function_tool
from company_context_agent import agent as context_agent
from communication_agent import agent as comm_agent
from oversight_agent import agent as oversight_agent
import os

# Load OpenAI API key from environment variable
from dotenv import load_dotenv
load_dotenv()

# Agent API keys from your platform
API_KEYS = {
    "context": "mcp_agent_2c808c7dc61413d5ff61bea1703ec04b445dd0a44542945da8c70f9928c61367",
    "communication": "mcp_agent_621a4243dc5b6a0b8d4ea3cd169858899e77f24c6fdeb986942b787884c16c33",
    "oversight": "mcp_agent_b8b12c55dbd6cc5e4e4b3ba3f546af910c51413b18186ba18f3c2938e4414604"
}

async def connect_agent_to_platform(agent_type, agent, api_key):
    """Connect an individual agent to the MCP platform"""
    uri = "ws://localhost:3001/api/v1/ws"
    
    try:
        async with websockets.connect(uri) as websocket:
            print(f"🔗 {agent_type} Agent connected to MCP platform")
            
            # Authenticate
            auth_msg = {
                "jsonrpc": "2.0",
                "method": "system/authenticate",
                "id": f"auth-{agent_type}",
                "params": {"api_key": api_key}
            }
            await websocket.send(json.dumps(auth_msg))
            print(f"🔐 {agent_type} authentication sent")
            
            # Listen for messages
            async for message in websocket:
                try:
                    data = json.loads(message)
                    print(f"📨 {agent_type} received: {data.get('method', 'unknown')}")
                    
                    # Handle authentication response
                    if data.get('id') == f"auth-{agent_type}":
                        if 'result' in data:
                            print(f"✅ {agent_type} authentication successful!")
                        else:
                            print(f"❌ {agent_type} authentication failed: {data.get('error', {})}")
                    
                    # Handle specific requests based on agent type
                    if data.get('method') == 'feedback/process' and agent_type == "oversight":
                        feedback = data['params'].get('feedback', {})
                        result = await Runner.run(agent, f"Process this feedback: {json.dumps(feedback)}")
                        
                        response = {
                            "jsonrpc": "2.0",
                            "id": data.get('id'),
                            "result": {"analysis": result.final_output, "agent": agent_type}
                        }
                        await websocket.send(json.dumps(response))
                        
                except Exception as e:
                    print(f"❌ {agent_type} error: {e}")
                    
    except Exception as e:
        print(f"❌ {agent_type} connection failed: {e}")

async def main():
    print("🤖 Starting AI Agent Platform Integration")
    print("=" * 50)
    
    # Test agents locally first
    print("\n🧪 Testing agents locally...")
    
    context_result = await Runner.run(context_agent, "Analyze current company performance")
    print(f"Context Agent: {context_result.final_output}")
    
    comm_result = await Runner.run(comm_agent, "Coordinate feedback between companies")
    print(f"Communication Agent: {comm_result.final_output}")
    
    oversight_result = await Runner.run(oversight_agent, "Validate data quality")
    print(f"Oversight Agent: {oversight_result.final_output}")
    
    print("\n🔗 Connecting agents to MCP platform...")
    
    # Connect all agents to the platform concurrently
    await asyncio.gather(
        connect_agent_to_platform("context", context_agent, API_KEYS["context"]),
        connect_agent_to_platform("communication", comm_agent, API_KEYS["communication"]),
        connect_agent_to_platform("oversight", oversight_agent, API_KEYS["oversight"])
    )

if __name__ == "__main__":
    asyncio.run(main())