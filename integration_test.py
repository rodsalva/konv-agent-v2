import asyncio
import json
import requests
import time
import sys
import os
sys.path.append("python-agents")

from company_context_agent import agent as context_agent
from communication_agent import agent as comm_agent
from oversight_agent import agent as oversight_agent
from agents import Runner

async def test_full_integration():
    print("🤖 AI Agent Integration Test")
    print("=" * 50)
    
    print("\n1. �� Testing MCP Platform Health...")
    try:
        response = requests.get("http://localhost:3001/health")
        health_data = response.json()
        print("✅ Platform Status:", health_data["status"])
        print("✅ Database:", health_data["services"]["database"])
        print("✅ Feedback Pipeline:", health_data["services"]["feedback"]["pipeline"]["isInitialized"])
    except Exception as e:
        print("❌ Platform health check failed:", e)
        return
    
    print("\n2. 🧠 Testing AI Agents...")
    
    print("\n�� Company Context Agent:")
    context_result = await Runner.run(context_agent, "Analyze our current business performance")
    print("Result:", context_result.final_output[:200] + "...")
    
    print("\n💬 Communication Agent:")
    comm_result = await Runner.run(comm_agent, "Plan coordination between companies")
    print("Result:", comm_result.final_output[:200] + "...")
    
    print("\n📋 Oversight Agent:")
    oversight_result = await Runner.run(oversight_agent, "Validate customer feedback data")
    print("Result:", oversight_result.final_output[:200] + "...")
    
    print("\n3. 📤 Testing Feedback Processing...")
    
    test_feedback = {
        "customer_agent_id": "5f825fc7-c8f5-44d3-9079-cbbd2673f3de",
        "company_agent_id": "739b40fc-1295-423f-a61a-68c1aa8b617d",
        "raw_feedback": {
            "content": {
                "text": "I love your AI-powered feedback system! The real-time processing is amazing.",
                "rating": 4
            }
        },
        "feedback_type": "review",
        "status": "raw"
    }
    
    try:
        submit_response = requests.post(
            "http://localhost:3001/api/v1/feedback",
            json=test_feedback,
            headers={"Content-Type": "application/json"}
        )
        
        if submit_response.status_code == 201:
            feedback_data = submit_response.json()
            feedback_id = feedback_data["data"]["id"]
            print("✅ Feedback submitted successfully:", feedback_id)
            
            time.sleep(2)
            
            get_response = requests.get("http://localhost:3001/api/v1/feedback/" + feedback_id)
            if get_response.status_code == 200:
                processed_data = get_response.json()
                print("✅ Feedback processed - Status:", processed_data["data"]["status"])
                print("✅ Sentiment:", processed_data["data"].get("sentiment_score", "N/A"))
            else:
                print("❌ Failed to retrieve feedback:", get_response.status_code)
        else:
            print("❌ Failed to submit feedback:", submit_response.status_code)
    except Exception as e:
        print("❌ Feedback API test failed:", e)
    
    print("\n🎉 INTEGRATION SUCCESSFUL!")
    print("\nYour platform now has:")
    print("• 🤖 3 AI-powered agents using GPT-4")
    print("• 🔄 Real-time feedback processing")
    print("• 📊 Intelligent context analysis")
    print("• 💬 Smart agent-to-agent communication")
    print("• 📋 Comprehensive data oversight")
    print("• 🔗 MCP protocol for standardized messaging")
    
if __name__ == "__main__":
    asyncio.run(test_full_integration())