import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/services/database';
import { logger } from '@/utils/logger';
import { agentAuthMiddleware } from '@/middleware/auth.middleware';
import { appConfig } from '@/config/environment';
import crypto from 'crypto';

const router = Router();

// Validation schemas
const createAgentSchema = z.object({
  name: z.string().min(3).max(255),
  type: z.enum(['company', 'customer', 'insight', 'product', 'support', 'sales']),
  capabilities: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).optional().default({}),
});

const updateAgentSchema = z.object({
  name: z.string().min(3).max(255).optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
  capabilities: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * @swagger
 * /agents:
 *   get:
 *     summary: List all agents
 *     description: Retrieves a list of all agents with optional filtering by type and status
 *     tags: [Agents]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [company, customer, insight, product, support, sales]
 *         description: Filter by agent type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, suspended]
 *         description: Filter by agent status
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: A list of agents
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Agent'
 *                 total:
 *                   type: integer
 *                   example: 5
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/', agentAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { type, status } = req.query;
    
    const agents = await db.listAgents(
      type as string | undefined, 
      status as string | undefined
    );
    
    // Remove sensitive data from response
    const sanitizedAgents = agents.map(agent => {
      const { api_key, ...safeAgent } = agent;
      return safeAgent;
    });
    
    res.json({
      success: true,
      data: sanitizedAgents,
      total: sanitizedAgents.length,
    });
  } catch (error) {
    logger.error('Failed to list agents', { error, correlationId: req.correlationId });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve agents',
    });
  }
});

/**
 * @swagger
 * /agents/{id}:
 *   get:
 *     summary: Get a single agent
 *     description: Retrieves a single agent by ID
 *     tags: [Agents]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the agent to retrieve
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: A single agent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Agent'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id', agentAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const agent = await db.getAgent(id);
    
    // Remove sensitive data from response
    const { api_key, ...safeAgent } = agent;
    
    res.json({
      success: true,
      data: safeAgent,
    });
  } catch (error) {
    logger.error('Failed to get agent', { error, id: req.params.id, correlationId: req.correlationId });
    res.status(404).json({
      success: false,
      error: 'Agent not found',
    });
  }
});

/**
 * @swagger
 * /agents:
 *   post:
 *     summary: Create a new agent
 *     description: Creates a new agent with the provided information
 *     tags: [Agents]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 255
 *                 example: "Company Survey Agent"
 *               type:
 *                 type: string
 *                 enum: [company, customer, insight, product, support, sales]
 *                 example: "company"
 *               capabilities:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["feedback_collection", "survey_management"]
 *               metadata:
 *                 type: object
 *                 example: {}
 *     responses:
 *       201:
 *         description: Agent created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/Agent'
 *                     - type: object
 *                       properties:
 *                         api_key:
 *                           type: string
 *                           example: "mcp_agent_550e8400e29b41d4a716446655440000"
 *                 message:
 *                   type: string
 *                   example: "Agent created successfully. Save the API key as it won't be shown again."
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Maximum number of agents reached
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Error'
 *                 - type: object
 *                   properties:
 *                     error:
 *                       example: "Maximum number of company agents reached (5)"
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/', agentAuthMiddleware, async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validationResult = createAgentSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationResult.error.format(),
      });
    }
    
    const agentData = validationResult.data;
    
    // Check agent limit by type
    const existingAgents = await db.listAgents(agentData.type);
    if (existingAgents.length >= appConfig.agents.maxPerType) {
      return res.status(403).json({
        success: false,
        error: `Maximum number of ${agentData.type} agents reached (${appConfig.agents.maxPerType})`,
      });
    }
    
    // Generate API key
    const apiKey = generateApiKey();
    
    // Create agent
    const agent = await db.createAgent({
      ...agentData,
      api_key: apiKey,
      status: 'active',
    });
    
    // Return agent with API key (only returned on creation)
    res.status(201).json({
      success: true,
      data: {
        ...agent,
        api_key: apiKey,
      },
      message: 'Agent created successfully. Save the API key as it won\'t be shown again.',
    });
  } catch (error) {
    logger.error('Failed to create agent', { error, correlationId: req.correlationId });
    res.status(500).json({
      success: false,
      error: 'Failed to create agent',
    });
  }
});

/**
 * @route   PUT /api/v1/agents/:id
 * @desc    Update an agent
 * @access  Authenticated
 */
