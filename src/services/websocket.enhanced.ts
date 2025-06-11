import WebSocket from 'ws';
import http from 'http';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/utils/logger';
import { appConfig } from '@/config/environment';
import { db } from '@/services/database';
import { MCPHandler } from '@/protocols/mcp/handler';
import { MCPRequest, MCPResponse } from '@/types/mcp.types';
import { EventBus } from '@/events/event-bus';
import { A2AEventType } from '@/events/a2a-events';

// Define event types constant for backward compatibility
const A2A_EVENT_TYPES = {
  AGENT_CONNECTED: 'a2a:agent:connected',
  AGENT_DISCONNECTED: 'a2a:agent:disconnected',
  MESSAGE_SENT: 'a2a:message:outgoing',
  OBSERVATION_CREATED: 'a2a:observation:created',
  EXPLORATION_COMPLETED: 'a2a:exploration:completed'
};

interface WebSocketConnection {
  socket: WebSocket;
  agentId: string | null;
  agentType: string | null;
  sessionId: string;
  lastPing: number;
  mcpHandler: MCPHandler | null;
  metadata: Record<string, any>;
}

export class WebSocketService {
  private server: WebSocket.Server;
  private connections: Map<string, WebSocketConnection> = new Map();
  private pingInterval: NodeJS.Timeout;
  private eventBus: EventBus;

  constructor(httpServer: http.Server, eventBus: EventBus) {
    // Initialize WebSocket server
    this.server = new WebSocket.Server({ 
      server: httpServer,
      path: `/api/${appConfig.server.apiVersion}/ws`,
    });

    // Store event bus reference
    this.eventBus = eventBus;

    // Setup event handlers
    this.server.on('connection', this.handleConnection.bind(this));
    
    // Setup ping interval to detect dead connections
    this.pingInterval = setInterval(this.pingConnections.bind(this), 30000);
    
    // Subscribe to relevant events
    this.subscribeToEvents();
    
    logger.info('Enhanced WebSocket server initialized');
  }

