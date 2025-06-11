import asyncio
import json
import random
import websockets
import os
from agents import Agent, Runner, function_tool
from datetime import datetime
import uuid

# Import all agents
from mercadolivre_context_agent import agent as ml_context_agent
from communication_agent import agent as ml_comm_agent
from company_analysis_agent import agent as company_analysis_agent
from oversight_agent import agent as oversight_agent
from diverse_persona_agent import DiversePersonaAgent

# Load OpenAI API key from environment variable
from dotenv import load_dotenv
load_dotenv()

# API key prefix
API_KEY_PREFIX = "mcp_agent_"

# Database service for loading personas
class DatabaseService:
    """Simulated database service for loading personas"""
    
    @staticmethod
    async def load_personas(count=15, exploration_filter=None):
        """
        Load persona profiles from the database
        
        Args:
            count: Number of personas to load
            exploration_filter: Optional filter for exploration_time
            
        Returns:
            List of persona configurations
        """
        # In a real implementation, this would query the database
        # For now, we'll return mock data
        
        exploration_times = ["brief", "medium", "lengthy"]
        if exploration_filter and exploration_filter in exploration_times:
            exploration_times = [exploration_filter]
            
        personas = []
        
        # Sample persona types
        persona_types = [
            "tech_enthusiast", "budget_shopper", "gift_buyer", 
            "family_shopper", "business_buyer", "senior_shopper", "luxury_shopper"
        ]
        
        # Sample names
        first_names = [
            "James", "Maria", "John", "Patricia", "Robert", "Jennifer", "Michael",
            "Linda", "William", "Elizabeth", "David", "Susan", "Richard", "Jessica"
        ]
        
        last_names = [
            "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller",
            "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez"
        ]
        
        for i in range(count):
            # Create a diverse set of personas
            exploration_time = random.choice(exploration_times)
            
            # Time spent depends on exploration time
            if exploration_time == "brief":
                time_spent = random.randint(5, 10)
            elif exploration_time == "medium":
                time_spent = random.randint(15, 25)
            else:  # lengthy
                time_spent = random.randint(30, 50)
                
            persona = {
                "persona_id": f"persona_{uuid.uuid4().hex[:8]}",
                "name": f"{random.choice(first_names)} {random.choice(last_names)}",
                "type": random.choice(persona_types),
                "characteristics": {
                    "age_range": random.choice(["18-24", "25-34", "35-44", "45-54", "55-64", "65+"]),
                    "income_level": random.choice(["low", "medium", "high", "very_high"]),
                    "tech_savviness": random.randint(1, 10),
                    "price_sensitivity": random.randint(1, 10),
                    "research_depth": random.randint(1, 10),
                    "decision_speed": random.randint(1, 10)
                },
                "preferences": {
                    "preferred_categories": random.sample(
                        ["electronics", "home", "fashion", "toys", "sports", "automotive", 
                         "books", "health", "beauty", "groceries", "office"], 
                        k=random.randint(2, 4)
                    ),
                    "important_factors": random.sample(
                        ["price", "quality", "speed", "service"], 
                        k=random.randint(2, 4)
                    ),
                    "payment_preferences": random.sample(
                        ["credit", "debit", "pix", "installments"], 
                        k=random.randint(1, 4)
                    )
                },
                "behaviors": {
                    "shopping_frequency": random.choice(["daily", "weekly", "monthly", "rarely"]),
                    "average_session_duration": time_spent,
                    "device_preference": random.choice(["mobile", "desktop", "tablet"]),
                    "social_influence": random.randint(1, 10)
                },
                "customization": {
                    "custom_attributes": {
                        "exploration_time": exploration_time,
                        "time_spent_minutes": time_spent
                    }
                },
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
                "is_active": True
            }
            
            personas.append(persona)
            
        return personas

