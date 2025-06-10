import asyncio
import json
from agents import Agent, Runner, function_tool
from typing import Dict, List, Any
import os

# Load OpenAI API key from environment variable
from dotenv import load_dotenv
load_dotenv()

@function_tool
def route_feedback_to_companies(feedback_text: str) -> Dict[str, Any]:
    """Route feedback between company agents intelligently"""
    return {
        "routing_decision": "high_priority", 
        "target_agents": ["company_x", "company_y"], 
        "reasoning": "Critical customer feedback requires immediate attention"
    }

@function_tool
def negotiate_data_sharing(request_type: str) -> Dict[str, Any]:
    """Handle cross-company data sharing negotiations"""
    return {
        "approval": True, 
        "conditions": ["anonymized", "aggregated"], 
        "confidence": 0.89, 
        "reasoning": "Safe data sharing with privacy protection"
    }

agent = Agent(
    name="Inter-Agent Communication Agent",
    instructions="Manage agent communication and feedback orchestration. Be diplomatic in negotiations and prioritize data privacy.",
    tools=[route_feedback_to_companies, negotiate_data_sharing]
)

async def main():
    result = await Runner.run(agent, "Coordinate feedback sharing between two companies")
    print("Communication Result:", result.final_output)

if __name__ == "__main__":
    asyncio.run(main())