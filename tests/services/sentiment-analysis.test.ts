/**
 * Sentiment Analysis Service Tests
 */
import { sentimentAnalysisService } from '@/services/sentiment-analysis';
import { EventBus } from '@/events/event-bus';
import { WebSocketService } from '@/services/websocket';
import { FeedbackSourceType, FeedbackLanguage } from '@/types/sentiment.types';
import { v4 as uuidv4 } from 'uuid';

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
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: {}, error: null }),
    },
  },
}));

describe('Sentiment Analysis Service', () => {
  // Setup mocks
  const mockEventBus = new EventBus() as jest.Mocked<EventBus>;
  const mockWebSocketService = new WebSocketService(null as any) as jest.Mocked<WebSocketService>;
  
  beforeAll(() => {
    // Initialize service with mocks
    sentimentAnalysisService.initialize(mockWebSocketService);
  });
  
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });
  
  describe('analyzeSentiment', () => {
    it('should analyze sentiment for Portuguese text', async () => {
      // Setup test data
      const testRequest = {
        feedback_id: `test_${uuidv4()}`,
        feedback_text: 'Estou muito satisfeito com a rapidez da entrega e a qualidade do produto.',
        feedback_source: FeedbackSourceType.PRODUCT_REVIEW,
        language: FeedbackLanguage.PORTUGUESE,
      };
      
      // Mock database response
      const mockDbResponse = {
        data: {
          id: `sentiment_${uuidv4()}`,
          feedback_id: testRequest.feedback_id,
          feedback_source: testRequest.feedback_source,
          feedback_text: testRequest.feedback_text,
          language: testRequest.language,
          overall_sentiment: 0.8,
          confidence: 0.9,
          category_sentiment: {
            'overall': 0.8,
            'product_quality': 0.7,
            'shipping': 0.9,
          },
          aspects: [
            {
              aspect: 'qualidade',
              sentiment: 0.7,
              confidence: 0.85,
              excerpts: ['a qualidade do produto'],
            },
            {
              aspect: 'entrega',
              sentiment: 0.9,
              confidence: 0.95,
              excerpts: ['a rapidez da entrega'],
            },
          ],
          key_phrases: ['rapidez da entrega', 'qualidade do produto'],
          entities: [],
          metadata: {},
          analyzed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      };
      
      // Mock implementations
      require('@/services/database').db.supabase.single.mockResolvedValue(mockDbResponse);
      mockEventBus.publish = jest.fn();
      mockWebSocketService.broadcast = jest.fn();
      
      // Call the method under test
      const result = await sentimentAnalysisService.analyzeSentiment(testRequest);
      
      // Assertions
      expect(result).toBeDefined();
      expect(result.overall_sentiment).toBeGreaterThan(0); // Positive sentiment
      expect(result.language).toBe(FeedbackLanguage.PORTUGUESE);
      expect(result.category_sentiment).toHaveProperty('product_quality');
      expect(result.aspects.length).toBeGreaterThan(0);
      
      // Verify event was published
      expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
    });
    
    it('should analyze sentiment for negative English text', async () => {
      // Setup test data
      const testRequest = {
        feedback_id: `test_${uuidv4()}`,
        feedback_text: 'The product quality is terrible and customer service was unhelpful.',
        feedback_source: FeedbackSourceType.CUSTOMER_SUPPORT,
        language: FeedbackLanguage.ENGLISH,
      };
      
      // Mock database response
      const mockDbResponse = {
        data: {
          id: `sentiment_${uuidv4()}`,
          feedback_id: testRequest.feedback_id,
          feedback_source: testRequest.feedback_source,
          feedback_text: testRequest.feedback_text,
          language: testRequest.language,
          overall_sentiment: -0.7,
          confidence: 0.85,
          category_sentiment: {
            'overall': -0.7,
            'product_quality': -0.8,
            'customer_service': -0.6,
          },
          aspects: [
            {
              aspect: 'product quality',
              sentiment: -0.8,
              confidence: 0.9,
              excerpts: ['product quality is terrible'],
            },
            {
              aspect: 'customer service',
              sentiment: -0.6,
              confidence: 0.8,
              excerpts: ['customer service was unhelpful'],
            },
          ],
          key_phrases: ['terrible product quality', 'unhelpful customer service'],
          entities: [],
          metadata: {},
          analyzed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      };
      
      // Mock implementations
      require('@/services/database').db.supabase.single.mockResolvedValue(mockDbResponse);
      
      // Call the method under test
      const result = await sentimentAnalysisService.analyzeSentiment(testRequest);
      
      // Assertions
      expect(result).toBeDefined();
      expect(result.overall_sentiment).toBeLessThan(0); // Negative sentiment
      expect(result.language).toBe(FeedbackLanguage.ENGLISH);
      expect(result.category_sentiment).toHaveProperty('customer_service');
      expect(result.aspects.length).toBeGreaterThan(0);
    });
  });
  
  describe('generateSentimentTrend', () => {
    it('should generate sentiment trend for a specified period', async () => {
      // Setup test data
      const testRequest = {
        period_start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        period_end: new Date().toISOString(),
      };
      
      // Mock database responses
      require('@/services/database').db.supabase.select.mockResolvedValue({
        data: [
          {
            id: `sentiment_${uuidv4()}`,
            overall_sentiment: 0.7,
            category_sentiment: { 'product_quality': 0.8, 'shipping': 0.6 },
            aspects: [{ aspect: 'quality', sentiment: 0.8 }],
          },
          {
            id: `sentiment_${uuidv4()}`,
            overall_sentiment: -0.3,
            category_sentiment: { 'customer_service': -0.4, 'shipping': -0.2 },
            aspects: [{ aspect: 'support', sentiment: -0.4 }],
          },
        ],
        error: null,
      });
      
      require('@/services/database').db.supabase.single.mockResolvedValue({
        data: {
          id: `trend_${uuidv4()}`,
          period_start: testRequest.period_start,
          period_end: testRequest.period_end,
          total_feedback_count: 2,
          average_sentiment: 0.2,
          sentiment_distribution: {
            very_negative: 0,
            negative: 1,
            neutral: 0,
            positive: 1,
            very_positive: 0,
          },
          category_sentiment: {
            'product_quality': 0.8,
            'customer_service': -0.4,
            'shipping': 0.2,
          },
          top_positive_aspects: [{ aspect: 'quality', sentiment: 0.8, count: 1 }],
          top_negative_aspects: [{ aspect: 'support', sentiment: -0.4, count: 1 }],
          emerging_topics: [],
          created_at: new Date().toISOString(),
        },
        error: null,
      });
      
      // Call the method under test
      const result = await sentimentAnalysisService.generateSentimentTrend(testRequest);
      
      // Assertions
      expect(result).toBeDefined();
      expect(result.period_start).toBe(testRequest.period_start);
      expect(result.period_end).toBe(testRequest.period_end);
      expect(result.total_feedback_count).toBe(2);
      expect(result.average_sentiment).toBe(0.2);
      expect(result.category_sentiment).toHaveProperty('product_quality');
      expect(result.top_positive_aspects).toHaveLength(1);
      expect(result.top_negative_aspects).toHaveLength(1);
    });
  });
  
  describe('getSentimentInsights', () => {
    it('should retrieve sentiment insights with filtering', async () => {
      // Setup test data
      const filters = {
        priority: 'high',
        categories: ['product_quality', 'shipping'],
        limit: 5,
      };
      
      // Mock database response
      require('@/services/database').db.supabase.select.mockResolvedValue({
        data: [
          {
            id: `insight_${uuidv4()}`,
            title: 'Negative sentiment in shipping requires attention',
            description: 'Customer feedback shows negative sentiment in shipping',
            insight_type: 'improvement_opportunity',
            priority: 'high',
            categories: ['shipping'],
            created_at: new Date().toISOString(),
          },
        ],
        error: null,
      });
      
      // Call the method under test
      const result = await sentimentAnalysisService.getSentimentInsights(filters);
      
      // Assertions
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].priority).toBe('high');
      expect(result[0].categories).toContain('shipping');
    });
  });
});