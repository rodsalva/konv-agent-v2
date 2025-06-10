#!/bin/bash

# Script to view all interactions in the Konv Agent system

# Text formatting
BOLD='\033[1m'
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print section headers
print_header() {
  echo -e "\n${BOLD}${BLUE}=== $1 ===${NC}\n"
}

# Function to print info messages
print_info() {
  echo -e "${YELLOW}ℹ $1${NC}"
}

# View server logs
view_server_logs() {
  print_header "Server Logs"
  if [ -f "server.log" ]; then
    print_info "Showing last 20 lines of server logs (full logs in server.log):"
    tail -n 20 server.log
  else
    echo "Server log file not found. Did you run the demo?"
  fi
}

# View Python agents logs
view_python_agent_logs() {
  print_header "Python Agent Logs"
  if [ -f "python_agents.log" ]; then
    print_info "Showing last 20 lines of Python agent logs (full logs in python_agents.log):"
    tail -n 20 python_agents.log
  else
    echo "Python agents log file not found. Did you run the demo?"
  fi
}

# View database interactions
view_database_interactions() {
  print_header "Database Interactions"
  
  # API key for authentication
  API_KEY="mcp_agent_2c808c7dc61413d5ff61bea1703ec04b445dd0a44542945da8c70f9928c61367"
  
  print_info "Checking for feedback entries in the database:"
  curl -s -X GET http://localhost:3001/api/v1/feedback \
    -H "Authorization: Bearer $API_KEY" | jq '.'
}

# View information about the agents
view_agent_details() {
  print_header "Agent Details"
  
  # API key for authentication
  API_KEY="mcp_agent_2c808c7dc61413d5ff61bea1703ec04b445dd0a44542945da8c70f9928c61367"
  
  print_info "Getting list of active agents:"
  curl -s -X GET "http://localhost:3001/api/v1/agents?status=active" \
    -H "Authorization: Bearer $API_KEY" | jq '.data[] | {id, name, type, status, capabilities}'
}

# Run the Python agent test locally
run_python_agent_test() {
  print_header "Python Agent Test"
  
  if [ -d "python-agents" ]; then
    cd python-agents || exit 1
    source env/bin/activate
    
    print_info "Running a local test of the Company Context Agent:"
    python -c "
import asyncio
from company_context_agent import agent
from agents import Runner

async def test():
    result = await Runner.run(agent, 'Analyze our company performance and provide insights')
    print('\\nAgent Response:\\n')
    print(result.final_output)

asyncio.run(test())
"
    
    cd - > /dev/null || exit 1
  else
    echo "Python agents directory not found."
  fi
}

# Instructions for monitoring real-time
show_realtime_monitoring() {
  print_header "Real-Time Monitoring Instructions"
  
  echo "To monitor the system in real-time, you can use these commands:"
  echo ""
  echo "1. Watch server logs in real-time:"
  echo "   tail -f server.log"
  echo ""
  echo "2. Watch Python agent logs in real-time:"
  echo "   tail -f python_agents.log"
  echo ""
  echo "3. To observe WebSocket communication (requires wscat):"
  echo "   npm install -g wscat"
  echo "   wscat -c ws://localhost:3001/api/v1/ws \\"
  echo "     -H \"Authorization: Bearer mcp_agent_2c808c7dc61413d5ff61bea1703ec04b445dd0a44542945da8c70f9928c61367\""
  echo ""
  echo "4. To simulate agent communication:"
  echo "   Send test feedback via:"
  echo "   npm run feedback:test"
}

# Main function
main() {
  print_header "KONV AGENT INTERACTIONS VIEWER"
  
  # Check if server is running
  if ! curl -s http://localhost:3001/health > /dev/null; then
    echo "${RED}The server doesn't appear to be running. Please start it first.${NC}"
    exit 1
  fi
  
  # View different types of interactions
  view_server_logs
  view_python_agent_logs
  view_database_interactions
  view_agent_details
  run_python_agent_test
  show_realtime_monitoring
  
  print_header "Viewing Complete"
  echo "You can run this script again at any time to see updated interactions."
}

# Run the main function
main