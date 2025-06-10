/**
 * Feedback Service Tests
 */
import { feedbackService } from '@/services/feedback';
import { EventBus } from '@/events/event-bus';
import { WebSocketService } from '@/services/websocket';
import { v4 as uuidv4 } from 'uuid';
import { dbTestUtils } from '../utils/test-utils';

// Mock dependencies
jest.mock('@/events/event-bus');
jest.mock('@/services/websocket');
jest.mock('@/services/database', () => ({
  db: {
    supabase: {
      from: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: {}, error: null }),
    },
  },
}));

describe('Feedback Service', () => {
  // Setup mocks
  const mockEventBus = new EventBus() as jest.Mocked<EventBus>;
  const mockWebSocketService = new WebSocketService(null as any) as jest.Mocked<WebSocketService>;
  
  beforeAll(() => {
    // Initialize service with mocks
    feedbackService.initialize(mockWebSocketService);
  });
  
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });
  
  afterAll(async () => {
    await dbTestUtils.cleanupTestData();
  });
  
  describe('processFeedback', () => {
    it('should process feedback and emit events', async () => {
      // Setup test data
      const testFeedback = {
        id: `test_${uuidv4()}`,
        customer_agent_id: uuidv4(),
        company_agent_id: uuidv4(),
        raw_feedback: {
          text: 'This is a test feedback',
          rating: 4,
        },
        feedback_type: 'test',
      };
      
      // Mock database response
      const mockDbResponse = {
        data: {
          ...testFeedback,
          processed_feedback: {
            text: 'Processed test feedback',
            rating: 4,
            processed: true,
          },
          status: 'processed',
          processed_at: new Date().toISOString(),
        },
        error: null,
      };
      
      // Mock implementations
      require('@/services/database').db.supabase.single.mockResolvedValue(mockDbResponse);
      mockEventBus.publish = jest.fn();
      mockWebSocketService.broadcast = jest.fn();
      
      // Call the method under test
      const result = await feedbackService.processFeedback(testFeedback);
      
      // Assertions
      expect(result).toBeDefined();
      expect(result.processed_feedback).toBeDefined();
      expect(result.status).toBe('processed');
      
      // Verify event was published
      expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
      
      // Verify WebSocket notification was sent
      expect(mockWebSocketService.broadcast).toHaveBeenCalledTimes(1);
    });
    
    it('should handle errors during feedback processing', async () => {
      // Setup test data
      const testFeedback = {
        id: `test_${uuidv4()}`,
        customer_agent_id: uuidv4(),
        company_agent_id: uuidv4(),
        raw_feedback: {
          text: 'This will cause an error',
        },
        feedback_type: 'test',
      };
      
      // Mock implementations to throw error
      require('@/services/database').db.supabase.single.mockResolvedValue({
        data: null,
        error: new Error('Test database error'),
      });
      
      // Assertions
      await expect(feedbackService.processFeedback(testFeedback)).rejects.toThrow();
    });
  });
  
  describe('analyzeFeedback', () => {
    it('should analyze feedback and update status', async () => {
      // Setup test data
      const testFeedback = {
        id: `test_${uuidv4()}`,
        processed_feedback: {
          text: 'This is processed feedback for analysis',
          rating: 4,
        },
        status: 'processed',
      };
      
      // Mock database response
      const mockDbResponse = {
        data: {
          ...testFeedback,
          status: 'analyzed',
          sentiment_score: 0.8,
          confidence_score: 0.9,
          tags: ['positive', 'product', 'quality'],
        },
        error: null,
      };
      
      // Mock implementations
      require('@/services/database').db.supabase.single.mockResolvedValue(mockDbResponse);
      
      // Call the method under test
      const result = await feedbackService.analyzeFeedback(testFeedback as any);
      
      // Assertions
      expect(result).toBeDefined();
      expect(result.status).toBe('analyzed');
      expect(result.sentiment_score).toBe(0.8);
      expect(result.tags).toContain('positive');
    });
  });
});