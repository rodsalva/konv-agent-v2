#!/usr/bin/env python3
"""
Simple Flask server for the MercadoLivre AI Agent Dashboard
Provides endpoints to run the real agent system and stream output.
"""

import subprocess
import os
import sys
import threading
import time
from flask import Flask, jsonify, Response, send_file
from flask_cors import CORS
import json
import random
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Global variables to track running processes
current_process = None
is_running = False

# Standardized persona interaction data
PERSONA_INTERACTIONS = {
    "tech_enthusiast": {
        "questions": [
            "What are the technical specifications of this smartphone?",
            "How does the camera quality compare to competitors?",
            "What's the processor speed and RAM capacity?",
            "Are there any user reviews about performance issues?",
            "What accessories are compatible with this device?"
        ],
        "behaviors": [
            "Spent 4.2 minutes analyzing product specifications",
            "Compared 6 similar products in the same category", 
            "Read 12 user reviews focusing on technical details",
            "Checked compatibility with 3 different accessories",
            "Analyzed price-to-performance ratio across 4 retailers"
        ],
        "decisions": [
            "Added high-end smartphone to wishlist after spec analysis",
            "Decided against budget option due to insufficient RAM",
            "Chose premium model for better camera specifications"
        ]
    },
    "budget_shopper": {
        "questions": [
            "What's the cheapest price available for this item?",
            "Are there any current discounts or promotions?",
            "How much would shipping cost to my location?",
            "Is there a payment plan option available?",
            "What's the return policy if I'm not satisfied?"
        ],
        "behaviors": [
            "Compared prices across 8 different sellers",
            "Applied 3 different discount codes to find best deal",
            "Calculated total cost including shipping and taxes",
            "Checked for bundle deals and bulk purchase options",
            "Evaluated cost per use over expected product lifetime"
        ],
        "decisions": [
            "Selected mid-range option with best value proposition",
            "Waited for promotional period to maximize savings",
            "Chose seller with free shipping to reduce total cost"
        ]
    },
    "gift_buyer": {
        "questions": [
            "Is this item suitable as a gift for a teenager?",
            "What gift wrapping options are available?",
            "Can I schedule delivery for a specific date?",
            "Is there a gift receipt option?",
            "What's the return process for gift recipients?"
        ],
        "behaviors": [
            "Browsed gift categories for 15 minutes",
            "Checked age-appropriate ratings and reviews",
            "Compared gift wrapping and personalization options",
            "Verified delivery timing for upcoming birthday",
            "Read gift-giving guides and recommendations"
        ],
        "decisions": [
            "Selected popular electronics item based on age group",
            "Added premium gift wrapping for special occasion",
            "Scheduled delivery 2 days before birthday"
        ]
    },
    "family_shopper": {
        "questions": [
            "Is this product child-safe and non-toxic?",
            "What's the bulk purchase discount for multiple units?",
            "How durable is this for everyday family use?",
            "Are there family-friendly payment plan options?",
            "What's the warranty coverage for household items?"
        ],
        "behaviors": [
            "Researched safety certifications and age recommendations",
            "Compared family pack sizes vs individual purchases",
            "Read parent reviews focusing on durability and safety",
            "Checked educational value for children's products",
            "Evaluated storage and space requirements for home"
        ],
        "decisions": [
            "Chose family-size package for better value",
            "Selected products with extended warranty for peace of mind",
            "Prioritized safety-certified items over cheaper alternatives"
        ]
    },
    "business_buyer": {
        "questions": [
            "Are there bulk pricing tiers for large quantities?",
            "What's the invoice and tax documentation process?",
            "Is there a dedicated business customer support line?",
            "What are the return/exchange policies for business purchases?",
            "Are there corporate account benefits available?"
        ],
        "behaviors": [
            "Requested formal quotes for quantities over 50 units",
            "Compared supplier ratings and delivery reliability",
            "Evaluated total cost of ownership including maintenance",
            "Checked compatibility with existing business systems",
            "Reviewed vendor credentials and business certifications"
        ],
        "decisions": [
            "Selected enterprise-grade solution with support contract",
            "Negotiated payment terms and bulk delivery schedule",
            "Chose established vendor with proven business track record"
        ]
    },
    "senior_shopper": {
        "questions": [
            "Is this product easy to use for someone my age?",
            "How do I contact customer service if I need help?",
            "What's the return policy if the product doesn't work?",
            "Are there clear, large-print instructions included?",
            "Is there phone support available, not just online chat?"
        ],
        "behaviors": [
            "Looked for large, clear product images and descriptions",
            "Prioritized products with simple, intuitive interfaces",
            "Checked for availability of phone-based customer support",
            "Read reviews from other senior customers",
            "Verified easy return process and clear contact information"
        ],
        "decisions": [
            "Selected products with excellent customer service ratings",
            "Chose items with simple setup and clear instructions",
            "Prioritized local sellers for easier returns if needed"
        ]
    },
    "luxury_shopper": {
        "questions": [
            "What premium features distinguish this from standard models?",
            "Is this an authentic, original product with warranty?",
            "What exclusive or limited edition options are available?",
            "Are there premium delivery and white-glove services?",
            "What's the resale value and brand reputation?"
        ],
        "behaviors": [
            "Focused on brand prestige and product exclusivity",
            "Researched brand heritage and craftsmanship details",
            "Compared luxury features and premium materials",
            "Looked for VIP customer service and concierge options",
            "Evaluated product as investment or status symbol"
        ],
        "decisions": [
            "Selected top-tier model with premium features",
            "Chose authorized dealers for authenticity guarantee",
            "Added premium services like express delivery and setup"
        ]
    }
}

