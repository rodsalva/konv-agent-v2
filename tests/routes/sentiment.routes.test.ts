/**
 * Sentiment Routes Tests
 */
import supertest from 'supertest';
import app from '@/index';
import { v4 as uuidv4 } from 'uuid';
import { FeedbackSourceType, FeedbackLanguage } from '@/types/sentiment.types';
import { authTestUtils, dbTestUtils, generateTestData } from '../utils/test-utils';

const request = supertest(app);

// Mock sentiment analysis service
jest.mock('@/services/sentiment-analysis', () => ({
  sentimentAnalysisService: {
    analyzeSentiment: jest.fn(),
    generateSentimentTrend: jest.fn(),
    getSentimentInsights: jest.fn(),
    getDashboardData: jest.fn(),
    initialize: jest.fn(),
  },
}));

describe('Sentiment Routes', () => {
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
  
  describe('POST /api/v1/sentiment/analyze', () => {
    it('should analyze sentiment and return result', async () => {
      // Create test data
      const testRequest = {
        feedback_id: `test_${uuidv4()}`,
        feedback_text: 'The product quality is excellent and shipping was fast.',
        feedback_source: FeedbackSourceType.PRODUCT_REVIEW,
        language: FeedbackLanguage.ENGLISH,
      };
      
      // Mock the service response
      const mockResult = {
        id: `sentiment_${uuidv4()}`,
        feedback_id: testRequest.feedback_id,
        feedback_source: testRequest.feedback_source,
        feedback_text: testRequest.feedback_text,
        language: testRequest.language,
        overall_sentiment: 0.8,
        confidence: 0.9,
        category_sentiment: {
          'overall': 0.8,
          'product_quality': 0.9,
          'shipping': 0.7,
        },
        aspects: [
          {
            aspect: 'product quality',
            sentiment: 0.9,
            confidence: 0.95,
            excerpts: ['product quality is excellent'],
          },
          {
            aspect: 'shipping',
            sentiment: 0.7,
            confidence: 0.85,
            excerpts: ['shipping was fast'],
          },
        ],
        key_phrases: ['excellent product quality', 'fast shipping'],
        entities: [],
        metadata: {},
        analyzed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      require('@/services/sentiment-analysis').sentimentAnalysisService.analyzeSentiment.mockResolvedValue(mockResult);
      
      const response = await request
        .post('/api/v1/sentiment/analyze')
        .set(testAuth.headers)
        .send(testRequest);
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.overall_sentiment).toBe(0.8);
      expect(response.body.data.category_sentiment).toHaveProperty('product_quality');
      expect(response.body.data.aspects.length).toBe(2);
    });
    
    it('should return 400 for invalid request data', async () => {
      // Invalid request missing required fields
      const invalidRequest = {
        feedback_source: FeedbackSourceType.PRODUCT_REVIEW,
      };
      
      const response = await request
        .post('/api/v1/sentiment/analyze')
        .set(testAuth.headers)
        .send(invalidRequest);
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.details).toBeDefined();
    });
    
    it('should return 500 when service throws an error', async () => {
      const testRequest = generateTestData.sentimentRequest();
      
      // Mock service to throw an error
      require('@/services/sentiment-analysis').sentimentAnalysisService.analyzeSentiment.mockRejectedValue(
        new Error('Test error')
      );
      
      const response = await request
        .post('/api/v1/sentiment/analyze')
        .set(testAuth.headers)
        .send(testRequest);
      
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });
  
  describe('POST /api/v1/sentiment/trends', () => {
    it('should generate sentiment trend and return result', async () => {
      // Create test data
      const testRequest = {
        period_start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        period_end: new Date().toISOString(),
      };
      
      // Mock the service response
      const mockResult = {
        id: `trend_${uuidv4()}`,
        period_start: testRequest.period_start,
        period_end: testRequest.period_end,
        total_feedback_count: 100,
        average_sentiment: 0.6,
        sentiment_distribution: {
          very_negative: 5,
          negative: 10,
          neutral: 20,
          positive: 45,
          very_positive: 20,
        },
        category_sentiment: {
          'product_quality': 0.7,
          'shipping': 0.8,
          'customer_service': 0.5,
          'price': 0.4,
        },
        top_positive_aspects: [
          { aspect: 'product quality', sentiment: 0.8, count: 40 },
          { aspect: 'shipping speed', sentiment: 0.75, count: 35 },
        ],
        top_negative_aspects: [
          { aspect: 'price', sentiment: -0.3, count: 25 },
          { aspect: 'checkout process', sentiment: -0.2, count: 15 },
        ],
        emerging_topics: [],
        created_at: new Date().toISOString(),
      };
      
      require('@/services/sentiment-analysis').sentimentAnalysisService.generateSentimentTrend.mockResolvedValue(mockResult);
      
      const response = await request
        .post('/api/v1/sentiment/trends')
        .set(testAuth.headers)
        .send(testRequest);
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.average_sentiment).toBe(0.6);
      expect(response.body.data.total_feedback_count).toBe(100);
      expect(response.body.data.category_sentiment).toHaveProperty('product_quality');
      expect(response.body.data.top_positive_aspects.length).toBeGreaterThan(0);
      expect(response.body.data.top_negative_aspects.length).toBeGreaterThan(0);
    });
  });
  
  describe('GET /api/v1/sentiment/insights', () => {
    it('should return filtered sentiment insights', async () => {
      // Mock the service response
      const mockInsights = [
        {
          id: `insight_${uuidv4()}`,
          title: 'Negative sentiment in shipping requires attention',
          description: 'Customer feedback shows negative sentiment in shipping',
          insight_type: 'improvement_opportunity',
          priority: 'high',
          categories: ['shipping'],
          sentiment_scores: { 'shipping': -0.5 },
          affected_aspects: ['delivery time', 'package condition'],
          supporting_data: {
            feedback_count: 35,
            representative_samples: ['Package arrived damaged', 'Delivery took too long'],
            confidence: 0.85,
          },
          recommendations: [
            {
              department: 'logistics',
              action: 'Review shipping carriers performance',
              expected_impact: 'high',
            },
          ],
          created_at: new Date().toISOString(),
        },
      ];
      
      require('@/services/sentiment-analysis').sentimentAnalysisService.getSentimentInsights.mockResolvedValue(mockInsights);
      
      const response = await request
        .get('/api/v1/sentiment/insights')
        .set(testAuth.headers)
        .query({
          priority: 'high',
          categories: ['shipping'],
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].priority).toBe('high');
      expect(response.body.data[0].categories).toContain('shipping');
    });
  });
  
  describe('GET /api/v1/sentiment/dashboard', () => {
    it('should return dashboard data', async () => {
      // Mock the service response
      const mockDashboardData = {
        overall_sentiment: 0.65,
        feedback_count: 250,
        sentiment_distribution: {
          very_negative: 10,
          negative: 25,
          neutral: 50,
          positive: 115,
          very_positive: 50,
        },
        category_sentiment: {
          'product_quality': 0.7,
          'shipping': 0.6,
          'customer_service': 0.8,
          'price': 0.3,
          'user_experience': 0.75,
        },
        trending_aspects: {
          positive: [
            { aspect: 'product quality', sentiment: 0.8, count: 75 },
            { aspect: 'customer service', sentiment: 0.75, count: 60 },
          ],
          negative: [
            { aspect: 'price', sentiment: -0.4, count: 40 },
            { aspect: 'checkout process', sentiment: -0.3, count: 25 },
          ],
        },
        recent_insights: [],
        sentiment_over_time: [],
      };
      
      require('@/services/sentiment-analysis').sentimentAnalysisService.getDashboardData.mockResolvedValue(mockDashboardData);
      
      const response = await request
        .get('/api/v1/sentiment/dashboard')
        .set(testAuth.headers)
        .query({
          period_days: 30,
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.overall_sentiment).toBe(0.65);
      expect(response.body.data.feedback_count).toBe(250);
      expect(response.body.data.category_sentiment).toHaveProperty('product_quality');
      expect(response.body.data.trending_aspects.positive.length).toBeGreaterThan(0);
      expect(response.body.data.trending_aspects.negative.length).toBeGreaterThan(0);
    });
  });
  
  describe('GET /api/v1/sentiment/dashboard/view', () => {
    it('should return HTML dashboard view', async () => {
      // Mock the service response with the same data as previous test
      const mockDashboardData = {
        overall_sentiment: 0.65,
        feedback_count: 250,
        sentiment_distribution: {
          very_negative: 10,
          negative: 25,
          neutral: 50,
          positive: 115,
          very_positive: 50,
        },
        category_sentiment: {
          'product_quality': 0.7,
          'shipping': 0.6,
          'customer_service': 0.8,
          'price': 0.3,
          'user_experience': 0.75,
        },
        trending_aspects: {
          positive: [
            { aspect: 'product quality', sentiment: 0.8, count: 75 },
            { aspect: 'customer service', sentiment: 0.75, count: 60 },
          ],
          negative: [
            { aspect: 'price', sentiment: -0.4, count: 40 },
            { aspect: 'checkout process', sentiment: -0.3, count: 25 },
          ],
        },
        recent_insights: [],
        sentiment_over_time: [],
      };
      
      require('@/services/sentiment-analysis').sentimentAnalysisService.getDashboardData.mockResolvedValue(mockDashboardData);
      
      const response = await request
        .get('/api/v1/sentiment/dashboard/view')
        .set(testAuth.headers)
        .query({
          period_days: 30,
        });
      
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/html');
      expect(response.text).toContain('MercadoLivre Customer Sentiment Dashboard');
      expect(response.text).toContain('Product Quality');
    });
  });
});