router.put('/:id', agentAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validate request body
    const validationResult = updateAgentSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationResult.error.format(),
      });
    }
    
    const updates = validationResult.data;
    
    // Update agent
    const updatedAgent = await db.updateAgent(id, updates);
    
    // Remove sensitive data from response
    const { api_key, ...safeAgent } = updatedAgent;
    
    res.json({
      success: true,
      data: safeAgent,
      message: 'Agent updated successfully',
    });
  } catch (error) {
    logger.error('Failed to update agent', { error, id: req.params.id, correlationId: req.correlationId });
    res.status(500).json({
      success: false,
      error: 'Failed to update agent',
    });
  }
});

/**
 * @route   POST /api/v1/agents/:id/regenerate-key
 * @desc    Regenerate API key for an agent
 * @access  Authenticated
 */
router.post('/:id/regenerate-key', agentAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Generate new API key
    const apiKey = generateApiKey();
    
    // Update agent with new API key
    const updatedAgent = await db.updateAgent(id, {
      api_key: apiKey,
    });
    
    res.json({
      success: true,
      data: {
        id: updatedAgent.id,
        api_key: apiKey,
      },
      message: 'API key regenerated successfully. Save the new key as it won\'t be shown again.',
    });
  } catch (error) {
    logger.error('Failed to regenerate API key', { error, id: req.params.id, correlationId: req.correlationId });
    res.status(500).json({
      success: false,
      error: 'Failed to regenerate API key',
    });
  }
});

/**
 * @route   DELETE /api/v1/agents/:id
 * @desc    Deactivate an agent (soft delete)
 * @access  Authenticated
 */
router.delete('/:id', agentAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Soft delete by setting status to inactive
    await db.updateAgent(id, {
      status: 'suspended',
      api_key: null, // Invalidate API key
    });
    
    res.json({
      success: true,
      message: 'Agent deactivated successfully',
    });
  } catch (error) {
    logger.error('Failed to deactivate agent', { error, id: req.params.id, correlationId: req.correlationId });
    res.status(500).json({
      success: false,
      error: 'Failed to deactivate agent',
    });
  }
});

/**
 * @route   GET /api/v1/agents/discover
 * @desc    Discover agents by capabilities
 * @access  Authenticated
 */
router.get('/discover', agentAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { capabilities } = req.query;
    
    // Parse capabilities as array
    const requiredCapabilities = capabilities 
      ? Array.isArray(capabilities) 
        ? capabilities 
        : [capabilities]
      : [];
    
    // Get active agents
    const agents = await db.listAgents(undefined, 'active');
    
    // Filter by capabilities if provided
    const filteredAgents = requiredCapabilities.length > 0
      ? agents.filter(agent => {
          return requiredCapabilities.every(cap => 
            agent.capabilities.includes(cap as string)
          );
        })
      : agents;
    
    // Format as agent cards
    const agentCards = filteredAgents.map(agent => {
      const { api_key, ...safeAgent } = agent;
      return {
        id: agent.id,
        name: agent.name,
        type: agent.type,
        capabilities: agent.capabilities,
        lastSeen: agent.last_seen,
        metadata: agent.metadata,
      };
    });
    
    res.json({
      success: true,
      data: agentCards,
      total: agentCards.length,
    });
  } catch (error) {
    logger.error('Failed to discover agents', { error, correlationId: req.correlationId });
    res.status(500).json({
      success: false,
      error: 'Failed to discover agents',
    });
  }
});

/**
 * Generate a secure API key
 */
function generateApiKey(): string {
  const randomBytes = crypto.randomBytes(32);
  return `${appConfig.security.apiKeyPrefix}${randomBytes.toString('hex')}`;
}

export default router;