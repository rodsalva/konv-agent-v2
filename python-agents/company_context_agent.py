import asyncio
import json
from agents import Agent, Runner, function_tool
import os

# Load OpenAI API key from environment variable
from dotenv import load_dotenv
load_dotenv()

@function_tool
def gather_company_data():
    return {"revenue": 450000, "customers": 15420, "growth": "12%"}

agent = Agent(name="Company Context Agent", instructions="Analyze company context", tools=[gather_company_data])

async def main():
    result = await Runner.run(agent, "Analyze our company performance")
    print("Company Context:", result.final_output)

if __name__ == "__main__":
    asyncio.run(main())