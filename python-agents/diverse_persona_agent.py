import asyncio
import json
import random
import time
from agents import Agent, function_tool, Runner, AgentResult

class DiversePersonaAgent(Agent):
    """
    A flexible agent that can assume different MercadoLivre shopper personas
    with variable exploration times and behaviors.
    """

    def __init__(self, persona_config=None):
        # Extract name and create instructions from persona data
        persona_name = persona_config.get('name', 'Generic Persona') if persona_config else 'Generic Persona'
        persona_type = persona_config.get('type', 'generic') if persona_config else 'generic'

        instructions = f"You are a {persona_type} shopper named {persona_name}. "
        instructions += "Explore MercadoLivre and provide feedback based on your persona characteristics."

        super().__init__(name=persona_name, instructions=instructions)
        self.persona = persona_config or {}
        self.exploration_time = self.persona.get('customization', {}).get(
            'custom_attributes', {}).get('exploration_time', 'medium')
        self.time_spent_minutes = int(self.persona.get('customization', {}).get(
            'custom_attributes', {}).get('time_spent_minutes', 20))
        
        # Set up tools
        self.tools = [
            self.browse_category,
            self.search_products,
            self.check_product_details,
            self.add_to_cart,
            self.checkout_process,
            self.analyze_marketplace
        ]
    
    async def run(self, prompt: str) -> AgentResult:
        """Run the agent with the given prompt"""
        return await Runner.run(self, prompt)

    @function_tool
    def browse_category(self, category: str) -> dict:
        """Simulates browsing a specific category on MercadoLivre"""
        # Simulate variable exploration time based on persona preferences
        exploration_seconds = self._calculate_exploration_time(base_time=2)
        time.sleep(exploration_seconds)
        
        return {
            "category": category,
            "time_spent_seconds": exploration_seconds,
            "products_viewed": random.randint(3, 10),
            "depth_of_exploration": "deep" if exploration_seconds > 3 else "shallow"
        }
    
    @function_tool
    def search_products(self, query: str) -> dict:
        """Simulates searching for products on MercadoLivre"""
        # Simulate variable exploration time based on persona preferences
        exploration_seconds = self._calculate_exploration_time(base_time=1.5)
        time.sleep(exploration_seconds)
        
        return {
            "query": query,
            "time_spent_seconds": exploration_seconds,
            "results_count": random.randint(5, 50),
            "depth_of_analysis": "detailed" if exploration_seconds > 2 else "basic"
        }
    
    @function_tool
    def check_product_details(self, product_id: str) -> dict:
        """Simulates examining a product's details page"""
        # Simulate variable exploration time based on persona preferences
        exploration_seconds = self._calculate_exploration_time(base_time=3)
        time.sleep(exploration_seconds)
        
        # Simulate different depth of review reading based on persona
        review_count = 0
        if self.exploration_time == "brief":
            review_count = random.randint(0, 2)
        elif self.exploration_time == "medium":
            review_count = random.randint(2, 8)
        else:  # lengthy
            review_count = random.randint(8, 20)
            
        return {
            "product_id": product_id,
            "time_spent_seconds": exploration_seconds,
            "specifications_examined": self.exploration_time != "brief",
            "reviews_read": review_count,
            "images_viewed": random.randint(1, 5)
        }
    
    @function_tool
    def add_to_cart(self, product_id: str) -> dict:
        """Simulates adding a product to cart"""
        # Simulate variable decision time based on persona preferences
        decision_time = self._calculate_exploration_time(base_time=1, variance=0.5)
        time.sleep(decision_time)
        
        return {
            "product_id": product_id,
            "time_to_decide_seconds": decision_time,
            "added_to_cart": True
        }
    
    @function_tool
    def checkout_process(self) -> dict:
        """Simulates going through checkout process"""
        # Different personas spend different amounts of time in checkout
        if self.exploration_time == "brief":
            checkout_time = random.uniform(1, 2)
        elif self.exploration_time == "medium":
            checkout_time = random.uniform(2, 4)
        else:  # lengthy
            checkout_time = random.uniform(4, 8)
            
        time.sleep(checkout_time)
        
        return {
            "checkout_time_seconds": checkout_time,
            "payment_method": random.choice(self.persona.get('preferences', {}).get(
                'payment_preferences', ["credit", "debit", "pix"])),
            "detailed_review": self.exploration_time == "lengthy"
        }
    
    @function_tool
    def analyze_marketplace(self, focus_area: str) -> dict:
        """Performs analysis on a specific area of the marketplace"""
        # Thorough personas spend more time on analysis
        analysis_time = self._calculate_exploration_time(
            base_time=5, 
            multiplier=2 if self.exploration_time == "lengthy" else 1
        )
        time.sleep(analysis_time)
        
        analysis_depth = "surface"
        if self.exploration_time == "medium":
            analysis_depth = "moderate"
        elif self.exploration_time == "lengthy":
            analysis_depth = "comprehensive"
            
        return {
            "focus_area": focus_area,
            "analysis_time_seconds": analysis_time,
            "depth": analysis_depth,
            "insights_generated": random.randint(1, 3) if self.exploration_time == "brief" else 
                                  random.randint(3, 5) if self.exploration_time == "medium" else
                                  random.randint(5, 10)
        }
    
    def _calculate_exploration_time(self, base_time=1.0, variance=0.3, multiplier=1.0):
        """
        Calculates a simulated exploration time based on persona characteristics.
        
        Args:
            base_time: Base time in seconds
            variance: Random variance factor (reduced to ensure proper ordering)
            multiplier: Multiplier for specific activities
            
        Returns:
            Simulated time spent in seconds
        """
        # Scale based on persona's exploration preference
        if self.exploration_time == "brief":
            time_factor = 0.5
        elif self.exploration_time == "medium":
            time_factor = 1.0
        else:  # lengthy
            time_factor = 2.0
            
        # Add limited randomness to maintain proper ordering
        random_factor = random.uniform(1 - variance, 1 + variance)
        
        # Calculate final time (reduced for demo purposes)
        # In real implementation, we might use actual minutes
        return base_time * time_factor * random_factor * multiplier
    
    def get_persona_summary(self):
        """Returns a summary of the persona's exploration behavior"""
        return {
            "name": self.persona.get('name', 'Unknown Persona'),
            "type": self.persona.get('type', 'generic'),
            "exploration_style": self.exploration_time,
            "average_time_spent_minutes": self.time_spent_minutes,
            "key_characteristics": {
                "tech_savviness": self.persona.get('characteristics', {}).get('tech_savviness', 5),
                "price_sensitivity": self.persona.get('characteristics', {}).get('price_sensitivity', 5),
                "research_depth": self.persona.get('characteristics', {}).get('research_depth', 5),
                "decision_speed": self.persona.get('characteristics', {}).get('decision_speed', 5),
            }
        }

# Example persona configuration
example_persona = {
    "name": "Tech Researcher",
    "type": "tech_enthusiast",
    "characteristics": {
        "age_range": "25-34",
        "income_level": "high",
        "tech_savviness": 9,
        "price_sensitivity": 4,
        "research_depth": 8,
        "decision_speed": 4
    },
    "preferences": {
        "preferred_categories": ["electronics", "computers", "software"],
        "important_factors": ["quality", "specs", "price"],
        "payment_preferences": ["credit", "pix"]
    },
    "behaviors": {
        "shopping_frequency": "monthly",
        "average_session_duration": 35,
        "device_preference": "desktop",
        "social_influence": 3
    },
    "customization": {
        "custom_attributes": {
            "exploration_time": "lengthy",
            "time_spent_minutes": 35,
            "technical_specs_focused": True
        }
    }
}

# Create agent instance for export
agent = DiversePersonaAgent(example_persona)

# For testing
if __name__ == "__main__":
    # Test the agent with a simple run
    async def test_run():
        result = await agent.run("Explore MercadoLivre's electronics section and provide feedback")
        print(json.dumps(result, indent=2))
        
    asyncio.run(test_run())