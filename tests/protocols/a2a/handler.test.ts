/**
 * A2A Protocol Handler Tests
 */
import { A2AHandler } from '@/protocols/a2a/handler';
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
import { eventBus } from '@/events/event-bus';
import { v4 as uuidv4 } from 'uuid';

// Mock event bus
jest.mock('@/events/event-bus', () => ({
  eventBus: {
    publish: jest.fn().mockResolvedValue(undefined),
    subscribe: jest.fn().mockImplementation((event, handler) => {
      // Store handler for testing
      mockEventHandlers[event] = handler;
      return jest.fn();
    }),
    unsubscribe: jest.fn(),
    getSubscribers: jest.fn().mockReturnValue({})
  }
}));

// Mock logger
jest.mock('@/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

// Storage for event handlers
const mockEventHandlers: Record<string, Function> = {};

// Helper to create branded types
const createAgentId = (id: string) => id as AgentId;
const createMessageId = (id: string) => id as MessageId;
const createConversationId = (id: string) => id as ConversationId;

describe('A2AHandler', () => {
  let handler: A2AHandler;
  const agentId = createAgentId('agent-123');
  const remoteAgentId = createAgentId('agent-456');
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear event handlers
    Object.keys(mockEventHandlers).forEach(key => delete mockEventHandlers[key]);
    
    handler = new A2AHandler(agentId);
  });
  
  describe('initialization', () => {
    it('should initialize with correct state', () => {
      expect(handler.getState()).toBe('discovering');
      expect(handler.getSessionId()).toBeDefined();
      expect(handler.getAgentId()).toBe(agentId);
      expect(handler.getRemoteAgentId()).toBeUndefined();
      expect(handler.getCapabilities()).toEqual([]);
      expect(handler.getActiveConversations()).toEqual([]);
    });
    
    it('should register event handlers on initialization', () => {
      expect(eventBus.subscribe).toHaveBeenCalledWith(
        'a2a:agent:discovered',
        expect.any(Function)
      );
      expect(eventBus.subscribe).toHaveBeenCalledWith(
        'a2a:connection:result',
        expect.any(Function)
      );
    });
  });
  
  describe('handleAgentDiscovered', () => {
    it('should handle agent discovery and initiate connection', async () => {
      // Trigger agent discovery event
      await mockEventHandlers['a2a:agent:discovered']({ agentId: remoteAgentId });
      
      // Check that connection was initiated
      expect(eventBus.publish).toHaveBeenCalledWith(
        'a2a:message:outgoing',
        expect.objectContaining({
          fromAgent: agentId,
          toAgent: remoteAgentId,
          type: 'control',
          content: expect.objectContaining({
            action: 'connect'
          })
        }),
        expect.anything()
      );
    });
  });
  
  describe('capability negotiation', () => {
    beforeEach(async () => {
      // Simulate connection established
      await mockEventHandlers['a2a:connection:result']({ 
        agentId: remoteAgentId, 
        success: true 
      });
      
      // Handler should now be in negotiating state
      expect(handler.getState()).toBe('negotiating');
    });
    
    it('should successfully negotiate capabilities', async () => {
      const request: A2ANegotiationRequest = {
        agentId: remoteAgentId,
        capabilities: ['messaging', 'agent_discovery'],
        supportedMessageTypes: ['text', 'json', 'control']
      };
      
      const response = await handler.negotiateCapabilities(remoteAgentId, request.capabilities);
      
      expect(response.accepted).toBe(true);
      expect(response.capabilities).toContain('messaging');
      expect(response.capabilities).toContain('agent_discovery');
      expect(response.supportedMessageTypes).toContain('text');
      expect(response.supportedMessageTypes).toContain('json');
      expect(response.supportedMessageTypes).toContain('control');
      expect(response.sessionId).toBe(handler.getSessionId());
      
      // Handler should now be in ready state
      expect(handler.getState()).toBe('ready');
    });
    
    it('should reject negotiation if capabilities do not match', async () => {
      const request: A2ANegotiationRequest = {
        agentId: remoteAgentId,
        capabilities: ['unknown_capability'] as A2ACapability[],
        supportedMessageTypes: ['text']
      };
      
      const response = await handler.negotiateCapabilities(remoteAgentId, request.capabilities);
      
      expect(response.accepted).toBe(false);
      expect(response.capabilities).toEqual([]);
      expect(response.error).toBeDefined();
      expect(response.error?.code).toBe('NO_MATCHING_CAPABILITIES');
      
      // Handler should now be in error state
      expect(handler.getState()).toBe('error');
    });
    
    it('should reject negotiation if agent IDs do not match', async () => {
      const wrongAgentId = createAgentId('wrong-agent');
      
      const response = await handler.negotiateCapabilities(wrongAgentId, ['messaging']);
      
      expect(response.accepted).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error?.code).toBe('INVALID_AGENT');
    });
  });
  
  describe('message handling', () => {
    // Setup handler to ready state
    beforeEach(async () => {
      // Simulate connection established
      await mockEventHandlers['a2a:connection:result']({ 
        agentId: remoteAgentId, 
        success: true 
      });
      
      // Simulate capability negotiation
      await handler.negotiateCapabilities(remoteAgentId, ['messaging']);
      
      // Set remote agent ID
      Object.defineProperty(handler, 'remoteAgentId', { value: remoteAgentId });
      
      // Handler should now be in ready state
      expect(handler.getState()).toBe('ready');
    });
    
    it('should send text message', async () => {
      const message: A2ATextMessage = {
        id: createMessageId(uuidv4()),
        conversationId: createConversationId(uuidv4()),
        fromAgent: agentId,
        toAgent: remoteAgentId,
        type: 'text',
        content: 'Hello, remote agent!',
        timestamp: new Date().toISOString(),
        correlationId: uuidv4()
      };
      
      const result = await handler.sendMessage(message);
      
      expect(result).toBe(true);
      expect(eventBus.publish).toHaveBeenCalledWith(
        'a2a:message:outgoing',
        message,
        expect.anything()
      );
    });
    
    it('should send JSON message', async () => {
      const message: A2AJsonMessage = {
        id: createMessageId(uuidv4()),
        conversationId: createConversationId(uuidv4()),
        fromAgent: agentId,
        toAgent: remoteAgentId,
        type: 'json',
        content: { key: 'value', nested: { data: true } },
        timestamp: new Date().toISOString(),
        correlationId: uuidv4()
      };
      
      const result = await handler.sendMessage(message);
      
      expect(result).toBe(true);
      expect(eventBus.publish).toHaveBeenCalledWith(
        'a2a:message:outgoing',
        message,
        expect.anything()
      );
    });
    
    it('should handle incoming text message', async () => {
      const message: A2ATextMessage = {
        id: createMessageId(uuidv4()),
        conversationId: createConversationId(uuidv4()),
        fromAgent: remoteAgentId,
        toAgent: agentId,
        type: 'text',
        content: 'Hello from remote agent!',
        timestamp: new Date().toISOString(),
        correlationId: uuidv4()
      };
      
      await handler.handleIncomingMessage(message);
      
      expect(eventBus.publish).toHaveBeenCalledWith(
        'a2a:message:incoming',
        message,
        expect.anything()
      );
    });
    
    it('should reject invalid messages', async () => {
      const invalidMessage = {
        id: createMessageId(uuidv4()),
        conversationId: createConversationId(uuidv4()),
        fromAgent: remoteAgentId,
        toAgent: agentId,
        type: 'text',
        // Missing content field
        timestamp: new Date().toISOString(),
        correlationId: uuidv4()
      } as A2AMessage;
      
      await handler.handleIncomingMessage(invalidMessage);
      
      // Should publish error event
      expect(eventBus.publish).toHaveBeenCalledWith(
        'a2a:error',
        expect.objectContaining({
          code: 'MESSAGE_VALIDATION_FAILED'
        }),
        expect.anything()
      );
    });
    
    it('should register and use custom message handler', async () => {
      const customHandler = jest.fn().mockResolvedValue(undefined);
      
      // Register custom handler
      handler.registerMessageHandler('text', customHandler);
      
      const message: A2ATextMessage = {
        id: createMessageId(uuidv4()),
        conversationId: createConversationId(uuidv4()),
        fromAgent: remoteAgentId,
        toAgent: agentId,
        type: 'text',
        content: 'Custom handler test',
        timestamp: new Date().toISOString(),
        correlationId: uuidv4()
      };
      
      await handler.handleIncomingMessage(message);
      
      // Custom handler should be called
      expect(customHandler).toHaveBeenCalledWith(message);
    });
  });
  
  describe('control message handling', () => {
    it('should handle connection request', async () => {
      const message: A2AControlMessage = {
        id: createMessageId(uuidv4()),
        conversationId: createConversationId(uuidv4()),
        fromAgent: remoteAgentId,
        toAgent: agentId,
        type: 'control',
        content: {
          action: 'connect',
          data: {
            sessionId: 'remote-session-123'
          }
        },
        timestamp: new Date().toISOString(),
        correlationId: uuidv4()
      };
      
      await handler.handleIncomingMessage(message);
      
      // Should respond with ack message
      expect(eventBus.publish).toHaveBeenCalledWith(
        'a2a:message:outgoing',
        expect.objectContaining({
          fromAgent: agentId,
          toAgent: remoteAgentId,
          type: 'control',
          content: expect.objectContaining({
            action: 'ack'
          })
        }),
        expect.anything()
      );
      
      // Handler should now be in negotiating state
      expect(handler.getState()).toBe('negotiating');
    });
    
    it('should handle ping message', async () => {
      const message: A2AControlMessage = {
        id: createMessageId(uuidv4()),
        conversationId: createConversationId(uuidv4()),
        fromAgent: remoteAgentId,
        toAgent: agentId,
        type: 'control',
        content: {
          action: 'ping',
          data: {
            timestamp: new Date().toISOString()
          }
        },
        timestamp: new Date().toISOString(),
        correlationId: uuidv4()
      };
      
      await handler.handleIncomingMessage(message);
      
      // Should respond with ack message
      expect(eventBus.publish).toHaveBeenCalledWith(
        'a2a:message:outgoing',
        expect.objectContaining({
          fromAgent: agentId,
          toAgent: remoteAgentId,
          type: 'control',
          content: expect.objectContaining({
            action: 'ack',
            data: expect.objectContaining({
              forMessage: message.id
            })
          })
        }),
        expect.anything()
      );
    });
  });
  
  describe('disconnection', () => {
    // Setup handler to ready state
    beforeEach(async () => {
      // Simulate connection established
      await mockEventHandlers['a2a:connection:result']({ 
        agentId: remoteAgentId, 
        success: true 
      });
      
      // Simulate capability negotiation
      await handler.negotiateCapabilities(remoteAgentId, ['messaging']);
      
      // Set remote agent ID
      Object.defineProperty(handler, 'remoteAgentId', { value: remoteAgentId });
      
      // Handler should be in ready state
      expect(handler.getState()).toBe('ready');
    });
    
    it('should handle disconnect request from remote agent', async () => {
      const message: A2AControlMessage = {
        id: createMessageId(uuidv4()),
        conversationId: createConversationId(uuidv4()),
        fromAgent: remoteAgentId,
        toAgent: agentId,
        type: 'control',
        content: {
          action: 'disconnect',
          data: {
            reason: 'Test disconnection'
          }
        },
        timestamp: new Date().toISOString(),
        correlationId: uuidv4()
      };
      
      await handler.handleIncomingMessage(message);
      
      // Should respond with ack message
      expect(eventBus.publish).toHaveBeenCalledWith(
        'a2a:message:outgoing',
        expect.objectContaining({
          fromAgent: agentId,
          toAgent: remoteAgentId,
          type: 'control',
          content: expect.objectContaining({
            action: 'ack'
          })
        }),
        expect.anything()
      );
      
      // Should publish disconnection event
      expect(eventBus.publish).toHaveBeenCalledWith(
        'a2a:agent:disconnected',
        expect.objectContaining({
          agentId,
          remoteAgentId
        }),
        expect.anything()
      );
      
      // Handler should now be in disconnected state
      expect(handler.getState()).toBe('disconnected');
    });
    
    it('should initiate disconnect', async () => {
      await handler.disconnect();
      
      // Should send disconnect message
      expect(eventBus.publish).toHaveBeenCalledWith(
        'a2a:message:outgoing',
        expect.objectContaining({
          fromAgent: agentId,
          toAgent: remoteAgentId,
          type: 'control',
          content: expect.objectContaining({
            action: 'disconnect'
          })
        }),
        expect.anything()
      );
      
      // Should publish disconnection event
      expect(eventBus.publish).toHaveBeenCalledWith(
        'a2a:agent:disconnected',
        expect.objectContaining({
          agentId,
          remoteAgentId
        }),
        expect.anything()
      );
      
      // Handler should now be in disconnected state
      expect(handler.getState()).toBe('disconnected');
    });
  });
  
  describe('conversation management', () => {
    // Setup handler to ready state
    beforeEach(async () => {
      // Simulate connection established
      await mockEventHandlers['a2a:connection:result']({ 
        agentId: remoteAgentId, 
        success: true 
      });
      
      // Simulate capability negotiation
      await handler.negotiateCapabilities(remoteAgentId, ['messaging']);
      
      // Set remote agent ID
      Object.defineProperty(handler, 'remoteAgentId', { value: remoteAgentId });
      
      // Handler should be in ready state
      expect(handler.getState()).toBe('ready');
    });
    
    it('should create new conversation', () => {
      const conversationId = handler.createConversation(remoteAgentId);
      
      expect(conversationId).toBeDefined();
      expect(handler.getActiveConversations()).toContain(conversationId);
    });
    
    it('should track conversations from messages', async () => {
      const conversationId = createConversationId(uuidv4());
      
      const message: A2ATextMessage = {
        id: createMessageId(uuidv4()),
        conversationId,
        fromAgent: agentId,
        toAgent: remoteAgentId,
        type: 'text',
        content: 'Test conversation tracking',
        timestamp: new Date().toISOString(),
        correlationId: uuidv4()
      };
      
      await handler.sendMessage(message);
      
      expect(handler.getActiveConversations()).toContain(conversationId);
    });
  });
});