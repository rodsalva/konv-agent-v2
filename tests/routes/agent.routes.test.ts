/**
 * Agent Routes Tests
 */
import supertest from 'supertest';
import app from '@/index';
import { v4 as uuidv4 } from 'uuid';
import { authTestUtils, dbTestUtils, generateTestData } from '../utils/test-utils';

const request = supertest(app);

// Mock database service
jest.mock('@/services/database', () => ({
  db: {
    createAgent: jest.fn(),
    getAgent: jest.fn(),
    listAgents: jest.fn(),
    updateAgent: jest.fn(),
    healthCheck: jest.fn().mockResolvedValue(true),
  },
}));

describe('Agent Routes', () => {
  let testAuth: {
    agent: any;
    apiKey: string;
    headers: Record<string, string>;
  };
  
  beforeAll(async () => {
    // Create a test agent for authentication
    testAuth = await authTestUtils.createAuthenticatedTestAgent();
  });
  
  afterAll(async () => {
    // Clean up test data
    await dbTestUtils.cleanupTestData();
  });
  
  describe('GET /api/v1/agents', () => {
    it('should return a list of agents', async () => {
      // Mock the database response
      require('@/services/database').db.listAgents.mockResolvedValue([
        {
          id: testAuth.agent.id,
          name: testAuth.agent.name,
          type: testAuth.agent.type,
          status: 'active',
          capabilities: [],
          created_at: new Date().toISOString(),
        },
      ]);
      
      const response = await request
        .get('/api/v1/agents')
        .set(testAuth.headers);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      // API key should not be exposed
      expect(response.body.data[0].api_key).toBeUndefined();
    });
    
    it('should return 401 without valid authentication', async () => {
      const response = await request.get('/api/v1/agents');
      
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
  
  describe('GET /api/v1/agents/:id', () => {
    it('should return a single agent by ID', async () => {
      // Mock the database response
      require('@/services/database').db.getAgent.mockResolvedValue({
        id: testAuth.agent.id,
        name: testAuth.agent.name,
        type: testAuth.agent.type,
        status: 'active',
        api_key: 'sensitive-data-not-for-response',
        capabilities: [],
        created_at: new Date().toISOString(),
      });
      
      const response = await request
        .get(`/api/v1/agents/${testAuth.agent.id}`)
        .set(testAuth.headers);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(testAuth.agent.id);
      
      // API key should not be exposed
      expect(response.body.data.api_key).toBeUndefined();
    });
    
    it('should return 404 for non-existent agent', async () => {
      // Mock the database to throw an error
      require('@/services/database').db.getAgent.mockRejectedValue(
        new Error('Agent not found')
      );
      
      const response = await request
        .get(`/api/v1/agents/non-existent-id`)
        .set(testAuth.headers);
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
  
  describe('POST /api/v1/agents', () => {
    it('should create a new agent', async () => {
      const newAgent = generateTestData.agent();
      
      // Mock the database response
      require('@/services/database').db.createAgent.mockResolvedValue({
        id: `test_${uuidv4()}`,
        ...newAgent,
        api_key: 'test-api-key',
        status: 'active',
        created_at: new Date().toISOString(),
      });
      
      const response = await request
        .post('/api/v1/agents')
        .set(testAuth.headers)
        .send(newAgent);
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.name).toBe(newAgent.name);
      expect(response.body.data.type).toBe(newAgent.type);
      
      // API key should be included in the response for creation only
      expect(response.body.data.api_key).toBeDefined();
    });
    
    it('should return 400 for invalid agent data', async () => {
      const invalidAgent = {
        // Missing required fields
        type: 'invalid-type',
      };
      
      const response = await request
        .post('/api/v1/agents')
        .set(testAuth.headers)
        .send(invalidAgent);
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.details).toBeDefined();
    });
  });
  
  describe('PUT /api/v1/agents/:id', () => {
    it('should update an existing agent', async () => {
      const updates = {
        name: `Updated Test Agent ${uuidv4().slice(0, 8)}`,
        capabilities: ['feedback_collection', 'reporting'],
      };
      
      // Mock the database response
      require('@/services/database').db.updateAgent.mockResolvedValue({
        id: testAuth.agent.id,
        ...testAuth.agent,
        ...updates,
        updated_at: new Date().toISOString(),
      });
      
      const response = await request
        .put(`/api/v1/agents/${testAuth.agent.id}`)
        .set(testAuth.headers)
        .send(updates);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.name).toBe(updates.name);
      expect(response.body.data.capabilities).toEqual(expect.arrayContaining(updates.capabilities));
      
      // API key should not be exposed
      expect(response.body.data.api_key).toBeUndefined();
    });
  });
  
  describe('POST /api/v1/agents/:id/regenerate-key', () => {
    it('should regenerate API key for an agent', async () => {
      const newApiKey = `test_key_${uuidv4()}`;
      
      // Mock the database response
      require('@/services/database').db.updateAgent.mockResolvedValue({
        id: testAuth.agent.id,
        ...testAuth.agent,
        api_key: newApiKey,
        updated_at: new Date().toISOString(),
      });
      
      const response = await request
        .post(`/api/v1/agents/${testAuth.agent.id}/regenerate-key`)
        .set(testAuth.headers);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(testAuth.agent.id);
      
      // New API key should be included in the response
      expect(response.body.data.api_key).toBeDefined();
    });
  });
  
  describe('DELETE /api/v1/agents/:id', () => {
    it('should deactivate an agent', async () => {
      // Mock the database response
      require('@/services/database').db.updateAgent.mockResolvedValue({
        id: testAuth.agent.id,
        ...testAuth.agent,
        status: 'suspended',
        api_key: null,
        updated_at: new Date().toISOString(),
      });
      
      const response = await request
        .delete(`/api/v1/agents/${testAuth.agent.id}`)
        .set(testAuth.headers);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deactivated');
    });
  });
});