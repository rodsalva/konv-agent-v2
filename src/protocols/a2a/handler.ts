/**
 * A2A Protocol Handler
 * Implements Agent-to-Agent communication protocol for cross-platform agent interoperability
 */
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/utils/logger';
import { 
  AgentId, 
  A2ACapability,
  A2ALifecycleState,
  A2AMessage,
  A2ATextMessage,
  A2AJsonMessage,
  A2ABinaryMessage,
  A2AControlMessage,
  ConversationId,
  MessageId,
  SessionId,
  A2AErrorCode,
  A2AError,
  A2ANegotiationRequest,
  A2ANegotiationResponse,
  AgentCard,
  AgentCardId
} from '@/types/a2a.types';
import { eventBus } from '@/events/event-bus';

/**
 * A2A Protocol Handler Class
 * Responsible for managing agent-to-agent communication
 */
export class A2AHandler {
  private state: A2ALifecycleState = 'discovering';
  private sessionId: SessionId = uuidv4() as SessionId;
  private agentId: AgentId;
  private remoteAgentId?: AgentId;
  private negotiatedCapabilities: A2ACapability[] = [];
  private activeConversations: Map<ConversationId, { remoteAgentId: AgentId, lastMessageTimestamp: number }> = new Map();
  private agentCard?: AgentCard;
  private remoteAgentCard?: AgentCard;
  private messageHandlers: Map<string, (message: A2AMessage) => Promise<void>> = new Map();
  
  /**
   * Constructor for A2AHandler
   * @param agentId The ID of the local agent
   */
  constructor(agentId: AgentId) {
    this.agentId = agentId;
    
    logger.debug('A2A Handler created', { 
      agentId: this.agentId,
      sessionId: this.sessionId 
    });
    
    // Register for A2A events
    this.registerEventHandlers();
  }
  
  /**
   * Register event handlers for A2A events
   */
  private registerEventHandlers(): void {
    // Subscribe to agent discovery events
    eventBus.subscribe<{ agentId: AgentId }>('a2a:agent:discovered', async (data) => {
      await this.handleAgentDiscovered(data.agentId);
    });
    
    // Subscribe to connection events
    eventBus.subscribe<{ agentId: AgentId, success: boolean, error?: A2AError }>('a2a:connection:result', async (data) => {
      if (data.success) {
        this.state = 'negotiating';
      } else {
        this.state = 'error';
        logger.error('Connection failed', { 
          error: data.error,
          agentId: this.agentId,
          remoteAgentId: data.agentId,
          sessionId: this.sessionId
        });
      }
    });
  }
  
  /**
   * Handle agent discovery
   * @param agentId The ID of the discovered agent
   */
  private async handleAgentDiscovered(agentId: AgentId): Promise<void> {
    if (this.state !== 'discovering') {
      logger.debug('Ignoring agent discovery, not in discovering state', {
        currentState: this.state,
        discoveredAgentId: agentId
      });
      return;
    }
    
    logger.info('Agent discovered', {
      agentId: this.agentId,
      discoveredAgentId: agentId,
      sessionId: this.sessionId
    });
    
    try {
      // Fetch agent card for the discovered agent
      const remoteAgentCard = await this.fetchAgentCard(agentId);
      
      // Validate agent capabilities and compatibility
      if (this.isAgentCompatible(remoteAgentCard)) {
        this.remoteAgentId = agentId;
        this.remoteAgentCard = remoteAgentCard;
        this.state = 'connecting';
        
        // Initiate connection
        await this.initiateConnection();
      } else {
        logger.warn('Discovered agent not compatible', {
          agentId: this.agentId,
          discoveredAgentId: agentId,
          sessionId: this.sessionId,
          reason: 'Incompatible capabilities'
        });
      }
    } catch (error) {
      logger.error('Error during agent discovery', {
        error,
        agentId: this.agentId,
        discoveredAgentId: agentId,
        sessionId: this.sessionId
      });
    }
  }
  
