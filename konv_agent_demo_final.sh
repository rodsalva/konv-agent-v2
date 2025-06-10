#!/bin/bash

# Konv Agent Complete Demo - Enhanced for MercadoLivre AI Analysis
# This script runs the entire Konv Agent system with MercadoLivre AI analysis
# Usage: ./konv_agent_demo_final.sh (will make itself executable if needed)

# Self-permission check - make executable if not already
if [ ! -x "$0" ]; then
  chmod +x "$0"
  echo "✓ Script made executable"
  exec "$0" "$@"
fi

# Text formatting
BOLD='\033[1m'
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# API key for authentication
API_KEY="mcp_agent_2c808c7dc61413d5ff61bea1703ec04b445dd0a44542945da8c70f9928c61367"

# Process IDs for background processes
SERVER_PID=""
PYTHON_PID=""

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
}

# Function to print fatal error messages and exit
print_fatal_error() {
  echo -e "${RED}✗ $1${NC}"
  exit 1
}

# Function to print info messages
print_info() {
  echo -e "${YELLOW}ℹ $1${NC}"
}

# Function to print prompts
print_prompt() {
  echo -e "${PURPLE}> $1${NC}"
}

# Function to forcefully kill processes using port 3001
kill_port_processes() {
  print_header "Cleaning Up Port 3001"
  
  # Find processes using port 3001
  PORT_PIDS=$(lsof -i :3001 -t 2>/dev/null)
  
  if [ -n "$PORT_PIDS" ]; then
    print_info "Found processes using port 3001: $PORT_PIDS"
    print_info "Forcefully killing these processes..."
    
    # Kill each process with SIGKILL (-9)
    for pid in $PORT_PIDS; do
      kill -9 "$pid" 2>/dev/null || true
    done
    
    # Wait a moment
    sleep 2
    
    # Check if port is now free
    if lsof -i :3001 -t &> /dev/null; then
      REMAINING_PIDS=$(lsof -i :3001 -t)
      print_error "Failed to free port 3001. These processes are still running: $REMAINING_PIDS"
      print_info "Trying even more aggressive cleanup..."
      
      # Try even more aggressive cleanup
      pkill -f "node.*3001" 2>/dev/null || true
      pkill -f "tsx.*src/index.ts" 2>/dev/null || true
      sleep 1
      
      if lsof -i :3001 -t &> /dev/null; then
        print_fatal_error "Could not free port 3001. Please manually kill processes and try again."
      fi
    fi
    
    print_success "Port 3001 is now free"
  else
    print_success "Port 3001 is already free"
  fi
}

# Function to cleanup on exit
cleanup() {
  print_header "Cleaning Up"
  
  if [ -n "$SERVER_PID" ]; then
    print_info "Stopping MCP server (PID: $SERVER_PID)..."
    kill -15 "$SERVER_PID" 2>/dev/null || true
    sleep 1
    # Force kill if still running
    if ps -p "$SERVER_PID" > /dev/null 2>&1; then
      kill -9 "$SERVER_PID" 2>/dev/null || true
    fi
  fi
  
  if [ -n "$PYTHON_PID" ]; then
    print_info "Stopping Python agents (PID: $PYTHON_PID)..."
    kill -15 "$PYTHON_PID" 2>/dev/null || true
    sleep 1
    # Force kill if still running
    if ps -p "$PYTHON_PID" > /dev/null 2>&1; then
      kill -9 "$PYTHON_PID" 2>/dev/null || true
    fi
  fi
  
  # Kill any other instances that might be running
  print_info "Checking for other processes using port 3001..."
  PORT_PIDS=$(lsof -i :3001 -t 2>/dev/null)
  if [ -n "$PORT_PIDS" ]; then
    print_info "Killing processes using port 3001 (PIDs: $PORT_PIDS)..."
    for pid in $PORT_PIDS; do
      kill -9 "$pid" 2>/dev/null || true
    done
  fi
  
  print_success "Cleanup complete!"
}

# Set up trap to clean up on exit
trap cleanup EXIT

