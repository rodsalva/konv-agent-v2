import unittest
import asyncio
import json
import sys
import os
from unittest.mock import patch, MagicMock, AsyncMock
from datetime import datetime

# Add parent directory to path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from diverse_mercadolivre_orchestrator import (
    MercadoLivreExplorationOrchestrator, 
    DatabaseService
)

class TestDatabaseService(unittest.IsolatedAsyncioTestCase):
    """Tests for the DatabaseService class"""
    
    async def test_load_personas_count(self):
        """Test that load_personas returns the correct number of personas"""
        # Test with default count
        personas = await DatabaseService.load_personas()
        self.assertEqual(len(personas), 15)
        
        # Test with specific count
        personas = await DatabaseService.load_personas(count=5)
        self.assertEqual(len(personas), 5)
    
    async def test_load_personas_filter(self):
        """Test that load_personas applies exploration_time filter correctly"""
        # Test with brief filter
        personas = await DatabaseService.load_personas(exploration_filter="brief")
        for persona in personas:
            self.assertEqual(
                persona['customization']['custom_attributes']['exploration_time'], 
                "brief"
            )
        
        # Test with medium filter
        personas = await DatabaseService.load_personas(exploration_filter="medium")
        for persona in personas:
            self.assertEqual(
                persona['customization']['custom_attributes']['exploration_time'], 
                "medium"
            )
        
        # Test with lengthy filter
        personas = await DatabaseService.load_personas(exploration_filter="lengthy")
        for persona in personas:
            self.assertEqual(
                persona['customization']['custom_attributes']['exploration_time'], 
                "lengthy"
            )
    
    async def test_personas_have_required_fields(self):
        """Test that generated personas have all required fields"""
        personas = await DatabaseService.load_personas(count=3)
        
        required_fields = [
            'persona_id', 'name', 'type', 'characteristics', 'preferences', 
            'behaviors', 'customization', 'created_at', 'updated_at', 'is_active'
        ]
        
        for persona in personas:
            for field in required_fields:
                self.assertIn(field, persona)
            
            # Check nested fields
            self.assertIn('exploration_time', persona['customization']['custom_attributes'])
            self.assertIn('time_spent_minutes', persona['customization']['custom_attributes'])


class TestMercadoLivreExplorationOrchestrator(unittest.IsolatedAsyncioTestCase):
    """Tests for the MercadoLivreExplorationOrchestrator class"""
    
    def setUp(self):
        """Set up test fixtures"""
        # Create orchestrator instance
        self.orchestrator = MercadoLivreExplorationOrchestrator()
        
        # Test personas
        self.test_personas = [
            {
                "persona_id": "persona_test1",
                "name": "Test Persona 1",
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
                "behaviors": {
                    "shopping_frequency": "monthly",
                    "average_session_duration": 30,
                    "device_preference": "desktop",
                    "social_influence": 4
                },
                "customization": {
                    "custom_attributes": {
                        "exploration_time": "medium",
                        "time_spent_minutes": 20
                    }
                },
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
                "is_active": True
            },
            {
                "persona_id": "persona_test2",
                "name": "Test Persona 2",
                "type": "budget_shopper",
                "characteristics": {
                    "age_range": "35-44",
                    "income_level": "medium",
                    "tech_savviness": 6,
                    "price_sensitivity": 8,
                    "research_depth": 5,
                    "decision_speed": 7
                },
                "preferences": {
                    "preferred_categories": ["home", "fashion"],
                    "important_factors": ["price", "service"],
                    "payment_preferences": ["credit", "installments"]
                },
                "behaviors": {
                    "shopping_frequency": "weekly",
                    "average_session_duration": 15,
                    "device_preference": "mobile",
                    "social_influence": 6
                },
                "customization": {
                    "custom_attributes": {
                        "exploration_time": "brief",
                        "time_spent_minutes": 8
                    }
                },
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
                "is_active": True
            }
        ]
    
    @patch('diverse_mercadolivre_orchestrator.DatabaseService.load_personas')
    @patch('diverse_mercadolivre_orchestrator.Runner.run')
    async def test_run_exploration_with_diverse_personas(self, mock_run, mock_load_personas):
        """Test the main exploration orchestration method"""
        # Mock database service to return test personas
        mock_load_personas.return_value = self.test_personas
        
        # Mock runner to return predictable results
        mock_result = MagicMock()
        mock_result.final_output = "Test output"
        mock_run.return_value = mock_result
        
        # Run the exploration with a small count for testing
        result = await self.orchestrator.run_exploration_with_diverse_personas(persona_count=2)
        
        # Check that exploration completed
        self.assertTrue(result['exploration_complete'])
        self.assertEqual(result['personas_participated'], 2)
        
        # Check that all expected phases were executed
        mock_load_personas.assert_called_once_with(count=2)
        
        # Runner.run should be called multiple times for different agents
        self.assertGreaterEqual(mock_run.call_count, 4)  # At least for context, comm, analysis, oversight
    
    @patch('diverse_mercadolivre_orchestrator.DiversePersonaAgent')
    @patch('diverse_mercadolivre_orchestrator.Runner.run')
    async def test_explore_with_persona(self, mock_run, mock_agent_class):
        """Test the persona-specific exploration method"""
        # Mock agent and runner
        mock_agent = MagicMock()
        mock_agent.get_persona_summary.return_value = {
            "name": "Test Persona",
            "type": "tech_enthusiast",
            "exploration_style": "medium"
        }
        mock_agent_class.return_value = mock_agent
        
        mock_result = MagicMock()
        mock_result.final_output = {
            "observations": [
                "Test observation 1",
                "Test observation 2"
            ]
        }
        mock_run.return_value = mock_result
        
        # Run exploration with a test persona
        result = await self.orchestrator.explore_with_persona(self.test_personas[0])
        
        # Check that agent was created with correct persona
        mock_agent_class.assert_called_once_with(self.test_personas[0])
        
        # Check that runner was called with correct prompt
        self.assertIn("tech", mock_run.call_args[0][1].lower())
        
        # Check result structure
        self.assertEqual(result['persona_id'], self.test_personas[0]['persona_id'])
        self.assertEqual(result['name'], self.test_personas[0]['name'])
        self.assertEqual(result['type'], self.test_personas[0]['type'])
        self.assertEqual(
            result['exploration_time'], 
            self.test_personas[0]['customization']['custom_attributes']['exploration_time']
        )
        self.assertEqual(len(result['observations']), 2)
    
    @patch('diverse_mercadolivre_orchestrator.DiversePersonaAgent')
    @patch('diverse_mercadolivre_orchestrator.Runner.run')
    async def test_explore_with_persona_error_handling(self, mock_run, mock_agent_class):
        """Test error handling in persona exploration"""
        # Mock agent
        mock_agent = MagicMock()
        mock_agent.get_persona_summary.return_value = {
            "name": "Test Persona",
            "type": "tech_enthusiast",
            "exploration_style": "medium"
        }
        mock_agent_class.return_value = mock_agent
        
        # Mock runner to raise exception
        mock_run.side_effect = Exception("Test error")
        
        # Run exploration with a test persona
        result = await self.orchestrator.explore_with_persona(self.test_personas[0])
        
        # Check that error was handled
        self.assertIn('error', result)
        self.assertEqual(result['error'], "Test error")
        self.assertEqual(len(result['observations']), 1)
        self.assertIn("Error", result['observations'][0])


if __name__ == '__main__':
    unittest.main()