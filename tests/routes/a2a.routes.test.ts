/**
 * A2A Routes Tests
 */
import supertest from 'supertest';
import app from '@/index';
import { v4 as uuidv4 } from 'uuid';
import { authTestUtils, dbTestUtils, generateTestData } from '../utils/test-utils';
import { AgentId, MessageId, ConversationId, SessionId } from '@/types/a2a.types';
import { a2aManager } from '@/services/a2a-manager';

const request = supertest(app);

// Mock A2A Manager
jest.mock('@/services/a2a-manager', () => ({
  a2aManager: {
    discoverAgents: jest.fn(),
    connectToAgent: jest.fn(),
    negotiateCapabilities: jest.fn(),
    sendMessage: jest.fn(),
    createConversation: jest.fn(),
    disconnectAgent: jest.fn(),
    getActiveSessions: jest.fn(),
    getSessionInfo: jest.fn(),
  }
}));

// Helper to create branded types
const createAgentId = (id: string) => id as AgentId;
const createMessageId = (id: string) => id as MessageId;
const createConversationId = (id: string) => id as ConversationId;
const createSessionId = (id: string) => id as SessionId;

describe('A2A Routes', () => {
  let testAuth: {
    agent: any;
    apiKey: string;
    headers: Record<string, string>;
  };
  
  beforeAll(async () => {
    // Create a test agent for authentication
    testAuth = await authTestUtils.createAuthenticatedTestAgent({
      type: 'company', // Ensure company type for full access
      capabilities: ['messaging', 'agent_discovery'],
    });
  });
  
  afterAll(async () => {
    // Clean up test data
    await dbTestUtils.cleanupTestData();
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('GET /api/v1/a2a/discover', () => {
    it('should discover available agents', async () => {
      const mockAgentIds = [
        createAgentId(`agent-${uuidv4()}`),
        createAgentId(`agent-${uuidv4()}`)
      ];
      
      // Mock the a2aManager response
      (a2aManager.discoverAgents as jest.Mock).mockResolvedValue(mockAgentIds);
      
      const response = await request
        .get('/api/v1/a2a/discover')
        .set(testAuth.headers);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(mockAgentIds.length);
      
      // Verify each agent has the expected structure
      response.body.data.forEach((agent: any, index: number) => {
        expect(agent.agentId).toBe(mockAgentIds[index]);
        expect(agent.name).toBeDefined();
        expect(agent.capabilities).toBeDefined();
      });
    });
    
    it('should filter agents by capability', async () => {
      const mockAgentIds = [createAgentId(`agent-${uuidv4()}`)];
      
      // Mock the a2aManager response
      (a2aManager.discoverAgents as jest.Mock).mockResolvedValue(mockAgentIds);
      
      const response = await request
        .get('/api/v1/a2a/discover?capability=messaging')
        .set(testAuth.headers);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Verify that discoverAgents was called with the right criteria
      expect(a2aManager.discoverAgents).toHaveBeenCalledWith(
        expect.objectContaining({ capability: 'messaging' })
      );
    });
    
    it('should return 401 without authentication', async () => {
      const response = await request.get('/api/v1/a2a/discover');
      
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
  
  describe('POST /api/v1/a2a/connect', () => {
    it('should connect to a remote agent', async () => {
      const remoteAgentId = createAgentId(`agent-${uuidv4()}`);
      
      // Mock the a2aManager response
      (a2aManager.connectToAgent as jest.Mock).mockResolvedValue(true);
      
      const response = await request
        .post('/api/v1/a2a/connect')
        .set(testAuth.headers)
        .send({ remoteAgentId });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Connection initiated');
      
      // Verify a2aManager was called correctly
      expect(a2aManager.connectToAgent).toHaveBeenCalledWith(
        createAgentId(testAuth.agent.id),
        remoteAgentId
      );
    });
    
    it('should return 400 without remote agent ID', async () => {
      const response = await request
        .post('/api/v1/a2a/connect')
        .set(testAuth.headers)
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Remote agent ID is required');
    });
    
    it('should return 400 if connection fails', async () => {
      const remoteAgentId = createAgentId(`agent-${uuidv4()}`);
      
      // Mock the a2aManager response
      (a2aManager.connectToAgent as jest.Mock).mockResolvedValue(false);
      
      const response = await request
        .post('/api/v1/a2a/connect')
        .set(testAuth.headers)
        .send({ remoteAgentId });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Failed to initiate connection');
    });
  });
  
  describe('POST /api/v1/a2a/negotiate', () => {
    it('should negotiate capabilities with remote agent', async () => {
      const remoteAgentId = createAgentId(`agent-${uuidv4()}`);
      const sessionId = createSessionId(`session-${uuidv4()}`);
      
      const negotiationRequest = {
        remoteAgentId,
        capabilities: ['messaging', 'agent_discovery'],
        supportedMessageTypes: ['text', 'json', 'control']
      };
      
      // Mock the a2aManager response
      (a2aManager.negotiateCapabilities as jest.Mock).mockResolvedValue({
        agentId: createAgentId(testAuth.agent.id),
        accepted: true,
        capabilities: ['messaging', 'agent_discovery'],
        supportedMessageTypes: ['text', 'json', 'control'],
        sessionId
      });
      
      const response = await request
        .post('/api/v1/a2a/negotiate')
        .set(testAuth.headers)
        .send(negotiationRequest);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.accepted).toBe(true);
      expect(response.body.data.sessionId).toBe(sessionId);
      expect(response.body.data.capabilities).toEqual(
        expect.arrayContaining(['messaging', 'agent_discovery'])
      );
      
      // Verify a2aManager was called correctly
      expect(a2aManager.negotiateCapabilities).toHaveBeenCalledWith(
        createAgentId(testAuth.agent.id),
        remoteAgentId,
        expect.objectContaining({
          agentId: testAuth.agent.id,
          capabilities: negotiationRequest.capabilities,
          supportedMessageTypes: negotiationRequest.supportedMessageTypes,
        })
      );
    });
    
    it('should return 400 for invalid negotiation request', async () => {
      const response = await request
        .post('/api/v1/a2a/negotiate')
        .set(testAuth.headers)
        .send({
          remoteAgentId: createAgentId(`agent-${uuidv4()}`),
          capabilities: ['invalid_capability'], // Invalid capability
          supportedMessageTypes: ['text']
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid negotiation request');
    });
  });
  
  describe('POST /api/v1/a2a/message', () => {
    it('should send a text message to a remote agent', async () => {
      const remoteAgentId = createAgentId(`agent-${uuidv4()}`);
      const messageId = createMessageId(`msg-${uuidv4()}`);
      const conversationId = createConversationId(`conv-${uuidv4()}`);
      
      const message = {
        id: messageId,
        conversationId,
        fromAgent: createAgentId(testAuth.agent.id),
        toAgent: remoteAgentId,
        type: 'text',
        content: 'Hello, remote agent!',
        timestamp: new Date().toISOString()
      };
      
      // Mock the a2aManager response
      (a2aManager.sendMessage as jest.Mock).mockResolvedValue(true);
      
      const response = await request
        .post('/api/v1/a2a/message')
        .set(testAuth.headers)
        .send(message);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.messageId).toBe(messageId);
      
      // Verify a2aManager was called correctly
      expect(a2aManager.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          id: messageId,
          conversationId,
          fromAgent: createAgentId(testAuth.agent.id),
          toAgent: remoteAgentId,
          type: 'text',
          content: 'Hello, remote agent!'
        })
      );
    });
    
    it('should send a JSON message to a remote agent', async () => {
      const remoteAgentId = createAgentId(`agent-${uuidv4()}`);
      const messageId = createMessageId(`msg-${uuidv4()}`);
      const conversationId = createConversationId(`conv-${uuidv4()}`);
      
      const message = {
        id: messageId,
        conversationId,
        fromAgent: createAgentId(testAuth.agent.id),
        toAgent: remoteAgentId,
        type: 'json',
        content: { key: 'value', nested: { data: true } },
        timestamp: new Date().toISOString()
      };
      
      // Mock the a2aManager response
      (a2aManager.sendMessage as jest.Mock).mockResolvedValue(true);
      
      const response = await request
        .post('/api/v1/a2a/message')
        .set(testAuth.headers)
        .send(message);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.messageId).toBe(messageId);
    });
    
    it('should return 400 for invalid message format', async () => {
      const invalidMessage = {
        // Missing required fields
        type: 'text',
        content: 'Hello!'
      };
      
      const response = await request
        .post('/api/v1/a2a/message')
        .set(testAuth.headers)
        .send(invalidMessage);
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid message format');
    });
    
    it('should return 403 if fromAgent does not match authenticated agent', async () => {
      const remoteAgentId = createAgentId(`agent-${uuidv4()}`);
      const messageId = createMessageId(`msg-${uuidv4()}`);
      const conversationId = createConversationId(`conv-${uuidv4()}`);
      
      const message = {
        id: messageId,
        conversationId,
        fromAgent: createAgentId(`different-agent-${uuidv4()}`), // Different from authenticated agent
        toAgent: remoteAgentId,
        type: 'text',
        content: 'Hello, remote agent!',
        timestamp: new Date().toISOString()
      };
      
      const response = await request
        .post('/api/v1/a2a/message')
        .set(testAuth.headers)
        .send(message);
      
      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Message sender must match authenticated agent');
    });
  });
  
  describe('POST /api/v1/a2a/conversation', () => {
    it('should create a new conversation', async () => {
      const remoteAgentId = createAgentId(`agent-${uuidv4()}`);
      const conversationId = createConversationId(`conv-${uuidv4()}`);
      
      // Mock the a2aManager response
      (a2aManager.createConversation as jest.Mock).mockResolvedValue(conversationId);
      
      const response = await request
        .post('/api/v1/a2a/conversation')
        .set(testAuth.headers)
        .send({
          remoteAgentId,
          metadata: { purpose: 'testing' }
        });
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.conversationId).toBe(conversationId);
      
      // Verify a2aManager was called correctly
      expect(a2aManager.createConversation).toHaveBeenCalledWith(
        createAgentId(testAuth.agent.id),
        remoteAgentId
      );
    });
    
    it('should return 400 without remote agent ID', async () => {
      const response = await request
        .post('/api/v1/a2a/conversation')
        .set(testAuth.headers)
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Remote agent ID is required');
    });
  });
  
  describe('POST /api/v1/a2a/disconnect', () => {
    it('should disconnect from remote agent', async () => {
      // Mock the a2aManager response
      (a2aManager.disconnectAgent as jest.Mock).mockResolvedValue(true);
      
      const response = await request
        .post('/api/v1/a2a/disconnect')
        .set(testAuth.headers);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Disconnected successfully');
      
      // Verify a2aManager was called correctly
      expect(a2aManager.disconnectAgent).toHaveBeenCalledWith(
        createAgentId(testAuth.agent.id)
      );
    });
    
    it('should return 400 if disconnection fails', async () => {
      // Mock the a2aManager response
      (a2aManager.disconnectAgent as jest.Mock).mockResolvedValue(false);
      
      const response = await request
        .post('/api/v1/a2a/disconnect')
        .set(testAuth.headers);
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Failed to disconnect');
    });
  });
  
  describe('GET /api/v1/a2a/sessions', () => {
    it('should return active sessions for company agents', async () => {
      const sessionId1 = createSessionId(`session-${uuidv4()}`);
      const sessionId2 = createSessionId(`session-${uuidv4()}`);
      const agent1 = createAgentId(`agent-${uuidv4()}`);
      const agent2 = createAgentId(`agent-${uuidv4()}`);
      
      // Mock the a2aManager responses
      (a2aManager.getActiveSessions as jest.Mock).mockReturnValue([sessionId1, sessionId2]);
      (a2aManager.getSessionInfo as jest.Mock).mockImplementation((id: SessionId) => {
        if (id === sessionId1) {
          return { agentId: agent1, remoteAgentId: agent2 };
        } else {
          return { agentId: agent2, remoteAgentId: agent1 };
        }
      });
      
      const response = await request
        .get('/api/v1/a2a/sessions')
        .set(testAuth.headers);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);
      
      // Verify each session has the expected structure
      response.body.data.forEach((session: any) => {
        expect(session.sessionId).toBeDefined();
        expect(session.agentId).toBeDefined();
        expect(session.remoteAgentId).toBeDefined();
        expect(session.state).toBeDefined();
        expect(session.createdAt).toBeDefined();
      });
    });
    
    it('should return 403 for non-company agents', async () => {
      // Create a test agent that is not a company type
      const nonCompanyAuth = await authTestUtils.createAuthenticatedTestAgent({
        type: 'insight', // Not a company type
      });
      
      const response = await request
        .get('/api/v1/a2a/sessions')
        .set(nonCompanyAuth.headers);
      
      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Insufficient privileges');
    });
  });
});