# Check environment
check_environment() {
  print_header "Checking Environment"
  
  # Check if .env file exists
  if [ ! -f ".env" ]; then
    print_fatal_error ".env file not found. Please create it first."
  fi
  print_success "Found .env file"

  # Check if python-agents/.env exists
  if [ ! -f "python-agents/.env" ]; then
    print_fatal_error "python-agents/.env file not found. Please create it first."
  fi
  print_success "Found python-agents/.env file"

  # Check if Python virtual environment exists
  if [ ! -d "python-agents/env" ]; then
    print_fatal_error "Python virtual environment not found. Please run setup first."
  fi
  print_success "Found Python virtual environment"

  # Check Node.js
  if ! command -v node &> /dev/null; then
    print_fatal_error "Node.js is not installed"
  fi
  node_version=$(node -v)
  print_success "Node.js is installed: $node_version"

  # Check Python
  if ! command -v python3 &> /dev/null; then
    print_fatal_error "Python 3 is not installed"
  fi
  python_version=$(python3 --version)
  print_success "Python is installed: $python_version"

  # Check if MercadoLivre orchestrator exists
  if [ ! -f "python-agents/mercadolivre_orchestrator.py" ]; then
    print_fatal_error "MercadoLivre orchestrator not found. Please ensure the file exists."
  fi
  print_success "Found MercadoLivre orchestrator"

  # Check database connection (optional)
  print_info "Checking database connection..."
  DB_CHECK_OUTPUT=$(npm run db:check 2>&1)
  if echo "$DB_CHECK_OUTPUT" | grep -q "All required tables exist" || echo "$DB_CHECK_OUTPUT" | grep -q "healthy"; then
    print_success "Database connection successful"
  else
    print_info "Database connection check completed (may be in test mode)"
  fi
}

# Start the MCP platform server
start_server() {
  print_header "Starting MCP Platform Server"
  print_info "Starting server in the background (logs will be saved to server.log)"
  
  # Remove old log file if it exists
  if [ -f "server.log" ]; then
    rm server.log
  fi
  
  # Start server with explicit port
  PORT=3001 npm run dev > server.log 2>&1 &
  SERVER_PID=$!
  
  # Wait for server to start
  print_info "Waiting for server to start..."
  for i in {1..30}; do
    if curl -s http://localhost:3001/health > /dev/null; then
      print_success "Server is running on http://localhost:3001"
      return 0
    fi
    sleep 1
    echo -n "."
  done
  
  # Check if server process is still running
  if ! ps -p "$SERVER_PID" > /dev/null; then
    print_error "Server process died. Here's what happened:"
    tail -n 15 server.log
    print_fatal_error "Please fix the server issues and try again."
  else
    print_error "Server started but health check is not responding. Here's the log:"
    tail -n 15 server.log
    print_fatal_error "Please fix the server issues and try again."
  fi
}

# Run the MercadoLivre AI Analysis
run_mercadolivre_analysis() {
  print_header "Running MercadoLivre AI Analysis"
  print_info "Starting comprehensive MercadoLivre marketplace analysis..."
  print_info "This will run 7 AI agents to analyze MercadoLivre from multiple perspectives"
  
  # Remove old log file if it exists
  if [ -f "python_agents.log" ]; then
    rm python_agents.log
  fi
  
  cd python-agents || print_fatal_error "Failed to change to python-agents directory"
  source env/bin/activate
  
  # Check if Python agents can be imported
  if ! python -c "import agents; print('Agents module available')" &> /dev/null; then
    print_error "Python agents module not available"
    print_info "Installing required packages..."
    pip install -r requirements.txt
  fi
  
  print_info "Running MercadoLivre orchestrator..."
  print_info "This will take about 2-3 minutes to complete the full analysis"
  
  # Run the MercadoLivre orchestrator and capture output
  python mercadolivre_orchestrator.py | tee ../python_agents.log
  
  # Check if analysis completed successfully
  if grep -q "MERCADOLIVRE COMPREHENSIVE ANALYSIS COMPLETE" ../python_agents.log; then
    print_success "MercadoLivre analysis completed successfully!"
    print_info "Generated insights from 7 AI agents:"
    print_info "• 🏪 MercadoLivre Context Agent"
    print_info "• 💻 Tech Enthusiast Agent"
    print_info "• 💰 Budget Shopper Agent"
    print_info "• 🎁 Gift Buyer Agent"
    print_info "• 🤝 Communication Agent"
    print_info "• 🏢 Company Analysis Agent"
    print_info "• 👁️ Oversight Agent"
  else
    print_error "MercadoLivre analysis may not have completed successfully"
    print_info "Check the logs for details"
  fi
  
  cd ..
}

