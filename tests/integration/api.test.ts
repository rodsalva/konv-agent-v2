/**
 * Integration Tests for API Endpoints
 * 
 * Note: These tests interact with the actual API and database
 * To run them, you need a test database configured
 */
import supertest from 'supertest';
import app from '@/index';
import { v4 as uuidv4 } from 'uuid';
import { authTestUtils, dbTestUtils, generateTestData } from '../utils/test-utils';
import { setupTestDatabase } from '../utils/db-setup';

const request = supertest(app);

// Skip tests if not in integration test mode
const integrationTestMode = process.env.TEST_MODE === 'integration';
const testOrSkip = integrationTestMode ? describe : describe.skip;

testOrSkip('API Integration Tests', () => {
  let testAuth: {
    agent: any;
    apiKey: string;
    headers: Record<string, string>;
  };
  
  beforeAll(async () => {
    // Set up test database
    if (integrationTestMode) {
      await setupTestDatabase();
    }
    
    // Create a test agent for authentication
    testAuth = await authTestUtils.createAuthenticatedTestAgent();
  });
  
  afterAll(async () => {
    // Clean up test data
    await dbTestUtils.cleanupTestData();
  });
  
  describe('Agent API', () => {
    let testAgentId: string;
    
    it('should create, read, update, and delete an agent', async () => {
      // 1. Create an agent
      const newAgent = generateTestData.agent();
      
      const createResponse = await request
        .post('/api/v1/agents')
        .set(testAuth.headers)
        .send(newAgent);
      
      expect(createResponse.status).toBe(201);
      expect(createResponse.body.success).toBe(true);
      expect(createResponse.body.data.name).toBe(newAgent.name);
      expect(createResponse.body.data.api_key).toBeDefined();
      
      testAgentId = createResponse.body.data.id;
      
      // 2. Get the agent
      const getResponse = await request
        .get(`/api/v1/agents/${testAgentId}`)
        .set(testAuth.headers);
      
      expect(getResponse.status).toBe(200);
      expect(getResponse.body.success).toBe(true);
      expect(getResponse.body.data.id).toBe(testAgentId);
      expect(getResponse.body.data.name).toBe(newAgent.name);
      
      // 3. Update the agent
      const updateData = {
        name: `Updated ${newAgent.name}`,
        capabilities: ['feedback_analysis', 'reporting'],
      };
      
      const updateResponse = await request
        .put(`/api/v1/agents/${testAgentId}`)
        .set(testAuth.headers)
        .send(updateData);
      
      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.name).toBe(updateData.name);
      expect(updateResponse.body.data.capabilities).toEqual(expect.arrayContaining(updateData.capabilities));
      
      // 4. Delete (deactivate) the agent
      const deleteResponse = await request
        .delete(`/api/v1/agents/${testAgentId}`)
        .set(testAuth.headers);
      
      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.success).toBe(true);
      
      // 5. Verify agent is deactivated
      const verifyResponse = await request
        .get(`/api/v1/agents/${testAgentId}`)
        .set(testAuth.headers);
      
      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.body.data.status).toBe('suspended');
    });
  });
  
  describe('Feedback API', () => {
    it('should process feedback', async () => {
      // Create test feedback data
      const feedbackData = {
        customer_agent_id: uuidv4(),
        company_agent_id: uuidv4(),
        raw_feedback: {
          text: 'This is test feedback for integration testing',
          rating: 4,
          channel: 'integration_test',
        },
        feedback_type: 'test',
      };
      
      const response = await request
        .post('/api/v1/feedback/process')
        .set(testAuth.headers)
        .send(feedbackData);
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.processed_feedback).toBeDefined();
    });
  });
  
  describe('Sentiment API', () => {
    it('should analyze sentiment', async () => {
      // Create test sentiment request
      const sentimentRequest = {
        feedback_id: `test_${uuidv4()}`,
        feedback_text: 'This is a positive test feedback with good quality and fast shipping.',
        feedback_source: 'test',
      };
      
      const response = await request
        .post('/api/v1/sentiment/analyze')
        .set(testAuth.headers)
        .send(sentimentRequest);
      
      // If we're not in integration test mode, we're mocking so expect success
      if (integrationTestMode) {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.overall_sentiment).toBeGreaterThanOrEqual(-1);
        expect(response.body.data.overall_sentiment).toBeLessThanOrEqual(1);
      } else {
        expect(response.status).toBeLessThan(500); // Any response other than server error
      }
    });
  });
  
  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request.get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.services).toBeDefined();
      expect(response.body.services.database).toBeDefined();
    });
  });
  
  describe('Dashboard Views', () => {
    it('should return sentiment dashboard HTML', async () => {
      const response = await request
        .get('/api/v1/sentiment/dashboard/view')
        .set(testAuth.headers);
      
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/html');
      expect(response.text).toContain('<!DOCTYPE html>');
      expect(response.text).toContain('MercadoLivre Customer Sentiment Dashboard');
    });
    
    it('should return competitor benchmark HTML', async () => {
      const response = await request
        .get('/api/v1/competitors/benchmark/visualization')
        .set(testAuth.headers);
      
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/html');
      expect(response.text).toContain('<!DOCTYPE html>');
      expect(response.text).toContain('MercadoLivre Competitive Benchmarking');
    });
  });
});