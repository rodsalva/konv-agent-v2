import { v4 as uuidv4 } from 'uuid';
import { EventBus } from '../events/event-bus';
import { logger } from '../utils/logger';
import { db } from './database';
import { WebSocketService } from './websocket';
import {
  Persona,
  PersonaConfig,
  PersonaCreationResponse,
  PersonaID,
  PersonaInteraction,
  FeedbackRequest,
  FeedbackCollectionResponse,
  PersonaInsightsResponse,
  PersonaInsight
} from '../types/personas.types';

class PersonaRegistryService {
  private websocketService: WebSocketService | null = null;

  constructor(private eventBus: EventBus) {
    // Subscribe to relevant events
    this.eventBus.subscribe('persona.created', this.handlePersonaCreated.bind(this));
    this.eventBus.subscribe('persona.updated', this.handlePersonaUpdated.bind(this));
    this.eventBus.subscribe('persona.deleted', this.handlePersonaDeleted.bind(this));
  }

  /**
   * Initialize the service with dependencies
   */
  initialize(websocketService: WebSocketService): void {
    this.websocketService = websocketService;
    logger.info('PersonaRegistryService initialized');
  }

  /**
   * Register a new persona in the system
   */
  async registerPersona(personaConfig: PersonaConfig): Promise<PersonaCreationResponse> {
    try {
      const personaId = `persona_${uuidv4()}` as PersonaID;
      const now = new Date().toISOString();

      const newPersona: Persona = {
        ...personaConfig,
        persona_id: personaId,
        created_at: now,
        updated_at: now,
        is_active: true
      };

      // Store in database
      const { data, error } = await db.supabase
        .from('personas')
        .insert(newPersona)
        .select('persona_id, name, type, created_at')
        .single();

      if (error) {
        logger.error('Error creating persona', { error, personaConfig });
        throw new Error(`Failed to create persona: ${error.message}`);
      }

      // Emit event
      this.eventBus.publish('persona.created', { personaId, personaType: personaConfig.type });

      // Return creation response
      return {
        persona_id: personaId,
        name: data.name,
        type: data.type,
        created_at: data.created_at
      };
    } catch (error) {
      logger.error('Error in registerPersona', { error });
      throw error;
    }
  }

  /**
   * Get personas based on filter criteria
   */
  async getPersonas(filterCriteria: Record<string, unknown> = {}): Promise<Persona[]> {
    try {
      let query = db.supabase
        .from('personas')
        .select('*')
        .eq('is_active', true);

      // Apply filters if provided
      if (filterCriteria.type) {
        query = query.eq('type', filterCriteria.type);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching personas', { error, filterCriteria });
        throw new Error(`Failed to fetch personas: ${error.message}`);
      }

      return data as Persona[];
    } catch (error) {
      logger.error('Error in getPersonas', { error });
      throw error;
    }
  }

  /**
   * Update an existing persona
   */
  async updatePersona(personaId: PersonaID, updates: Partial<PersonaConfig>): Promise<boolean> {
    try {
      // Ensure the persona exists
      const { data: existingPersona, error: fetchError } = await db.supabase
        .from('personas')
        .select('*')
        .eq('persona_id', personaId)
        .single();

      if (fetchError || !existingPersona) {
        logger.error('Persona not found for update', { personaId, error: fetchError });
        throw new Error(`Persona not found: ${personaId}`);
      }

      // Apply updates
      const updatedPersona = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { error } = await db.supabase
        .from('personas')
        .update(updatedPersona)
        .eq('persona_id', personaId);

      if (error) {
        logger.error('Error updating persona', { error, personaId, updates });
        throw new Error(`Failed to update persona: ${error.message}`);
      }

      // Emit event
      this.eventBus.publish('persona.updated', { personaId });

      return true;
    } catch (error) {
      logger.error('Error in updatePersona', { error });
      throw error;
    }
  }

  /**
   * Delete a persona (soft delete)
   */
  async deletePersona(personaId: PersonaID): Promise<boolean> {
    try {
      // Soft delete by marking as inactive
      const { error } = await db.supabase
        .from('personas')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('persona_id', personaId);

      if (error) {
        logger.error('Error deleting persona', { error, personaId });
        throw new Error(`Failed to delete persona: ${error.message}`);
      }

      // Emit event
      this.eventBus.publish('persona.deleted', { personaId });

      return true;
    } catch (error) {
      logger.error('Error in deletePersona', { error });
      throw error;
    }
  }

