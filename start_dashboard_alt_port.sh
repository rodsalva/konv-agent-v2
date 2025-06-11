#!/bin/bash

# Alternative dashboard startup script with configurable port
PORT=${1:-8081}  # Use first argument as port, default to 8081

echo "🚀 Starting MercadoLivre AI Agent Admin Dashboard on Port $PORT"
echo "================================================================"
echo ""

# Check if we're in the right directory
if [ ! -d "python-agents" ]; then
    echo "⚠️  Error: python-agents directory not found."
    echo "   Please run this script from the project root directory."
    exit 1
fi

# Activate virtual environment
if [ ! -d ".venv" ]; then
    echo "❌ Error: Virtual environment not found."
    echo "   Please run ./setup_tests.sh first to create the virtual environment."
    exit 1
fi

echo "🔧 Activating virtual environment..."
source .venv/bin/activate

# Install Flask if not already installed
echo "📦 Checking dependencies..."
pip install flask flask-cors > /dev/null 2>&1

# Make the dashboard server executable
chmod +x dashboard_server.py

echo "🌐 Starting dashboard server..."
echo ""
echo "📊 Dashboard will be available at: http://localhost:$PORT"
echo "🔧 Press Ctrl+C to stop the server"
echo ""
echo "Features:"
echo "• Run Enhanced Agents - See detailed persona interactions"
echo "• Run Real Agents - Execute the actual Python agent system"
echo "• Run Simulation - Watch a demo simulation"
echo "• Live Output - See step-by-step execution"
echo "• Persona Monitoring - Track individual agent personas"
echo "• Company Insights - View agent analysis results"
echo ""

# Start the Flask server with custom port
export FLASK_PORT=$PORT
python -c "
import os
from dashboard_server import app
port = int(os.environ.get('FLASK_PORT', 8081))
print(f'🚀 Starting MercadoLivre AI Agent Dashboard Server on port {port}...')
print(f'📊 Dashboard will be available at: http://localhost:{port}')
print('🔧 Use Ctrl+C to stop the server')
print('')
app.run(host='0.0.0.0', port=port, debug=True, threaded=True)
" 