  /**
   * Fetch agent card for a remote agent
   * @param agentId The ID of the remote agent
   */
  private async fetchAgentCard(agentId: AgentId): Promise<AgentCard> {
    // In a real implementation, this would fetch the agent card from a discovery service
    // For now, we'll return a placeholder card
    const placeholderId = uuidv4() as AgentCardId;
    return {
      id: placeholderId,
      name: `Agent ${agentId}`,
      description: 'Discovered agent',
      version: '1.0.0',
      capabilities: ['messaging', 'agent_discovery'],
      skills: [],
      authentication: {
        type: 'apikey'
      },
      endpoints: {
        messaging: `/api/v1/a2a/${agentId}/message`
      }
    };
  }
  
  /**
   * Check if a remote agent is compatible with this agent
   * @param remoteAgentCard The agent card of the remote agent
   */
  private isAgentCompatible(remoteAgentCard: AgentCard): boolean {
    // Check if the remote agent supports the minimum required capabilities
    const requiredCapabilities: A2ACapability[] = ['messaging'];
    
    return requiredCapabilities.every(cap => 
      remoteAgentCard.capabilities.includes(cap)
    );
  }
  
  /**
   * Initiate connection to a remote agent
   */
  private async initiateConnection(): Promise<void> {
    if (!this.remoteAgentId || !this.remoteAgentCard) {
      throw new Error('Cannot initiate connection: no remote agent selected');
    }
    
    try {
      logger.info('Initiating connection to remote agent', {
        agentId: this.agentId,
        remoteAgentId: this.remoteAgentId,
        sessionId: this.sessionId
      });
      
      // Create a control message for connection
      const controlMessage: A2AControlMessage = {
        id: uuidv4() as MessageId,
        conversationId: uuidv4() as ConversationId,
        fromAgent: this.agentId,
        toAgent: this.remoteAgentId,
        type: 'control',
        content: {
          action: 'connect',
          data: {
            sessionId: this.sessionId
          }
        },
        timestamp: new Date().toISOString(),
        correlationId: uuidv4()
      };
      
      // Send the control message
      await this.sendMessage(controlMessage);
      
      // State transition will be handled by the connection:result event
    } catch (error) {
      logger.error('Error initiating connection', {
        error,
        agentId: this.agentId,
        remoteAgentId: this.remoteAgentId,
        sessionId: this.sessionId
      });
      
      this.state = 'error';
    }
  }
  
  /**
   * Negotiate capabilities with a remote agent
   * @param remoteAgentId The ID of the remote agent
   * @param requestedCapabilities The capabilities requested by the remote agent
   */
  public async negotiateCapabilities(
    remoteAgentId: AgentId,
    requestedCapabilities: A2ACapability[]
  ): Promise<A2ANegotiationResponse> {
    // Ensure we're in the right state
    if (this.state !== 'negotiating') {
      return {
        agentId: this.agentId,
        accepted: false,
        capabilities: [],
        supportedMessageTypes: [],
        error: {
          code: 'INVALID_STATE',
          message: `Cannot negotiate: agent is in ${this.state} state`
        }
      };
    }
    
    // Validate remote agent ID
    if (this.remoteAgentId !== remoteAgentId) {
      return {
        agentId: this.agentId,
        accepted: false,
        capabilities: [],
        supportedMessageTypes: [],
        error: {
          code: 'INVALID_AGENT',
          message: 'Remote agent ID does not match negotiation session'
        }
      };
    }
    
    // Define the supported capabilities
    const supportedCapabilities: A2ACapability[] = [
      'messaging',
      'agent_discovery',
      'task_execution'
    ];
    
    // Negotiate capabilities (intersection of requested and supported)
    this.negotiatedCapabilities = requestedCapabilities.filter(
      cap => supportedCapabilities.includes(cap)
    );
    
    // Define supported message types
    const supportedMessageTypes: Array<A2AMessage['type']> = [
      'text',
      'json',
      'control'
    ];
    
    // Update state if successful
    if (this.negotiatedCapabilities.length > 0) {
      this.state = 'ready';
      
      logger.info('Capability negotiation successful', {
        agentId: this.agentId,
        remoteAgentId,
        sessionId: this.sessionId,
        negotiatedCapabilities: this.negotiatedCapabilities
      });
      
      return {
        agentId: this.agentId,
        accepted: true,
        capabilities: this.negotiatedCapabilities,
        supportedMessageTypes,
        sessionId: this.sessionId
      };
    } else {
      this.state = 'error';
      
      logger.warn('Capability negotiation failed', {
        agentId: this.agentId,
        remoteAgentId,
        sessionId: this.sessionId,
        requestedCapabilities
      });
      
      return {
        agentId: this.agentId,
        accepted: false,
        capabilities: [],
        supportedMessageTypes: [],
        error: {
          code: 'NO_MATCHING_CAPABILITIES',
          message: 'No matching capabilities found'
        }
      };
    }
  }
  
