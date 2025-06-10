#!/bin/bash

# Demo script for Konv Agent system
# This script demonstrates the Konv Agent platform by running
# all necessary services and executing test API calls

# Text formatting
BOLD='\033[1m'
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_DIR="$(pwd)"
PYTHON_AGENTS_DIR="$PROJECT_DIR/python-agents"

# Function to print section headers
print_header() {
  echo -e "\n${BOLD}${BLUE}=== $1 ===${NC}\n"
}

# Function to print success messages
print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error messages
print_error() {
  echo -e "${RED}✗ $1${NC}"
  exit 1
}

# Function to print info messages
print_info() {
  echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if environment is set up correctly
check_environment() {
  print_header "Checking Environment"
  
  # Check if .env file exists
  if [ ! -f ".env" ]; then
    print_error ".env file not found. Please create it first."
  fi
  print_success "Found .env file"

  # Check if python-agents/.env exists
  if [ ! -f "python-agents/.env" ]; then
    print_error "python-agents/.env file not found. Please create it first."
  fi
  print_success "Found python-agents/.env file"

  # Check if Python virtual environment exists
  if [ ! -d "python-agents/env" ]; then
    print_error "Python virtual environment not found. Please run setup first."
  fi
  print_success "Found Python virtual environment"

  # Check Node.js
  if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
  fi
  node_version=$(node -v)
  print_success "Node.js is installed: $node_version"

  # Check database connection
  print_info "Checking database connection..."
  if npm run db:check &> /dev/null; then
    print_success "Database connection successful"
  else
    print_error "Database connection failed"
  fi
}

# Start the MCP platform server
start_server() {
  print_header "Starting MCP Platform Server"
  print_info "Starting server in the background (logs will be saved to server.log)"
  npm run dev > server.log 2>&1 &
  SERVER_PID=$!
  
  # Wait for server to start
  print_info "Waiting for server to start..."
  sleep 5
  
  # Check if server is running
  if curl -s http://localhost:3001/health > /dev/null; then
    print_success "Server is running"
  else
    print_error "Server failed to start. Check server.log for details."
  fi
}

# Start the Python AI agents
start_python_agents() {
  print_header "Starting Python AI Agents"
  print_info "Starting Python agents in the background (logs will be saved to python_agents.log)"
  
  cd "$PYTHON_AGENTS_DIR" || print_error "Failed to change to python-agents directory"
  source env/bin/activate
  python main_orchestrator.py > "$PROJECT_DIR/python_agents.log" 2>&1 &
  PYTHON_PID=$!
  cd "$PROJECT_DIR" || print_error "Failed to change back to project directory"
  
  print_info "Waiting for agents to initialize..."
  sleep 5
  print_success "Python agents started"
}

# Run the feedback test
run_feedback_test() {
  print_header "Running Feedback Test"
  npm run feedback:test
}

# Make API requests with authentication
make_api_requests() {
  print_header "Making API Requests"
  
  # API key for authentication
  API_KEY="mcp_agent_2c808c7dc61413d5ff61bea1703ec04b445dd0a44542945da8c70f9928c61367"
  
  # Get health status (no auth required)
  print_info "Checking health status..."
  curl -s http://localhost:3001/health | jq '.'
  print_success "Health check complete"
  
  # Get list of agents
  print_info "Fetching agents list..."
  curl -s -X GET http://localhost:3001/api/v1/agents \
    -H "Authorization: Bearer $API_KEY" | jq '.data[].name'
  print_success "Agents list retrieved"
  
  # Submit custom feedback
  print_info "Submitting custom feedback..."
  curl -s -X POST http://localhost:3001/api/v1/feedback \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d '{
      "customer_agent_id": "5f825fc7-c8f5-44d3-9079-cbbd2673f3de",
      "company_agent_id": "739b40fc-1295-423f-a61a-68c1aa8b617d",
      "content": {
        "text": "The new feature is amazing but I found a bug when trying to export data.",
        "rating": 4
      },
      "feedback_type": "review",
      "context": {
        "source": "web",
        "channel": "customer_portal"
      }
    }' | jq '.'
  print_success "Custom feedback submitted"
}

# Main demo function
run_demo() {
  print_header "KONV AGENT DEMO"
  print_info "This script will demonstrate the Konv Agent platform by running all necessary services and making test API calls."
  
  # Check environment
  check_environment
  
  # Start server
  start_server
  
  # Start Python agents
  start_python_agents
  
  # Run feedback test
  run_feedback_test
  
  # Make API requests
  make_api_requests
  
  # Show logs from Python agents
  print_header "Python Agents Logs"
  tail -n 20 python_agents.log
  
  print_header "Demo Complete"
  print_info "Server (PID: $SERVER_PID) and Python agents (PID: $PYTHON_PID) are still running."
  print_info "You can stop them with: kill $SERVER_PID $PYTHON_PID"
  print_info "For more detailed logs, check: server.log and python_agents.log"
}

# Run the demo
run_demo