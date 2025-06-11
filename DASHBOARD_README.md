# 🤖 MercadoLivre AI Agent Admin Dashboard

A beautiful, real-time web interface for monitoring and controlling the MercadoLivre AI agent system. Watch diverse persona agents explore MercadoLivre step-by-step with live output streaming.

## 🚀 Quick Start

```bash
# Start the dashboard (one command!)
./start_dashboard.sh
```

Then open your browser to: **http://localhost:5000**

## ✨ Features

### 🎯 **Two Execution Modes**
- **Run Real Agents** - Execute the actual Python agent system with live streaming
- **Run Simulation** - Watch a beautiful demo simulation of the agent exploration

### 📊 **Live Monitoring Dashboard**
- **Overview Tab**: Real-time metrics and recent activity
- **Live Output Tab**: Streaming console output with timestamps
- **Personas Tab**: Visual cards showing individual agent status and progress

### 🎮 **Interactive Controls**
- Start/Stop exploration with one click
- Choose number of personas (2, 3, or 5)
- Clear logs and refresh views
- Real-time status indicators

### 📈 **Real-Time Metrics**
- Total personas active
- Current running personas  
- Total observations collected
- Runtime tracking

## 🖥️ **Dashboard Screenshots**

The dashboard provides:
- Beautiful gradient UI with modern design
- Terminal-style output with green text on black background
- Color-coded status indicators (red=stopped, yellow=running, green=complete)
- Responsive grid layout for persona cards
- Smooth animations and transitions

## 🔧 **How It Works**

### Backend (Flask Server)
- `dashboard_server.py` - Handles real agent execution and streaming
- Runs Python agent tests with live output streaming
- Provides REST API endpoints for dashboard communication

### Frontend (HTML Dashboard) 
- `admin_dashboard.html` - Single-page admin interface
- JavaScript handles real-time updates and streaming
- Fallback simulation mode if backend unavailable

## 📋 **Step-by-Step Process View**

Watch the agents progress through these phases:

1. **📊 Phase 1**: Gathering MercadoLivre Context
2. **👥 Phase 2**: Loading Diverse Personas  
3. **🎯 Phase 3**: Planning Exploration Strategy
4. **🔍 Phase 4**: Executing Multi-Persona Exploration
5. **📊 Phase 5**: Synthesizing Feedback
6. **🏢 Phase 6**: Company Analysis & Recommendations
7. **✅ Phase 7**: Quality Validation & Final Report

## 🎭 **Persona Types**

The dashboard tracks different shopper personas:
- **Tech Enthusiast** - Detailed product research, spec analysis
- **Budget Shopper** - Price comparison, deal hunting
- **Gift Buyer** - Category exploration, gift services
- **Casual Browser** - General marketplace exploration

## 🛠️ **Technical Details**

### Requirements
- Python 3.9+
- Flask & Flask-CORS
- Virtual environment (`.venv`)
- MercadoLivre agent system

### File Structure
```
admin_dashboard.html     # Main dashboard interface
dashboard_server.py      # Flask backend server
start_dashboard.sh       # One-command startup script
```

### API Endpoints
- `GET /` - Serve dashboard HTML
- `POST /run-agents` - Execute real agent system (streaming)
- `POST /run-simulation` - Run simulation mode (streaming)
- `GET /status` - Get current system status
- `POST /stop` - Stop running agents

## 🎨 **UI Design**

The dashboard features:
- **Modern gradient backgrounds** (blue to purple)
- **Card-based layout** for personas and metrics
- **Terminal-style output** with monospace font
- **Status indicators** with pulsing animations
- **Responsive design** that works on all screen sizes

## 🔄 **Real-Time Updates**

Every action provides immediate feedback:
- Personas change color when active (blue highlight)
- Metrics update in real-time as agents run
- Output streams live with timestamps
- Status bar shows current system state

## 🎯 **Perfect For**

- **Development** - Test and debug agent system
- **Demos** - Show off the AI agent capabilities
- **Monitoring** - Watch system performance in real-time
- **Debugging** - See detailed execution logs
- **Training** - Understand how the agents work

## 💡 **Tips**

- Use **Run Simulation** for quick demos
- Use **Run Real Agents** to test actual system
- Switch between tabs during execution to see different views
- The output automatically scrolls to show latest activity
- Personas update their status in real-time during exploration

---

**Enjoy watching your AI agents in action! 🤖✨** 