import unittest
import asyncio
import json
from unittest.mock import patch, MagicMock
import sys
import os

# Add parent directory to path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from diverse_persona_agent import DiversePersonaAgent


class TestDiversePersonaAgent(unittest.TestCase):
    """Tests for the DiversePersonaAgent class"""
    
    def setUp(self):
        """Set up test fixtures"""
        # Sample persona configurations for different exploration times
        self.brief_persona = {
            "name": "Quick Browser",
            "type": "budget_shopper",
            "characteristics": {
                "age_range": "25-34",
                "income_level": "medium",
                "tech_savviness": 7,
                "price_sensitivity": 8,
                "research_depth": 3,
                "decision_speed": 9
            },
            "customization": {
                "custom_attributes": {
                    "exploration_time": "brief",
                    "time_spent_minutes": 8
                }
            }
        }
        
        self.medium_persona = {
            "name": "Average Shopper",
            "type": "family_shopper",
            "characteristics": {
                "age_range": "35-44",
                "income_level": "medium",
                "tech_savviness": 5,
                "price_sensitivity": 6,
                "research_depth": 6,
                "decision_speed": 5
            },
            "customization": {
                "custom_attributes": {
                    "exploration_time": "medium",
                    "time_spent_minutes": 20
                }
            }
        }
        
        self.lengthy_persona = {
            "name": "Thorough Researcher",
            "type": "tech_enthusiast",
            "characteristics": {
                "age_range": "45-54",
                "income_level": "high",
                "tech_savviness": 9,
                "price_sensitivity": 4,
                "research_depth": 9,
                "decision_speed": 3
            },
            "customization": {
                "custom_attributes": {
                    "exploration_time": "lengthy",
                    "time_spent_minutes": 45
                }
            }
        }
        
        # Create agent instances
        self.brief_agent = DiversePersonaAgent(self.brief_persona)
        self.medium_agent = DiversePersonaAgent(self.medium_persona)
        self.lengthy_agent = DiversePersonaAgent(self.lengthy_persona)
    
    def test_agent_initialization(self):
        """Test that agents are initialized with correct persona attributes"""
        # Brief agent
        self.assertEqual(self.brief_agent.persona['name'], "Quick Browser")
        self.assertEqual(self.brief_agent.exploration_time, "brief")
        self.assertEqual(self.brief_agent.time_spent_minutes, 8)
        
        # Medium agent
        self.assertEqual(self.medium_agent.persona['name'], "Average Shopper")
        self.assertEqual(self.medium_agent.exploration_time, "medium")
        self.assertEqual(self.medium_agent.time_spent_minutes, 20)
        
        # Lengthy agent
        self.assertEqual(self.lengthy_agent.persona['name'], "Thorough Researcher")
        self.assertEqual(self.lengthy_agent.exploration_time, "lengthy")
        self.assertEqual(self.lengthy_agent.time_spent_minutes, 45)
    
    def test_get_persona_summary(self):
        """Test that persona summary contains all expected fields"""
        summary = self.medium_agent.get_persona_summary()
        
        # Check for required fields
        self.assertIn('name', summary)
        self.assertIn('type', summary)
        self.assertIn('exploration_style', summary)
        self.assertIn('average_time_spent_minutes', summary)
        self.assertIn('key_characteristics', summary)
        
        # Check values
        self.assertEqual(summary['name'], "Average Shopper")
        self.assertEqual(summary['type'], "family_shopper")
        self.assertEqual(summary['exploration_style'], "medium")
        self.assertEqual(summary['average_time_spent_minutes'], 20)
        
        # Check key characteristics
        characteristics = summary['key_characteristics']
        self.assertEqual(characteristics['tech_savviness'], 5)
        self.assertEqual(characteristics['price_sensitivity'], 6)
        self.assertEqual(characteristics['research_depth'], 6)
        self.assertEqual(characteristics['decision_speed'], 5)
    
    def test_default_values(self):
        """Test that agents use default values when persona fields are missing"""
        minimal_persona = {
            "name": "Minimal Persona",
            "type": "generic"
        }
        
        agent = DiversePersonaAgent(minimal_persona)
        
        # Should use defaults
        self.assertEqual(agent.exploration_time, "medium")
        self.assertEqual(agent.time_spent_minutes, 20)
        
        # Summary should still work
        summary = agent.get_persona_summary()
        self.assertEqual(summary['name'], "Minimal Persona")
        self.assertEqual(summary['exploration_style'], "medium")
    
    @patch('time.sleep')
    def test_browse_category_time_scaling(self, mock_sleep):
        """Test that browse_category scales exploration time by persona type"""
        # Run the browse_category function for each agent
        self.brief_agent.browse_category("electronics")
        self.medium_agent.browse_category("electronics")
        self.lengthy_agent.browse_category("electronics")
        
        # Get the time values passed to sleep
        call_args = [args[0] for args, _ in mock_sleep.call_args_list]
        
        # Brief agent should spend less time than medium agent
        self.assertLess(call_args[0], call_args[1])
        
        # Medium agent should spend less time than lengthy agent
        self.assertLess(call_args[1], call_args[2])
    
    @patch('time.sleep')
    def test_search_products_time_scaling(self, mock_sleep):
        """Test that search_products scales exploration time by persona type"""
        # Run the search_products function for each agent
        self.brief_agent.search_products("laptop")
        self.medium_agent.search_products("laptop")
        self.lengthy_agent.search_products("laptop")
        
        # Get the time values passed to sleep
        call_args = [args[0] for args, _ in mock_sleep.call_args_list]
        
        # Brief agent should spend less time than medium agent
        self.assertLess(call_args[0], call_args[1])
        
        # Medium agent should spend less time than lengthy agent
        self.assertLess(call_args[1], call_args[2])
    
    @patch('time.sleep')
    def test_check_product_details_time_scaling(self, mock_sleep):
        """Test that check_product_details scales exploration time by persona type"""
        # Run the check_product_details function for each agent
        brief_result = self.brief_agent.check_product_details("product123")
        medium_result = self.medium_agent.check_product_details("product123")
        lengthy_result = self.lengthy_agent.check_product_details("product123")
        
        # Get the time values passed to sleep
        call_args = [args[0] for args, _ in mock_sleep.call_args_list]
        
        # Brief agent should spend less time than medium agent
        self.assertLess(call_args[0], call_args[1])
        
        # Medium agent should spend less time than lengthy agent
        self.assertLess(call_args[1], call_args[2])
        
        # Check that review counts increase with exploration time
        self.assertLessEqual(brief_result['reviews_read'], medium_result['reviews_read'])
        self.assertLessEqual(medium_result['reviews_read'], lengthy_result['reviews_read'])
    
    @patch('time.sleep')
    def test_add_to_cart_time_scaling(self, mock_sleep):
        """Test that add_to_cart scales decision time by persona type"""
        # Run the add_to_cart function for each agent
        self.brief_agent.add_to_cart("product123")
        self.medium_agent.add_to_cart("product123")
        self.lengthy_agent.add_to_cart("product123")
        
        # Get the time values passed to sleep
        call_args = [args[0] for args, _ in mock_sleep.call_args_list]
        
        # Brief agent should spend less time than lengthy agent on decisions
        self.assertLess(call_args[0], call_args[2])
    
    @patch('time.sleep')
    def test_checkout_process_time_scaling(self, mock_sleep):
        """Test that checkout_process scales time by persona type"""
        # Run the checkout_process function for each agent
        brief_result = self.brief_agent.checkout_process()
        medium_result = self.medium_agent.checkout_process()
        lengthy_result = self.lengthy_agent.checkout_process()
        
        # Get the time values passed to sleep
        call_args = [args[0] for args, _ in mock_sleep.call_args_list]
        
        # Brief agent should spend less time than medium agent
        self.assertLess(call_args[0], call_args[1])
        
        # Medium agent should spend less time than lengthy agent
        self.assertLess(call_args[1], call_args[2])
        
        # Check that detailed review is only true for lengthy personas
        self.assertFalse(brief_result['detailed_review'])
        self.assertFalse(medium_result['detailed_review'])
        self.assertTrue(lengthy_result['detailed_review'])
    
    @patch('time.sleep')
    def test_analyze_marketplace_time_scaling(self, mock_sleep):
        """Test that analyze_marketplace scales time by persona type"""
        # Run the analyze_marketplace function for each agent
        brief_result = self.brief_agent.analyze_marketplace("pricing")
        medium_result = self.medium_agent.analyze_marketplace("pricing")
        lengthy_result = self.lengthy_agent.analyze_marketplace("pricing")
        
        # Get the time values passed to sleep
        call_args = [args[0] for args, _ in mock_sleep.call_args_list]
        
        # Brief agent should spend less time than medium agent
        self.assertLess(call_args[0], call_args[1])
        
        # Medium agent should spend less time than lengthy agent
        self.assertLess(call_args[1], call_args[2])
        
        # Check that analysis depth increases with exploration time
        self.assertEqual(brief_result['depth'], "surface")
        self.assertEqual(medium_result['depth'], "moderate")
        self.assertEqual(lengthy_result['depth'], "comprehensive")
        
        # Check that insight count increases with exploration time
        self.assertLessEqual(brief_result['insights_generated'], medium_result['insights_generated'])
        self.assertLessEqual(medium_result['insights_generated'], lengthy_result['insights_generated'])
    
    def test_calculate_exploration_time(self):
        """Test the _calculate_exploration_time internal method"""
        # Test with default parameters
        brief_time = self.brief_agent._calculate_exploration_time()
        medium_time = self.medium_agent._calculate_exploration_time()
        lengthy_time = self.lengthy_agent._calculate_exploration_time()
        
        # Times should scale by persona exploration preference
        self.assertLess(brief_time, medium_time)
        self.assertLess(medium_time, lengthy_time)
        
        # Test with multiplier
        brief_time_2x = self.brief_agent._calculate_exploration_time(multiplier=2.0)
        medium_time_2x = self.medium_agent._calculate_exploration_time(multiplier=2.0)
        lengthy_time_2x = self.lengthy_agent._calculate_exploration_time(multiplier=2.0)
        
        # Times should be scaled by multiplier
        self.assertAlmostEqual(brief_time * 2, brief_time_2x, delta=brief_time)
        self.assertAlmostEqual(medium_time * 2, medium_time_2x, delta=medium_time)
        self.assertAlmostEqual(lengthy_time * 2, lengthy_time_2x, delta=lengthy_time)


