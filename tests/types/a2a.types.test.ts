/**
 * A2A Types Tests
 */
import { 
  A2AErrorCode,
  A2AMessage,
  A2ATextMessage,
  A2AJsonMessage,
  A2AControlMessage,
  A2ALifecycleState,
  A2ACapability,
  AgentCard,
  A2ASession,
  A2ANegotiationRequest,
  A2ANegotiationResponse
} from '@/types/a2a.types';
import { v4 as uuidv4 } from 'uuid';

// Helper to create branded types
const createAgentId = (id: string) => id as any;
const createSessionId = (id: string) => id as any;
const createMessageId = (id: string) => id as any;
const createConversationId = (id: string) => id as any;
const createAgentCardId = (id: string) => id as any;

describe('A2A Types', () => {
  describe('A2ALifecycleState', () => {
    it('should allow valid lifecycle states', () => {
      const validStates: A2ALifecycleState[] = [
        'discovering',
        'connecting',
        'negotiating',
        'ready',
        'error',
        'disconnected'
      ];
      
      validStates.forEach(state => {
        // TypeScript validation occurs at compile time
        // This is just a runtime check to ensure the values are as expected
        expect(validStates.includes(state)).toBe(true);
      });
    });
  });

  describe('A2ACapability', () => {
    it('should allow valid capabilities', () => {
      const validCapabilities: A2ACapability[] = [
        'messaging',
        'streaming',
        'file_transfer',
        'event_subscription',
        'agent_discovery',
        'task_execution'
      ];
      
      validCapabilities.forEach(capability => {
        expect(validCapabilities.includes(capability)).toBe(true);
      });
    });
  });

  describe('A2A Message Types', () => {
    const baseMessage: A2AMessage = {
      id: createMessageId(uuidv4()),
      conversationId: createConversationId(uuidv4()),
      fromAgent: createAgentId(uuidv4()),
      toAgent: createAgentId(uuidv4()),
      type: 'text',
      content: 'Test message',
      timestamp: new Date().toISOString(),
      correlationId: uuidv4()
    };

    it('should validate A2ATextMessage structure', () => {
      const textMessage: A2ATextMessage = {
        ...baseMessage,
        type: 'text',
        content: 'Hello, this is a text message'
      };
      
      expect(textMessage).toHaveProperty('id');
      expect(textMessage).toHaveProperty('conversationId');
      expect(textMessage).toHaveProperty('fromAgent');
      expect(textMessage).toHaveProperty('toAgent');
      expect(textMessage.type).toBe('text');
      expect(typeof textMessage.content).toBe('string');
    });

    it('should validate A2AJsonMessage structure', () => {
      const jsonMessage: A2AJsonMessage = {
        ...baseMessage,
        type: 'json',
        content: { key: 'value', nested: { data: true } }
      };
      
      expect(jsonMessage).toHaveProperty('id');
      expect(jsonMessage.type).toBe('json');
      expect(typeof jsonMessage.content).toBe('object');
      expect(jsonMessage.content).toHaveProperty('key', 'value');
      expect(jsonMessage.content).toHaveProperty('nested');
      expect(jsonMessage.content.nested).toHaveProperty('data', true);
    });

    it('should validate A2AControlMessage structure', () => {
      const controlMessage: A2AControlMessage = {
        ...baseMessage,
        type: 'control',
        content: {
          action: 'ping',
          data: { timestamp: new Date().toISOString() }
        }
      };
      
      expect(controlMessage).toHaveProperty('id');
      expect(controlMessage.type).toBe('control');
      expect(controlMessage.content).toHaveProperty('action', 'ping');
      expect(controlMessage.content).toHaveProperty('data');
      expect(typeof controlMessage.content.data).toBe('object');
    });
  });

  describe('AgentCard', () => {
    it('should validate AgentCard structure', () => {
      const agentCard: AgentCard = {
        id: createAgentCardId(uuidv4()),
        name: 'Test Agent',
        description: 'An agent for testing',
        version: '1.0.0',
        capabilities: ['messaging', 'agent_discovery'],
        skills: [
          {
            id: 'skill1',
            name: 'Test Skill',
            description: 'A skill for testing'
          }
        ],
        authentication: {
          type: 'apikey'
        },
        endpoints: {
          messaging: 'https://example.com/api/messaging',
          discovery: 'https://example.com/api/discovery'
        }
      };
      
      expect(agentCard).toHaveProperty('id');
      expect(agentCard).toHaveProperty('name', 'Test Agent');
      expect(agentCard).toHaveProperty('capabilities');
      expect(Array.isArray(agentCard.capabilities)).toBe(true);
      expect(agentCard.capabilities).toContain('messaging');
      expect(agentCard).toHaveProperty('skills');
      expect(Array.isArray(agentCard.skills)).toBe(true);
      expect(agentCard.skills[0]).toHaveProperty('id', 'skill1');
      expect(agentCard).toHaveProperty('authentication');
      expect(agentCard.authentication).toHaveProperty('type', 'apikey');
      expect(agentCard).toHaveProperty('endpoints');
      expect(agentCard.endpoints).toHaveProperty('messaging');
    });
  });

  describe('A2ASession', () => {
    it('should validate A2ASession structure', () => {
      const session: A2ASession = {
        id: createSessionId(uuidv4()),
        agentId: createAgentId(uuidv4()),
        remoteAgentId: createAgentId(uuidv4()),
        state: 'ready',
        capabilities: ['messaging', 'task_execution'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString(),
        metadata: {
          initiatedBy: 'agent1',
          purpose: 'testing'
        }
      };
      
      expect(session).toHaveProperty('id');
      expect(session).toHaveProperty('agentId');
      expect(session).toHaveProperty('remoteAgentId');
      expect(session).toHaveProperty('state', 'ready');
      expect(session).toHaveProperty('capabilities');
      expect(Array.isArray(session.capabilities)).toBe(true);
      expect(session.capabilities).toContain('messaging');
      expect(session).toHaveProperty('createdAt');
      expect(session).toHaveProperty('updatedAt');
      expect(session).toHaveProperty('lastActivityAt');
      expect(session).toHaveProperty('metadata');
      expect(session.metadata).toHaveProperty('initiatedBy', 'agent1');
    });
  });

  describe('A2A Negotiation', () => {
    it('should validate A2ANegotiationRequest structure', () => {
      const request: A2ANegotiationRequest = {
        agentId: createAgentId(uuidv4()),
        capabilities: ['messaging', 'task_execution'],
        supportedMessageTypes: ['text', 'json', 'control'],
        metadata: {
          maxMessageSize: 1048576
        }
      };
      
      expect(request).toHaveProperty('agentId');
      expect(request).toHaveProperty('capabilities');
      expect(Array.isArray(request.capabilities)).toBe(true);
      expect(request.capabilities).toContain('messaging');
      expect(request).toHaveProperty('supportedMessageTypes');
      expect(Array.isArray(request.supportedMessageTypes)).toBe(true);
      expect(request.supportedMessageTypes).toContain('text');
      expect(request).toHaveProperty('metadata');
      expect(request.metadata).toHaveProperty('maxMessageSize', 1048576);
    });

    it('should validate A2ANegotiationResponse structure', () => {
      const response: A2ANegotiationResponse = {
        agentId: createAgentId(uuidv4()),
        accepted: true,
        capabilities: ['messaging'],
        supportedMessageTypes: ['text', 'json'],
        sessionId: createSessionId(uuidv4()),
        metadata: {
          maxMessageSize: 524288
        }
      };
      
      expect(response).toHaveProperty('agentId');
      expect(response).toHaveProperty('accepted', true);
      expect(response).toHaveProperty('capabilities');
      expect(Array.isArray(response.capabilities)).toBe(true);
      expect(response.capabilities).toContain('messaging');
      expect(response).toHaveProperty('supportedMessageTypes');
      expect(Array.isArray(response.supportedMessageTypes)).toBe(true);
      expect(response.supportedMessageTypes).toContain('text');
      expect(response).toHaveProperty('sessionId');
      expect(response).toHaveProperty('metadata');
      expect(response.metadata).toHaveProperty('maxMessageSize', 524288);
    });

    it('should validate rejection in A2ANegotiationResponse', () => {
      const rejectionResponse: A2ANegotiationResponse = {
        agentId: createAgentId(uuidv4()),
        accepted: false,
        capabilities: [],
        supportedMessageTypes: [],
        error: {
          code: 'CAPABILITY_NOT_SUPPORTED',
          message: 'Required capabilities not supported'
        }
      };
      
      expect(rejectionResponse).toHaveProperty('agentId');
      expect(rejectionResponse).toHaveProperty('accepted', false);
      expect(rejectionResponse).toHaveProperty('capabilities');
      expect(rejectionResponse.capabilities.length).toBe(0);
      expect(rejectionResponse).toHaveProperty('error');
      expect(rejectionResponse.error).toHaveProperty('code', 'CAPABILITY_NOT_SUPPORTED');
      expect(rejectionResponse.error).toHaveProperty('message');
    });
  });

  describe('A2AErrorCode', () => {
    it('should define standard error codes', () => {
      expect(A2AErrorCode.ConnectionFailed).toBe('CONNECTION_FAILED');
      expect(A2AErrorCode.InvalidMessage).toBe('INVALID_MESSAGE');
      expect(A2AErrorCode.AgentNotFound).toBe('AGENT_NOT_FOUND');
      expect(A2AErrorCode.TaskExecutionFailed).toBe('TASK_EXECUTION_FAILED');
      expect(A2AErrorCode.InternalError).toBe('INTERNAL_ERROR');
    });
  });
});