/**
 * Feedback API Routes
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/services/database';
import { logger } from '@/utils/logger';
import { agentAuthMiddleware } from '@/middleware/auth.middleware';
import { feedbackService } from '@/services/feedback';
import { feedbackSubmissionSchema, IFeedbackSubmission } from '@/types/feedback/feedback.types';

const router = Router();

/**
 * @route   POST /api/v1/feedback
 * @desc    Submit feedback
 * @access  Authenticated
 */
router.post('/', agentAuthMiddleware, async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validationResult = feedbackSubmissionSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationResult.error.format()
      });
    }
    
    const feedbackData = validationResult.data;
    
    // Ensure the authenticated agent is either the customer_agent_id or company_agent_id
    if (req.agent.id !== feedbackData.customer_agent_id && req.agent.id !== feedbackData.company_agent_id) {
      return res.status(403).json({
        success: false,
        error: 'You can only submit feedback as yourself or to yourself'
      });
    }
    
    // Process the feedback
    const result = await feedbackService.processFeedback(
      feedbackData as IFeedbackSubmission,
      req.correlationId
    );
    
    res.status(201).json({
      success: true,
      data: result,
      message: 'Feedback submitted successfully'
    });
  } catch (error) {
    logger.error('Failed to submit feedback', { 
      error, 
      correlationId: req.correlationId 
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to process feedback',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route   GET /api/v1/feedback/:id
 * @desc    Get feedback by ID
 * @access  Authenticated
 */
router.get('/:id', agentAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const feedback = await feedbackService.getFeedback(id);
    
    // Check if agent has access to this feedback
    if (req.agent.id !== feedback.customer_agent_id && 
        req.agent.id !== feedback.company_agent_id && 
        req.agent.type !== 'insight') {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to access this feedback'
      });
    }
    
    res.json({
      success: true,
      data: feedback
    });
  } catch (error) {
    logger.error('Failed to get feedback', { 
      error, 
      id: req.params.id, 
      correlationId: req.correlationId 
    });
    
    res.status(404).json({
      success: false,
      error: 'Feedback not found'
    });
  }
});

/**
 * @route   GET /api/v1/feedback
 * @desc    List feedback with optional filtering
 * @access  Authenticated
 */
router.get('/', agentAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { 
      status, 
      type, 
      customer_agent_id, 
      company_agent_id, 
      limit = '50', 
      offset = '0' 
    } = req.query;
    
    // Build query
    let query = db.getClient().from('feedback_data').select('*');
    
    // Ensure agent can only see feedback they're involved with unless they're an insight agent
    if (req.agent.type !== 'insight') {
      query = query.or(`customer_agent_id.eq.${req.agent.id},company_agent_id.eq.${req.agent.id}`);
    }
    
    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    
    if (type) {
      query = query.eq('feedback_type', type);
    }
    
    if (customer_agent_id) {
      query = query.eq('customer_agent_id', customer_agent_id);
    }
    
    if (company_agent_id) {
      query = query.eq('company_agent_id', company_agent_id);
    }
    
    // Apply pagination
    query = query
      .order('created_at', { ascending: false })
      .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);
    
    // Execute query
    const { data, error, count } = await query;
    
    if (error) {
      throw error;
    }
    
    // Get total count
    const { count: totalCount } = await db.getClient()
      .from('feedback_data')
      .select('*', { count: 'exact', head: true });
    
    res.json({
      success: true,
      data,
      total: totalCount || 0,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });
  } catch (error) {
    logger.error('Failed to list feedback', { 
      error, 
      correlationId: req.correlationId 
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to list feedback'
    });
  }
});

/**
 * @route   PUT /api/v1/feedback/:id/status
 * @desc    Update feedback status
 * @access  Authenticated (Company or Insight agents only)
 */
router.put('/:id/status', agentAuthMiddleware, async (req: Request, res: Response) => {
  try {
    // Only company or insight agents can update status
    if (req.agent.type !== 'company' && req.agent.type !== 'insight') {
      return res.status(403).json({
        success: false,
        error: 'Only company or insight agents can update feedback status'
      });
    }
    
    const { id } = req.params;
    
    // Validate request body
    const statusSchema = z.object({
      status: z.enum(['raw', 'processed', 'analyzed', 'archived'])
    });
    
    const validationResult = statusSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
        details: validationResult.error.format()
      });
    }
    
    const { status } = validationResult.data;
    
    // Update feedback status
    const feedback = await db.getFeedback(id);
    
    // Check if agent has access to this feedback
    if (req.agent.type !== 'insight' && 
        req.agent.id !== feedback.company_agent_id) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to update this feedback'
      });
    }
    
    // Update feedback
    const updatedFeedback = await db.getClient()
      .from('feedback_data')
      .update({ 
        status,
        processed_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    res.json({
      success: true,
      data: updatedFeedback.data,
      message: 'Feedback status updated successfully'
    });
  } catch (error) {
    logger.error('Failed to update feedback status', { 
      error, 
      id: req.params.id, 
      correlationId: req.correlationId 
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to update feedback status'
    });
  }
});

/**
 * @route   GET /api/v1/feedback/stats
 * @desc    Get feedback statistics
 * @access  Authenticated
 */
router.get('/stats', agentAuthMiddleware, async (req: Request, res: Response) => {
  try {
    // Build query for counts
    let query = db.getClient().from('feedback_data');
    
    // Ensure agent can only see feedback they're involved with unless they're an insight agent
    if (req.agent.type !== 'insight') {
      query = query.or(`customer_agent_id.eq.${req.agent.id},company_agent_id.eq.${req.agent.id}`);
    }
    
    // Count by status
    const { data: statusCounts, error: statusError } = await query
      .select('status')
      .then(result => {
        const counts: Record<string, number> = { 
          raw: 0, 
          processed: 0, 
          analyzed: 0, 
          archived: 0 
        };
        
        result.data?.forEach(item => {
          const status = item.status as string;
          counts[status] = (counts[status] || 0) + 1;
        });
        
        return { data: counts };
      });
    
    if (statusError) {
      throw statusError;
    }
    
    // Count by type
    const { data: typeCounts, error: typeError } = await query
      .select('feedback_type')
      .then(result => {
        const counts: Record<string, number> = {};
        
        result.data?.forEach(item => {
          const type = item.feedback_type as string || 'unknown';
          counts[type] = (counts[type] || 0) + 1;
        });
        
        return { data: counts };
      });
    
    if (typeError) {
      throw typeError;
    }
    
    // Get sentiment distribution
    const { data: sentimentData, error: sentimentError } = await query
      .select('sentiment_score')
      .then(result => {
        let positive = 0;
        let neutral = 0;
        let negative = 0;
        let noSentiment = 0;
        
        result.data?.forEach(item => {
          const score = item.sentiment_score as number | null;
          
          if (score === null) {
            noSentiment++;
          } else if (score > 0.2) {
            positive++;
          } else if (score < -0.2) {
            negative++;
          } else {
            neutral++;
          }
        });
        
        return { 
          data: { 
            positive, 
            neutral, 
            negative, 
            noSentiment,
            total: positive + neutral + negative + noSentiment
          } 
        };
      });
    
    if (sentimentError) {
      throw sentimentError;
    }
    
    res.json({
      success: true,
      data: {
        byStatus: statusCounts,
        byType: typeCounts,
        bySentiment: sentimentData
      }
    });
  } catch (error) {
    logger.error('Failed to get feedback stats', { 
      error, 
      correlationId: req.correlationId 
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get feedback statistics'
    });
  }
});

export default router;