  /**
   * Send a message to a remote agent
   * @param message The message to send
   */
  public async sendMessage(message: A2AMessage): Promise<boolean> {
    try {
      // Validate message
      this.validateMessage(message);
      
      // Ensure agent is ready to send messages
      if (this.state !== 'ready' && message.type !== 'control') {
        throw new Error(`Cannot send message: agent is in ${this.state} state`);
      }
      
      // Emit event for message sending
      await eventBus.publish('a2a:message:outgoing', message, {
        publisher: 'a2a:handler',
        correlationId: message.correlationId
      });
      
      // For control messages, don't track conversations
      if (message.type !== 'control') {
        // Update conversation tracking
        this.activeConversations.set(message.conversationId, {
          remoteAgentId: message.toAgent,
          lastMessageTimestamp: Date.now()
        });
      }
      
      logger.debug('Message sent', {
        messageId: message.id,
        conversationId: message.conversationId,
        fromAgent: message.fromAgent,
        toAgent: message.toAgent,
        type: message.type,
        correlationId: message.correlationId
      });
      
      return true;
    } catch (error) {
      logger.error('Error sending message', {
        error,
        messageId: message.id,
        conversationId: message.conversationId,
        correlationId: message.correlationId
      });
      
      // Emit error event
      const a2aError: A2AError = {
        code: A2AErrorCode.MessageDeliveryFailed,
        message: error instanceof Error ? error.message : String(error),
        messageId: message.id,
        conversationId: message.conversationId,
        timestamp: new Date().toISOString(),
        correlationId: message.correlationId
      };
      
      await eventBus.publish('a2a:error', a2aError, {
        publisher: 'a2a:handler',
        correlationId: message.correlationId
      });
      
      return false;
    }
  }
  
  /**
   * Handle incoming message from a remote agent
   * @param message The message received
   */
  public async handleIncomingMessage(message: A2AMessage): Promise<void> {
    try {
      // Validate message
      this.validateMessage(message);
      
      // Ensure the message is intended for this agent
      if (message.toAgent !== this.agentId) {
        throw new Error(`Message intended for agent ${message.toAgent}, not ${this.agentId}`);
      }
      
      // Special handling for control messages
      if (message.type === 'control') {
        await this.handleControlMessage(message as A2AControlMessage);
        return;
      }
      
      // Ensure agent is ready to receive messages
      if (this.state !== 'ready') {
        throw new Error(`Cannot handle message: agent is in ${this.state} state`);
      }
      
      // Emit event for message reception
      await eventBus.publish('a2a:message:incoming', message, {
        publisher: 'a2a:handler',
        correlationId: message.correlationId
      });
      
      // Update conversation tracking
      this.activeConversations.set(message.conversationId, {
        remoteAgentId: message.fromAgent,
        lastMessageTimestamp: Date.now()
      });
      
      // Call message type-specific handler
      await this.dispatchMessageToHandler(message);
      
      logger.debug('Message handled', {
        messageId: message.id,
        conversationId: message.conversationId,
        fromAgent: message.fromAgent,
        toAgent: message.toAgent,
        type: message.type,
        correlationId: message.correlationId
      });
    } catch (error) {
      logger.error('Error handling incoming message', {
        error,
        messageId: message.id,
        conversationId: message.conversationId,
        correlationId: message.correlationId
      });
      
      // Emit error event
      const a2aError: A2AError = {
        code: A2AErrorCode.MessageValidationFailed,
        message: error instanceof Error ? error.message : String(error),
        messageId: message.id,
        conversationId: message.conversationId,
        timestamp: new Date().toISOString(),
        correlationId: message.correlationId
      };
      
      await eventBus.publish('a2a:error', a2aError, {
        publisher: 'a2a:handler',
        correlationId: message.correlationId
      });
    }
  }
  