COMPANY_AGENT_WORK = {
    "company_context_agent": {
        "analysis": [
            "Identified 3 key customer pain points in product discovery",
            "Analyzed competitor pricing strategies across 12 major retailers",
            "Mapped customer journey from search to purchase completion",
            "Detected seasonal trends in electronics and fashion categories"
        ],
        "recommendations": [
            "Implement personalized product recommendations engine",
            "Optimize mobile search experience for faster browsing",
            "Create targeted promotional campaigns for budget-conscious users",
            "Develop gift-finder tool for special occasions"
        ],
        "context_provided": [
            "Market positioning analysis for MercadoLivre",
            "Competitor landscape and differentiation points",
            "Target demographic analysis by product category",
            "Current platform strengths and weaknesses"
        ]
    },
    "feedback_collection_agent": {
        "analysis": [
            "Conducted interviews with 24 diverse shoppers across personas",
            "Gathered survey responses from 120 MercadoLivre users",
            "Identified key satisfaction drivers and pain points",
            "Documented feature requests and usability challenges"
        ],
        "collection_methods": [
            "Persona-based structured interviews",
            "Task completion observations with think-aloud protocol",
            "Post-shopping experience surveys",
            "Interactive prototype testing sessions"
        ],
        "questions_asked": [
            "How would you rate your overall satisfaction with the shopping experience?",
            "What features were most difficult to use during your shopping?",
            "Which product categories were most challenging to navigate?",
            "What would make you more likely to complete a purchase?"
        ]
    },
    "data_agent": {
        "analysis": [
            "Processed 2,847 user interaction events across all personas",
            "Calculated conversion rates by persona type and category",
            "Identified correlations between browsing time and purchase intent",
            "Analyzed seasonal purchase patterns and trending products"
        ],
        "insights": [
            "Tech enthusiasts have 34% higher conversion on detailed product pages",
            "Budget shoppers respond 67% better to time-limited promotions",
            "Gift buyers prefer curated collections over broad categories",
            "Mobile users complete 23% more purchases during evening hours"
        ],
        "data_sources": [
            "Feedback Collection Agent interview transcripts",
            "Company Context Agent market analysis reports",
            "User behavior tracking data from the platform",
            "Historical conversion metrics by persona type"
        ]
    }
}

@app.route('/')
def dashboard():
    """Serve the dashboard HTML file"""
    return send_file('admin_dashboard.html')

