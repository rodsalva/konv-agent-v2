import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/services/database';
import { logger } from '@/utils/logger';
import { agentAuthMiddleware } from '@/middleware/auth.middleware';
import { MCPHandler } from '@/protocols/mcp/handler';
import { MCPRequest, MCPResponse } from '@/types/mcp.types';

const router = Router();

// Create MCP handler instance for each agent connection
const mcpHandlers = new Map<string, MCPHandler>();

// Validation schema for MCP messages
const mcpRequestSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.union([z.string(), z.number()]),
  method: z.string(),
  params: z.record(z.unknown()).optional(),
});

/**
 * @route   POST /api/v1/mcp/message
 * @desc    Process MCP message from agent
 * @access  Authenticated
 */
router.post('/message', agentAuthMiddleware, async (req: Request, res: Response) => {
  try {
    // Validate incoming message
    const validationResult = mcpRequestSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        jsonrpc: '2.0',
        id: req.body.id || null,
        error: {
          code: -32600,
          message: 'Invalid Request',
          data: validationResult.error.format(),
        }
      });
    }
    
    const mcpRequest = validationResult.data as MCPRequest;
    
    // Get agent ID from auth middleware
    const agentId = req.agent.id;
    
    // Get or create MCP handler for this agent
    let handler = mcpHandlers.get(agentId);
    if (!handler) {
      handler = new MCPHandler();
      mcpHandlers.set(agentId, handler);
      logger.info('Created new MCP handler for agent', { 
        agentId, 
        sessionId: handler.getSessionId(),
        correlationId: req.correlationId 
      });
    }
    
    // Process the request
    const mcpResponse = await handler.processRequest(mcpRequest);
    
    // Store message in database for auditing
    await db.createMessage({
      from_agent_id: agentId,
      to_agent_id: agentId, // Self-message for now, will be updated in later phases
      message_type: 'request',
      method: mcpRequest.method,
      params: mcpRequest.params || null,
      result: mcpResponse.result || null,
      error_code: mcpResponse.error?.code || null,
      error_message: mcpResponse.error?.message || null,
      status: 'processed',
      correlation_id: req.correlationId,
      processed_at: new Date().toISOString(),
    });
    
    // Check if handler was terminated
    if (handler.getState() === 'shutdown') {
      mcpHandlers.delete(agentId);
      logger.info('MCP handler shutdown', { agentId, correlationId: req.correlationId });
    }
    
    // Return the response
    res.json(mcpResponse);
  } catch (error) {
    logger.error('Error processing MCP message', { error, correlationId: req.correlationId });
    res.status(500).json({
      jsonrpc: '2.0',
      id: req.body.id || null,
      error: {
        code: -32603,
        message: 'Internal error',
        data: error instanceof Error ? error.message : String(error),
      }
    });
  }
});

/**
 * @route   GET /api/v1/mcp/sessions
 * @desc    List active MCP sessions
 * @access  Authenticated (Admin only)
 */
router.get('/sessions', agentAuthMiddleware, async (req: Request, res: Response) => {
  try {
    // Check if requesting agent has admin privileges
    if (req.agent.type !== 'company') {
      return res.status(403).json({
        success: false,
        error: 'Insufficient privileges',
      });
    }
    
    // Get active sessions
    const sessions = Array.from(mcpHandlers.entries()).map(([agentId, handler]) => ({
      agentId,
      sessionId: handler.getSessionId(),
      state: handler.getState(),
      capabilities: handler.getCapabilities(),
    }));
    
    res.json({
      success: true,
      data: sessions,
      total: sessions.length,
    });
  } catch (error) {
    logger.error('Failed to list MCP sessions', { error, correlationId: req.correlationId });
    res.status(500).json({
      success: false,
      error: 'Failed to list MCP sessions',
    });
  }
});

/**
 * @route   DELETE /api/v1/mcp/sessions/:agentId
 * @desc    Terminate an MCP session
 * @access  Authenticated (Admin only)
 */
router.delete('/sessions/:agentId', agentAuthMiddleware, async (req: Request, res: Response) => {
  try {
    // Check if requesting agent has admin privileges
    if (req.agent.type !== 'company') {
      return res.status(403).json({
        success: false,
        error: 'Insufficient privileges',
      });
    }
    
    const { agentId } = req.params;
    
    // Check if session exists
    if (!mcpHandlers.has(agentId)) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }
    
    // Remove handler
    mcpHandlers.delete(agentId);
    
    logger.info('MCP session terminated by admin', { 
      agentId, 
      adminId: req.agent.id,
      correlationId: req.correlationId 
    });
    
    res.json({
      success: true,
      message: 'Session terminated successfully',
    });
  } catch (error) {
    logger.error('Failed to terminate MCP session', { error, agentId: req.params.agentId, correlationId: req.correlationId });
    res.status(500).json({
      success: false,
      error: 'Failed to terminate MCP session',
    });
  }
});

export default router;