  /**
   * Handle control messages (connect, disconnect, etc)
   * @param message The control message to handle
   */
  private async handleControlMessage(message: A2AControlMessage): Promise<void> {
    const { action, data } = message.content;
    
    switch (action) {
      case 'connect':
        // Handle connection request
        await this.handleConnectionRequest(message);
        break;
        
      case 'disconnect':
        // Handle disconnection
        await this.handleDisconnection(message);
        break;
        
      case 'ping':
        // Handle ping with pong
        await this.handlePing(message);
        break;
        
      case 'ack':
        // Handle acknowledgment
        logger.debug('Received ack message', {
          messageId: message.id,
          conversationId: message.conversationId,
          fromAgent: message.fromAgent
        });
        break;
        
      default:
        logger.warn('Unknown control message action', {
          action,
          messageId: message.id,
          conversationId: message.conversationId
        });
    }
  }
  
  /**
   * Handle connection request from another agent
   * @param message The connection request message
   */
  private async handleConnectionRequest(message: A2AControlMessage): Promise<void> {
    // If we're already connected or negotiating, respond with current state
    if (this.state === 'ready' || this.state === 'negotiating') {
      logger.info('Connection request received but already in active state', {
        state: this.state,
        fromAgent: message.fromAgent,
        sessionId: this.sessionId
      });
      
      // Send acknowledgment
      const response: A2AControlMessage = {
        id: uuidv4() as MessageId,
        conversationId: message.conversationId,
        fromAgent: this.agentId,
        toAgent: message.fromAgent,
        type: 'control',
        content: {
          action: 'ack',
          data: {
            forMessage: message.id,
            state: this.state,
            sessionId: this.sessionId
          }
        },
        timestamp: new Date().toISOString(),
        correlationId: message.correlationId
      };
      
      await this.sendMessage(response);
      return;
    }
    
    // Accept connection and move to negotiating state
    this.remoteAgentId = message.fromAgent;
    this.state = 'negotiating';
    
    logger.info('Connection request accepted', {
      fromAgent: message.fromAgent,
      sessionId: this.sessionId
    });
    
    // Send acknowledgment
    const response: A2AControlMessage = {
      id: uuidv4() as MessageId,
      conversationId: message.conversationId,
      fromAgent: this.agentId,
      toAgent: message.fromAgent,
      type: 'control',
      content: {
        action: 'ack',
        data: {
          forMessage: message.id,
          state: this.state,
          sessionId: this.sessionId
        }
      },
      timestamp: new Date().toISOString(),
      correlationId: message.correlationId
    };
    
    await this.sendMessage(response);
  }
  
  /**
   * Handle disconnection from remote agent
   * @param message The disconnect message
   */
  private async handleDisconnection(message: A2AControlMessage): Promise<void> {
    // Validate that the disconnect is from our current remote agent
    if (this.remoteAgentId !== message.fromAgent) {
      logger.warn('Disconnect message from unknown agent', {
        fromAgent: message.fromAgent,
        currentRemoteAgent: this.remoteAgentId,
        sessionId: this.sessionId
      });
      return;
    }
    
    logger.info('Disconnection request received', {
      fromAgent: message.fromAgent,
      sessionId: this.sessionId
    });
    
    // Update state
    this.state = 'disconnected';
    
    // Clean up resources
    this.negotiatedCapabilities = [];
    this.activeConversations.clear();
    
    // Send acknowledgment
    const response: A2AControlMessage = {
      id: uuidv4() as MessageId,
      conversationId: message.conversationId,
      fromAgent: this.agentId,
      toAgent: message.fromAgent,
      type: 'control',
      content: {
        action: 'ack',
        data: {
          forMessage: message.id,
          state: this.state
        }
      },
      timestamp: new Date().toISOString(),
      correlationId: message.correlationId
    };
    
    await this.sendMessage(response);
    
    // Emit disconnection event
    await eventBus.publish('a2a:agent:disconnected', {
      agentId: this.agentId,
      remoteAgentId: message.fromAgent,
      sessionId: this.sessionId
    }, {
      publisher: 'a2a:handler',
      correlationId: message.correlationId
    });
  }
  
