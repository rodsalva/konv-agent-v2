/**
 * A2A Routes
 * API endpoints for Agent-to-Agent (A2A) communication
 */
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/services/database';
import { logger } from '@/utils/logger';
import { agentAuthMiddleware } from '@/middleware/auth.middleware';
import { a2aManager } from '@/services/a2a-manager';
import { 
  AgentId, 
  A2AMessage, 
  A2ATextMessage, 
  A2AJsonMessage,
  A2AControlMessage,
  MessageId,
  ConversationId,
  A2ANegotiationRequest,
  A2ACapability
} from '@/types/a2a.types';

const router = Router();

// Validation schemas for A2A messages
const messageBaseSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  fromAgent: z.string(),
  toAgent: z.string(),
  timestamp: z.string().datetime(),
  metadata: z.record(z.unknown()).optional(),
  correlationId: z.string().optional()
});

const textMessageSchema = messageBaseSchema.extend({
  type: z.literal('text'),
  content: z.string()
});

const jsonMessageSchema = messageBaseSchema.extend({
  type: z.literal('json'),
  content: z.record(z.unknown())
});

const controlMessageSchema = messageBaseSchema.extend({
  type: z.literal('control'),
  content: z.object({
    action: z.enum(['connect', 'disconnect', 'ping', 'ack']),
    data: z.record(z.unknown()).optional()
  })
});

const messageSchema = z.discriminatedUnion('type', [
  textMessageSchema,
  jsonMessageSchema,
  controlMessageSchema
]);

const negotiationRequestSchema = z.object({
  agentId: z.string(),
  capabilities: z.array(z.enum([
    'messaging',
    'streaming',
    'file_transfer',
    'event_subscription',
    'agent_discovery',
    'task_execution'
  ])),
  supportedMessageTypes: z.array(z.enum(['text', 'json', 'binary', 'control'])),
  metadata: z.record(z.unknown()).optional()
});