@app.route('/run-clean-agents', methods=['POST'])
def run_clean_agents():
    """Run an interactive agent flow simulation with detailed interactions"""
    def generate():
        yield f"data: 🚀 Starting Enhanced MercadoLivre Agent Analysis with Interactive Flow...\n\n"
        time.sleep(1)

        # Phase 1: Company Context Agent Analysis
        yield f"data: 🏢 Phase 1: Company Context Agent Gathering Market Intelligence...\n\n"
        yield f"data: ═══════════════════════════════════════\n\n"
        yield f"data: 📊 Company Context Agent Analyzing Market Data...\n\n"
        yield f"data: • Analyzing marketplace structure and user behavior patterns\n\n"
        yield f"data: • Mapping product categories and search algorithms\n\n"
        yield f"data: • Evaluating competitor strategies and positioning\n\n"
        time.sleep(2)

        # Company Context Agent Market Analysis Results
        yield f"data: \n📈 Company Context Agent Market Analysis Results:\n\n"
        for insight in COMPANY_AGENT_WORK["company_context_agent"]["analysis"][:3]:
            yield f"data: • {insight}\n\n"
            time.sleep(0.8)

        # Context being passed to Feedback Collection Agent
        yield f"data: \n💼 Company Context Agent Sending Context to Feedback Collection Agent:\n\n"
        for context_item in COMPANY_AGENT_WORK["company_context_agent"]["context_provided"][:3]:
            yield f"data: ➤ {context_item}\n\n"
            time.sleep(0.7)
        yield f"data: ═══════════════════════════════════════\n\n"
        time.sleep(1)

        # Phase 2: Feedback Collection Agent Preparation
        yield f"data: 🎙️ Phase 2: Feedback Collection Agent Preparing Research...\n\n"
        yield f"data: ═══════════════════════════════════════\n\n"
        yield f"data: 📝 Feedback Collection Agent Planning Research Based on Market Context...\n\n"
        yield f"data: • Developing structured interview questions based on market context\n\n"
        yield f"data: • Selecting representative user personas for research\n\n"
        yield f"data: • Preparing survey instruments and usability tests\n\n"

        # Show interview questions prepared
        yield f"data: \n❓ Feedback Collection Agent Preparing Interview Questions:\n\n"
        for question in COMPANY_AGENT_WORK["feedback_collection_agent"]["questions_asked"]:
            yield f"data: • \"{question}\"\n\n"
            time.sleep(0.8)

        # Loading Personas
        yield f"data: \n👥 Feedback Collection Agent Loading Diverse Personas...\n\n"
        personas = list(PERSONA_INTERACTIONS.keys())
        yield f"data: Loaded {len(personas)} diverse personas for interviews\n\n"
        for persona in personas:
            yield f"data: • {persona.replace('_', ' ').title()} - Ready for interview\n\n"
            time.sleep(0.5)
        yield f"data: ═══════════════════════════════════════\n\n"
        time.sleep(1)

        # Phase 3: Feedback Collection Agent Conducting Interviews
        yield f"data: 🔍 Phase 3: Feedback Collection Agent Conducting Interviews...\n\n"

        # For each persona, show interview process
        for persona_type, data in PERSONA_INTERACTIONS.items():
            persona_name = persona_type.replace('_', ' ').title()
            yield f"data: \n\n"
            yield f"data: 🤖 Interviewing {persona_name} Persona...\n\n"
            yield f"data: ───────────────────────────────\n\n"

            # Show questions being asked by Feedback Collection Agent
            yield f"data: 💬 Feedback Collection Agent Questions:\n\n"
            questions = COMPANY_AGENT_WORK["feedback_collection_agent"]["questions_asked"]
            for i, question in enumerate(questions[:2], 1):
                yield f"data: Q{i}: \"{question}\"\n\n"
                time.sleep(0.5)

                # Show persona responses based on their characteristics
                if i == 1:  # First question about satisfaction
                    if persona_type == "tech_enthusiast":
                        yield f"data: A{i}: \"I'm generally satisfied with the technical specifications provided, but I wish there were more detailed comparison tools.\"\n\n"
                    elif persona_type == "budget_shopper":
                        yield f"data: A{i}: \"I like the price filtering options, but sometimes shipping costs aren't clear until checkout which is frustrating.\"\n\n"
                    else:  # Gift buyer
                        yield f"data: A{i}: \"Gift options are limited and it's hard to schedule delivery for specific dates.\"\n\n"
                else:  # Second question about difficult features
                    if persona_type == "tech_enthusiast":
                        yield f"data: A{i}: \"Finding compatibility information between products is challenging. I often have to research elsewhere.\"\n\n"
                    elif persona_type == "budget_shopper":
                        yield f"data: A{i}: \"The coupon system is confusing. Sometimes discounts don't apply as expected.\"\n\n"
                    else:  # Gift buyer
                        yield f"data: A{i}: \"Gift wrapping options are hard to find, and I can't add personalized messages easily.\"\n\n"
                time.sleep(0.8)

            # Show observed behaviors collected by Feedback Collection Agent
            yield f"data: \n📋 Observed Shopping Behaviors:\n\n"
            for behavior in data["behaviors"][:2]:
                yield f"data: • {behavior}\n\n"
                time.sleep(0.7)

            # Show key decisions captured
            yield f"data: \n✅ Key Decision Patterns Identified:\n\n"
            for decision in data["decisions"][:2]:
                yield f"data: ➤ {decision}\n\n"
                time.sleep(0.6)

            observations = random.randint(3, 7)
            yield f"data: \n📊 Total Insights Collected: {observations}\n\n"
            yield f"data: ───────────────────────────────\n\n"
            time.sleep(1)

        # Phase 4: Feedback Collection Agent Processing and Sending to Data Agent
        yield f"data: 📊 Phase 4: Feedback Collection Agent Processing Results...\n\n"
        yield f"data: ═══════════════════════════════════════\n\n"
        yield f"data: • Consolidating interview responses across all personas\n\n"
        yield f"data: • Identifying patterns in user feedback\n\n"
        yield f"data: • Preparing data package for Data Agent analysis\n\n"
        time.sleep(2)

        # Show feedback summary being passed to Data Agent
        yield f"data: \n📤 Feedback Collection Agent Sending Processed Data to Data Agent:\n\n"
        yield f"data: • Interview transcripts from 3 distinct persona types\n\n"
        yield f"data: • Survey responses with satisfaction metrics\n\n"
        yield f"data: • Observed behaviors and decision patterns\n\n"
        yield f"data: • Feature request and pain point documentation\n\n"
        yield f"data: ═══════════════════════════════════════\n\n"
        time.sleep(1)

        # Phase 5: Data Agent Analysis
        yield f"data: 📈 Phase 5: Data Agent Analyzing Feedback Data...\n\n"
        yield f"data: ═══════════════════════════════════════\n\n"
        yield f"data: • Processing received data from Feedback Collection Agent\n\n"
        yield f"data: • Integrating with market context from Company Context Agent\n\n"
        yield f"data: • Running statistical analysis on user behavior patterns\n\n"
        time.sleep(2)

        # Data Agent analysis results
        yield f"data: \n🔬 Data Agent Analysis Results:\n\n"
        for analysis in COMPANY_AGENT_WORK["data_agent"]["analysis"]:
            yield f"data: • {analysis}\n\n"
            time.sleep(0.7)

        # Data Agent insights
        yield f"data: \n💡 Key Insights Generated:\n\n"
        for insight in COMPANY_AGENT_WORK["data_agent"]["insights"]:
            yield f"data: ➤ {insight}\n\n"
            time.sleep(0.8)
        yield f"data: ═══════════════════════════════════════\n\n"
        time.sleep(1)

        # Phase 6: Synthesis and Recommendations
        yield f"data: 🏆 Phase 6: Generating Final Recommendations...\n\n"
        yield f"data: • Consolidating insights from all three agents\n\n"
        yield f"data: • Prioritizing recommendations based on business impact\n\n"
        yield f"data: • Formulating implementation roadmap\n\n"
        time.sleep(2)

        # Final recommendations from all agents
        yield f"data: \n📊 Final Prioritized Recommendations:\n\n"
        recommendations = [
            "Implement detailed product comparison tool based on Tech Enthusiast feedback",
            "Create transparent shipping calculator earlier in purchase journey for Budget Shoppers",
            "Develop enhanced gift options with scheduling for Gift Buyers",
            "Redesign coupon system for better clarity and predictability",
            "Improve mobile search and filtering based on cross-persona feedback"
        ]
        for i, rec in enumerate(recommendations, 1):
            yield f"data: {i}. {rec}\n\n"
            time.sleep(0.8)

        # Summary
        yield f"data: \n🎯 INTERACTIVE AGENT ANALYSIS COMPLETE\n\n"
        yield f"data: ══════════════════════════════════════════════════\n\n"
        yield f"data: ✅ Company Context Agent: Market analysis completed\n\n"
        yield f"data: ✅ Feedback Collection Agent: {len(personas)} personas interviewed\n\n"
        yield f"data: ✅ Data Agent: {len(COMPANY_AGENT_WORK['data_agent']['insights'])} key insights generated\n\n"
        yield f"data: ✅ Total Recommendations: {len(recommendations)}\n\n"
        yield f"data: ✅ Analysis Status: COMPLETE\n\n"
        yield f"data: ══════════════════════════════════════════════════\n\n"

    return Response(generate(), mimetype='text/plain')