# Show web interface access information
show_web_interfaces() {
  print_header "Web Interface Access"
  
  print_info "Your MercadoLivre AI system is now accessible via these URLs:"
  echo ""
  echo -e "${CYAN}🏠 Main Dashboard:${NC}"
  echo "   http://localhost:3001/"
  echo ""
  echo -e "${CYAN}💬 Agent Conversations:${NC}"
  echo "   http://localhost:3001/conversations"
  echo "   (See how AI personas explored MercadoLivre)"
  echo ""
  echo -e "${CYAN}🏢 Department Recommendations:${NC}"
  echo "   http://localhost:3001/departments"
  echo "   (Strategic business insights for 6 departments)"
  echo ""
  echo -e "${CYAN}📚 API Documentation:${NC}"
  echo "   http://localhost:3001/api-docs"
  echo "   (Interactive API explorer)"
  echo ""
  
  print_info "Opening main dashboard in your browser..."
  if command -v open &> /dev/null; then
    open http://localhost:3001/
  elif command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3001/
  else
    print_info "Please manually open http://localhost:3001/ in your browser"
  fi
}

# Test API endpoints
test_api_endpoints() {
  print_header "Testing API Endpoints"
  
  print_info "Testing health endpoint..."
  HEALTH_STATUS=$(curl -s http://localhost:3001/health | jq -r '.status' 2>/dev/null)
  if [ "$HEALTH_STATUS" = "ok" ]; then
    print_success "Health check: $HEALTH_STATUS"
  else
    print_error "Health check failed"
  fi
  
  print_info "Testing conversations endpoint..."
  CONVERSATIONS_STATUS=$(curl -s -I http://localhost:3001/conversations | head -n1 | awk '{print $2}')
  if [[ "$CONVERSATIONS_STATUS" =~ ^(200|302)$ ]]; then
    print_success "Conversations endpoint: HTTP $CONVERSATIONS_STATUS"
  else
    print_error "Conversations endpoint: HTTP $CONVERSATIONS_STATUS"
  fi
  
  print_info "Testing departments endpoint..."
  DEPARTMENTS_STATUS=$(curl -s -I http://localhost:3001/departments | head -n1 | awk '{print $2}')
  if [[ "$DEPARTMENTS_STATUS" =~ ^(200|302)$ ]]; then
    print_success "Departments endpoint: HTTP $DEPARTMENTS_STATUS"
  else
    print_error "Departments endpoint: HTTP $DEPARTMENTS_STATUS"
  fi
}

# View analysis results summary
view_analysis_summary() {
  print_header "MercadoLivre Analysis Summary"
  
  if [ -f "python_agents.log" ]; then
    print_info "Analysis completed with the following insights:"
    echo ""
    
    # Extract key insights from the log
    if grep -q "Tech Enthusiast" python_agents.log; then
      echo -e "${GREEN}💻 Tech Enthusiast Analysis:${NC}"
      echo "   • Evaluated electronics, specifications, and tech trends"
      echo "   • Analyzed product comparison tools and technical accuracy"
    fi
    
    if grep -q "Budget Shopper" python_agents.log; then
      echo -e "${GREEN}💰 Budget Shopper Analysis:${NC}"
      echo "   • Evaluated deals, pricing, and value propositions"
      echo "   • Analyzed payment options and money-saving features"
    fi
    
    if grep -q "Gift Buyer" python_agents.log; then
      echo -e "${GREEN}🎁 Gift Buyer Analysis:${NC}"
      echo "   • Explored gift services, delivery, and customization"
      echo "   • Evaluated gift discovery and packaging options"
    fi
    
    if grep -q "Company Analysis" python_agents.log; then
      echo -e "${GREEN}🏢 Business Recommendations Generated:${NC}"
      echo "   • Product Department strategies"
      echo "   • Engineering Department priorities"
      echo "   • Marketing Department campaigns"
      echo "   • Customer Service improvements"
      echo "   • Business Intelligence analytics"
      echo "   • Operations optimization"
    fi
    
    echo ""
    print_info "Full detailed analysis available in the web interface"
  else
    print_error "Analysis log not found. Please run the MercadoLivre analysis first."
  fi
}

# Show system status
check_system_status() {
  print_header "System Status Check"
  
  # Check server status
  if curl -s http://localhost:3001/health > /dev/null; then
    SERVER_STATUS=$(curl -s http://localhost:3001/health | jq -r '.status' 2>/dev/null || echo "unknown")
    print_success "Backend Server: Running (status: $SERVER_STATUS)"
  else
    print_error "Backend Server: Not responding"
  fi
  
  # Check if analysis was completed
  if [ -f "python_agents.log" ] && grep -q "ANALYSIS COMPLETE" python_agents.log; then
    print_success "AI Analysis: Completed successfully"
  else
    print_error "AI Analysis: Not completed or in progress"
  fi
  
  # Check web interfaces
  print_info "Testing web interface accessibility..."
  MAIN_STATUS=$(curl -s -I http://localhost:3001/ | head -n1 | awk '{print $2}' || echo "failed")
  if [ "$MAIN_STATUS" = "200" ]; then
    print_success "Web Interfaces: Accessible"
  else
    print_error "Web Interfaces: May have issues (HTTP $MAIN_STATUS)"
  fi
}

# Interactive menu for additional actions
show_interactive_menu() {
  print_header "Interactive Demo Menu"
  
  while true; do
    echo ""
    echo "What would you like to do next?"
    echo ""
    echo "1. View MercadoLivre analysis summary"
    echo "2. Show web interface URLs"
    echo "3. Test API endpoints"
    echo "4. View analysis logs (last 30 lines)"
    echo "5. View server logs (last 20 lines)"
    echo "6. Check system status"
    echo "7. Run analysis again"
    echo "8. Open web interfaces in browser"
    echo "9. Exit demo"
    echo ""
    
    read -r -p "Enter your choice (1-9): " choice
    
    case "$choice" in
      1) view_analysis_summary ;;
      2) show_web_interfaces ;;
      3) test_api_endpoints ;;
      4) 
        if [ -f "python_agents.log" ]; then
          print_header "Analysis Logs (Last 30 lines)"
          tail -n 30 python_agents.log
        else
          print_error "Analysis log file not found"
        fi
        ;;
      5) 
        if [ -f "server.log" ]; then
          print_header "Server Logs (Last 20 lines)"
          tail -n 20 server.log
        else
          print_error "Server log file not found"
        fi
        ;;
      6) check_system_status ;;
      7) run_mercadolivre_analysis ;;
      8) 
        print_info "Opening web interfaces..."
        if command -v open &> /dev/null; then
          open http://localhost:3001/
          open http://localhost:3001/conversations
          open http://localhost:3001/departments
        elif command -v xdg-open &> /dev/null; then
          xdg-open http://localhost:3001/
          xdg-open http://localhost:3001/conversations
          xdg-open http://localhost:3001/departments
        else
          print_info "Please manually open the URLs shown in option 2"
        fi
        ;;
      9) break ;;
      *) echo "Invalid choice. Please enter a number between 1 and 9." ;;
    esac
  done
}

# Main function to run the demo
run_demo() {
  print_header "MERCADOLIVRE AI AGENT ANALYSIS DEMO"
  print_info "This script will run the complete MercadoLivre AI analysis system"
  print_info "🤖 7 AI agents will analyze MercadoLivre marketplace from multiple perspectives"
  print_info "🏢 Business recommendations will be generated for 6 departments"
  print_info "🌐 Beautiful web interfaces will show the results"
  echo ""
  
  # Kill any processes using port 3001 before we start
  kill_port_processes
  
  # Check environment
  check_environment
  
  # Start the server
  start_server
  
  # Run MercadoLivre analysis
  run_mercadolivre_analysis
  
  # Show web interfaces
  show_web_interfaces
  
  # Test API endpoints
  test_api_endpoints
  
  # Show analysis summary
  view_analysis_summary
  
  # Interactive menu
  show_interactive_menu
  
  print_header "Demo Complete"
  print_success "🎉 MercadoLivre AI Analysis System is ready!"
  print_info "Your system will continue running until you stop it"
  print_info "Access the web interface at: http://localhost:3001/"
  print_info "Press Ctrl+C to stop all services"
}

# Run the demo
run_demo