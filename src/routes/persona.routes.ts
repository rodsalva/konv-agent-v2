import express from 'express';
import { z } from 'zod';
import { logger } from '../utils/logger';
import { personaService } from '../services/persona';
import { 
  PersonaConfigSchema, 
  FeedbackRequestSchema,
  PersonaID
} from '../types/personas.types';

const router = express.Router();

// Schema for ID param validation
const IdParamSchema = z.object({
  personaId: z.string().min(10)
});

// Schema for filter query validation
const FilterQuerySchema = z.object({
  type: z.string().optional(),
  is_active: z.enum(['true', 'false']).optional().transform(val => val === 'true'),
  limit: z.string().optional().transform(val => parseInt(val, 10)),
  offset: z.string().optional().transform(val => parseInt(val, 10)),
});

// POST /api/v1/personas/create - Create new persona
router.post('/create', async (req: express.Request, res: express.Response) => {
  try {
    // Validate request body
    const validationResult = PersonaConfigSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      logger.warn('Invalid persona creation request', { 
        errors: validationResult.error.format(),
        correlationId: req.correlationId 
      });
      
      return res.status(400).json({
        status: 'error',
        message: 'Invalid persona configuration',
        errors: validationResult.error.format(),
        correlationId: req.correlationId
      });
    }
    
    const personaConfig = validationResult.data;
    
    // Register persona
    const result = await personaService.registerPersona(personaConfig);
    
    // Return success response
    return res.status(201).json({
      status: 'success',
      message: 'Persona created successfully',
      data: result,
      correlationId: req.correlationId
    });
  } catch (error) {
    logger.error('Error creating persona', { error, correlationId: req.correlationId });
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create persona',
      error: error instanceof Error ? error.message : 'Unknown error',
      correlationId: req.correlationId
    });
  }
});

// GET /api/v1/personas/list - List available personas
router.get('/list', async (req: express.Request, res: express.Response) => {
  try {
    // Validate and parse query parameters
    const validationResult = FilterQuerySchema.safeParse(req.query);
    
    if (!validationResult.success) {
      logger.warn('Invalid filter parameters', { 
        errors: validationResult.error.format(),
        correlationId: req.correlationId 
      });
      
      return res.status(400).json({
        status: 'error',
        message: 'Invalid filter parameters',
        errors: validationResult.error.format(),
        correlationId: req.correlationId
      });
    }
    
    const filters = validationResult.data;
    
    // Get personas with filters
    const personas = await personaService.getPersonas(filters);
    
    // Return success response
    return res.json({
      status: 'success',
      data: {
        personas,
        total: personas.length,
        limit: filters.limit || personas.length,
        offset: filters.offset || 0
      },
      correlationId: req.correlationId
    });
  } catch (error) {
    logger.error('Error listing personas', { error, correlationId: req.correlationId });
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to list personas',
      error: error instanceof Error ? error.message : 'Unknown error',
      correlationId: req.correlationId
    });
  }
});

// POST /api/v1/personas/:personaId/collect - Collect feedback from persona
router.post('/:personaId/collect', async (req: express.Request, res: express.Response) => {
  try {
    // Validate persona ID
    const idValidation = IdParamSchema.safeParse({ personaId: req.params.personaId });
    
    if (!idValidation.success) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid persona ID',
        errors: idValidation.error.format(),
        correlationId: req.correlationId
      });
    }
    
    // Validate request body
    const validationResult = FeedbackRequestSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      logger.warn('Invalid feedback request', { 
        errors: validationResult.error.format(),
        correlationId: req.correlationId 
      });
      
      return res.status(400).json({
        status: 'error',
        message: 'Invalid feedback request',
        errors: validationResult.error.format(),
        correlationId: req.correlationId
      });
    }
    
    const personaId = req.params.personaId as PersonaID;
    const feedbackRequest = validationResult.data;
    
    // Collect feedback
    const result = await personaService.collectFeedback(personaId, feedbackRequest);
    
    // Return success response
    return res.status(202).json({
      status: 'success',
      message: 'Feedback collection initiated',
      data: result,
      correlationId: req.correlationId
    });
  } catch (error) {
    logger.error('Error collecting feedback', { 
      error, 
      personaId: req.params.personaId,
      correlationId: req.correlationId 
    });
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to collect feedback',
      error: error instanceof Error ? error.message : 'Unknown error',
      correlationId: req.correlationId
    });
  }
});

// GET /api/v1/personas/insights - Get cross-persona insights
router.get('/insights', async (req: express.Request, res: express.Response) => {
  try {
    // Get insights with optional filters
    const insights = await personaService.getInsights({
      department: req.query.department,
      priority: req.query.priority,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string, 10) : undefined
    });
    
    // Return success response
    return res.json({
      status: 'success',
      data: insights,
      correlationId: req.correlationId
    });
  } catch (error) {
    logger.error('Error getting insights', { error, correlationId: req.correlationId });
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get insights',
      error: error instanceof Error ? error.message : 'Unknown error',
      correlationId: req.correlationId
    });
  }
});