  /**
   * Handle ping from remote agent
   * @param message The ping message
   */
  private async handlePing(message: A2AControlMessage): Promise<void> {
    // Send pong response
    const response: A2AControlMessage = {
      id: uuidv4() as MessageId,
      conversationId: message.conversationId,
      fromAgent: this.agentId,
      toAgent: message.fromAgent,
      type: 'control',
      content: {
        action: 'ack',
        data: {
          forMessage: message.id,
          state: this.state,
          timestamp: new Date().toISOString()
        }
      },
      timestamp: new Date().toISOString(),
      correlationId: message.correlationId
    };
    
    await this.sendMessage(response);
  }
  
  /**
   * Dispatch a message to its appropriate handler
   * @param message The message to dispatch
   */
  private async dispatchMessageToHandler(message: A2AMessage): Promise<void> {
    // Check if we have a specific handler for this message type
    const handler = this.messageHandlers.get(message.type);
    
    if (handler) {
      await handler(message);
    } else {
      // Default handling based on message type
      switch (message.type) {
        case 'text':
          await this.handleTextMessage(message as A2ATextMessage);
          break;
          
        case 'json':
          await this.handleJsonMessage(message as A2AJsonMessage);
          break;
          
        case 'binary':
          await this.handleBinaryMessage(message as A2ABinaryMessage);
          break;
          
        default:
          logger.warn('No handler for message type', {
            type: message.type,
            messageId: message.id
          });
      }
    }
  }
  
  /**
   * Handle text message
   * @param message The text message to handle
   */
  private async handleTextMessage(message: A2ATextMessage): Promise<void> {
    // Default implementation - just log the text
    logger.info('Received text message', {
      fromAgent: message.fromAgent,
      text: message.content,
      messageId: message.id,
      conversationId: message.conversationId
    });
    
    // Real implementation would process the text or route to appropriate handler
  }
  
  /**
   * Handle JSON message
   * @param message The JSON message to handle
   */
  private async handleJsonMessage(message: A2AJsonMessage): Promise<void> {
    // Default implementation - just log the JSON
    logger.info('Received JSON message', {
      fromAgent: message.fromAgent,
      messageId: message.id,
      conversationId: message.conversationId
    });
    
    // Real implementation would process the JSON or route to appropriate handler
  }
  
  /**
   * Handle binary message
   * @param message The binary message to handle
   */
  private async handleBinaryMessage(message: A2ABinaryMessage): Promise<void> {
    // Default implementation - just log the binary data info
    logger.info('Received binary message', {
      fromAgent: message.fromAgent,
      contentType: message.contentType,
      size: message.content.length,
      messageId: message.id,
      conversationId: message.conversationId
    });
    
    // Real implementation would process the binary data or route to appropriate handler
  }
  
  /**
   * Register a custom message handler
   * @param messageType The type of message to handle
   * @param handler The handler function
   */
  public registerMessageHandler(
    messageType: A2AMessage['type'],
    handler: (message: A2AMessage) => Promise<void>
  ): void {
    this.messageHandlers.set(messageType, handler);
    logger.debug('Registered message handler', { messageType });
  }
  
  /**
   * Unregister a message handler
   * @param messageType The type of message to unregister handler for
   */
  public unregisterMessageHandler(messageType: A2AMessage['type']): void {
    this.messageHandlers.delete(messageType);
    logger.debug('Unregistered message handler', { messageType });
  }
  
  /**
   * Create a new conversation with a remote agent
   * @param remoteAgentId The ID of the remote agent
   */
  public createConversation(remoteAgentId: AgentId): ConversationId {
    // Ensure agent is ready
    if (this.state !== 'ready') {
      throw new Error(`Cannot create conversation: agent is in ${this.state} state`);
    }
    
    // Create conversation ID
    const conversationId = uuidv4() as ConversationId;
    
    // Track conversation
    this.activeConversations.set(conversationId, {
      remoteAgentId,
      lastMessageTimestamp: Date.now()
    });
    
    logger.info('Created new conversation', {
      conversationId,
      agentId: this.agentId,
      remoteAgentId
    });
    
    return conversationId;
  }
  
