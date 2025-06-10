/**
 * Feedback Enrichment Stage
 * Enriches feedback data with additional context and metadata
 */

import { PipelineStage, IPipelineStageContext, IPipelineStageOptions } from '@/pipeline/pipeline-stage';
import { IFeedback } from '@/types/feedback/feedback.types';
import { logger } from '@/utils/logger';
import { db } from '@/services/database';

export class EnrichmentStage extends PipelineStage<IFeedback, IFeedback> {
  constructor(options: IPipelineStageOptions = { name: 'EnrichmentStage' }) {
    super({ 
      name: options.name || 'EnrichmentStage',
      ...options 
    });
  }

  protected async execute(context: IPipelineStageContext<IFeedback>): Promise<IFeedback> {
    const { data, metadata } = context;
    const feedbackId = data.id as string;
    
    logger.debug('Enriching feedback data', { 
      feedbackId,
      correlationId: metadata.correlationId 
    });
    
    try {
      // Retrieve agent information for additional context
      const [customerAgent, companyAgent] = await Promise.all([
        db.getAgent(data.customer_agent_id),
        db.getAgent(data.company_agent_id)
      ]);
      
      // Add agent information to feedback context
      const enrichedFeedback: IFeedback = {
        ...data,
        raw_feedback: {
          ...data.raw_feedback,
          enrichment: {
            customerAgent: {
              name: customerAgent.name,
              type: customerAgent.type,
              capabilities: customerAgent.capabilities
            },
            companyAgent: {
              name: companyAgent.name,
              type: companyAgent.type,
              capabilities: companyAgent.capabilities
            },
            enrichmentTimestamp: new Date().toISOString()
          }
        }
      };
      
      // Determine feedback type if not explicitly set
      if (!data.feedback_type || data.feedback_type === 'general') {
        let detectedType = 'general';
        
        const content = data.raw_feedback.content as any;
        
        if (content.rating !== undefined) {
          detectedType = 'review';
          
          // Check if it's an NPS (Net Promoter Score) rating
          if (content.rating >= 0 && content.rating <= 10) {
            if (content.category === 'nps' || 
                (content.text && content.text.toLowerCase().includes('recommend'))) {
              detectedType = 'nps';
            }
          }
        } else if (content.category === 'support' || 
                  (content.text && 
                   (content.text.toLowerCase().includes('help') || 
                    content.text.toLowerCase().includes('issue') || 
                    content.text.toLowerCase().includes('problem')))) {
          detectedType = 'support_ticket';
        } else if (content.options && 
                  (content.options.surveyId || 
                   content.options.questionId || 
                   content.options.surveyName)) {
          detectedType = 'survey';
        }
        
        enrichedFeedback.feedback_type = detectedType;
      }
      
      // Update status to 'processed' since we're enriching
      enrichedFeedback.status = 'processed';
      
      logger.debug('Feedback enrichment successful', { 
        feedbackId,
        feedbackType: enrichedFeedback.feedback_type,
        correlationId: metadata.correlationId
      });
      
      return enrichedFeedback;
    } catch (error) {
      logger.error('Error enriching feedback', { 
        error, 
        feedbackId,
        correlationId: metadata.correlationId 
      });
      throw error;
    }
  }
}