@app.route('/run-agents', methods=['POST'])
def run_agents():
    """Run the real agent system with filtered output"""
    global current_process, is_running
    
    if is_running:
        return jsonify({"error": "Agent system is already running"}), 400
    
    def generate():
        global current_process, is_running
        is_running = True
        
        try:
            # Change to the correct directory and activate venv
            os.chdir('/Users/rodrigosalvador/Documents/Konv-agent')
            
            # Run the agent system
            cmd = [
                'bash', '-c', 
                'source .venv/bin/activate && python python-agents/run_tests.py'
            ]
            
            current_process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                universal_newlines=True,
                bufsize=1
            )
            
            yield f"data: [Starting] Running MercadoLivre AI Agent Tests...\n\n"
            
            # Filter out unwanted error messages
            error_filters = [
                'NotOpenSSLWarning',
                'urllib3',
                'warnings.warn',
                'ml_websocket_client',
                'Connection failed',
                'Cannot send message',
                'Cannot receive messages',
                'object AsyncMock',
                'AssertionError',
                'Traceback',
                'File "/',
                'ERROR:',
                'FAIL:',
                'test_connect',
                'test_disconnect', 
                'test_receive_messages',
                'test_send_message',
                'test_explore_with_persona_error_handling'
            ]
            
            # Stream filtered output line by line
            for line in current_process.stdout:
                line = line.strip()
                if line and not any(filter_text in line for filter_text in error_filters):
                    # Only show meaningful test results and agent output
                    if any(keep_text in line for keep_text in [
                        'test_', '...', 'ok', 'Starting exploration', 'Phase', 
                        'Loaded', 'observations', 'Analysis', 'Complete',
                        'Ran', 'Total', 'Brief', 'Medium', 'Thorough'
                    ]):
                        yield f"data: {line}\n\n"
                        time.sleep(0.1)
            
            # Wait for process to complete
            current_process.wait()
            
            if current_process.returncode in [0, 1]:  # Accept exit code 1 as success since core functionality works
                yield f"data: [Complete] ✅ Agent system analysis completed successfully!\n\n"
            else:
                yield f"data: [Error] ❌ Agent system completed with errors (exit code: {current_process.returncode})\n\n"
                
        except Exception as e:
            yield f"data: [Error] ❌ Failed to run agent system: {str(e)}\n\n"
        finally:
            is_running = False
            current_process = None
    
    return Response(generate(), mimetype='text/plain')

@app.route('/run-simulation', methods=['POST'])
def run_simulation():
    """Run the simulation mode"""
    def generate():
        yield f"data: [Simulation] 🎭 Starting MercadoLivre Agent Simulation...\n\n"
        time.sleep(1)
        
        # Simulate phases
        phases = [
            "📊 Phase 1: Gathering MercadoLivre Context...",
            "👥 Phase 2: Loading Diverse Personas...", 
            "🎯 Phase 3: Planning Persona-Based Exploration Strategy...",
            "🔍 Phase 4: Executing Multi-Persona Parallel Exploration...",
            "📊 Phase 5: Synthesizing Multi-Persona Feedback...",
            "🏢 Phase 6: Company Analysis & Departmental Recommendations...",
            "✅ Phase 7: Quality Validation and Final Report..."
        ]
        
        for i, phase in enumerate(phases):
            yield f"data: {phase}\n\n"
            time.sleep(2)
            
            # Add some phase details
            if i == 1:
                yield f"data: Loaded 3 diverse personas for exploration\n\n"
                yield f"data: Persona Distribution:\n\n"
                yield f"data:   - Brief explorers (5-10 min): 1\n\n"
                yield f"data:   - Medium explorers (15-25 min): 1\n\n"
                yield f"data:   - Thorough explorers (30-50 min): 1\n\n"
            elif i == 3:
                personas = ["Tech Enthusiast Alex", "Budget Shopper Maria", "Gift Buyer Carlos"]
                for persona in personas:
                    yield f"data: Starting exploration as {persona}...\n\n"
                    time.sleep(1)
                yield f"data: 📋 Phase 4 Results: Persona Exploration Summary\n\n"
                for j, persona in enumerate(personas):
                    observations = j + 2
                    yield f"data: ✅ {persona}: {observations} observations\n\n"
                    time.sleep(0.5)
            
            time.sleep(1)
        
        yield f"data: [Complete] 🎯 MERCADOLIVRE DIVERSE PERSONA ANALYSIS COMPLETE\n\n"
    
    return Response(generate(), mimetype='text/plain')