// GET /api/v1/personas/:personaId - Get persona details
router.get('/:personaId', async (req: express.Request, res: express.Response) => {
  try {
    // Validate persona ID
    const idValidation = IdParamSchema.safeParse({ personaId: req.params.personaId });
    
    if (!idValidation.success) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid persona ID',
        errors: idValidation.error.format(),
        correlationId: req.correlationId
      });
    }
    
    // Get all personas and filter for the requested one
    // In a production system, you would query directly by ID
    const personas = await personaService.getPersonas({});
    const persona = personas.find(p => p.persona_id === req.params.personaId);
    
    if (!persona) {
      return res.status(404).json({
        status: 'error',
        message: 'Persona not found',
        correlationId: req.correlationId
      });
    }
    
    // Return success response
    return res.json({
      status: 'success',
      data: persona,
      correlationId: req.correlationId
    });
  } catch (error) {
    logger.error('Error getting persona details', { 
      error, 
      personaId: req.params.personaId,
      correlationId: req.correlationId 
    });
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get persona details',
      error: error instanceof Error ? error.message : 'Unknown error',
      correlationId: req.correlationId
    });
  }
});

// PUT /api/v1/personas/:personaId - Update persona
router.put('/:personaId', async (req: express.Request, res: express.Response) => {
  try {
    // Validate persona ID
    const idValidation = IdParamSchema.safeParse({ personaId: req.params.personaId });
    
    if (!idValidation.success) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid persona ID',
        errors: idValidation.error.format(),
        correlationId: req.correlationId
      });
    }
    
    // Validate request body for partial updates
    // We use .partial() to make all fields optional for updates
    const validationResult = PersonaConfigSchema.partial().safeParse(req.body);
    
    if (!validationResult.success) {
      logger.warn('Invalid persona update request', { 
        errors: validationResult.error.format(),
        correlationId: req.correlationId 
      });
      
      return res.status(400).json({
        status: 'error',
        message: 'Invalid persona update',
        errors: validationResult.error.format(),
        correlationId: req.correlationId
      });
    }
    
    const personaId = req.params.personaId as PersonaID;
    const updates = validationResult.data;
    
    // Update persona
    const success = await personaService.updatePersona(personaId, updates);
    
    if (!success) {
      return res.status(404).json({
        status: 'error',
        message: 'Persona not found or update failed',
        correlationId: req.correlationId
      });
    }
    
    // Return success response
    return res.json({
      status: 'success',
      message: 'Persona updated successfully',
      correlationId: req.correlationId
    });
  } catch (error) {
    logger.error('Error updating persona', { 
      error, 
      personaId: req.params.personaId,
      correlationId: req.correlationId 
    });
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update persona',
      error: error instanceof Error ? error.message : 'Unknown error',
      correlationId: req.correlationId
    });
  }
});

// DELETE /api/v1/personas/:personaId - Delete persona
router.delete('/:personaId', async (req: express.Request, res: express.Response) => {
  try {
    // Validate persona ID
    const idValidation = IdParamSchema.safeParse({ personaId: req.params.personaId });
    
    if (!idValidation.success) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid persona ID',
        errors: idValidation.error.format(),
        correlationId: req.correlationId
      });
    }
    
    const personaId = req.params.personaId as PersonaID;
    
    // Delete persona (soft delete)
    const success = await personaService.deletePersona(personaId);
    
    if (!success) {
      return res.status(404).json({
        status: 'error',
        message: 'Persona not found or deletion failed',
        correlationId: req.correlationId
      });
    }
    
    // Return success response
    return res.json({
      status: 'success',
      message: 'Persona deleted successfully',
      correlationId: req.correlationId
    });
  } catch (error) {
    logger.error('Error deleting persona', { 
      error, 
      personaId: req.params.personaId,
      correlationId: req.correlationId 
    });
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to delete persona',
      error: error instanceof Error ? error.message : 'Unknown error',
      correlationId: req.correlationId
    });
  }
});

// GET /api/v1/personas/:personaId/history - Get persona interaction history
router.get('/:personaId/history', async (req: express.Request, res: express.Response) => {
  try {
    // Validate persona ID
    const idValidation = IdParamSchema.safeParse({ personaId: req.params.personaId });
    
    if (!idValidation.success) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid persona ID',
        errors: idValidation.error.format(),
        correlationId: req.correlationId
      });
    }
    
    const personaId = req.params.personaId as PersonaID;
    
    // Get history
    const history = await personaService.getPersonaHistory(personaId);
    
    // Return success response
    return res.json({
      status: 'success',
      data: {
        history,
        total: history.length
      },
      correlationId: req.correlationId
    });
  } catch (error) {
    logger.error('Error getting persona history', { 
      error, 
      personaId: req.params.personaId,
      correlationId: req.correlationId 
    });
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get persona history',
      error: error instanceof Error ? error.message : 'Unknown error',
      correlationId: req.correlationId
    });
  }
});

export default router;