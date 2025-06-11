# MercadoLivre AI Agent Tests

This directory contains unit tests for the MercadoLivre AI agent system.

## Setup

Before running tests, make sure to install the required dependencies:

```bash
pip install -r ../requirements.txt
```

This will install:
- websockets (for WebSocket communication)
- requests (for HTTP communication)
- python-dotenv (for environment variable loading)
- openai (for AI model interaction)

## Running Tests

To run all tests:

```bash
python ../run_tests.py
```

To run tests with detailed output:

```bash
python ../run_tests.py --verbose
```

To run specific tests:

```bash
python ../run_tests.py --pattern "diverse_persona"
```

## Test Structure

- `test_diverse_persona_agent.py`: Tests for the flexible persona-based agent implementation
- `test_websocket_client.py`: Tests for WebSocket communication with Node.js backend
- `test_diverse_mercadolivre_orchestrator.py`: Tests for multi-persona orchestration

## Mocking Dependencies

These tests use the Python `unittest.mock` module to mock external dependencies like:
- WebSocket connections
- Database calls
- AI model calls

This allows for faster and more reliable testing without requiring external services.

## Known Issues

If you encounter `ModuleNotFoundError: No module named 'websockets'`, install the websockets package:

```bash
pip install websockets
```

For other import errors, make sure you've installed all dependencies from requirements.txt.