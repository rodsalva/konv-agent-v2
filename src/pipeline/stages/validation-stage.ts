/**
 * Feedback Validation Stage
 * Validates incoming feedback data and formats it for processing
 */

import { PipelineStage, IPipelineStageContext, IPipelineStageOptions } from '@/pipeline/pipeline-stage';
import { IFeedbackSubmission, IFeedback, feedbackSubmissionSchema } from '@/types/feedback/feedback.types';
import { logger } from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class ValidationStage extends PipelineStage<IFeedbackSubmission, IFeedback> {
  constructor(options: IPipelineStageOptions = { name: 'ValidationStage' }) {
    super({ 
      name: options.name || 'ValidationStage',
      ...options 
    });
  }

  protected async execute(context: IPipelineStageContext<IFeedbackSubmission>): Promise<IFeedback> {
    const { data, metadata } = context;
    
    logger.debug('Validating feedback data', { correlationId: metadata.correlationId });
    
    try {
      // Validate against schema
      const validationResult = feedbackSubmissionSchema.safeParse(data);
      
      if (!validationResult.success) {
        const formattedError = validationResult.error.format();
        logger.warn('Feedback validation failed', { 
          errors: formattedError,
          correlationId: metadata.correlationId
        });
        
        throw new Error(`Validation failed: ${JSON.stringify(formattedError)}`);
      }
      
      // Generate ID if not provided
      const feedbackId = metadata.feedbackId as string || uuidv4();
      
      // Format validated feedback
      const validatedFeedback: IFeedback = {
        id: feedbackId,
        customer_agent_id: data.customer_agent_id,
        company_agent_id: data.company_agent_id,
        raw_feedback: {
          content: data.content,
          context: data.context,
          metadata: data.metadata || {}
        },
        feedback_type: data.feedback_type || 'general',
        status: 'raw',
        created_at: new Date().toISOString()
      };
      
      logger.debug('Feedback validation successful', { 
        feedbackId,
        correlationId: metadata.correlationId
      });
      
      return validatedFeedback;
    } catch (error) {
      logger.error('Error validating feedback', { 
        error, 
        correlationId: metadata.correlationId 
      });
      throw error;
    }
  }
}