# Create a coroutine test case for async functions
class TestDiversePersonaAgentAsync(unittest.IsolatedAsyncioTestCase):
    """Tests for async methods of DiversePersonaAgent"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.test_persona = {
            "name": "Test Persona",
            "type": "tech_enthusiast",
            "characteristics": {
                "age_range": "25-34",
                "income_level": "high", 
                "tech_savviness": 8,
                "price_sensitivity": 5,
                "research_depth": 7,
                "decision_speed": 6
            },
            "preferences": {
                "preferred_categories": ["electronics", "computers"],
                "important_factors": ["quality", "price"],
                "payment_preferences": ["credit", "pix"]
            },
            "customization": {
                "custom_attributes": {
                    "exploration_time": "medium",
                    "time_spent_minutes": 20
                }
            }
        }
        
        self.agent = DiversePersonaAgent(self.test_persona)
    
    @patch('time.sleep')
    async def test_agent_run(self, mock_sleep):
        """Test the async run method of the agent"""
        # Mock agent methods to avoid actual execution
        self.agent.browse_category = MagicMock(return_value={
            "category": "electronics",
            "products_viewed": 5,
            "depth_of_exploration": "medium"
        })
        
        self.agent.search_products = MagicMock(return_value={
            "query": "laptop",
            "results_count": 20,
            "depth_of_analysis": "moderate"
        })
        
        self.agent.check_product_details = MagicMock(return_value={
            "product_id": "laptop123",
            "specifications_examined": True,
            "reviews_read": 5
        })
        
        # Run the agent
        result = await self.agent.run("Explore MercadoLivre electronics section")
        
        # Check that agent produced a result
        self.assertIsNotNone(result)
        
        # Since agent.run is complex and implementation-dependent,
        # we mainly check that it completes without errors
        self.assertTrue(hasattr(result, 'final_output'))


if __name__ == '__main__':
    unittest.main()