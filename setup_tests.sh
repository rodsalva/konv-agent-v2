#!/bin/bash
# Setup script for MercadoLivre AI Agent tests

echo "Setting up test environment for MercadoLivre AI Agent system..."

# Check if virtual environment exists, create if not
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv .venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source .venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r python-agents/requirements.txt

# Create tests directory if it doesn't exist
if [ ! -d "python-agents/tests" ]; then
    echo "Creating tests directory..."
    mkdir -p python-agents/tests
fi

echo "Setup complete! Run tests with: python python-agents/run_tests.py"
echo "For more options, run: python python-agents/run_tests.py --help"