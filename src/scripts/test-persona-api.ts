/**
 * Test script for the Persona API
 * 
 * This script demonstrates the creation and use of personas through the Persona API.
 * It creates three persona types, collects feedback, and displays the results.
 */

import axios from 'axios';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

const API_URL = `http://localhost:${process.env.PORT || 3001}/api/v1`;

// Test creating and using personas
async function testPersonaAPI() {
  try {
    logger.info('Starting Persona API test...');

    // Create Tech Enthusiast Persona
    const techPersona = await createPersona({
      name: 'Tech Enthusiast',
      type: 'tech_enthusiast',
      characteristics: {
        age_range: '25-34',
        income_level: 'high',
        tech_savviness: 9,
        price_sensitivity: 5,
        research_depth: 8,
        decision_speed: 6
      },
      preferences: {
        preferred_categories: ['electronics', 'computers', 'gadgets', 'smart home'],
        avoided_categories: ['clothing', 'furniture'],
        important_factors: ['quality', 'speed'],
        payment_preferences: ['credit', 'pix']
      },
      behaviors: {
        shopping_frequency: 'weekly',
        average_session_duration: 45,
        device_preference: 'desktop',
        social_influence: 6
      }
    });

    // Create Budget Shopper Persona
    const budgetPersona = await createPersona({
      name: 'Budget Shopper',
      type: 'budget_shopper',
      characteristics: {
        age_range: '35-44',
        income_level: 'medium',
        tech_savviness: 6,
        price_sensitivity: 9,
        research_depth: 7,
        decision_speed: 4
      },
      preferences: {
        preferred_categories: ['home', 'electronics', 'groceries'],
        avoided_categories: ['luxury'],
        important_factors: ['price', 'quality'],
        payment_preferences: ['pix', 'installments']
      },
      behaviors: {
        shopping_frequency: 'weekly',
        average_session_duration: 30,
        device_preference: 'mobile',
        social_influence: 7
      }
    });

    // Create Gift Buyer Persona
    const giftPersona = await createPersona({
      name: 'Gift Buyer',
      type: 'gift_buyer',
      characteristics: {
        age_range: '35-44',
        income_level: 'high',
        tech_savviness: 5,
        price_sensitivity: 4,
        research_depth: 6,
        decision_speed: 5
      },
      preferences: {
        preferred_categories: ['gifts', 'jewelry', 'home decor', 'electronics'],
        avoided_categories: [],
        important_factors: ['quality', 'service'],
        payment_preferences: ['credit', 'installments']
      },
      behaviors: {
        shopping_frequency: 'monthly',
        average_session_duration: 25,
        device_preference: 'mobile',
        social_influence: 8
      }
    });

    logger.info('Created 3 personas successfully', {
      techPersonaId: techPersona.persona_id,
      budgetPersonaId: budgetPersona.persona_id,
      giftPersonaId: giftPersona.persona_id
    });

    // List all personas
    const personas = await listPersonas();
    logger.info(`Retrieved ${personas.length} personas`);

    // Collect feedback from each persona
    await collectPersonaFeedback(techPersona.persona_id);
    await collectPersonaFeedback(budgetPersona.persona_id);
    await collectPersonaFeedback(giftPersona.persona_id);

    // Get insights across personas
    const insights = await getInsights();
    logger.info(`Generated ${insights.length} cross-persona insights`);
    
    logger.info('Persona API test completed successfully!');
  } catch (error) {
    logger.error('Error in Persona API test', { error });
  }
}

// Helper function to create a persona
async function createPersona(personaConfig: any) {
  try {
    const response = await axios.post(`${API_URL}/personas/create`, personaConfig);
    logger.info(`Created persona: ${personaConfig.name}`, {
      personaId: response.data.data.persona_id
    });
    return response.data.data;
  } catch (error) {
    logger.error('Error creating persona', { error, name: personaConfig.name });
    throw error;
  }
}

// Helper function to list all personas
async function listPersonas() {
  try {
    const response = await axios.get(`${API_URL}/personas/list`);
    return response.data.data.personas;
  } catch (error) {
    logger.error('Error listing personas', { error });
    throw error;
  }
}

// Helper function to collect feedback from a persona
async function collectPersonaFeedback(personaId: string) {
  try {
    // Sample feedback request for MercadoLivre
    const feedbackRequest = {
      platform: {
        name: 'MercadoLivre',
        url: 'https://www.mercadolivre.com.br',
        context: {
          section: 'electronics'
        }
      },
      questions: [
        {
          id: 'q1',
          text: 'What specific features on MercadoLivre do you find most valuable for your shopping needs?',
          category: 'experience'
        },
        {
          id: 'q2',
          text: 'How would you rate the user experience and navigation compared to other e-commerce platforms?',
          category: 'comparison'
        },
        {
          id: 'q3',
          text: 'What improvements would you suggest to enhance your shopping experience on MercadoLivre?',
          category: 'features'
        },
        {
          id: 'q4',
          text: 'How do you typically discover new products and deals on the platform?',
          category: 'discovery'
        }
      ],
      settings: {
        detail_level: 'high',
        focus_areas: ['ux', 'search', 'pricing']
      }
    };

    const response = await axios.post(
      `${API_URL}/personas/${personaId}/collect`,
      feedbackRequest
    );

    logger.info(`Collected feedback from persona`, {
      personaId,
      collectionId: response.data.data.collection_id
    });

    return response.data.data;
  } catch (error) {
    logger.error('Error collecting feedback', { error, personaId });
    throw error;
  }
}

// Helper function to get insights across personas
async function getInsights() {
  try {
    const response = await axios.get(`${API_URL}/personas/insights`);
    return response.data.data.insights;
  } catch (error) {
    logger.error('Error getting insights', { error });
    throw error;
  }
}

// Run the test
if (require.main === module) {
  testPersonaAPI();
}