  /**
   * Validate a message before sending or after receiving
   * @param message The message to validate
   */
  private validateMessage(message: A2AMessage): void {
    // Check required fields
    if (!message.id) throw new Error('Message ID is required');
    if (!message.conversationId) throw new Error('Conversation ID is required');
    if (!message.fromAgent) throw new Error('Sender agent ID is required');
    if (!message.toAgent) throw new Error('Recipient agent ID is required');
    if (!message.timestamp) throw new Error('Timestamp is required');
    
    // Validate timestamp format
    try {
      new Date(message.timestamp);
    } catch (e) {
      throw new Error('Invalid timestamp format');
    }
    
    // Type-specific validation
    switch (message.type) {
      case 'text':
        if (typeof (message as A2ATextMessage).content !== 'string') {
          throw new Error('Text message content must be a string');
        }
        break;
        
      case 'json':
        if (typeof (message as A2AJsonMessage).content !== 'object') {
          throw new Error('JSON message content must be an object');
        }
        break;
        
      case 'binary':
        if (!(message as A2ABinaryMessage).content instanceof Uint8Array) {
          throw new Error('Binary message content must be a Uint8Array');
        }
        if (!(message as A2ABinaryMessage).contentType) {
          throw new Error('Binary message must specify content type');
        }
        break;
        
      case 'control':
        const controlMsg = message as A2AControlMessage;
        if (!controlMsg.content.action) {
          throw new Error('Control message must specify an action');
        }
        break;
        
      default:
        throw new Error(`Unsupported message type: ${message.type}`);
    }
  }
  
  /**
   * Disconnect from the remote agent
   */
  public async disconnect(): Promise<void> {
    // Only disconnect if we're connected or negotiating
    if (this.state !== 'ready' && this.state !== 'negotiating') {
      logger.debug('Cannot disconnect: not in active state', {
        state: this.state,
        agentId: this.agentId,
        sessionId: this.sessionId
      });
      return;
    }
    
    if (!this.remoteAgentId) {
      throw new Error('Cannot disconnect: no remote agent connected');
    }
    
    try {
      logger.info('Disconnecting from remote agent', {
        agentId: this.agentId,
        remoteAgentId: this.remoteAgentId,
        sessionId: this.sessionId
      });
      
      // Create a control message for disconnection
      const controlMessage: A2AControlMessage = {
        id: uuidv4() as MessageId,
        conversationId: uuidv4() as ConversationId,
        fromAgent: this.agentId,
        toAgent: this.remoteAgentId,
        type: 'control',
        content: {
          action: 'disconnect',
          data: {
            sessionId: this.sessionId,
            reason: 'Client initiated disconnect'
          }
        },
        timestamp: new Date().toISOString(),
        correlationId: uuidv4()
      };
      
      // Send the control message
      await this.sendMessage(controlMessage);
      
      // Update state
      this.state = 'disconnected';
      
      // Clean up resources
      this.negotiatedCapabilities = [];
      this.activeConversations.clear();
      
      // Emit disconnection event
      await eventBus.publish('a2a:agent:disconnected', {
        agentId: this.agentId,
        remoteAgentId: this.remoteAgentId,
        sessionId: this.sessionId
      }, {
        publisher: 'a2a:handler'
      });
    } catch (error) {
      logger.error('Error disconnecting', {
        error,
        agentId: this.agentId,
        remoteAgentId: this.remoteAgentId,
        sessionId: this.sessionId
      });
      
      // Force disconnect on error
      this.state = 'disconnected';
    }
  }
  
  /**
   * Get the current state of the A2A handler
   */
  public getState(): A2ALifecycleState {
    return this.state;
  }
  
  /**
   * Get the negotiated capabilities
   */
  public getCapabilities(): A2ACapability[] {
    return [...this.negotiatedCapabilities];
  }
  
  /**
   * Get the session ID
   */
  public getSessionId(): SessionId {
    return this.sessionId;
  }
  
  /**
   * Get the agent ID
   */
  public getAgentId(): AgentId {
    return this.agentId;
  }
  
  /**
   * Get the remote agent ID if connected
   */
  public getRemoteAgentId(): AgentId | undefined {
    return this.remoteAgentId;
  }
  
  /**
   * Get active conversations
   */
  public getActiveConversations(): ConversationId[] {
    return Array.from(this.activeConversations.keys());
  }
}