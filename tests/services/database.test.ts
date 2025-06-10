/**
 * Database Service Tests
 */
import { db } from '@/services/database';
import { v4 as uuidv4 } from 'uuid';
import { dbTestUtils } from '../utils/test-utils';

describe('Database Service', () => {
  beforeAll(async () => {
    // Ensure database is clean before tests
    await dbTestUtils.cleanupTestData();
  });

  afterAll(async () => {
    // Clean up after tests
    await dbTestUtils.cleanupTestData();
  });

  describe('healthCheck', () => {
    it('should return true when database is healthy', async () => {
      const result = await db.healthCheck();
      expect(result).toBe(true);
    });
  });

  describe('Agent Operations', () => {
    const testAgent = {
      name: `Test Agent ${uuidv4().slice(0, 8)}`,
      type: 'company',
      capabilities: ['feedback_collection'],
      status: 'active',
      api_key: `test_key_${uuidv4()}`,
    };

    let createdAgentId: string;

    it('should create an agent', async () => {
      const agent = await db.createAgent(testAgent);
      
      expect(agent).toBeDefined();
      expect(agent.id).toBeDefined();
      expect(agent.name).toBe(testAgent.name);
      expect(agent.type).toBe(testAgent.type);
      expect(agent.status).toBe('active');
      
      createdAgentId = agent.id;
    });

    it('should get an agent by ID', async () => {
      const agent = await db.getAgent(createdAgentId);
      
      expect(agent).toBeDefined();
      expect(agent.id).toBe(createdAgentId);
      expect(agent.name).toBe(testAgent.name);
    });

    it('should list agents', async () => {
      const agents = await db.listAgents();
      
      expect(Array.isArray(agents)).toBe(true);
      expect(agents.length).toBeGreaterThan(0);
      
      const foundAgent = agents.find(a => a.id === createdAgentId);
      expect(foundAgent).toBeDefined();
    });

    it('should filter agents by type', async () => {
      const agents = await db.listAgents('company');
      
      expect(Array.isArray(agents)).toBe(true);
      expect(agents.length).toBeGreaterThan(0);
      
      // All returned agents should be of type 'company'
      expect(agents.every(a => a.type === 'company')).toBe(true);
    });

    it('should update an agent', async () => {
      const updatedName = `Updated Test Agent ${uuidv4().slice(0, 8)}`;
      
      const updatedAgent = await db.updateAgent(createdAgentId, {
        name: updatedName,
        capabilities: ['feedback_collection', 'reporting'],
      });
      
      expect(updatedAgent).toBeDefined();
      expect(updatedAgent.id).toBe(createdAgentId);
      expect(updatedAgent.name).toBe(updatedName);
      expect(updatedAgent.capabilities).toContain('reporting');
    });
  });

  describe('Error Handling', () => {
    it('should throw an error when getting a non-existent agent', async () => {
      await expect(db.getAgent('non-existent-id')).rejects.toThrow();
    });
  });
});