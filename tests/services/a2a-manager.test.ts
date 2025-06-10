/**
 * A2A Manager Service Tests
 */
import { A2AManagerService } from '@/services/a2a-manager';
import { db } from '@/services/database';
import { 
  AgentId, 
  A2AMessage,
  A2ATextMessage,
  A2AErrorCode,
  SessionId,
  ConversationId,
  MessageId
} from '@/types/a2a.types';
import { eventBus } from '@/events/event-bus';
import { A2AHandler } from '@/protocols/a2a/handler';
import { v4 as uuidv4 } from 'uuid';

// Mock dependencies
jest.mock('@/services/database', () => ({
  db: {
    createSession: jest.fn().mockResolvedValue(true),
    updateSession: jest.fn().mockResolvedValue(true),
    createMessage: jest.fn().mockResolvedValue(true),
    createConversation: jest.fn().mockResolvedValue(true),
    createErrorLog: jest.fn().mockResolvedValue(true),
  }
}));

jest.mock('@/events/event-bus', () => ({
  eventBus: {
    publish: jest.fn().mockResolvedValue(undefined),
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    getSubscribers: jest.fn().mockReturnValue({})
  }
}));

jest.mock('@/protocols/a2a/handler');

// Mock logger
jest.mock('@/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

// Helper to create branded types
const createAgentId = (id: string) => id as AgentId;
const createSessionId = (id: string) => id as SessionId;
const createConversationId = (id: string) => id as ConversationId;
const createMessageId = (id: string) => id as MessageId;

describe('A2A Manager Service', () => {
  let a2aManager: A2AManagerService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset singleton
    jest.spyOn(A2AManagerService as any, 'instance', 'get').mockReturnValue(undefined);
    
    a2aManager = A2AManagerService.getInstance();
  });
  
  describe('initialization', () => {
    it('should be a singleton', () => {
      const instance1 = A2AManagerService.getInstance();
      const instance2 = A2AManagerService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
    
    it('should initialize only once', async () => {
      await a2aManager.initialize();
      await a2aManager.initialize();
      
      // The second initialization should log a warning
      expect(require('@/utils/logger').logger.warn).toHaveBeenCalledWith(
        'A2A Manager Service already initialized'
      );
    });
    
    it('should set up event subscriptions during initialization', async () => {
      await a2aManager.initialize();
      
      // Check that it subscribed to relevant events
      expect(eventBus.subscribe).toHaveBeenCalledWith(
        'a2a:message:incoming', 
        expect.any(Function)
      );
      
      expect(eventBus.subscribe).toHaveBeenCalledWith(
        'a2a:message:outgoing', 
        expect.any(Function)
      );
      
      expect(eventBus.subscribe).toHaveBeenCalledWith(
        'a2a:agent:discovered', 
        expect.any(Function)
      );
      
      expect(eventBus.subscribe).toHaveBeenCalledWith(
        'a2a:agent:disconnected', 
        expect.any(Function)
      );
      
      expect(eventBus.subscribe).toHaveBeenCalledWith(
        'a2a:error', 
        expect.any(Function)
      );
    });
  });
  
  describe('handler management', () => {
    it('should create a new handler when needed', async () => {
      const agentId = createAgentId('agent-123');
      
      // A2AHandler constructor is mocked and should be called
      const handler = await a2aManager.getOrCreateHandler(agentId);
      
      expect(A2AHandler).toHaveBeenCalledWith(agentId);
      expect(handler).toBeDefined();
    });
    
    it('should reuse existing handlers', async () => {
      const agentId = createAgentId('agent-123');
      
      // Get handler the first time - should create
      await a2aManager.getOrCreateHandler(agentId);
      
      // Reset mock to track next call
      (A2AHandler as jest.Mock).mockClear();
      
      // Get handler the second time - should not create
      await a2aManager.getOrCreateHandler(agentId);
      
      // Constructor should not be called again
      expect(A2AHandler).not.toHaveBeenCalled();
    });
  });
  
  describe('agent operations', () => {
    beforeEach(async () => {
      await a2aManager.initialize();
    });
    
    it('should handle connecting to an agent', async () => {
      const agentId = createAgentId('agent-123');
      const remoteAgentId = createAgentId('agent-456');
      
      const mockHandler = {
        getState: jest.fn().mockReturnValue('discovering'),
        getSessionId: jest.fn().mockReturnValue(createSessionId('session-123')),
      };
      
      // Mock getOrCreateHandler to return our mock handler
      jest.spyOn(a2aManager as any, 'getOrCreateHandler').mockResolvedValue(mockHandler);
      
      const result = await a2aManager.connectToAgent(agentId, remoteAgentId);
      
      expect(result).toBe(true);
      expect(eventBus.publish).toHaveBeenCalledWith(
        'a2a:agent:discovered',
        expect.objectContaining({
          agentId: remoteAgentId
        }),
        expect.anything()
      );
    });
    
    it('should not connect if agent is already in an active state', async () => {
      const agentId = createAgentId('agent-123');
      const remoteAgentId = createAgentId('agent-456');
      
      const mockHandler = {
        getState: jest.fn().mockReturnValue('ready'),
        getSessionId: jest.fn().mockReturnValue(createSessionId('session-123')),
      };
      
      // Mock getOrCreateHandler to return our mock handler
      jest.spyOn(a2aManager as any, 'getOrCreateHandler').mockResolvedValue(mockHandler);
      
      const result = await a2aManager.connectToAgent(agentId, remoteAgentId);
      
      expect(result).toBe(false);
      expect(require('@/utils/logger').logger.warn).toHaveBeenCalled();
    });
    
    it('should handle capability negotiation', async () => {
      const agentId = createAgentId('agent-123');
      const remoteAgentId = createAgentId('agent-456');
      const sessionId = createSessionId('session-123');
      
      const mockHandler = {
        negotiateCapabilities: jest.fn().mockResolvedValue({
          agentId,
          accepted: true,
          capabilities: ['messaging', 'agent_discovery'],
          supportedMessageTypes: ['text', 'json', 'control'],
          sessionId
        }),
        getSessionId: jest.fn().mockReturnValue(sessionId),
      };
      
      // Mock getOrCreateHandler to return our mock handler
      jest.spyOn(a2aManager as any, 'getOrCreateHandler').mockResolvedValue(mockHandler);
      
      const request = {
        agentId: remoteAgentId,
        capabilities: ['messaging', 'agent_discovery'],
        supportedMessageTypes: ['text', 'json', 'control']
      };
      
      const response = await a2aManager.negotiateCapabilities(agentId, remoteAgentId, request);
      
      expect(response.accepted).toBe(true);
      expect(response.capabilities).toContain('messaging');
      expect(response.capabilities).toContain('agent_discovery');
      expect(response.sessionId).toBe(sessionId);
      
      // Should store session in database
      expect(db.createSession).toHaveBeenCalledWith(expect.objectContaining({
        session_id: sessionId,
        agent_id: agentId,
        remote_agent_id: remoteAgentId,
        state: 'ready'
      }));
      
      // Should publish agent connected event
      expect(eventBus.publish).toHaveBeenCalledWith(
        'a2a:agent:connected',
        expect.objectContaining({
          agentId,
          remoteAgentId,
          sessionId,
          capabilities: expect.arrayContaining(['messaging', 'agent_discovery'])
        }),
        expect.anything()
      );
    });
    
    it('should handle agent disconnection', async () => {
      const agentId = createAgentId('agent-123');
      
      const mockHandler = {
        disconnect: jest.fn().mockResolvedValue(undefined),
      };
      
      // Setup mock handlers map
      Object.defineProperty(a2aManager, 'handlers', {
        value: new Map([[agentId, mockHandler]]),
        writable: true
      });
      
      const result = await a2aManager.disconnectAgent(agentId);
      
      expect(result).toBe(true);
      expect(mockHandler.disconnect).toHaveBeenCalled();
      
      // Should remove handler from map
      expect((a2aManager as any).handlers.has(agentId)).toBe(false);
    });
  });
  
  describe('message handling', () => {
    beforeEach(async () => {
      await a2aManager.initialize();
    });
    
    it('should send messages', async () => {
      const agentId = createAgentId('agent-123');
      const remoteAgentId = createAgentId('agent-456');
      
      const mockHandler = {
        sendMessage: jest.fn().mockResolvedValue(true),
      };
      
      // Mock getOrCreateHandler to return our mock handler
      jest.spyOn(a2aManager as any, 'getOrCreateHandler').mockResolvedValue(mockHandler);
      
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
      
      const result = await a2aManager.sendMessage(message);
      
      expect(result).toBe(true);
      expect(mockHandler.sendMessage).toHaveBeenCalledWith(message);
    });
    
    it('should handle message sending errors', async () => {
      const agentId = createAgentId('agent-123');
      const remoteAgentId = createAgentId('agent-456');
      
      const mockHandler = {
        sendMessage: jest.fn().mockRejectedValue(new Error('Send error')),
      };
      
      // Mock getOrCreateHandler to return our mock handler
      jest.spyOn(a2aManager as any, 'getOrCreateHandler').mockResolvedValue(mockHandler);
      
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
      
      const result = await a2aManager.sendMessage(message);
      
      expect(result).toBe(false);
      
      // Should publish error
      expect(eventBus.publish).toHaveBeenCalledWith(
        'a2a:error',
        expect.objectContaining({
          error: expect.objectContaining({
            code: A2AErrorCode.MessageDeliveryFailed,
            messageId: message.id,
            conversationId: message.conversationId
          })
        }),
        expect.anything()
      );
    });
    
    it('should process incoming messages', async () => {
      // Setup to trigger the event handler
      const messageHandler = (eventBus.subscribe as jest.Mock).mock.calls.find(
        call => call[0] === 'a2a:message:incoming'
      )[1];
      
      const agentId = createAgentId('agent-123');
      const remoteAgentId = createAgentId('agent-456');
      
      const mockHandler = {
        handleIncomingMessage: jest.fn().mockResolvedValue(undefined),
      };
      
      // Mock getOrCreateHandler to return our mock handler
      jest.spyOn(a2aManager as any, 'getOrCreateHandler').mockResolvedValue(mockHandler);
      
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
      
      // Trigger the event handler
      await messageHandler({ message });
      
      expect(mockHandler.handleIncomingMessage).toHaveBeenCalledWith(message);
      
      // Should store message in database
      expect(db.createMessage).toHaveBeenCalledWith(expect.objectContaining({
        message_id: message.id,
        conversation_id: message.conversationId,
        from_agent_id: message.fromAgent,
        to_agent_id: message.toAgent,
        message_type: message.type,
        status: 'received'
      }));
      
      // Should publish message delivered event
      expect(eventBus.publish).toHaveBeenCalledWith(
        'a2a:message:delivered',
        expect.objectContaining({
          messageId: message.id,
          conversationId: message.conversationId
        }),
        expect.anything()
      );
    });
  });
  
  describe('conversation management', () => {
    beforeEach(async () => {
      await a2aManager.initialize();
    });
    
    it('should create conversations', async () => {
      const agentId = createAgentId('agent-123');
      const remoteAgentId = createAgentId('agent-456');
      const conversationId = createConversationId('conversation-123');
      
      const mockHandler = {
        createConversation: jest.fn().mockReturnValue(conversationId),
      };
      
      // Mock getOrCreateHandler to return our mock handler
      jest.spyOn(a2aManager as any, 'getOrCreateHandler').mockResolvedValue(mockHandler);
      
      const result = await a2aManager.createConversation(agentId, remoteAgentId);
      
      expect(result).toBe(conversationId);
      expect(mockHandler.createConversation).toHaveBeenCalledWith(remoteAgentId);
      
      // Should store conversation in database
      expect(db.createConversation).toHaveBeenCalledWith(expect.objectContaining({
        conversation_id: conversationId,
        agent_id: agentId,
        remote_agent_id: remoteAgentId,
        status: 'active'
      }));
    });
  });
  
  describe('session management', () => {
    beforeEach(async () => {
      await a2aManager.initialize();
    });
    
    it('should track active sessions', async () => {
      const sessionId = createSessionId('session-123');
      const agentId = createAgentId('agent-123');
      const remoteAgentId = createAgentId('agent-456');
      
      // Set up session data
      Object.defineProperty(a2aManager, 'sessions', {
        value: new Map([[sessionId, { agentId, remoteAgentId }]]),
        writable: true
      });
      
      const sessions = a2aManager.getActiveSessions();
      expect(sessions).toContain(sessionId);
      
      const sessionInfo = a2aManager.getSessionInfo(sessionId);
      expect(sessionInfo).toEqual({ agentId, remoteAgentId });
    });
    
    it('should handle disconnection events', async () => {
      // Setup to trigger the event handler
      const disconnectHandler = (eventBus.subscribe as jest.Mock).mock.calls.find(
        call => call[0] === 'a2a:agent:disconnected'
      )[1];
      
      const sessionId = createSessionId('session-123');
      const agentId = createAgentId('agent-123');
      const remoteAgentId = createAgentId('agent-456');
      
      // Set up session data
      Object.defineProperty(a2aManager, 'sessions', {
        value: new Map([[sessionId, { agentId, remoteAgentId }]]),
        writable: true
      });
      
      // Trigger the event handler
      await disconnectHandler({ agentId, remoteAgentId, sessionId });
      
      // Should remove the session
      expect((a2aManager as any).sessions.has(sessionId)).toBe(false);
      
      // Should update session in database
      expect(db.updateSession).toHaveBeenCalledWith(expect.objectContaining({
        session_id: sessionId,
        status: 'disconnected'
      }));
    });
  });
  
  describe('error handling', () => {
    beforeEach(async () => {
      await a2aManager.initialize();
    });
    
    it('should log and store errors', async () => {
      // Setup to trigger the event handler
      const errorHandler = (eventBus.subscribe as jest.Mock).mock.calls.find(
        call => call[0] === 'a2a:error'
      )[1];
      
      const error = {
        code: A2AErrorCode.InternalError,
        message: 'Test error',
        timestamp: new Date().toISOString(),
        correlationId: uuidv4()
      };
      
      // Trigger the event handler
      await errorHandler({ error });
      
      // Should log the error
      expect(require('@/utils/logger').logger.error).toHaveBeenCalledWith(
        'A2A error occurred',
        expect.objectContaining({
          code: error.code,
          message: error.message
        })
      );
      
      // Should store error in database
      expect(db.createErrorLog).toHaveBeenCalledWith(expect.objectContaining({
        error_code: error.code,
        error_message: error.message,
        timestamp: expect.any(String)
      }));
    });
  });
});