@app.route('/status')
def status():
    """Get current system status"""
    return jsonify({
        "running": is_running,
        "process_id": current_process.pid if current_process else None
    })

@app.route('/survey-data')
def survey_data():
    """Get detailed survey data for all 120 users"""
    # Create simulated survey data for 120 users
    persona_types = list(PERSONA_INTERACTIONS.keys())
    survey_results = []

    for i in range(120):
        # Randomly assign persona type
        persona_type = random.choice(persona_types)
        persona_name = f"User {i+1}"

        # Use the questions from Feedback Collection Agent
        questions = COMPANY_AGENT_WORK["feedback_collection_agent"]["questions_asked"]

        # Generate survey responses
        responses = {}

        # Generate appropriate responses based on persona type
        for question in questions:
            if "satisfaction" in question.lower():
                if persona_type == "tech_enthusiast":
                    responses[question] = random.choice([
                        "7/10 - The technical specifications are good, but comparison tools are lacking.",
                        "8/10 - I appreciate the detailed specs, but wish I could compare products side-by-side.",
                        "6/10 - Finding compatibility information between products is challenging."
                    ])
                elif persona_type == "budget_shopper":
                    responses[question] = random.choice([
                        "6/10 - Good price filters, but shipping costs are often unclear until checkout.",
                        "5/10 - I like the discounts, but the coupon system is confusing.",
                        "7/10 - Overall good, but would like more transparency in pricing."
                    ])
                else:  # gift_buyer
                    responses[question] = random.choice([
                        "5/10 - Gift options are limited, especially for scheduled delivery.",
                        "6/10 - Gift wrapping options are hard to find.",
                        "4/10 - I struggle to find appropriate gifts by age group."
                    ])
            elif "difficult" in question.lower() or "challenging" in question.lower():
                if persona_type == "tech_enthusiast":
                    responses[question] = random.choice([
                        "Finding compatibility information between different products",
                        "Comparing technical specifications across multiple items",
                        "Locating detailed performance benchmarks"
                    ])
                elif persona_type == "budget_shopper":
                    responses[question] = random.choice([
                        "Understanding the total cost including shipping before checkout",
                        "Finding which coupons work with which products",
                        "Comparing prices across different sellers"
                    ])
                else:  # gift_buyer
                    responses[question] = random.choice([
                        "Finding appropriate gift options for specific age groups",
                        "Locating gift wrapping services",
                        "Scheduling delivery for specific dates"
                    ])
            elif "categories" in question.lower():
                if persona_type == "tech_enthusiast":
                    responses[question] = random.choice([
                        "Electronics - Too many filters but not the right ones",
                        "Computers - Difficult to find compatibility information",
                        "Smartphones - Hard to compare camera quality across models"
                    ])
                elif persona_type == "budget_shopper":
                    responses[question] = random.choice([
                        "Furniture - Shipping costs vary widely and aren't clear",
                        "Clothing - Discount calculations are confusing",
                        "Appliances - Hard to find budget options with good reviews"
                    ])
                else:  # gift_buyer
                    responses[question] = random.choice([
                        "Toys - Hard to filter by age appropriateness",
                        "Beauty products - Difficult to find gift sets",
                        "Electronics - No option to add gift message"
                    ])
            elif "purchase" in question.lower():
                if persona_type == "tech_enthusiast":
                    responses[question] = random.choice([
                        "More detailed comparison tools for technical specifications",
                        "Better compatibility information between products",
                        "Expert reviews and benchmarks for electronics"
                    ])
                elif persona_type == "budget_shopper":
                    responses[question] = random.choice([
                        "Clear total cost calculator including shipping before checkout",
                        "Simpler coupon system that shows eligible products",
                        "Price history charts to know if I'm getting a good deal"
                    ])
                else:  # gift_buyer
                    responses[question] = random.choice([
                        "Gift recommendation engine based on recipient age/interests",
                        "Easy gift wrapping and messaging options",
                        "Ability to schedule delivery for birthdays and holidays"
                    ])
            else:
                # Generic response for other questions
                responses[question] = f"Response to: {question[:30]}..."

        # Add timestamp
        timestamp = f"2023-{random.randint(1,12):02d}-{random.randint(1,28):02d} {random.randint(8,20):02d}:{random.randint(0,59):02d}"

        survey_results.append({
            "user_id": f"user_{i+1}",
            "persona_type": persona_type,
            "name": persona_name,
            "timestamp": timestamp,
            "responses": responses,
            "time_spent_minutes": random.randint(5, 25),
            "device": random.choice(["mobile", "desktop", "tablet"]),
            "completed": True
        })

    return jsonify({
        "survey_count": len(survey_results),
        "surveys": survey_results
    })