  /**
   * Get persona interaction history
   */
  async getPersonaHistory(personaId: PersonaID): Promise<PersonaInteraction[]> {
    try {
      const { data, error } = await db.supabase
        .from('persona_interactions')
        .select('*')
        .eq('persona_id', personaId)
        .order('timestamp', { ascending: false });

      if (error) {
        logger.error('Error fetching persona history', { error, personaId });
        throw new Error(`Failed to fetch persona history: ${error.message}`);
      }

      return data as PersonaInteraction[];
    } catch (error) {
      logger.error('Error in getPersonaHistory', { error });
      throw error;
    }
  }

  /**
   * Collect feedback from a persona
   */
  async collectFeedback(
    personaId: PersonaID,
    feedbackRequest: FeedbackRequest
  ): Promise<FeedbackCollectionResponse> {
    try {
      // Ensure the persona exists
      const { data: persona, error: fetchError } = await db.supabase
        .from('personas')
        .select('*')
        .eq('persona_id', personaId)
        .single();

      if (fetchError || !persona) {
        logger.error('Persona not found for feedback collection', { personaId, error: fetchError });
        throw new Error(`Persona not found: ${personaId}`);
      }

      // Create a collection record
      const collectionId = `collection_${uuidv4()}`;
      const timestamp = new Date().toISOString();

      // In a real implementation, this would trigger an asynchronous process
      // to generate responses using AI models based on the persona profile
      // For now, we'll simulate this with a simple mock response
      
      // Record the interaction
      const interactionData = {
        interaction_id: collectionId,
        persona_id: personaId,
        platform: feedbackRequest.platform.name,
        timestamp,
        questions: feedbackRequest.questions,
        responses: feedbackRequest.questions.map(q => ({
          question_id: q.id,
          // Simple mock response based on persona type - in production this would be AI-generated
          answer: this.generateMockResponse(persona.type, q.category),
          sentiment: 'neutral',
          keywords: []
        })),
        metadata: {
          platform_url: feedbackRequest.platform.url,
          detail_level: feedbackRequest.settings?.detail_level || 'medium',
          focus_areas: feedbackRequest.settings?.focus_areas || []
        }
      };

      const { error } = await db.supabase
        .from('persona_interactions')
        .insert(interactionData);

      if (error) {
        logger.error('Error recording persona interaction', { error, personaId });
        throw new Error(`Failed to record interaction: ${error.message}`);
      }

      // Emit event
      this.eventBus.publish('feedback.collected', { 
        personaId, 
        collectionId,
        platform: feedbackRequest.platform.name
      });

      // In a real implementation, you might return a partial response first
      // and then update clients via WebSockets when the full responses are ready
      return {
        collection_id: collectionId,
        persona_id: personaId,
        platform: feedbackRequest.platform.name,
        timestamp,
        status: 'completed',
        responses: interactionData.responses.map(r => ({
          question_id: r.question_id,
          answer: r.answer
        }))
      };
    } catch (error) {
      logger.error('Error in collectFeedback', { error });
      throw error;
    }
  }

  /**
   * Get cross-persona insights
   */
  async getInsights(filters: Record<string, unknown> = {}): Promise<PersonaInsightsResponse> {
    try {
      // In a real implementation, this would query the insights table
      // and apply appropriate filters
      
      // For demo purposes, return mock insights
      return {
        insights: this.generateMockInsights(),
        total: 3,
        categories: {
          'user_experience': 1,
          'feature_request': 1,
          'pricing': 1
        }
      };
    } catch (error) {
      logger.error('Error in getInsights', { error });
      throw error;
    }
  }

  // Event handlers
  private handlePersonaCreated(data: { personaId: PersonaID, personaType: string }): void {
    logger.info('Persona created', { personaId: data.personaId, type: data.personaType });
    
    // Notify via WebSocket if available
    if (this.websocketService) {
      this.websocketService.broadcast('persona:created', {
        personaId: data.personaId,
        type: data.personaType,
        timestamp: new Date().toISOString()
      });
    }
  }

