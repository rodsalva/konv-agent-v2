#!/bin/bash

echo "🚀 Starting MercadoLivre AI Agent Admin Dashboard"
echo "=================================================="
echo ""

# Stop any existing dashboard server processes
echo "🛑 Stopping any existing dashboard servers..."
pkill -f dashboard_server.py 2>/dev/null

# Wait for processes to terminate
sleep 1

# Check if we're in the right directory
if [ ! -f "dashboard_server.py" ]; then
    echo "⚠️  Error: dashboard_server.py file not found."
    echo "   Please run this script from the project root directory."
    exit 1
fi

# Check dependencies
echo "📦 Checking dependencies..."
pip install flask flask-cors > /dev/null 2>&1

# Make the dashboard server executable
chmod +x dashboard_server.py

# Start the Flask server in the background
echo "🌐 Starting dashboard server..."
python dashboard_server.py &
SERVER_PID=$!

# Wait for server to start
sleep 2

# Check if server started successfully
if ps -p $SERVER_PID > /dev/null; then
    echo "✅ Server started successfully (PID: $SERVER_PID)"
    echo ""
    echo "📊 Dashboard available at: http://localhost:8080"
    echo "🔧 Press Ctrl+C to stop the server"
    echo ""
    echo "Features:"
    echo "• Run AI Agent Analysis - Execute the AI analysis workflow"
    echo "• Live Output - See step-by-step execution"
    echo "• Persona Monitoring - Track individual agent personas"
    echo "• Company Insights - View agent analysis results"
    echo "• AI Insights - View AI-generated analysis of survey data"
    echo ""
    
    # Open browser automatically (works on Mac)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "🌐 Opening browser..."
        open "http://localhost:8080"
    else
        echo "Please open http://localhost:8080 in your browser"
    fi
    
    # Wait for the server process to finish
    wait $SERVER_PID
else
    echo "❌ Failed to start server. Check for errors above."
    exit 1
fi