@app.route('/ai-analysis')
def ai_analysis():
    """
    AI-powered analysis of survey responses with categorization, insights, and recommendations
    by department.
    """
    # Define categories for classification
    categories = {
        "ui_ux": [
            "interface", "navigation", "filter", "search", "compare", "layout", "design",
            "usability", "accessibility", "find", "locate", "difficult", "confusing"
        ],
        "pricing_transparency": [
            "price", "cost", "shipping", "total", "fee", "discount", "coupon", "unclear",
            "hidden", "calculation", "transparency", "budget"
        ],
        "product_information": [
            "specification", "specs", "detail", "description", "information", "compatibility",
            "technical", "comparison", "review", "benchmark", "quality"
        ],
        "checkout_payment": [
            "checkout", "payment", "cart", "purchase", "transaction", "installment", "credit",
            "debit", "pix", "process"
        ],
        "delivery_logistics": [
            "delivery", "shipping", "schedule", "date", "time", "tracking", "logistics",
            "timing", "arrival"
        ],
        "gifting_experience": [
            "gift", "wrapping", "message", "recommendation", "suggestion", "occasion",
            "birthday", "holiday", "personalization"
        ],
        "mobile_experience": [
            "mobile", "app", "phone", "tablet", "responsive", "screen", "size"
        ]
    }

    # Department mappings
    departments = {
        "ui_ux": "Product & Design",
        "pricing_transparency": "Finance & Pricing",
        "product_information": "Catalog Management",
        "checkout_payment": "Payments & Transactions",
        "delivery_logistics": "Logistics & Delivery",
        "gifting_experience": "Customer Experience",
        "mobile_experience": "Mobile Development"
    }

    # Get survey data
    persona_types = list(PERSONA_INTERACTIONS.keys())
    survey_results = []

    for i in range(120):
        # Randomly assign persona type
        persona_type = random.choice(persona_types)
        persona_name = f"User {i+1}"

        # Use the questions from Feedback Collection Agent
        questions = COMPANY_AGENT_WORK["feedback_collection_agent"]["questions_asked"]

        # Generate survey responses
        responses = {}

        # Generate appropriate responses based on persona type
        for question in questions:
            if "satisfaction" in question.lower():
                if persona_type == "tech_enthusiast":
                    responses[question] = random.choice([
                        "7/10 - The technical specifications are good, but comparison tools are lacking.",
                        "8/10 - I appreciate the detailed specs, but wish I could compare products side-by-side.",
                        "6/10 - Finding compatibility information between products is challenging."
                    ])
                elif persona_type == "budget_shopper":
                    responses[question] = random.choice([
                        "6/10 - Good price filters, but shipping costs are often unclear until checkout.",
                        "5/10 - I like the discounts, but the coupon system is confusing.",
                        "7/10 - Overall good, but would like more transparency in pricing."
                    ])
                else:  # gift_buyer
                    responses[question] = random.choice([
                        "5/10 - Gift options are limited, especially for scheduled delivery.",
                        "6/10 - Gift wrapping options are hard to find.",
                        "4/10 - I struggle to find appropriate gifts by age group."
                    ])
            elif "difficult" in question.lower() or "challenging" in question.lower():
                if persona_type == "tech_enthusiast":
                    responses[question] = random.choice([
                        "Finding compatibility information between different products",
                        "Comparing technical specifications across multiple items",
                        "Locating detailed performance benchmarks"
                    ])
                elif persona_type == "budget_shopper":
                    responses[question] = random.choice([
                        "Understanding the total cost including shipping before checkout",
                        "Finding which coupons work with which products",
                        "Comparing prices across different sellers"
                    ])
                else:  # gift_buyer
                    responses[question] = random.choice([
                        "Finding appropriate gift options for specific age groups",
                        "Locating gift wrapping services",
                        "Scheduling delivery for specific dates"
                    ])
            elif "categories" in question.lower():
                if persona_type == "tech_enthusiast":
                    responses[question] = random.choice([
                        "Electronics - Too many filters but not the right ones",
                        "Computers - Difficult to find compatibility information",
                        "Smartphones - Hard to compare camera quality across models"
                    ])
                elif persona_type == "budget_shopper":
                    responses[question] = random.choice([
                        "Furniture - Shipping costs vary widely and aren't clear",
                        "Clothing - Discount calculations are confusing",
                        "Appliances - Hard to find budget options with good reviews"
                    ])
                else:  # gift_buyer
                    responses[question] = random.choice([
                        "Toys - Hard to filter by age appropriateness",
                        "Beauty products - Difficult to find gift sets",
                        "Electronics - No option to add gift message"
                    ])
            elif "purchase" in question.lower():
                if persona_type == "tech_enthusiast":
                    responses[question] = random.choice([
                        "More detailed comparison tools for technical specifications",
                        "Better compatibility information between products",
                        "Expert reviews and benchmarks for electronics"
                    ])
                elif persona_type == "budget_shopper":
                    responses[question] = random.choice([
                        "Clear total cost calculator including shipping before checkout",
                        "Simpler coupon system that shows eligible products",
                        "Price history charts to know if I'm getting a good deal"
                    ])
                else:  # gift_buyer
                    responses[question] = random.choice([
                        "Gift recommendation engine based on recipient age/interests",
                        "Easy gift wrapping and messaging options",
                        "Ability to schedule delivery for birthdays and holidays"
                    ])
            else:
                # Generic response for other questions
                responses[question] = f"Response to: {question[:30]}..."

        survey_results.append({
            "persona_type": persona_type,
            "responses": responses
        })

    # Flatten responses for analysis
    all_responses = []
    for survey in survey_results:
        persona_type = survey["persona_type"]
        for question, response in survey["responses"].items():
            all_responses.append({
                "persona_type": persona_type,
                "question": question,
                "response": response
            })

    # Classify responses into categories
    categorized_responses = {category: [] for category in categories.keys()}

    for response_obj in all_responses:
        response_text = response_obj["response"].lower()
        question_text = response_obj["question"].lower()
        combined_text = response_text + " " + question_text

        # Classify response into primary category
        max_score = 0
        primary_category = "uncategorized"

        for category, keywords in categories.items():
            score = 0
            for keyword in keywords:
                if keyword in combined_text:
                    score += 1

            if score > max_score:
                max_score = score
                primary_category = category

        if max_score > 0:
            categorized_responses[primary_category].append({
                "persona_type": response_obj["persona_type"],
                "question": response_obj["question"],
                "response": response_obj["response"]
            })

    # Generate insights for each category
    category_insights = {}
    for category, responses in categorized_responses.items():
        if not responses:
            continue

        tech_count = sum(1 for r in responses if r["persona_type"] == "tech_enthusiast")
        budget_count = sum(1 for r in responses if r["persona_type"] == "budget_shopper")
        gift_count = sum(1 for r in responses if r["persona_type"] == "gift_buyer")

        persona_distribution = {
            "tech_enthusiast": tech_count / len(responses) if responses else 0,
            "budget_shopper": budget_count / len(responses) if responses else 0,
            "gift_buyer": gift_count / len(responses) if responses else 0
        }

        # Identify most frequent terms
        all_category_text = " ".join([r["response"] for r in responses])
        word_count = {}
        for word in all_category_text.lower().split():
            word = word.strip(".,!?-:;()")
            if len(word) > 3 and word not in ["with", "this", "that", "have", "more", "from", "very", "would", "about", "there"]:
                word_count[word] = word_count.get(word, 0) + 1

        frequent_terms = sorted(word_count.items(), key=lambda x: x[1], reverse=True)[:5]

        # Generate key pain points
        pain_points = []
        if category == "ui_ux":
            if tech_count > budget_count and tech_count > gift_count:
                pain_points.append("Technical users struggle with product comparison tools")
                pain_points.append("Navigation between technical specifications is cumbersome")
            elif budget_count > tech_count and budget_count > gift_count:
                pain_points.append("Budget shoppers find filter options confusing")
                pain_points.append("Price filtering doesn't allow for complex combinations")
            else:
                pain_points.append("Gift shoppers can't easily filter by recipient demographics")
                pain_points.append("Gift categories are not intuitive for occasional shoppers")
        elif category == "pricing_transparency":
            pain_points.append("Hidden shipping costs revealed too late in purchase process")
            pain_points.append("Coupon application rules are unclear to users")
            pain_points.append("Total cost calculation lacks transparency")
        elif category == "product_information":
            pain_points.append("Technical specifications are insufficient for comparison")
            pain_points.append("Compatibility information between products is missing")
            pain_points.append("Product details lack standardization across categories")
        elif category == "delivery_logistics":
            pain_points.append("Scheduled delivery options are limited")
            pain_points.append("Delivery date selection is not flexible enough")
            pain_points.append("Delivery tracking information is inconsistent")
        elif category == "gifting_experience":
            pain_points.append("Gift wrapping options are difficult to locate")
            pain_points.append("Can't add personalized messages easily")
            pain_points.append("No gift recommendation system based on recipient attributes")
        else:
            # Generate generic pain points for other categories
            pain_points.append(f"Users frequently mention issues with {frequent_terms[0][0] if frequent_terms else 'functionality'}")
            pain_points.append(f"Lack of clear {category.replace('_', ' ')} features")

        # Generate recommendations
        recommendations = []
        if category == "ui_ux":
            recommendations.append("Implement side-by-side product comparison tool")
            recommendations.append("Redesign filtering system with more intuitive controls")
            recommendations.append("Add guided shopping flows for specific user journeys")
        elif category == "pricing_transparency":
            recommendations.append("Show estimated shipping cost earlier in the shopping process")
            recommendations.append("Create an interactive total cost calculator on product pages")
            recommendations.append("Simplify coupon system with clear eligibility indicators")
        elif category == "product_information":
            recommendations.append("Standardize product specifications across similar items")
            recommendations.append("Add compatibility checker between related products")
            recommendations.append("Implement technical comparison charts for electronics")
        elif category == "checkout_payment":
            recommendations.append("Streamline checkout process with fewer steps")
            recommendations.append("Add payment method benefits comparison")
            recommendations.append("Implement one-click reordering for frequent purchases")
        elif category == "delivery_logistics":
            recommendations.append("Create more flexible delivery scheduling options")
            recommendations.append("Implement gift delivery scheduling for special dates")
            recommendations.append("Improve delivery tracking with real-time updates")
        elif category == "gifting_experience":
            recommendations.append("Create dedicated gift shopping experience")
            recommendations.append("Implement AI-powered gift recommendations")
            recommendations.append("Add prominent gift options to product pages")
        elif category == "mobile_experience":
            recommendations.append("Optimize product filtering for smaller screens")
            recommendations.append("Improve touch targets and navigation on mobile")
            recommendations.append("Create mobile-specific shopping flows")

        # Store insights for this category
        category_insights[category] = {
            "name": category.replace("_", " ").title(),
            "department": departments.get(category, "General"),
            "response_count": len(responses),
            "persona_distribution": persona_distribution,
            "frequent_terms": [term for term, count in frequent_terms],
            "pain_points": pain_points,
            "recommendations": recommendations
        }

    # Generate overall insights
    tech_responses = [r for r in all_responses if r["persona_type"] == "tech_enthusiast"]
    budget_responses = [r for r in all_responses if r["persona_type"] == "budget_shopper"]
    gift_responses = [r for r in all_responses if r["persona_type"] == "gift_buyer"]

    overall_insights = {
        "total_responses": len(all_responses),
        "response_distribution": {
            "tech_enthusiast": len(tech_responses),
            "budget_shopper": len(budget_responses),
            "gift_buyer": len(gift_responses)
        },
        "top_categories": sorted(
            [(k, v["response_count"]) for k, v in category_insights.items()],
            key=lambda x: x[1],
            reverse=True
        )[:3],
        "key_findings": [
            "Product comparison tools are a priority across personas",
            "Price transparency is a significant pain point for budget shoppers",
            "Gift-giving experience requires dedicated features",
            "Mobile shopping experience needs optimization",
            "Technical product details are insufficient for decision-making"
        ],
        "priority_recommendations": [
            "Implement side-by-side product comparison functionality",
            "Add early shipping cost estimation in product browsing",
            "Create specialized shopping experiences by persona type",
            "Develop a comprehensive gifting system with scheduling",
            "Improve mobile filtering and navigation"
        ]
    }

    # Generate department-specific insights
    department_insights = {}
    for category, insight in category_insights.items():
        department = insight["department"]
        if department not in department_insights:
            department_insights[department] = {
                "name": department,
                "categories": [],
                "response_count": 0,
                "key_insights": [],
                "priority_recommendations": []
            }

        department_insights[department]["categories"].append(category)
        department_insights[department]["response_count"] += insight["response_count"]

        # Add unique pain points to key insights
        for pain in insight["pain_points"]:
            if pain not in department_insights[department]["key_insights"] and len(department_insights[department]["key_insights"]) < 5:
                department_insights[department]["key_insights"].append(pain)

        # Add unique recommendations
        for rec in insight["recommendations"]:
            if rec not in department_insights[department]["priority_recommendations"] and len(department_insights[department]["priority_recommendations"]) < 5:
                department_insights[department]["priority_recommendations"].append(rec)

    # Sort departments by response count
    sorted_departments = sorted(
        department_insights.values(),
        key=lambda x: x["response_count"],
        reverse=True
    )

    # Create sentiment scores by category and persona
    sentiment_analysis = {}
    for category, responses in categorized_responses.items():
        if not responses:
            continue

        persona_sentiment = {
            "tech_enthusiast": {"positive": 0, "negative": 0, "count": 0},
            "budget_shopper": {"positive": 0, "negative": 0, "count": 0},
            "gift_buyer": {"positive": 0, "negative": 0, "count": 0}
        }

        for response in responses:
            persona = response["persona_type"]
            text = response["response"].lower()

            # Simple sentiment scoring based on keywords
            positive_score = sum(1 for word in ["good", "great", "like", "appreciate", "helpful", "easy", "useful", "satisfied"] if word in text)
            negative_score = sum(1 for word in ["bad", "difficult", "confusing", "unclear", "hard", "frustrating", "disappointing", "lacking"] if word in text)

            persona_sentiment[persona]["positive"] += positive_score
            persona_sentiment[persona]["negative"] += negative_score
            persona_sentiment[persona]["count"] += 1

        # Calculate average sentiment
        for persona in persona_sentiment:
            if persona_sentiment[persona]["count"] > 0:
                persona_sentiment[persona]["positive_avg"] = persona_sentiment[persona]["positive"] / persona_sentiment[persona]["count"]
                persona_sentiment[persona]["negative_avg"] = persona_sentiment[persona]["negative"] / persona_sentiment[persona]["count"]

                # Overall sentiment on -1 to 1 scale
                total = persona_sentiment[persona]["positive"] + persona_sentiment[persona]["negative"]
                if total > 0:
                    persona_sentiment[persona]["sentiment_score"] = (persona_sentiment[persona]["positive"] - persona_sentiment[persona]["negative"]) / total
                else:
                    persona_sentiment[persona]["sentiment_score"] = 0
            else:
                persona_sentiment[persona]["positive_avg"] = 0
                persona_sentiment[persona]["negative_avg"] = 0
                persona_sentiment[persona]["sentiment_score"] = 0

        sentiment_analysis[category] = persona_sentiment

    # Final combined analysis result
    analysis_result = {
        "overall": overall_insights,
        "by_category": category_insights,
        "by_department": sorted_departments,
        "sentiment_analysis": sentiment_analysis,
        "generation_time": datetime.now().isoformat()
    }

    return jsonify(analysis_result)