  private handlePersonaUpdated(data: { personaId: PersonaID }): void {
    logger.info('Persona updated', { personaId: data.personaId });
    
    // Notify via WebSocket if available
    if (this.websocketService) {
      this.websocketService.broadcast('persona:updated', {
        personaId: data.personaId,
        timestamp: new Date().toISOString()
      });
    }
  }

  private handlePersonaDeleted(data: { personaId: PersonaID }): void {
    logger.info('Persona deleted', { personaId: data.personaId });
    
    // Notify via WebSocket if available
    if (this.websocketService) {
      this.websocketService.broadcast('persona:deleted', {
        personaId: data.personaId,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Helper methods
  private generateMockResponse(personaType: string, category: string): string {
    // Simple mock responses based on persona type and question category
    // In production, these would be AI-generated based on the persona's characteristics
    const responses: Record<string, Record<string, string>> = {
      'tech_enthusiast': {
        'experience': 'The technical specifications are impressively detailed. I can filter products exactly as I need.',
        'features': 'The comparison tool is excellent - I can compare up to 4 devices side by side with all specs.',
        'comparison': 'Better than competitors for technical products due to the granular filtering options.',
        'discovery': 'I use the category filters extensively and set up price alerts for specific products.'
      },
      'budget_shopper': {
        'experience': 'The price comparison feature is incredibly helpful. I can see all costs upfront.',
        'features': 'The flash sales and PIX payment discounts provide excellent value.',
        'comparison': 'Superior to other platforms for deal hunting and discount visibility.',
        'discovery': 'I browse by highest discount percentage and use the wishlist price alerts.'
      },
      'gift_buyer': {
        'experience': 'The gift wrapping and direct shipping options are convenient for sending presents.',
        'features': 'I appreciate the gift guides for different occasions, but wish there were more options.',
        'comparison': 'Good but could be better compared to specialized gift platforms.',
        'discovery': 'I search by recipient demographics and use the trending gifts section.'
      },
      'default': {
        'experience': 'The platform offers a good shopping experience overall.',
        'features': 'There are many useful features, though some improvements could be made.',
        'comparison': 'Comparable to other e-commerce platforms with some strengths and weaknesses.',
        'discovery': 'I typically browse categories and use the search function.'
      }
    };

    return responses[personaType]?.[category] || responses['default'][category];
  }

  private generateMockInsights(): Array<PersonaInsight> {
    return [
      {
        insight_id: `insight_${uuidv4()}`,
        title: 'Product comparison tool needs improvement',
        description: 'Multiple personas struggle with identifying key differences between similar products.',
        personas: [
          {
            persona_id: 'persona_mock_tech' as PersonaID,
            relevance_score: 0.92,
            evidence: 'When comparing smartphones, the side-by-side view doesn\'t highlight the RAM difference visually.'
          },
          {
            persona_id: 'persona_mock_budget' as PersonaID,
            relevance_score: 0.78,
            evidence: 'Price differences in comparisons aren\'t visually emphasized enough.'
          }
        ],
        departments: ['product', 'engineering'],
        priority: 'high' as 'high',
        created_at: new Date().toISOString()
      },
      {
        insight_id: `insight_${uuidv4()}`,
        title: 'Price history feature highly requested',
        description: 'Budget shoppers want to see historical price data to validate discount claims.',
        personas: [
          {
            persona_id: 'persona_mock_budget' as PersonaID,
            relevance_score: 0.95,
            evidence: 'I\'d love a price history graph showing how prices fluctuated over time.'
          }
        ],
        departments: ['product', 'marketing'],
        priority: 'medium' as 'medium',
        created_at: new Date().toISOString()
      },
      {
        insight_id: `insight_${uuidv4()}`,
        title: 'Gift customization options needed',
        description: 'Gift buyers want more personalization options for presents.',
        personas: [
          {
            persona_id: 'persona_mock_gift' as PersonaID,
            relevance_score: 0.89,
            evidence: 'More gift customization options like engraving or custom photo prints would be amazing.'
          }
        ],
        departments: ['product', 'operations'],
        priority: 'medium' as 'medium',
        created_at: new Date().toISOString()
      }
    ];
  }
}

// Create and export service instance
export const personaService = new PersonaRegistryService(new EventBus());
export default personaService;