  /**
   * Subscribe to relevant events
   */
  private subscribeToEvents(): void {
    // Subscribe to agent-to-agent communication events
    this.eventBus.subscribe(A2A_EVENT_TYPES.MESSAGE_SENT, (data: any) => {
      if (data && typeof data === 'object') {
        const toAgentId = data.toAgentId as string;
        const message = data.message;
        // Forward message to appropriate agent if connected
        if (toAgentId && message) {
          this.forwardMessageToAgent(toAgentId, message);
        }
      }
    });

    // Subscribe to observation events
    this.eventBus.subscribe(A2A_EVENT_TYPES.OBSERVATION_CREATED, (data: any) => {
      if (data && typeof data === 'object') {
        const agentId = data.agentId as string;
        const agentType = data.agentType as string;
        const observation = data.observation;
        // Broadcast observation to subscribers
        if (agentId && agentType && observation) {
          this.broadcastObservation(agentId, agentType, observation);
        }
      }
    });
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(socket: WebSocket, request: http.IncomingMessage): void {
    const sessionId = uuidv4();
    
    // Extract headers for enhanced authentication
    const authHeader = request.headers.authorization;
    const agentIdHeader = request.headers['x-agent-id'] as string;
    const agentTypeHeader = request.headers['x-agent-type'] as string;
    
    // Create new connection object
    const connection: WebSocketConnection = {
      socket,
      agentId: null, // Will be set after authentication
      agentType: null, // Will be set after authentication
      sessionId,
      lastPing: Date.now(),
      mcpHandler: null, // Will be set after authentication
      metadata: {
        ip: request.socket.remoteAddress,
        userAgent: request.headers['user-agent'],
        requestHeaders: request.headers,
      }
    };
    
    // Store connection
    this.connections.set(sessionId, connection);
    
    logger.info('New WebSocket connection', { 
      sessionId, 
      ip: request.socket.remoteAddress,
      agentId: agentIdHeader || 'unknown',
      agentType: agentTypeHeader || 'unknown'
    });

    // Setup socket event handlers
    socket.on('message', (data: WebSocket.Data) => this.handleMessage(sessionId, data));
    socket.on('close', () => this.handleDisconnect(sessionId));
    socket.on('error', (error) => this.handleError(sessionId, error));
    socket.on('pong', () => this.handlePong(sessionId));
    
    // Try header-based authentication first if provided
    if (authHeader && agentIdHeader) {
      const apiKey = authHeader.replace('Bearer ', '');
      this.handleHeaderAuthentication(sessionId, apiKey, agentIdHeader, agentTypeHeader);
    } else {
      // Send welcome message requesting authentication
      this.sendToClient(sessionId, {
        jsonrpc: '2.0',
        method: 'system/welcome',
        params: {
          sessionId,
          serverName: appConfig.mcp.serverName,
          serverVersion: appConfig.mcp.serverVersion,
          message: 'Welcome to MCP WebSocket Server. Please authenticate.',
          authMethods: ['api_key'],
        }
      });
    }
  }

  /**
   * Handle authentication via headers
   */
  private async handleHeaderAuthentication(
    sessionId: string, 
    apiKey: string,
    agentId: string,
    agentType?: string
  ): Promise<void> {
    const connection = this.connections.get(sessionId);
    if (!connection) {
      return;
    }

    try {
      // Validate API key
      try {
        const agent = await db.getAgentByApiKey(apiKey);
        
        // Update connection with agent info and create MCP handler
        connection.agentId = agent.id;
        connection.agentType = agent.type || agentType || 'unknown';
        connection.mcpHandler = new MCPHandler();
        
        // Update agent's last_seen timestamp
        await db.updateAgent(agent.id, {
          last_seen: new Date().toISOString()
        });
        
        logger.info('WebSocket client authenticated via headers', { 
          sessionId, 
          agentId: agent.id,
          agentName: agent.name,
          agentType: agent.type
        });
        
        // Send success notification
        this.sendToClient(sessionId, {
          jsonrpc: '2.0',
          method: 'system/authenticated',
          params: {
            success: true,
            agent: {
              id: agent.id,
              name: agent.name,
              type: agent.type,
            }
          }
        });
        
        // Emit connection event
        this.eventBus.publish(A2A_EVENT_TYPES.AGENT_CONNECTED, {
          agentId: agent.id,
          agentType: agent.type,
          sessionId,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        logger.warn('Header authentication failed with invalid API key', { 
          sessionId,
          error
        });
        
        this.sendToClient(sessionId, {
          jsonrpc: '2.0',
          method: 'system/error',
          params: {
            code: -33001,
            message: 'Authentication failed: Invalid API key',
          }
        });
      }
    } catch (error) {
      logger.error('Error during WebSocket header authentication', { error, sessionId });
      
      this.sendToClient(sessionId, {
        jsonrpc: '2.0',
        method: 'system/error',
        params: {
          code: -32603,
          message: 'Internal error during authentication',
          data: error instanceof Error ? error.message : String(error),
        }
      });
    }
  }

  /**
   * Handle incoming WebSocket message
   */
  private async handleMessage(sessionId: string, data: WebSocket.Data): Promise<void> {
    const connection = this.connections.get(sessionId);
    if (!connection) {
      logger.warn('Received message for unknown session', { sessionId });
      return;
    }

    try {
      // Parse message
      const message = JSON.parse(data.toString());
      
      // Check if it's a standard MCP message or an agent-specific message
      if (message.jsonrpc === '2.0') {
        // Handle as MCP message
        await this.handleMCPMessage(sessionId, message);
      } else if (message.type) {
        // Handle as agent-specific message
        await this.handleAgentMessage(sessionId, message);
      } else {
        // Unknown message format
        logger.warn('Received unknown message format', { sessionId });
        this.sendToClient(sessionId, {
          jsonrpc: '2.0',
          id: message.id,
          error: {
            code: -32600,
            message: 'Invalid Request: Unknown message format',
          }
        });
      }
    } catch (error) {
      logger.error('Error processing WebSocket message', { error, sessionId });
      
      // Send error response
      this.sendToClient(sessionId, {
        jsonrpc: '2.0',
        id: typeof data === 'string' && data.includes('"id"') ? 
          JSON.parse(data).id : null,
        error: {
          code: -32700,
          message: 'Parse error',
          data: error instanceof Error ? error.message : String(error),
        }
      });
    }
  }

  /**
   * Handle MCP-compliant message
   */
  private async handleMCPMessage(sessionId: string, message: MCPRequest): Promise<void> {
    const connection = this.connections.get(sessionId);
    if (!connection) {
      return;
    }
    
    // Log message receipt
    logger.debug('Received MCP message', { 
      sessionId, 
      messageId: message.id,
      method: message.method,
    });

    // Handle authentication first if not authenticated
    if (connection.agentId === null && message.method !== 'system/authenticate') {
      this.sendToClient(sessionId, {
        jsonrpc: '2.0',
        id: message.id,
        error: {
          code: -33001,
          message: 'Unauthorized: Please authenticate first',
        }
      });
      return;
    }

    // Handle authentication
    if (message.method === 'system/authenticate') {
      await this.handleAuthentication(sessionId, message);
      return;
    }

    // Process MCP message
    if (connection.mcpHandler) {
      const response = await connection.mcpHandler.processRequest(message);
      
      // Store message in database for auditing
      if (connection.agentId) {
        await db.createMessage({
          from_agent_id: connection.agentId,
          to_agent_id: connection.agentId, // Self-message for now
          message_type: 'request',
          method: message.method,
          params: message.params || null,
          result: response.result || null,
          error_code: response.error?.code || null,
          error_message: response.error?.message || null,
          status: 'processed',
          correlation_id: sessionId,
          processed_at: new Date().toISOString(),
        });
      }
      
      // Send response
      this.sendToClient(sessionId, response);
    }
  }

  /**
   * Handle agent-specific message
   */
  private async handleAgentMessage(sessionId: string, message: any): Promise<void> {
    const connection = this.connections.get(sessionId);
    if (!connection || !connection.agentId) {
      return;
    }

    // Log message receipt
    logger.debug('Received agent message', { 
      sessionId, 
      messageType: message.type,
      agentId: connection.agentId,
    });

    try {
      // Handle different message types
      switch (message.type) {
        case 'agent_connect':
          // Agent announcing connection
          logger.info('Agent announced connection', {
            sessionId,
            agentId: connection.agentId,
            agentType: message.agent_type || connection.agentType,
          });
          
          // Update agent type if provided
          if (message.agent_type && !connection.agentType) {
            connection.agentType = message.agent_type;
          }
          
          // Acknowledge connection
          this.sendToClient(sessionId, {
            type: 'connection_ack',
            agent_id: connection.agentId,
            timestamp: new Date().toISOString()
          });
          break;
          
        case 'agent_disconnect':
          // Agent announcing disconnection
          logger.info('Agent announced disconnection', {
            sessionId,
            agentId: connection.agentId,
          });
          break;
          
        case 'heartbeat':
          // Agent heartbeat
          // Just update last ping time
          connection.lastPing = Date.now();
          break;
          
        case 'agent_observation':
          // Agent sending observation
          await this.handleObservation(connection, message);
          break;
          
        case 'exploration_result':
          // Agent sending exploration results
          await this.handleExplorationResult(connection, message);
          break;
          
        default:
          // Unknown message type
          logger.warn('Received unknown agent message type', { 
            sessionId, 
            messageType: message.type 
          });
          
          // Send error response
          this.sendToClient(sessionId, {
            type: 'error',
            error: {
              code: 'unknown_message_type',
              message: `Unknown message type: ${message.type}`,
            },
            timestamp: new Date().toISOString()
          });
      }
    } catch (error) {
      logger.error('Error handling agent message', { error, sessionId });
      
      // Send error response
      this.sendToClient(sessionId, {
        type: 'error',
        error: {
          code: 'processing_error',
          message: error instanceof Error ? error.message : String(error),
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Handle agent observation
   */
  private async handleObservation(connection: WebSocketConnection, message: any): Promise<void> {
    if (!connection.agentId) {
      return;
    }
    
    logger.info('Received agent observation', {
      sessionId: connection.sessionId,
      agentId: connection.agentId,
      agentType: connection.agentType || message.agent_type,
    });
    
    try {
      // Store observation in database
      await db.createObservation({
        agent_id: connection.agentId,
        agent_type: connection.agentType || message.agent_type || 'unknown',
        observation: message.observation,
        metadata: message.metadata || {},
        timestamp: message.timestamp || new Date().toISOString(),
      });
      
      // Publish event
      this.eventBus.publish(A2A_EVENT_TYPES.OBSERVATION_CREATED, {
        agentId: connection.agentId,
        agentType: connection.agentType || message.agent_type || 'unknown',
        observation: message.observation,
        sessionId: connection.sessionId,
        timestamp: message.timestamp || new Date().toISOString(),
      });
      
      // Acknowledge receipt
      this.sendToClient(connection.sessionId, {
        type: 'observation_ack',
        observation_id: uuidv4(), // Generate ID for reference
        agent_id: connection.agentId,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('Error processing agent observation', { error });
      
      // Send error response
      this.sendToClient(connection.sessionId, {
        type: 'error',
        error: {
          code: 'observation_processing_error',
          message: error instanceof Error ? error.message : String(error),
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Handle exploration result
   */
  private async handleExplorationResult(connection: WebSocketConnection, message: any): Promise<void> {
    if (!connection.agentId) {
      return;
    }
    
    logger.info('Received exploration result', {
      sessionId: connection.sessionId,
      agentId: connection.agentId,
      agentType: connection.agentType || message.agent_type,
    });
    
    try {
      // Store result in database
      await db.createExplorationResult({
        agent_id: connection.agentId,
        agent_type: connection.agentType || message.agent_type || 'unknown',
        result: message.result,
        metadata: message.metadata || {},
        timestamp: message.timestamp || new Date().toISOString(),
      });
      
      // Publish event
      this.eventBus.publish(A2A_EVENT_TYPES.EXPLORATION_COMPLETED, {
        agentId: connection.agentId,
        agentType: connection.agentType || message.agent_type || 'unknown',
        result: message.result,
        sessionId: connection.sessionId,
        timestamp: message.timestamp || new Date().toISOString(),
      });
      
      // Acknowledge receipt
      this.sendToClient(connection.sessionId, {
        type: 'result_ack',
        result_id: uuidv4(), // Generate ID for reference
        agent_id: connection.agentId,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('Error processing exploration result', { error });
      
      // Send error response
      this.sendToClient(connection.sessionId, {
        type: 'error',
        error: {
          code: 'result_processing_error',
          message: error instanceof Error ? error.message : String(error),
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Handle WebSocket disconnect
   */
  private handleDisconnect(sessionId: string): void {
    const connection = this.connections.get(sessionId);
    if (connection) {
      logger.info('WebSocket disconnected', { 
        sessionId, 
        agentId: connection.agentId 
      });
      
      // Emit disconnect event if authenticated
      if (connection.agentId) {
        this.eventBus.publish(A2A_EVENT_TYPES.AGENT_DISCONNECTED, {
          agentId: connection.agentId,
          agentType: connection.agentType || 'unknown',
          sessionId,
          timestamp: new Date().toISOString()
        });
      }
      
      // Clean up resources
      this.connections.delete(sessionId);
    }
  }

  /**
   * Handle WebSocket error
   */
  private handleError(sessionId: string, error: Error): void {
    logger.error('WebSocket error', { error, sessionId });
    
    // Clean up connection on error
    const connection = this.connections.get(sessionId);
    if (connection) {
      // Emit disconnect event if authenticated
      if (connection.agentId) {
        this.eventBus.publish(A2A_EVENT_TYPES.AGENT_DISCONNECTED, {
          agentId: connection.agentId,
          agentType: connection.agentType || 'unknown',
          sessionId,
          timestamp: new Date().toISOString(),
          error: error.message
        });
      }
      
      connection.socket.terminate();
      this.connections.delete(sessionId);
    }
  }

  /**
   * Send message to client
   */
  private sendToClient(sessionId: string, message: any): void {
    const connection = this.connections.get(sessionId);
    if (!connection) {
      logger.warn('Attempted to send message to unknown session', { sessionId });
      return;
    }

    try {
      connection.socket.send(JSON.stringify(message));
    } catch (error) {
      logger.error('Error sending WebSocket message', { error, sessionId });
    }
  }

  /**
   * Handle authentication request
   */
  private async handleAuthentication(sessionId: string, message: MCPRequest): Promise<void> {
    const connection = this.connections.get(sessionId);
    if (!connection) {
      return;
    }

    try {
      const params = message.params as { api_key?: string, agent_type?: string } | undefined;
      
      if (!params?.api_key) {
        this.sendToClient(sessionId, {
          jsonrpc: '2.0',
          id: message.id,
          error: {
            code: -33001,
            message: 'Authentication failed: Missing API key',
          }
        });
        return;
      }

      // Validate API key
      try {
        const agent = await db.getAgentByApiKey(params.api_key);
        
        // Update connection with agent ID and create MCP handler
        connection.agentId = agent.id;
        connection.agentType = agent.type || params.agent_type || 'unknown';
        connection.mcpHandler = new MCPHandler();
        
        // Update agent's last_seen timestamp
        await db.updateAgent(agent.id, {
          last_seen: new Date().toISOString()
        });
        
        logger.info('WebSocket client authenticated', { 
          sessionId, 
          agentId: agent.id,
          agentName: agent.name,
          agentType: agent.type
        });
        
        // Emit connection event
        this.eventBus.publish(A2A_EVENT_TYPES.AGENT_CONNECTED, {
          agentId: agent.id,
          agentType: agent.type,
          sessionId,
          timestamp: new Date().toISOString()
        });
        
        // Send success response
        this.sendToClient(sessionId, {
          jsonrpc: '2.0',
          id: message.id,
          result: {
            success: true,
            agent: {
              id: agent.id,
              name: agent.name,
              type: agent.type,
            }
          }
        });
      } catch (error) {
        logger.warn('Authentication failed with invalid API key', { 
          sessionId,
          error
        });
        
        this.sendToClient(sessionId, {
          jsonrpc: '2.0',
          id: message.id,
          error: {
            code: -33001,
            message: 'Authentication failed: Invalid API key',
          }
        });
      }
    } catch (error) {
      logger.error('Error during WebSocket authentication', { error, sessionId });
      
      this.sendToClient(sessionId, {
        jsonrpc: '2.0',
        id: message.id,
        error: {
          code: -32603,
          message: 'Internal error during authentication',
          data: error instanceof Error ? error.message : String(error),
        }
      });
    }
  }

  /**
   * Forward message to agent
   */
  private forwardMessageToAgent(agentId: string, message: any): boolean {
    // Find connection for agent
    for (const [_, connection] of this.connections.entries()) {
      if (connection.agentId === agentId) {
        // Send message
        try {
          connection.socket.send(JSON.stringify(message));
          return true;
        } catch (error) {
          logger.error('Error forwarding message to agent', { error, agentId });
          return false;
        }
      }
    }
    
    logger.warn('Agent not connected for message forwarding', { agentId });
    return false;
  }

  /**
   * Broadcast observation to subscribers
   */
  private broadcastObservation(
    sourceAgentId: string,
    sourceAgentType: string,
    observation: any
  ): number {
    let sent = 0;
    
    // Create observation notification
    const notification = {
      type: 'observation_notification',
      source_agent_id: sourceAgentId,
      source_agent_type: sourceAgentType,
      observation,
      timestamp: new Date().toISOString()
    };
    
    // Find relevant subscribers
    for (const [_, connection] of this.connections.entries()) {
      // Skip the source agent
      if (connection.agentId === sourceAgentId) {
        continue;
      }
      
      // Only send to agents of certain types
      // e.g., company_analysis_agent or oversight_agent would be interested
      if (
        connection.agentId && 
        connection.agentType && 
        (connection.agentType === 'company_analysis' || 
         connection.agentType === 'oversight' ||
         connection.agentType === 'ml_communication')
      ) {
        try {
          connection.socket.send(JSON.stringify(notification));
          sent++;
        } catch (error) {
          logger.error('Error broadcasting observation', { 
            error, 
            sessionId: connection.sessionId 
          });
        }
      }
    }
    
    return sent;
  }

  /**
   * Ping connections to check for dead clients
   */
  private pingConnections(): void {
    const now = Date.now();
    
    for (const [sessionId, connection] of this.connections.entries()) {
      // Check if connection is stale (no pong for 60 seconds)
      if (now - connection.lastPing > 60000) {
        logger.warn('Terminating stale WebSocket connection', { sessionId });
        
        // Emit disconnect event if authenticated
        if (connection.agentId) {
          this.eventBus.publish(A2A_EVENT_TYPES.AGENT_DISCONNECTED, {
            agentId: connection.agentId,
            agentType: connection.agentType || 'unknown',
            sessionId,
            timestamp: new Date().toISOString(),
            reason: 'connection_timeout'
          });
        }
        
        connection.socket.terminate();
        this.connections.delete(sessionId);
        continue;
      }
      
      // Send ping
      try {
        connection.socket.ping();
      } catch (error) {
        logger.error('Error sending ping', { error, sessionId });
        connection.socket.terminate();
        this.connections.delete(sessionId);
      }
    }
  }

  /**
   * Handle pong response
   */
  private handlePong(sessionId: string): void {
    const connection = this.connections.get(sessionId);
    if (connection) {
      connection.lastPing = Date.now();
    }
  }

  /**
   * Send notification to a specific agent
   */
  public sendNotification(
    agentId: string, 
    method: string, 
    params?: Record<string, unknown>
  ): boolean {
    // Find connection for agent
    for (const [_, connection] of this.connections.entries()) {
      if (connection.agentId === agentId) {
        // Create notification
        const notification = {
          jsonrpc: '2.0',
          method,
          params
        };
        
        // Send notification
        try {
          connection.socket.send(JSON.stringify(notification));
          return true;
        } catch (error) {
          logger.error('Error sending notification', { error, agentId });
          return false;
        }
      }
    }
    
    logger.warn('Agent not connected for notification', { agentId });
    return false;
  }

  /**
   * Send agent-specific message
   */
  public sendAgentMessage(
    agentId: string, 
    message: any
  ): boolean {
    // Find connection for agent
    for (const [_, connection] of this.connections.entries()) {
      if (connection.agentId === agentId) {
        // Send message
        try {
          connection.socket.send(JSON.stringify(message));
          return true;
        } catch (error) {
          logger.error('Error sending agent message', { error, agentId });
          return false;
        }
      }
    }
    
    logger.warn('Agent not connected for message', { agentId });
    return false;
  }

  /**
   * Broadcast notification to all agents or agents of a specific type
   */
  public broadcastNotification(
    method: string, 
    params?: Record<string, unknown>,
    agentType?: string
  ): number {
    let sent = 0;
    
    for (const [_, connection] of this.connections.entries()) {
      if (
        connection.agentId && 
        connection.mcpHandler &&
        (!agentType || connection.agentType === agentType)
      ) {
        // Create notification
        const notification = {
          jsonrpc: '2.0',
          method,
          params
        };
        
        // Send notification
        try {
          connection.socket.send(JSON.stringify(notification));
          sent++;
        } catch (error) {
          logger.error('Error broadcasting notification', { 
            error, 
            sessionId: connection.sessionId 
          });
        }
      }
    }
    
    return sent;
  }

  /**
   * Broadcast agent message to all agents or agents of a specific type
   */
  public broadcastAgentMessage(
    message: any,
    agentType?: string
  ): number {
    let sent = 0;
    
    for (const [_, connection] of this.connections.entries()) {
      if (
        connection.agentId &&
        (!agentType || connection.agentType === agentType)
      ) {
        // Send message
        try {
          connection.socket.send(JSON.stringify(message));
          sent++;
        } catch (error) {
          logger.error('Error broadcasting agent message', { 
            error, 
            sessionId: connection.sessionId 
          });
        }
      }
    }
    
    return sent;
  }

  /**
   * Shutdown the WebSocket server
   */
  public shutdown(): void {
    // Clear ping interval
    clearInterval(this.pingInterval);
    
    // Close all connections
    for (const [sessionId, connection] of this.connections.entries()) {
      try {
        // Emit disconnect event if authenticated
        if (connection.agentId) {
          this.eventBus.publish(A2A_EVENT_TYPES.AGENT_DISCONNECTED, {
            agentId: connection.agentId,
            agentType: connection.agentType || 'unknown',
            sessionId,
            timestamp: new Date().toISOString(),
            reason: 'server_shutdown'
          });
        }
        
        connection.socket.close(1001, 'Server shutting down');
      } catch (error) {
        logger.error('Error closing WebSocket connection', { error, sessionId });
      }
    }
    
    // Close server
    this.server.close((error) => {
      if (error) {
        logger.error('Error closing WebSocket server', { error });
      } else {
        logger.info('WebSocket server closed');
      }
    });
  }

  /**
   * Get active connections count
   */
  public getConnectionsCount(): number {
    return this.connections.size;
  }

  /**
   * Get active agent connections
   */
  public getActiveAgents(): Array<{id: string, type: string}> {
    const agents: Array<{id: string, type: string}> = [];
    
    for (const [_, connection] of this.connections.entries()) {
      if (connection.agentId) {
        agents.push({
          id: connection.agentId,
          type: connection.agentType || 'unknown'
        });
      }
    }
    
    return agents;
  }

  /**
   * Get connections by agent type
   */
  public getConnectionsByAgentType(): Record<string, number> {
    const counts: Record<string, number> = {};
    
    for (const [_, connection] of this.connections.entries()) {
      if (connection.agentType) {
        counts[connection.agentType] = (counts[connection.agentType] || 0) + 1;
      }
    }
    
    return counts;
  }
}