/**
 * @swagger
 * /a2a/discover:
 *   get:
 *     summary: Discover available agents
 *     description: Searches for available agents matching the specified criteria
 *     tags: [A2A]
 *     parameters:
 *       - in: query
 *         name: capability
 *         schema:
 *           type: string
 *         description: Filter by capability
 *       - in: query
 *         name: agentType
 *         schema:
 *           type: string
 *         description: Filter by agent type
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of discovered agents
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
 *                     type: object
 *                     properties:
 *                       agentId:
 *                         type: string
 *                       name:
 *                         type: string
 *                       capabilities:
 *                         type: array
 *                         items:
 *                           type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/discover', agentAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { capability, agentType } = req.query;
    
    // Create filter criteria based on query parameters
    const criteria: Record<string, unknown> = {};
    if (capability) criteria.capability = capability;
    if (agentType) criteria.agentType = agentType;
    
    // Discover agents
    const agents = await a2aManager.discoverAgents(criteria);
    
    // Return the discovered agents
    res.json({
      success: true,
      data: agents.map(agentId => ({
        agentId,
        name: `Agent ${agentId.substring(0, 8)}...`,
        capabilities: ['messaging', 'agent_discovery'] // Placeholder
      })),
      correlationId: req.correlationId
    });
  } catch (error) {
    logger.error('Error discovering agents', { error, correlationId: req.correlationId });
    res.status(500).json({
      success: false,
      error: 'Failed to discover agents',
      correlationId: req.correlationId
    });
  }
});

/**
 * @swagger
 * /a2a/connect:
 *   post:
 *     summary: Connect to a remote agent
 *     description: Initiates a connection to a remote agent
 *     tags: [A2A]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - remoteAgentId
 *             properties:
 *               remoteAgentId:
 *                 type: string
 *                 description: ID of the remote agent to connect to
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Connection initiated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Connection initiated
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/connect', agentAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { remoteAgentId } = req.body;
    
    if (!remoteAgentId) {
      return res.status(400).json({
        success: false,
        error: 'Remote agent ID is required',
        correlationId: req.correlationId
      });
    }
    
    // Get agent ID from auth middleware
    const agentId = req.agent.id as AgentId;
    
    // Initiate connection
    const result = await a2aManager.connectToAgent(agentId, remoteAgentId as AgentId);
    
    if (result) {
      res.json({
        success: true,
        message: 'Connection initiated',
        correlationId: req.correlationId
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to initiate connection',
        correlationId: req.correlationId
      });
    }
  } catch (error) {
    logger.error('Error connecting to agent', { error, correlationId: req.correlationId });
    res.status(500).json({
      success: false,
      error: 'Failed to connect to agent',
      correlationId: req.correlationId
    });
  }
});

/**
 * @swagger
 * /a2a/negotiate:
 *   post:
 *     summary: Negotiate capabilities with a remote agent
 *     description: Negotiates capabilities and message types with a remote agent
 *     tags: [A2A]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - remoteAgentId
 *               - capabilities
 *               - supportedMessageTypes
 *             properties:
 *               remoteAgentId:
 *                 type: string
 *                 description: ID of the remote agent
 *               capabilities:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [messaging, streaming, file_transfer, event_subscription, agent_discovery, task_execution]
 *               supportedMessageTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [text, json, binary, control]
 *               metadata:
 *                 type: object
 *                 additionalProperties: true
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Negotiation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     agentId:
 *                       type: string
 *                     accepted:
 *                       type: boolean
 *                     capabilities:
 *                       type: array
 *                       items:
 *                         type: string
 *                     supportedMessageTypes:
 *                       type: array
 *                       items:
 *                         type: string
 *                     sessionId:
 *                       type: string
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/negotiate', agentAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { remoteAgentId, capabilities, supportedMessageTypes, metadata } = req.body;
    
    // Validate request
    const validationResult = negotiationRequestSchema.safeParse({
      agentId: req.agent.id,
      capabilities,
      supportedMessageTypes,
      metadata
    });
    
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid negotiation request',
        details: validationResult.error.format(),
        correlationId: req.correlationId
      });
    }
    
    if (!remoteAgentId) {
      return res.status(400).json({
        success: false,
        error: 'Remote agent ID is required',
        correlationId: req.correlationId
      });
    }
    
    // Get agent ID from auth middleware
    const agentId = req.agent.id as AgentId;
    
    // Negotiate capabilities
    const result = await a2aManager.negotiateCapabilities(
      agentId,
      remoteAgentId as AgentId,
      validationResult.data as A2ANegotiationRequest
    );
    
    res.json({
      success: true,
      data: result,
      correlationId: req.correlationId
    });
  } catch (error) {
    logger.error('Error negotiating capabilities', { error, correlationId: req.correlationId });
    res.status(500).json({
      success: false,
      error: 'Failed to negotiate capabilities',
      correlationId: req.correlationId
    });
  }
});

/**
 * @swagger
 * /a2a/message:
 *   post:
 *     summary: Send a message to a remote agent
 *     description: Sends a message to a remote agent through the A2A protocol
 *     tags: [A2A]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - $ref: '#/components/schemas/A2ATextMessage'
 *               - $ref: '#/components/schemas/A2AJsonMessage'
 *               - $ref: '#/components/schemas/A2AControlMessage'
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 messageId:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/message', agentAuthMiddleware, async (req: Request, res: Response) => {
  try {
    // Validate the message
    const validationResult = messageSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid message format',
        details: validationResult.error.format(),
        correlationId: req.correlationId
      });
    }
    
    const message = validationResult.data as A2AMessage;
    
    // Ensure the message is from the authenticated agent
    if (message.fromAgent !== req.agent.id) {
      return res.status(403).json({
        success: false,
        error: 'Message sender must match authenticated agent',
        correlationId: req.correlationId
      });
    }
    
    // Send the message
    const result = await a2aManager.sendMessage(message);
    
    if (result) {
      res.json({
        success: true,
        messageId: message.id,
        correlationId: req.correlationId
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send message',
        correlationId: req.correlationId
      });
    }
  } catch (error) {
    logger.error('Error sending message', { error, correlationId: req.correlationId });
    res.status(500).json({
      success: false,
      error: 'Failed to send message',
      correlationId: req.correlationId
    });
  }
});

/**
 * @swagger
 * /a2a/conversation:
 *   post:
 *     summary: Create a new conversation
 *     description: Creates a new conversation between the local agent and a remote agent
 *     tags: [A2A]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - remoteAgentId
 *             properties:
 *               remoteAgentId:
 *                 type: string
 *                 description: ID of the remote agent
 *               metadata:
 *                 type: object
 *                 additionalProperties: true
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       201:
 *         description: Conversation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 conversationId:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/conversation', agentAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { remoteAgentId, metadata } = req.body;
    
    if (!remoteAgentId) {
      return res.status(400).json({
        success: false,
        error: 'Remote agent ID is required',
        correlationId: req.correlationId
      });
    }
    
    // Get agent ID from auth middleware
    const agentId = req.agent.id as AgentId;
    
    // Create a new conversation
    const conversationId = await a2aManager.createConversation(agentId, remoteAgentId as AgentId);
    
    if (conversationId) {
      res.status(201).json({
        success: true,
        conversationId,
        correlationId: req.correlationId
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to create conversation',
        correlationId: req.correlationId
      });
    }
  } catch (error) {
    logger.error('Error creating conversation', { error, correlationId: req.correlationId });
    res.status(500).json({
      success: false,
      error: 'Failed to create conversation',
      correlationId: req.correlationId
    });
  }
});

/**
 * @swagger
 * /a2a/disconnect:
 *   post:
 *     summary: Disconnect from a remote agent
 *     description: Terminates the connection with a remote agent
 *     tags: [A2A]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Disconnected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Disconnected successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/disconnect', agentAuthMiddleware, async (req: Request, res: Response) => {
  try {
    // Get agent ID from auth middleware
    const agentId = req.agent.id as AgentId;
    
    // Disconnect the agent
    const result = await a2aManager.disconnectAgent(agentId);
    
    if (result) {
      res.json({
        success: true,
        message: 'Disconnected successfully',
        correlationId: req.correlationId
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to disconnect',
        correlationId: req.correlationId
      });
    }
  } catch (error) {
    logger.error('Error disconnecting', { error, correlationId: req.correlationId });
    res.status(500).json({
      success: false,
      error: 'Failed to disconnect',
      correlationId: req.correlationId
    });
  }
});

/**
 * @swagger
 * /a2a/sessions:
 *   get:
 *     summary: Get active A2A sessions
 *     description: Returns a list of active A2A sessions
 *     tags: [A2A]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of active sessions
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
 *                     type: object
 *                     properties:
 *                       sessionId:
 *                         type: string
 *                       agentId:
 *                         type: string
 *                       remoteAgentId:
 *                         type: string
 *                       state:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/sessions', agentAuthMiddleware, async (req: Request, res: Response) => {
  try {
    // Check if requesting agent has admin privileges
    if (req.agent.type !== 'company') {
      return res.status(403).json({
        success: false,
        error: 'Insufficient privileges',
        correlationId: req.correlationId
      });
    }
    
    // Get active sessions
    const sessionIds = a2aManager.getActiveSessions();
    
    // Get session info for each session
    const sessions = sessionIds.map(sessionId => {
      const info = a2aManager.getSessionInfo(sessionId);
      return {
        sessionId,
        agentId: info?.agentId,
        remoteAgentId: info?.remoteAgentId,
        // Additional info would be fetched from the database in a real implementation
        state: 'ready',
        createdAt: new Date().toISOString()
      };
    });
    
    res.json({
      success: true,
      data: sessions,
      total: sessions.length,
      correlationId: req.correlationId
    });
  } catch (error) {
    logger.error('Error getting active sessions', { error, correlationId: req.correlationId });
    res.status(500).json({
      success: false,
      error: 'Failed to get active sessions',
      correlationId: req.correlationId
    });
  }
});

export default router;