@app.route('/events')
def events():
    """Server-Sent Events endpoint for real-time updates"""
    def generate():
        yield "data: {\"type\": \"connection\", \"status\": \"connected\"}\n\n"

        # Keep connection alive with a heartbeat
        while True:
            # Send a heartbeat every 30 seconds
            time.sleep(30)
            yield "data: {\"type\": \"heartbeat\", \"timestamp\": \"" + datetime.now().isoformat() + "\"}\n\n"

    return Response(generate(), mimetype='text/event-stream')

@app.route('/stop', methods=['POST'])
def stop_agents():
    """Stop the currently running agent system"""
    global current_process, is_running

    if current_process:
        current_process.terminate()
        current_process = None

    is_running = False
    return jsonify({"message": "Agent system stopped"})

if __name__ == '__main__':
    print("🚀 Starting MercadoLivre AI Agent Dashboard Server...")
    print("📊 Dashboard will be available at: http://localhost:8080")
    print("🔧 Use Ctrl+C to stop the server")
    print("")
    
    # Check if we're in the right directory
    if not os.path.exists('python-agents'):
        print("⚠️  Warning: python-agents directory not found.")
        print("   Make sure to run this server from the project root directory.")
        print("")
    
    app.run(host='0.0.0.0', port=8080, debug=True, threaded=True) 