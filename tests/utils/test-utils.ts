/**
 * Test utilities for MCP Agent Backend
 */
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/services/database';
import supertest from 'supertest';
import app from '@/index';

// Create supertest agent
export const testAgent = supertest(app);

/**
 * Generate random test data
 */
export const generateTestData = {
  /**
   * Generate a random agent
   */
  agent: (overrides = {}) => ({
    name: `Test Agent ${uuidv4().slice(0, 8)}`,
    type: 'insight',
    capabilities: ['feedback_analysis', 'reporting'],
    metadata: {},
    ...overrides,
  }),

  /**
   * Generate random feedback data
   */
  feedback: (overrides = {}) => ({
    customer_agent_id: uuidv4(),
    company_agent_id: uuidv4(),
    raw_feedback: {
      text: 'This is test feedback for automated testing',
      rating: 4,
      channel: 'test',
    },
    feedback_type: 'test',
    ...overrides,
  }),

  /**
   * Generate random competitor data
   */
  competitor: (overrides = {}) => ({
    name: `Test Competitor ${uuidv4().slice(0, 8)}`,
    url: 'https://testcompetitor.com',
    primary_market: 'Test Market',
    description: 'A test competitor for automated testing',
    ...overrides,
  }),

  /**
   * Generate random sentiment analysis request
   */
  sentimentRequest: (overrides = {}) => ({
    feedback_id: uuidv4(),
    feedback_text: 'This is test feedback for sentiment analysis',
    feedback_source: 'test',
    ...overrides,
  }),

  /**
   * Generate random persona data
   */
  persona: (overrides = {}) => ({
    name: `Test Persona ${uuidv4().slice(0, 8)}`,
    description: 'A test persona for automated testing',
    preferences: ['test', 'automation'],
    ...overrides,
  }),
};

/**
 * Database test utilities
 */
export const dbTestUtils = {
  /**
   * Clean up test data after tests
   */
  cleanupTestData: async () => {
    // Use transaction to ensure all operations succeed or fail together
    const { error } = await db.supabase.rpc('cleanup_test_data');
    
    if (error) {
      console.error('Error cleaning up test data:', error);
      throw error;
    }
  },

  /**
   * Insert test agent
   */
  insertTestAgent: async (agentData: any) => {
    const { data, error } = await db.supabase
      .from('agents')
      .insert({
        ...agentData,
        api_key: `test_key_${uuidv4()}`,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  /**
   * Generate test API key
   */
  generateTestApiKey: () => {
    return `test_key_${uuidv4()}`;
  },
};

/**
 * Authentication test utilities
 */
export const authTestUtils = {
  /**
   * Get auth headers for a test agent
   */
  getAuthHeaders: (apiKey: string) => ({
    'x-api-key': apiKey,
  }),

  /**
   * Create an authenticated test agent
   */
  createAuthenticatedTestAgent: async (overrides = {}) => {
    const agentData = generateTestData.agent(overrides);
    const apiKey = dbTestUtils.generateTestApiKey();
    
    const agent = await dbTestUtils.insertTestAgent({
      ...agentData,
      api_key: apiKey,
    });
    
    return {
      agent,
      apiKey,
      headers: authTestUtils.getAuthHeaders(apiKey),
    };
  },
};

/**
 * Test server utilities
 */
export const serverTestUtils = {
  /**
   * Wait for a given amount of time
   */
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
};