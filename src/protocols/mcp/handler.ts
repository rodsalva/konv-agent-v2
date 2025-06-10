import { appConfig } from '@/config/environment';
import { logger } from '@/utils/logger';
import { 
  MCPRequest, 
  MCPResponse, 
  MCPNotification, 
  MCPErrorCode,
  MCPInitializeParams,
  MCPInitializeResult,
  MCPLifecycleState,
  MCPCapability
} from '@/types/mcp.types';
import { v4 as uuidv4 } from 'uuid';

/**
 * MCP Protocol Handler
 * Implements MCP specification v2025-03-26
 */
export class MCPHandler {
  private state: MCPLifecycleState = 'initializing';
  private sessionId: string = uuidv4();
  private negotiatedCapabilities: MCPCapability[] = [];

  constructor() {
    logger.debug('MCP Handler created', { sessionId: this.sessionId });
  }

  /**
   * Process an incoming MCP request and generate a response
   */
  public async processRequest(request: MCPRequest): Promise<MCPResponse> {
    try {
      logger.debug('Processing MCP request', { 
        method: request.method, 
        id: request.id,
        sessionId: this.sessionId 
      });

      // Validate the request format
      if (request.jsonrpc !== '2.0') {
        return this.createErrorResponse(request.id, MCPErrorCode.InvalidRequest, 'Invalid JSON-RPC version');
      }

      // Handle based on method
      switch (request.method) {
        case 'initialize':
          return this.handleInitialize(request);

        case 'ping':
          return this.createSuccessResponse(request.id, { pong: new Date().toISOString() });

        case 'shutdown':
          return this.handleShutdown(request);

        default:
          // Handle other methods (tools, resources, etc.)
          if (this.state !== 'ready') {
            return this.createErrorResponse(
              request.id, 
              MCPErrorCode.InvalidRequest, 
              'MCP not initialized, call initialize first'
            );
          }
          
          if (request.method.startsWith('tools/')) {
            return this.handleToolRequest(request);
          } else if (request.method.startsWith('resources/')) {
            return this.handleResourceRequest(request);
          } else if (request.method.startsWith('prompts/')) {
            return this.handlePromptRequest(request);
          } else if (request.method.startsWith('sampling/')) {
            return this.handleSamplingRequest(request);
          }
          
          return this.createErrorResponse(request.id, MCPErrorCode.MethodNotFound, `Method not found: ${request.method}`);
      }
    } catch (error) {
      logger.error('Error processing MCP request', { error, request });
      return this.createErrorResponse(
        request.id, 
        MCPErrorCode.InternalError, 
        `Internal error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Create a notification to be sent to an agent
   */
  public createNotification(method: string, params?: Record<string, unknown>): MCPNotification {
    return {
      jsonrpc: '2.0',
      method: method as MCPNotification['method'],
      params
    };
  }

  /**
   * Handle the MCP initialization request
   */
  private handleInitialize(request: MCPRequest): MCPResponse {
    try {
      const params = request.params as MCPInitializeParams | undefined;
      
      // Negotiate capabilities
      const supportedCapabilities = appConfig.mcp.capabilities as MCPCapability[];
      const requestedCapabilities = params?.capabilities || supportedCapabilities;
      
      this.negotiatedCapabilities = requestedCapabilities.filter(
        cap => supportedCapabilities.includes(cap)
      );

      // Record agent info if provided
      if (params?.agentInfo) {
        logger.info('Agent initialized', { 
          agentInfo: params.agentInfo,
          sessionId: this.sessionId
        });
      }

      // Update state
      this.state = 'ready';
      
      // Create response with server info
      const result: MCPInitializeResult = {
        capabilities: this.negotiatedCapabilities,
        serverInfo: {
          name: appConfig.mcp.serverName,
          version: appConfig.mcp.serverVersion
        }
      };

      return this.createSuccessResponse(request.id, result);
    } catch (error) {
      logger.error('Error during MCP initialization', { error });
      this.state = 'error';
      return this.createErrorResponse(
        request.id, 
        MCPErrorCode.InternalError, 
        `Initialization error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Handle the MCP shutdown request
   */
  private handleShutdown(request: MCPRequest): MCPResponse {
    this.state = 'shutdown';
    logger.info('MCP session shutting down', { sessionId: this.sessionId });
    return this.createSuccessResponse(request.id, { success: true });
  }

  /**
   * Handle a tool request
   */
  private handleToolRequest(request: MCPRequest): MCPResponse {
    // Check if tools capability is negotiated
    if (!this.negotiatedCapabilities.includes('tools')) {
      return this.createErrorResponse(
        request.id,
        MCPErrorCode.CapabilityNotSupported,
        'Tools capability not negotiated during initialization'
      );
    }

    // Tool handling logic will be implemented in later phases
    logger.info('Tool request received', { method: request.method });
    return this.createErrorResponse(
      request.id,
      MCPErrorCode.MethodNotFound,
      'Tool implementation pending'
    );
  }

  /**
   * Handle a resource request
   */
  private handleResourceRequest(request: MCPRequest): MCPResponse {
    // Check if resources capability is negotiated
    if (!this.negotiatedCapabilities.includes('resources')) {
      return this.createErrorResponse(
        request.id,
        MCPErrorCode.CapabilityNotSupported,
        'Resources capability not negotiated during initialization'
      );
    }

    // Resource handling logic will be implemented in later phases
    logger.info('Resource request received', { method: request.method });
    return this.createErrorResponse(
      request.id,
      MCPErrorCode.MethodNotFound,
      'Resource implementation pending'
    );
  }

  /**
   * Handle a prompt request
   */
  private handlePromptRequest(request: MCPRequest): MCPResponse {
    // Check if prompts capability is negotiated
    if (!this.negotiatedCapabilities.includes('prompts')) {
      return this.createErrorResponse(
        request.id,
        MCPErrorCode.CapabilityNotSupported,
        'Prompts capability not negotiated during initialization'
      );
    }

    // Prompt handling logic will be implemented in later phases
    logger.info('Prompt request received', { method: request.method });
    return this.createErrorResponse(
      request.id,
      MCPErrorCode.MethodNotFound,
      'Prompt implementation pending'
    );
  }

  /**
   * Handle a sampling request
   */
  private handleSamplingRequest(request: MCPRequest): MCPResponse {
    // Check if sampling capability is negotiated
    if (!this.negotiatedCapabilities.includes('sampling')) {
      return this.createErrorResponse(
        request.id,
        MCPErrorCode.CapabilityNotSupported,
        'Sampling capability not negotiated during initialization'
      );
    }

    // Sampling handling logic will be implemented in later phases
    logger.info('Sampling request received', { method: request.method });
    return this.createErrorResponse(
      request.id,
      MCPErrorCode.MethodNotFound,
      'Sampling implementation pending'
    );
  }

  /**
   * Create a success response
   */
  private createSuccessResponse(id: string | number, result: Record<string, unknown>): MCPResponse {
    return {
      jsonrpc: '2.0',
      id,
      result
    };
  }

  /**
   * Create an error response
   */
  private createErrorResponse(id: string | number, code: number, message: string, data?: unknown): MCPResponse {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code,
        message,
        data
      }
    };
  }

  /**
   * Get the current state of the MCP handler
   */
  public getState(): MCPLifecycleState {
    return this.state;
  }

  /**
   * Get the negotiated capabilities
   */
  public getCapabilities(): MCPCapability[] {
    return [...this.negotiatedCapabilities];
  }

  /**
   * Get the session ID
   */
  public getSessionId(): string {
    return this.sessionId;
  }
}