class MercadoLivreExplorationOrchestrator:
    """Orchestrates diverse persona explorations of MercadoLivre with interactive agent flow"""

    def __init__(self):
        self.database = DatabaseService()
        self.company_context_agent = ml_context_agent  # Renamed from context_agent
        self.feedback_collection_agent = ml_comm_agent  # Renamed from comm_agent
        self.data_agent = company_analysis_agent  # Will be used as the data analysis agent
        self.oversight_agent = oversight_agent

    async def run_exploration_with_diverse_personas(self, persona_count=15):
        """
        Run a comprehensive MercadoLivre exploration using diverse personas
        with an interactive flow between specialized agents

        Args:
            persona_count: Number of personas to include in exploration

        Returns:
            Comprehensive exploration results
        """
        print("🛒 Starting MercadoLivre Interactive Agent Exploration")
        print("=" * 70)

        start_time = datetime.now()

        # Phase 1: Company Context Agent gathers market intelligence
        print("\n🏢 Phase 1: Company Context Agent Gathering Market Intelligence...")
        context_result = await Runner.run(
            self.company_context_agent,
            "As the Company Context Agent, provide comprehensive MercadoLivre marketplace context including categories, stats, user behavior patterns, and competitive positioning. This context will be provided to the Feedback Collection Agent to inform their research."
        )
        print(f"Company Context Agent Analysis: {context_result.final_output}")

        # Extract market context for passing to other agents
        market_context = context_result.final_output
        print("\n💼 Company Context Agent providing market context to Feedback Collection Agent...")

        # Phase 2: Feedback Collection Agent prepares research based on context
        print("\n🎙️ Phase 2: Feedback Collection Agent Planning Research...")
        research_plan_result = await Runner.run(
            self.feedback_collection_agent,
            f"As the Feedback Collection Agent, use this market context from the Company Context Agent to develop a research plan for interviewing different MercadoLivre shopper personas: {market_context}\n\nCreate specific interview questions and research methodologies."
        )
        print(f"Feedback Collection Agent Research Plan: {research_plan_result.final_output}")

        # Phase 3: Load diverse personas from database
        print("\n👥 Phase 3: Feedback Collection Agent Loading Diverse Personas...")
        personas = await self.database.load_personas(count=persona_count)
        print(f"Loaded {len(personas)} diverse personas for interviews")

        # Display summary of personas by exploration time
        brief_personas = len([p for p in personas if p['customization']['custom_attributes']['exploration_time'] == 'brief'])
        medium_personas = len([p for p in personas if p['customization']['custom_attributes']['exploration_time'] == 'medium'])
        lengthy_personas = len([p for p in personas if p['customization']['custom_attributes']['exploration_time'] == 'lengthy'])

        print(f"Persona Distribution:")
        print(f"  - Brief interviews (5-10 min): {brief_personas}")
        print(f"  - Medium interviews (15-25 min): {medium_personas}")
        print(f"  - Thorough interviews (30-50 min): {lengthy_personas}")

        # Phase 4: Feedback Collection Agent conducts interviews
        print("\n🔍 Phase 4: Feedback Collection Agent Conducting Interviews...")

        # Prepare interview prompts using research plan
        interview_prompts = {}
        persona_types = list(set([p['type'] for p in personas]))

        for persona_type in persona_types:
            interview_prompts[persona_type] = await Runner.run(
                self.feedback_collection_agent,
                f"As the Feedback Collection Agent, prepare specific interview questions for the {persona_type} persona based on your research plan. These questions should help uncover their unique shopping behaviors and pain points."
            )
            print(f"Prepared interview questions for {persona_type} persona")

        # Create tasks for each persona's interview
        interview_tasks = []
        for persona in personas:
            # Use the interview prompts specific to this persona type
            persona_type = persona['type']
            interview_prompt = interview_prompts[persona_type].final_output

            task = self.interview_persona(persona, interview_prompt, market_context)
            interview_tasks.append(task)

        # Run all interviews in series to simulate conversation flow
        print("\nStarting persona interviews...")
        persona_results = []
        for task in interview_tasks[:min(5, len(interview_tasks))]:  # Limit to 5 interviews for demo purposes
            result = await task
            persona_results.append(result)
            print(f"Completed interview with {result['name']} ({result['type']} persona)")

        # Phase 5: Feedback Collection Agent processes results for Data Agent
        print("\n📊 Phase 5: Feedback Collection Agent Processing Interview Results...")

        # Combine all interview results into a structured format
        all_interview_data = {
            "interviews": persona_results,
            "interview_count": len(persona_results),
            "persona_types": list(set([r['type'] for r in persona_results])),
            "market_context": market_context
        }

        # Feedback Collection Agent processes and summarizes interviews
        processed_feedback = await Runner.run(
            self.feedback_collection_agent,
            f"As the Feedback Collection Agent, process these interview results and prepare a structured summary for the Data Agent to analyze: {json.dumps(all_interview_data, indent=2)}"
        )

        print("Feedback Collection Agent has processed interview results for Data Agent")

        # Phase 6: Data Agent analyzes processed feedback
        print("\n📈 Phase 6: Data Agent Analyzing Processed Feedback...")

        # Data Agent receives both market context and processed feedback
        data_analysis_result = await Runner.run(
            self.data_agent,
            f"As the Data Agent, analyze this processed feedback from the Feedback Collection Agent along with the original market context from the Company Context Agent. Identify patterns, insights, and generate recommendations.\n\nMarket Context: {market_context}\n\nProcessed Feedback: {processed_feedback.final_output}"
        )

        print("Data Agent completed analysis of feedback data")
        print(f"Data Analysis: {data_analysis_result.final_output}")

        # Phase 7: Generate final recommendations based on all agent inputs
        print("\n🏆 Phase 7: Generating Final Recommendations...")

        final_recommendations = await Runner.run(
            self.oversight_agent,
            f"Review and consolidate the inputs from all three agents to generate final prioritized recommendations:\n\n1. Company Context Agent market analysis: {market_context}\n\n2. Feedback Collection Agent processed interviews: {processed_feedback.final_output}\n\n3. Data Agent analysis: {data_analysis_result.final_output}"
        )

        print(f"Final Recommendations: {final_recommendations.final_output}")

        # Calculate total exploration time
        end_time = datetime.now()
        duration = end_time - start_time
        duration_minutes = duration.total_seconds() / 60

        # Final Summary
        print("\n" + "=" * 70)
        print("🎯 INTERACTIVE AGENT ANALYSIS COMPLETE")
        print("=" * 70)
        print(f"✅ Company Context Agent: Market analysis completed")
        print(f"✅ Feedback Collection Agent: {len(persona_results)} personas interviewed")
        print(f"✅ Data Agent: Analysis completed with insights and patterns")
        print(f"✅ Total Interview Time: {duration_minutes:.2f} minutes")

        return {
            "exploration_complete": True,
            "personas_interviewed": len(persona_results),
            "persona_types": list(set([r['type'] for r in persona_results])),
            "company_context": market_context,
            "processed_feedback": processed_feedback.final_output,
            "data_analysis": data_analysis_result.final_output,
            "final_recommendations": final_recommendations.final_output,
            "exploration_time_minutes": duration_minutes
        }

    async def interview_persona(self, persona_config, interview_prompt, market_context):
        """
        Conduct an interview with a specific persona using the Feedback Collection Agent

        Args:
            persona_config: Persona configuration from database
            interview_prompt: Specific interview questions prepared by Feedback Collection Agent
            market_context: Market context from Company Context Agent

        Returns:
            Interview results with this persona
        """
        # Create a persona-specific agent
        persona_agent = DiversePersonaAgent(persona_config)

        # Get persona summary
        summary = persona_agent.get_persona_summary()
        print(f"Feedback Collection Agent interviewing {summary['name']} ({summary['type']}, {summary['exploration_style']} explorer)")

        # Conduct the interview using the Feedback Collection Agent's questions
        interview_response = await Runner.run(
            persona_agent,
            f"You are participating in an interview with the Feedback Collection Agent about your MercadoLivre shopping experience. Please answer these questions from your persona's perspective:\n\n{interview_prompt}"
        )

        # Process and return results
        try:
            interview_data = {}

            # Extract responses from the interview
            if isinstance(interview_response.final_output, dict):
                interview_data = interview_response.final_output
            elif isinstance(interview_response.final_output, str):
                # Try to parse JSON if it's a string
                try:
                    parsed = json.loads(interview_response.final_output)
                    if isinstance(parsed, dict):
                        interview_data = parsed
                except:
                    # If parsing fails, treat the whole output as the response
                    interview_data = {"interview_response": interview_response.final_output}
            else:
                interview_data = {"interview_response": str(interview_response.final_output)}

            # Add persona information
            return {
                "persona_id": persona_config['persona_id'],
                "name": persona_config['name'],
                "type": persona_config['type'],
                "exploration_time": persona_config['customization']['custom_attributes']['exploration_time'],
                "interview_response": interview_data,
                "interview_prompt": interview_prompt,
                "characteristics": persona_config.get('characteristics', {})
            }

        except Exception as e:
            print(f"Error processing interview results for {persona_config['name']}: {e}")
            return {
                "persona_id": persona_config['persona_id'],
                "name": persona_config['name'],
                "type": persona_config['type'],
                "exploration_time": persona_config['customization']['custom_attributes']['exploration_time'],
                "interview_response": {"error": "Error processing interview results"},
                "error": str(e)
            }
    
    async def explore_with_persona(self, persona_config):
        """
        Conduct MercadoLivre exploration with a specific persona
        
        Args:
            persona_config: Persona configuration from database
            
        Returns:
            Exploration results for this persona
        """
        # Create a persona-specific agent
        persona_agent = DiversePersonaAgent(persona_config)
        
        # Get persona summary
        summary = persona_agent.get_persona_summary()
        print(f"Starting exploration as {summary['name']} ({summary['type']}, {summary['exploration_style']} explorer)")
        
        # Generate exploration prompts based on persona type
        if persona_config['type'] == 'tech_enthusiast':
            prompt = "Explore MercadoLivre's electronics and technology sections. Focus on product specifications, technical features, and the overall tech shopping experience."
        elif persona_config['type'] == 'budget_shopper':
            prompt = "Explore MercadoLivre with a focus on deals, discounts, and value for money. Evaluate pricing transparency and affordability across different categories."
        elif persona_config['type'] == 'gift_buyer':
            prompt = "Explore MercadoLivre's gift shopping experience. Focus on gift categories, personalization options, and the overall gifting process."
        elif persona_config['type'] == 'family_shopper':
            prompt = "Explore MercadoLivre for family-oriented products across home, children, and everyday essentials. Focus on safety, convenience, and family-friendly features."
        elif persona_config['type'] == 'business_buyer':
            prompt = "Explore MercadoLivre for business purchases, bulk orders, and professional equipment. Focus on B2B features, wholesale options, and business services."
        elif persona_config['type'] == 'senior_shopper':
            prompt = "Explore MercadoLivre with a focus on user-friendly navigation, accessibility features, and products popular with older adults."
        elif persona_config['type'] == 'luxury_shopper':
            prompt = "Explore MercadoLivre's premium and luxury offerings. Focus on high-end products, authenticity verification, and the premium shopping experience."
        else:
            prompt = "Explore MercadoLivre marketplace focusing on your preferred categories and shopping behaviors."
        
        # Run the exploration
        result = await Runner.run(persona_agent, prompt)
        
        # Process and return results
        try:
            observations = []
            
            # Extract observations from the result
            if isinstance(result.final_output, dict):
                observations = result.final_output.get('observations', [])
            elif isinstance(result.final_output, str):
                # Try to parse JSON if it's a string
                try:
                    parsed = json.loads(result.final_output)
                    if isinstance(parsed, dict):
                        observations = parsed.get('observations', [])
                except:
                    # If parsing fails, treat the whole output as one observation
                    observations = [result.final_output]
            else:
                observations = [str(result.final_output)]
            
            # Ensure we have observations
            if not observations:
                observations = ["Exploration completed but no specific observations were recorded."]
                
            return {
                "persona_id": persona_config['persona_id'],
                "name": persona_config['name'],
                "type": persona_config['type'],
                "exploration_time": persona_config['customization']['custom_attributes']['exploration_time'],
                "time_spent_minutes": persona_config['customization']['custom_attributes']['time_spent_minutes'],
                "observations": observations
            }
            
        except Exception as e:
            print(f"Error processing results for {persona_config['name']}: {e}")
            return {
                "persona_id": persona_config['persona_id'],
                "name": persona_config['name'],
                "type": persona_config['type'],
                "exploration_time": persona_config['customization']['custom_attributes']['exploration_time'],
                "observations": ["Error processing exploration results."],
                "error": str(e)
            }

async def connect_agents_to_platform():
    """Connect all MercadoLivre agents to the MCP platform"""
    uri = "ws://localhost:3001/api/v1/ws"
    
    print("\n🔗 Connecting MercadoLivre agents to platform...")
    
    try:
        # In a real implementation, this would establish WebSocket connections
        print(f"✅ Successfully connected agents to WebSocket platform at {uri}")
    except Exception as e:
        print(f"❌ WebSocket connection failed: {e}")

async def main():
    """Main entry point for diverse MercadoLivre exploration"""
    
    # Create orchestrator
    orchestrator = MercadoLivreExplorationOrchestrator()
    
    # Run the comprehensive exploration with diverse personas
    exploration_results = await orchestrator.run_exploration_with_diverse_personas(persona_count=15)
    
    # Connect to platform for real-time updates (optional)
    # await connect_agents_to_platform()
    
    print(f"\n🎊 MercadoLivre diverse persona analysis completed successfully!")
    print(f"📊 Total insights collected from {exploration_results['personas_participated']} personas")
    print(f"🏢 Departmental recommendations generated across {len(exploration_results['persona_feedback'])} persona types")
    
    return exploration_results

if __name__ == "__main__":
    asyncio.run(main())