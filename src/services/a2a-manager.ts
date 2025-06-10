/**
 * A2A Manager Service
 * Central service for managing Agent-to-Agent communication and sessions
 */
import { db } from './database';
import { logger } from '@/utils/logger';
import { A2AHandler } from '@/protocols/a2a/handler';
import { 
  AgentId, 
  A2AMessage, 
  A2ALifecycleState, 
  A2ACapability,
  A2ANegotiationRequest,
  A2ANegotiationResponse,
  A2AError,
  A2AErrorCode,
  ConversationId,
  MessageId,
  SessionId
} from '@/types/a2a.types';
import { 
  publishAgentDiscovered,
  publishAgentConnected,
  publishAgentDisconnected,
  publishConnectionResult,
  publishStateChanged,
  publishMessageIncoming,
  publishMessageOutgoing,
  publishMessageDelivered,
  publishMessageFailed,
  publishError,
  subscribeToA2AEvent
} from '@/events/a2a-events';
import { v4 as uuidv4 } from 'uuid';

/**
 * A2A Manager Service
 * Manages A2A communication sessions and handlers
 */
export class A2AManagerService {
  private static instance: A2AManagerService;
  private handlers: Map<AgentId, A2AHandler> = new Map();
  private sessions: Map<SessionId, { agentId: AgentId, remoteAgentId: AgentId }> = new Map();
  private initialized = false;
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor() {}
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): A2AManagerService {
    if (!A2AManagerService.instance) {
      A2AManagerService.instance = new A2AManagerService();
    }
    return A2AManagerService.instance;
  }
  
  /**
   * Initialize the A2A Manager Service
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      logger.warn('A2A Manager Service already initialized');
      return;
    }
    
    logger.info('Initializing A2A Manager Service');
    
    // Set up event subscriptions
    this.setupEventSubscriptions();
    
    // Load active sessions from database (for recovery)
    await this.loadActiveSessions();
    
    this.initialized = true;
    logger.info('A2A Manager Service initialized');
  }
  
  /**
   * Set up event subscriptions for A2A events
   */
  private setupEventSubscriptions(): void {
    // Subscribe to incoming messages
    subscribeToA2AEvent<{ message: A2AMessage }>('a2a:message:incoming', async (data) => {
      const { message } = data;
      await this.processIncomingMessage(message);
    });
    
    // Subscribe to outgoing messages
    subscribeToA2AEvent<{ message: A2AMessage }>('a2a:message:outgoing', async (data) => {
      const { message } = data;
      await this.processOutgoingMessage(message);
    });
    
    // Subscribe to agent discovered events
    subscribeToA2AEvent<{ agentId: AgentId }>('a2a:agent:discovered', async (data) => {
      const { agentId } = data;
      await this.handleAgentDiscovered(agentId);
    });
    
    // Subscribe to agent disconnected events
    subscribeToA2AEvent<{ agentId: AgentId, remoteAgentId: AgentId, sessionId: SessionId }>('a2a:agent:disconnected', async (data) => {
      const { agentId, remoteAgentId, sessionId } = data;
      await this.handleAgentDisconnected(agentId, remoteAgentId, sessionId);
    });
    
    // Subscribe to error events
    subscribeToA2AEvent<{ error: A2AError }>('a2a:error', async (data) => {
      const { error } = data;
      await this.handleError(error);
    });
  }
  
  /**
   * Load active sessions from database
   */
  private async loadActiveSessions(): Promise<void> {
    try {
      // In a real implementation, this would load sessions from a database
      // For now, we'll just initialize an empty map
      this.sessions = new Map();
      logger.info('Loaded active sessions', { count: this.sessions.size });
    } catch (error) {
      logger.error('Error loading active sessions', { error });
    }
  }
  
  /**
   * Get or create an A2A handler for an agent
   * @param agentId The ID of the agent
   */
  public async getOrCreateHandler(agentId: AgentId): Promise<A2AHandler> {
    let handler = this.handlers.get(agentId);
    
    if (!handler) {
      // Create new handler
      handler = new A2AHandler(agentId);
      this.handlers.set(agentId, handler);
      
      logger.info('Created new A2A handler for agent', {
        agentId,
        sessionId: handler.getSessionId()
      });
    }
    
    return handler;
  }
  
  /**
   * Handle agent discovery
   * @param agentId The ID of the discovered agent
   */
  private async handleAgentDiscovered(agentId: AgentId): Promise<void> {
    logger.info('Agent discovery event received', { agentId });
    
    // In a real implementation, this would query the agent registry
    // For now, just log the discovery
    
    // Could also notify other agents interested in this agent type
  }
  
  /**
   * Handle agent disconnection
   * @param agentId The ID of the agent that disconnected
   * @param remoteAgentId The ID of the remote agent
   * @param sessionId The ID of the session
   */
  private async handleAgentDisconnected(agentId: AgentId, remoteAgentId: AgentId, sessionId: SessionId): Promise<void> {
    logger.info('Agent disconnection event received', {
      agentId,
      remoteAgentId,
      sessionId
    });
    
    // Remove the session
    this.sessions.delete(sessionId);
    
    // Store disconnection in database
    try {
      await db.updateSession({
        session_id: sessionId,
        status: 'disconnected',
        disconnected_at: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error updating session on disconnection', {
        error,
        agentId,
        remoteAgentId,
        sessionId
      });
    }
  }
  
  /**
   * Process an incoming A2A message
   * @param message The incoming message
   */
  private async processIncomingMessage(message: A2AMessage): Promise<void> {
    logger.debug('Processing incoming A2A message', {
      messageId: message.id,
      conversationId: message.conversationId,
      fromAgent: message.fromAgent,
      toAgent: message.toAgent,
      type: message.type
    });
    
    try {
      // Get the handler for the recipient agent
      const handler = await this.getOrCreateHandler(message.toAgent);
      
      // Process the message
      await handler.handleIncomingMessage(message);
      
      // Store message in database
      await db.createMessage({
        message_id: message.id,
        conversation_id: message.conversationId,
        from_agent_id: message.fromAgent,
        to_agent_id: message.toAgent,
        message_type: message.type,
        content: JSON.stringify(message.content),
        metadata: message.metadata ? JSON.stringify(message.metadata) : null,
        status: 'received',
        correlation_id: message.correlationId || uuidv4(),
        processed_at: new Date().toISOString(),
      });
      
      // Publish message delivered event
      await publishMessageDelivered({
        messageId: message.id,
        conversationId: message.conversationId,
        timestamp: new Date().toISOString()
      }, message.correlationId);
    } catch (error) {
      logger.error('Error processing incoming A2A message', {
        error,
        messageId: message.id,
        conversationId: message.conversationId
      });
      
      // Publish message failed event
      const a2aError: A2AError = {
        code: A2AErrorCode.MessageDeliveryFailed,
        message: error instanceof Error ? error.message : String(error),
        messageId: message.id,
        conversationId: message.conversationId,
        timestamp: new Date().toISOString(),
        correlationId: message.correlationId
      };
      
      await publishMessageFailed({
        messageId: message.id,
        conversationId: message.conversationId,
        error: a2aError,
        timestamp: new Date().toISOString()
      }, message.correlationId);
    }
  }
  
  /**
   * Process an outgoing A2A message
   * @param message The outgoing message
   */
  private async processOutgoingMessage(message: A2AMessage): Promise<void> {
    logger.debug('Processing outgoing A2A message', {
      messageId: message.id,
      conversationId: message.conversationId,
      fromAgent: message.fromAgent,
      toAgent: message.toAgent,
      type: message.type
    });
    
    try {
      // In a real implementation, this would send the message to the remote agent
      // For now, we'll just log the outgoing message and store it in the database
      
      // Store message in database
      await db.createMessage({
        message_id: message.id,
        conversation_id: message.conversationId,
        from_agent_id: message.fromAgent,
        to_agent_id: message.toAgent,
        message_type: message.type,
        content: JSON.stringify(message.content),
        metadata: message.metadata ? JSON.stringify(message.metadata) : null,
        status: 'sent',
        correlation_id: message.correlationId || uuidv4(),
        processed_at: new Date().toISOString(),
      });
      
      // Publish message delivered event
      await publishMessageDelivered({
        messageId: message.id,
        conversationId: message.conversationId,
        timestamp: new Date().toISOString()
      }, message.correlationId);
    } catch (error) {
      logger.error('Error processing outgoing A2A message', {
        error,
        messageId: message.id,
        conversationId: message.conversationId
      });
      
      // Publish message failed event
      const a2aError: A2AError = {
        code: A2AErrorCode.MessageDeliveryFailed,
        message: error instanceof Error ? error.message : String(error),
        messageId: message.id,
        conversationId: message.conversationId,
        timestamp: new Date().toISOString(),
        correlationId: message.correlationId
      };
      
      await publishMessageFailed({
        messageId: message.id,
        conversationId: message.conversationId,
        error: a2aError,
        timestamp: new Date().toISOString()
      }, message.correlationId);
    }
  }
  
  /**
   * Handle errors in A2A communication
   * @param error The A2A error
   */
  private async handleError(error: A2AError): Promise<void> {
    logger.error('A2A error occurred', {
      code: error.code,
      message: error.message,
      conversationId: error.conversationId,
      messageId: error.messageId,
      taskId: error.taskId,
      details: error.details
    });
    
    // Store error in database
    try {
      await db.createErrorLog({
        error_code: error.code,
        error_message: error.message,
        conversation_id: error.conversationId || null,
        message_id: error.messageId || null,
        task_id: error.taskId || null,
        details: error.details ? JSON.stringify(error.details) : null,
        timestamp: new Date().toISOString(),
        correlation_id: error.correlationId || uuidv4(),
      });
    } catch (dbError) {
      logger.error('Error storing A2A error in database', {
        error: dbError,
        originalError: error
      });
    }
  }
  
  /**
   * Discover available agents
   * @param criteria Optional criteria for filtering agents
   */
  public async discoverAgents(criteria?: Record<string, unknown>): Promise<AgentId[]> {
    logger.info('Discovering agents', { criteria });
    
    try {
      // In a real implementation, this would query the agent registry
      // For now, return a placeholder list
      const discoveredAgents: AgentId[] = [];
      
      // Emit agent discovered events
      for (const agentId of discoveredAgents) {
        await publishAgentDiscovered({
          agentId,
          capabilities: ['messaging', 'agent_discovery']
        });
      }
      
      return discoveredAgents;
    } catch (error) {
      logger.error('Error discovering agents', { error, criteria });
      return [];
    }
  }
  
  /**
   * Connect to a remote agent
   * @param agentId The ID of the local agent
   * @param remoteAgentId The ID of the remote agent
   */
  public async connectToAgent(agentId: AgentId, remoteAgentId: AgentId): Promise<boolean> {
    logger.info('Connecting to remote agent', {
      agentId,
      remoteAgentId
    });
    
    try {
      // Get the handler for the local agent
      const handler = await this.getOrCreateHandler(agentId);
      
      // Check if already in a connection state
      const state = handler.getState();
      if (state !== 'discovering' && state !== 'disconnected') {
        logger.warn('Cannot connect: agent already in active state', {
          state,
          agentId,
          remoteAgentId
        });
        return false;
      }
      
      // Publish agent discovered event
      await publishAgentDiscovered({
        agentId: remoteAgentId
      });
      
      // State transition will be handled by the handler
      return true;
    } catch (error) {
      logger.error('Error connecting to remote agent', {
        error,
        agentId,
        remoteAgentId
      });
      
      // Publish connection result event with error
      await publishConnectionResult({
        agentId,
        remoteAgentId,
        sessionId: uuidv4() as SessionId,
        success: false,
        error: {
          code: A2AErrorCode.ConnectionFailed,
          message: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString()
        }
      });
      
      return false;
    }
  }
  
  /**
   * Negotiate capabilities with a remote agent
   * @param agentId The ID of the local agent
   * @param remoteAgentId The ID of the remote agent
   * @param request The negotiation request
   */
  public async negotiateCapabilities(
    agentId: AgentId,
    remoteAgentId: AgentId,
    request: A2ANegotiationRequest
  ): Promise<A2ANegotiationResponse> {
    logger.info('Negotiating capabilities with remote agent', {
      agentId,
      remoteAgentId,
      requestedCapabilities: request.capabilities
    });
    
    try {
      // Get the handler for the local agent
      const handler = await this.getOrCreateHandler(agentId);
      
      // Negotiate capabilities
      const response = await handler.negotiateCapabilities(
        remoteAgentId,
        request.capabilities
      );
      
      // If negotiation was successful, store the session
      if (response.accepted && response.sessionId) {
        this.sessions.set(response.sessionId, {
          agentId,
          remoteAgentId
        });
        
        // Store session in database
        await db.createSession({
          session_id: response.sessionId,
          agent_id: agentId,
          remote_agent_id: remoteAgentId,
          state: 'ready',
          capabilities: JSON.stringify(response.capabilities),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString(),
        });
        
        // Publish agent connected event
        await publishAgentConnected({
          agentId,
          remoteAgentId,
          sessionId: response.sessionId,
          capabilities: response.capabilities
        });
      }
      
      return response;
    } catch (error) {
      logger.error('Error negotiating capabilities with remote agent', {
        error,
        agentId,
        remoteAgentId
      });
      
      return {
        agentId,
        accepted: false,
        capabilities: [],
        supportedMessageTypes: [],
        error: {
          code: 'NEGOTIATION_FAILED',
          message: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }
  
  /**
   * Disconnect from a remote agent
   * @param agentId The ID of the local agent
   */
  public async disconnectAgent(agentId: AgentId): Promise<boolean> {
    logger.info('Disconnecting agent', { agentId });
    
    try {
      // Get the handler for the agent
      const handler = this.handlers.get(agentId);
      
      if (!handler) {
        logger.warn('Cannot disconnect: agent handler not found', { agentId });
        return false;
      }
      
      // Disconnect the agent
      await handler.disconnect();
      
      // Remove the handler
      this.handlers.delete(agentId);
      
      return true;
    } catch (error) {
      logger.error('Error disconnecting agent', {
        error,
        agentId
      });
      
      return false;
    }
  }
  
  /**
   * Send a message to a remote agent
   * @param message The message to send
   */
  public async sendMessage(message: A2AMessage): Promise<boolean> {
    logger.debug('Sending message to remote agent', {
      messageId: message.id,
      conversationId: message.conversationId,
      fromAgent: message.fromAgent,
      toAgent: message.toAgent,
      type: message.type
    });
    
    try {
      // Get the handler for the sending agent
      const handler = await this.getOrCreateHandler(message.fromAgent);
      
      // Send the message
      const result = await handler.sendMessage(message);
      
      return result;
    } catch (error) {
      logger.error('Error sending message to remote agent', {
        error,
        messageId: message.id,
        conversationId: message.conversationId
      });
      
      // Publish error
      await publishError({
        error: {
          code: A2AErrorCode.MessageDeliveryFailed,
          message: error instanceof Error ? error.message : String(error),
          messageId: message.id,
          conversationId: message.conversationId,
          timestamp: new Date().toISOString(),
          correlationId: message.correlationId
        }
      }, message.correlationId);
      
      return false;
    }
  }
  
  /**
   * Create a new conversation between agents
   * @param agentId The ID of the local agent
   * @param remoteAgentId The ID of the remote agent
   */
  public async createConversation(agentId: AgentId, remoteAgentId: AgentId): Promise<ConversationId | null> {
    logger.info('Creating new conversation', {
      agentId,
      remoteAgentId
    });
    
    try {
      // Get the handler for the local agent
      const handler = await this.getOrCreateHandler(agentId);
      
      // Create the conversation
      const conversationId = handler.createConversation(remoteAgentId);
      
      // Store conversation in database
      await db.createConversation({
        conversation_id: conversationId,
        agent_id: agentId,
        remote_agent_id: remoteAgentId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'active'
      });
      
      return conversationId;
    } catch (error) {
      logger.error('Error creating conversation', {
        error,
        agentId,
        remoteAgentId
      });
      
      return null;
    }
  }
  
  /**
   * Get active sessions
   */
  public getActiveSessions(): SessionId[] {
    return Array.from(this.sessions.keys());
  }
  
  /**
   * Get the session info for a session ID
   * @param sessionId The ID of the session
   */
  public getSessionInfo(sessionId: SessionId): { agentId: AgentId, remoteAgentId: AgentId } | null {
    return this.sessions.get(sessionId) || null;
  }
  
  /**
   * Get the handler for an agent
   * @param agentId The ID of the agent
   */
  public getHandler(agentId: AgentId): A2AHandler | null {
    return this.handlers.get(agentId) || null;
  }
}

// Export singleton instance
export const a2aManager = A2AManagerService.getInstance();
export default a2aManager;