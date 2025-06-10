/**
 * A2A Events Tests
 */
import { 
  publishAgentDiscovered,
  publishAgentConnecting,
  publishAgentConnected,
  publishAgentDisconnected,
  publishConnectionResult,
  publishStateChanged,
  publishMessageIncoming,
  publishMessageOutgoing,
  publishMessageDelivered,
  publishMessageFailed,
  publishTaskEvent,
  publishError,
  subscribeToA2AEvent,
  unsubscribeFromA2AEvent
} from '@/events/a2a-events';
import { eventBus } from '@/events/event-bus';
import { logger } from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { 
  AgentId, 
  SessionId, 
  ConversationId, 
  MessageId, 
  A2AErrorCode 
} from '@/types/a2a.types';

// Mock dependencies
jest.mock('@/events/event-bus', () => ({
  eventBus: {
    publish: jest.fn().mockResolvedValue(undefined),
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    getSubscribers: jest.fn().mockReturnValue({})
  }
}));

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

describe('A2A Events', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('publishAgentDiscovered', () => {
    it('should publish agent discovered event', async () => {
      const payload = {
        agentId: createAgentId('agent-123'),
        capabilities: ['messaging', 'task_execution']
      };
      
      const correlationId = 'correlation-123';
      
      await publishAgentDiscovered(payload, correlationId);
      
      expect(logger.debug).toHaveBeenCalledWith(
        'Publishing agent discovered event', 
        expect.objectContaining({ 
          agentId: payload.agentId,
          correlationId 
        })
      );
      
      expect(eventBus.publish).toHaveBeenCalledWith(
        'a2a:agent:discovered',
        payload,
        expect.objectContaining({
          publisher: 'a2a:events',
          correlationId
        })
      );
    });
  });
  
  describe('publishAgentConnecting', () => {
    it('should publish agent connecting event', async () => {
      const payload = {
        agentId: createAgentId('agent-123'),
        remoteAgentId: createAgentId('agent-456'),
        sessionId: createSessionId('session-123')
      };
      
      const correlationId = 'correlation-123';
      
      await publishAgentConnecting(payload, correlationId);
      
      expect(logger.debug).toHaveBeenCalledWith(
        'Publishing agent connecting event', 
        expect.objectContaining({ 
          agentId: payload.agentId,
          remoteAgentId: payload.remoteAgentId,
          sessionId: payload.sessionId,
          correlationId 
        })
      );
      
      expect(eventBus.publish).toHaveBeenCalledWith(
        'a2a:agent:connecting',
        payload,
        expect.objectContaining({
          publisher: 'a2a:events',
          correlationId
        })
      );
    });
  });
  
  describe('publishAgentConnected', () => {
    it('should publish agent connected event', async () => {
      const payload = {
        agentId: createAgentId('agent-123'),
        remoteAgentId: createAgentId('agent-456'),
        sessionId: createSessionId('session-123'),
        capabilities: ['messaging', 'task_execution']
      };
      
      const correlationId = 'correlation-123';
      
      await publishAgentConnected(payload, correlationId);
      
      expect(logger.info).toHaveBeenCalledWith(
        'Publishing agent connected event', 
        expect.objectContaining({ 
          agentId: payload.agentId,
          remoteAgentId: payload.remoteAgentId,
          sessionId: payload.sessionId,
          capabilities: payload.capabilities,
          correlationId 
        })
      );
      
      expect(eventBus.publish).toHaveBeenCalledWith(
        'a2a:agent:connected',
        payload,
        expect.objectContaining({
          publisher: 'a2a:events',
          correlationId
        })
      );
    });
  });
  
  describe('publishAgentDisconnected', () => {
    it('should publish agent disconnected event', async () => {
      const payload = {
        agentId: createAgentId('agent-123'),
        remoteAgentId: createAgentId('agent-456'),
        sessionId: createSessionId('session-123'),
        reason: 'Connection closed by remote agent'
      };
      
      const correlationId = 'correlation-123';
      
      await publishAgentDisconnected(payload, correlationId);
      
      expect(logger.info).toHaveBeenCalledWith(
        'Publishing agent disconnected event', 
        expect.objectContaining({ 
          agentId: payload.agentId,
          remoteAgentId: payload.remoteAgentId,
          sessionId: payload.sessionId,
          reason: payload.reason,
          correlationId 
        })
      );
      
      expect(eventBus.publish).toHaveBeenCalledWith(
        'a2a:agent:disconnected',
        payload,
        expect.objectContaining({
          publisher: 'a2a:events',
          correlationId
        })
      );
    });
  });
  
  describe('publishConnectionResult', () => {
    it('should publish connection result event for success', async () => {
      const payload = {
        agentId: createAgentId('agent-123'),
        remoteAgentId: createAgentId('agent-456'),
        sessionId: createSessionId('session-123'),
        success: true
      };
      
      const correlationId = 'correlation-123';
      
      await publishConnectionResult(payload, correlationId);
      
      expect(logger.info).toHaveBeenCalledWith(
        'Publishing connection result event', 
        expect.objectContaining({ 
          agentId: payload.agentId,
          remoteAgentId: payload.remoteAgentId,
          sessionId: payload.sessionId,
          success: true,
          correlationId 
        })
      );
      
      expect(eventBus.publish).toHaveBeenCalledWith(
        'a2a:connection:result',
        payload,
        expect.objectContaining({
          publisher: 'a2a:events',
          correlationId
        })
      );
    });
    
    it('should publish connection result event for failure', async () => {
      const payload = {
        agentId: createAgentId('agent-123'),
        remoteAgentId: createAgentId('agent-456'),
        sessionId: createSessionId('session-123'),
        success: false,
        error: {
          code: A2AErrorCode.ConnectionFailed,
          message: 'Failed to connect to remote agent',
          timestamp: new Date().toISOString()
        }
      };
      
      const correlationId = 'correlation-123';
      
      await publishConnectionResult(payload, correlationId);
      
      expect(logger.info).toHaveBeenCalledWith(
        'Publishing connection result event', 
        expect.objectContaining({ 
          agentId: payload.agentId,
          remoteAgentId: payload.remoteAgentId,
          sessionId: payload.sessionId,
          success: false,
          error: payload.error,
          correlationId 
        })
      );
      
      expect(eventBus.publish).toHaveBeenCalledWith(
        'a2a:connection:result',
        payload,
        expect.objectContaining({
          publisher: 'a2a:events',
          correlationId
        })
      );
    });
  });
  
  describe('publishStateChanged', () => {
    it('should publish state changed event', async () => {
      const payload = {
        agentId: createAgentId('agent-123'),
        oldState: 'connecting' as const,
        newState: 'ready' as const,
        sessionId: createSessionId('session-123')
      };
      
      const correlationId = 'correlation-123';
      
      await publishStateChanged(payload, correlationId);
      
      expect(logger.debug).toHaveBeenCalledWith(
        'Publishing state changed event', 
        expect.objectContaining({ 
          agentId: payload.agentId,
          oldState: payload.oldState,
          newState: payload.newState,
          sessionId: payload.sessionId,
          correlationId 
        })
      );
      
      expect(eventBus.publish).toHaveBeenCalledWith(
        'a2a:state:changed',
        payload,
        expect.objectContaining({
          publisher: 'a2a:events',
          correlationId
        })
      );
    });
  });
  
  describe('publishMessageIncoming', () => {
    it('should publish message incoming event', async () => {
      const messageId = createMessageId(uuidv4());
      const conversationId = createConversationId(uuidv4());
      const msgCorrelationId = 'msg-correlation-123';
      
      const payload = {
        message: {
          id: messageId,
          conversationId,
          fromAgent: createAgentId('agent-456'),
          toAgent: createAgentId('agent-123'),
          type: 'text' as const,
          content: 'Hello agent 123',
          timestamp: new Date().toISOString(),
          correlationId: msgCorrelationId
        }
      };
      
      const correlationId = 'correlation-123';
      
      await publishMessageIncoming(payload, correlationId);
      
      expect(logger.debug).toHaveBeenCalledWith(
        'Publishing message incoming event', 
        expect.objectContaining({ 
          messageId,
          conversationId,
          fromAgent: payload.message.fromAgent,
          toAgent: payload.message.toAgent,
          type: 'text',
          correlationId 
        })
      );
      
      expect(eventBus.publish).toHaveBeenCalledWith(
        'a2a:message:incoming',
        payload,
        expect.objectContaining({
          publisher: 'a2a:events',
          correlationId
        })
      );
    });
    
    it('should use message correlationId if event correlationId not provided', async () => {
      const messageId = createMessageId(uuidv4());
      const conversationId = createConversationId(uuidv4());
      const msgCorrelationId = 'msg-correlation-123';
      
      const payload = {
        message: {
          id: messageId,
          conversationId,
          fromAgent: createAgentId('agent-456'),
          toAgent: createAgentId('agent-123'),
          type: 'text' as const,
          content: 'Hello agent 123',
          timestamp: new Date().toISOString(),
          correlationId: msgCorrelationId
        }
      };
      
      await publishMessageIncoming(payload);
      
      expect(eventBus.publish).toHaveBeenCalledWith(
        'a2a:message:incoming',
        payload,
        expect.objectContaining({
          publisher: 'a2a:events',
          correlationId: msgCorrelationId
        })
      );
    });
  });
  
  describe('publishMessageOutgoing', () => {
    it('should publish message outgoing event', async () => {
      const messageId = createMessageId(uuidv4());
      const conversationId = createConversationId(uuidv4());
      
      const payload = {
        message: {
          id: messageId,
          conversationId,
          fromAgent: createAgentId('agent-123'),
          toAgent: createAgentId('agent-456'),
          type: 'json' as const,
          content: { key: 'value' },
          timestamp: new Date().toISOString()
        }
      };
      
      const correlationId = 'correlation-123';
      
      await publishMessageOutgoing(payload, correlationId);
      
      expect(logger.debug).toHaveBeenCalledWith(
        'Publishing message outgoing event', 
        expect.objectContaining({ 
          messageId,
          conversationId,
          fromAgent: payload.message.fromAgent,
          toAgent: payload.message.toAgent,
          type: 'json',
          correlationId 
        })
      );
      
      expect(eventBus.publish).toHaveBeenCalledWith(
        'a2a:message:outgoing',
        payload,
        expect.objectContaining({
          publisher: 'a2a:events',
          correlationId
        })
      );
    });
  });
  
  describe('publishMessageDelivered', () => {
    it('should publish message delivered event', async () => {
      const messageId = createMessageId(uuidv4());
      const conversationId = createConversationId(uuidv4());
      
      const payload = {
        messageId,
        conversationId,
        timestamp: new Date().toISOString()
      };
      
      const correlationId = 'correlation-123';
      
      await publishMessageDelivered(payload, correlationId);
      
      expect(logger.debug).toHaveBeenCalledWith(
        'Publishing message delivered event', 
        expect.objectContaining({ 
          messageId,
          conversationId,
          timestamp: payload.timestamp,
          correlationId 
        })
      );
      
      expect(eventBus.publish).toHaveBeenCalledWith(
        'a2a:message:delivered',
        payload,
        expect.objectContaining({
          publisher: 'a2a:events',
          correlationId
        })
      );
    });
  });
  
  describe('publishMessageFailed', () => {
    it('should publish message failed event', async () => {
      const messageId = createMessageId(uuidv4());
      const conversationId = createConversationId(uuidv4());
      
      const payload = {
        messageId,
        conversationId,
        error: {
          code: A2AErrorCode.MessageDeliveryFailed,
          message: 'Failed to deliver message',
          messageId,
          conversationId,
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      };
      
      const correlationId = 'correlation-123';
      
      await publishMessageFailed(payload, correlationId);
      
      expect(logger.warn).toHaveBeenCalledWith(
        'Publishing message failed event', 
        expect.objectContaining({ 
          messageId,
          conversationId,
          error: payload.error,
          timestamp: payload.timestamp,
          correlationId 
        })
      );
      
      expect(eventBus.publish).toHaveBeenCalledWith(
        'a2a:message:failed',
        payload,
        expect.objectContaining({
          publisher: 'a2a:events',
          correlationId
        })
      );
    });
  });
  
  describe('publishTaskEvent', () => {
    it('should publish task created event', async () => {
      const taskId = uuidv4();
      
      const payload = {
        taskId,
        agentId: createAgentId('agent-123'),
        status: 'created',
        timestamp: new Date().toISOString()
      };
      
      const correlationId = 'correlation-123';
      
      await publishTaskEvent('a2a:task:created', payload, correlationId);
      
      expect(logger.debug).toHaveBeenCalledWith(
        'Publishing a2a:task:created event', 
        expect.objectContaining({ 
          taskId,
          agentId: payload.agentId,
          status: payload.status,
          timestamp: payload.timestamp,
          correlationId 
        })
      );
      
      expect(eventBus.publish).toHaveBeenCalledWith(
        'a2a:task:created',
        payload,
        expect.objectContaining({
          publisher: 'a2a:events',
          correlationId
        })
      );
    });
    
    it('should publish task completed event', async () => {
      const taskId = uuidv4();
      
      const payload = {
        taskId,
        agentId: createAgentId('agent-123'),
        status: 'completed',
        timestamp: new Date().toISOString(),
        metadata: {
          duration: 1500,
          result: 'success'
        }
      };
      
      const correlationId = 'correlation-123';
      
      await publishTaskEvent('a2a:task:completed', payload, correlationId);
      
      expect(eventBus.publish).toHaveBeenCalledWith(
        'a2a:task:completed',
        payload,
        expect.objectContaining({
          publisher: 'a2a:events',
          correlationId
        })
      );
    });
  });
  
  describe('publishError', () => {
    it('should publish error event', async () => {
      const messageId = createMessageId(uuidv4());
      const conversationId = createConversationId(uuidv4());
      
      const payload = {
        error: {
          code: A2AErrorCode.InternalError,
          message: 'Internal server error',
          messageId,
          conversationId,
          timestamp: new Date().toISOString(),
          details: { reason: 'Database connection failed' }
        }
      };
      
      const correlationId = 'correlation-123';
      
      await publishError(payload, correlationId);
      
      expect(logger.error).toHaveBeenCalledWith(
        'Publishing error event', 
        expect.objectContaining({ 
          errorCode: payload.error.code,
          errorMessage: payload.error.message,
          conversationId,
          messageId,
          timestamp: payload.error.timestamp,
          correlationId 
        })
      );
      
      expect(eventBus.publish).toHaveBeenCalledWith(
        'a2a:error',
        payload,
        expect.objectContaining({
          publisher: 'a2a:events',
          correlationId
        })
      );
    });
  });
  
  describe('subscribeToA2AEvent', () => {
    it('should subscribe to A2A event', () => {
      const handler = jest.fn();
      
      subscribeToA2AEvent('a2a:message:incoming', handler);
      
      expect(eventBus.subscribe).toHaveBeenCalledWith(
        'a2a:message:incoming',
        handler
      );
      
      expect(logger.debug).toHaveBeenCalledWith(
        'Subscribed to a2a:message:incoming event'
      );
    });
  });
  
  describe('unsubscribeFromA2AEvent', () => {
    it('should unsubscribe from A2A event', () => {
      const handler = jest.fn();
      
      unsubscribeFromA2AEvent('a2a:message:incoming', handler);
      
      expect(eventBus.unsubscribe).toHaveBeenCalledWith(
        'a2a:message:incoming',
        handler
      );
      
      expect(logger.debug).toHaveBeenCalledWith(
        'Unsubscribed from a2a:message:incoming event'
      );
    });
  });
});