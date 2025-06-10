import WebSocket from 'ws';
import http from 'http';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/utils/logger';
import { appConfig } from '@/config/environment';
import { db } from '@/services/database';
import { MCPHandler } from '@/protocols/mcp/handler';
import { MCPRequest, MCPResponse } from '@/types/mcp.types';

interface WebSocketConnection {
  socket: WebSocket;
  agentId: string | null;
  sessionId: string;
  lastPing: number;
  mcpHandler: MCPHandler | null;
}

export class WebSocketService {
  private server: WebSocket.Server;
  private connections: Map<string, WebSocketConnection> = new Map();
  private pingInterval: NodeJS.Timeout;

  constructor(httpServer: http.Server) {
    // Initialize WebSocket server
    this.server = new WebSocket.Server({ 
      server: httpServer,
      path: `/api/${appConfig.server.apiVersion}/ws`,
    });

    // Setup event handlers
    this.server.on('connection', this.handleConnection.bind(this));
    
    // Setup ping interval to detect dead connections
    this.pingInterval = setInterval(this.pingConnections.bind(this), 30000);
    
    logger.info('WebSocket server initialized');
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(socket: WebSocket, request: http.IncomingMessage): void {
    const sessionId = uuidv4();
    
    // Create new connection object
    const connection: WebSocketConnection = {
      socket,
      agentId: null, // Will be set after authentication
      sessionId,
      lastPing: Date.now(),
      mcpHandler: null, // Will be set after authentication
    };
    
    // Store connection
    this.connections.set(sessionId, connection);
    
    logger.info('New WebSocket connection', { 
      sessionId, 
      ip: request.socket.remoteAddress 
    });

    // Setup socket event handlers
    socket.on('message', (data: WebSocket.Data) => this.handleMessage(sessionId, data));
    socket.on('close', () => this.handleDisconnect(sessionId));
    socket.on('error', (error) => this.handleError(sessionId, error));
    socket.on('pong', () => this.handlePong(sessionId));
    
    // Send welcome message
    this.sendToClient(sessionId, {
      jsonrpc: '2.0',
      method: 'system/welcome',
      params: {
        sessionId,
        serverName: appConfig.mcp.serverName,
        serverVersion: appConfig.mcp.serverVersion,
        message: 'Welcome to MCP WebSocket Server. Please authenticate.',
      }
    });
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
      const message = JSON.parse(data.toString()) as MCPRequest;
      
      // Log message receipt
      logger.debug('Received WebSocket message', { 
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
   * Handle WebSocket disconnect
   */
  private handleDisconnect(sessionId: string): void {
    const connection = this.connections.get(sessionId);
    if (connection) {
      logger.info('WebSocket disconnected', { 
        sessionId, 
        agentId: connection.agentId 
      });
      
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
      connection.socket.terminate();
      this.connections.delete(sessionId);
    }
  }

  /**
   * Send message to client
   */
  private sendToClient(sessionId: string, message: MCPResponse | MCPRequest): void {
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
      const params = message.params as { api_key?: string } | undefined;
      
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
   * Ping connections to check for dead clients
   */
  private pingConnections(): void {
    const now = Date.now();
    
    for (const [sessionId, connection] of this.connections.entries()) {
      // Check if connection is stale (no pong for 60 seconds)
      if (now - connection.lastPing > 60000) {
        logger.warn('Terminating stale WebSocket connection', { sessionId });
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
  public sendNotification(agentId: string, method: string, params?: Record<string, unknown>): boolean {
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
        (!agentType || connection.agentId.startsWith(agentType))
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
   * Shutdown the WebSocket server
   */
  public shutdown(): void {
    // Clear ping interval
    clearInterval(this.pingInterval);
    
    // Close all connections
    for (const [sessionId, connection] of this.connections.entries()) {
      try {
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
  public getActiveAgents(): string[] {
    const agents: string[] = [];
    
    for (const [_, connection] of this.connections.entries()) {
      if (connection.agentId) {
        agents.push(connection.agentId);
      }
    }
    
    return agents;
  }
}