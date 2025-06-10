/**
 * Mock utilities for testing
 */
import { SentimentAnalysis, SentimentTrend, SentimentInsight } from '@/types/sentiment.types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create mock sentiment analysis
 */
export const createMockSentimentAnalysis = (override = {}): SentimentAnalysis => ({
  id: `sentiment_${uuidv4()}` as any,
  feedback_id: uuidv4(),
  feedback_source: 'product_review',
  feedback_text: 'This is a mock feedback text for testing purposes.',
  language: 'en',
  overall_sentiment: 0.75,
  confidence: 0.9,
  category_sentiment: {
    overall: 0.75,
    product_quality: 0.8,
    shipping: 0.7,
    price: 0.6,
    customer_service: 0.9,
    user_experience: 0.7,
    checkout_process: 0.8,
    product_selection: 0.7,
    payment_options: 0.8,
    return_process: 0.6,
  },
  aspects: [
    {
      aspect: 'quality',
      sentiment: 0.8,
      confidence: 0.9,
      excerpts: ['good quality'],
    },
    {
      aspect: 'shipping',
      sentiment: 0.7,
      confidence: 0.85,
      excerpts: ['fast shipping'],
    },
  ],
  key_phrases: ['good quality', 'fast shipping', 'great service'],
  entities: [
    {
      entity: 'product',
      type: 'PRODUCT',
      sentiment: 0.8,
    },
  ],
  metadata: {},
  analyzed_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...override,
});

/**
 * Create mock sentiment trend
 */
export const createMockSentimentTrend = (override = {}): SentimentTrend => {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  return {
    id: `trend_${uuidv4()}` as any,
    period_start: weekAgo.toISOString(),
    period_end: now.toISOString(),
    total_feedback_count: 500,
    average_sentiment: 0.65,
    sentiment_distribution: {
      very_negative: 25,
      negative: 50,
      neutral: 100,
      positive: 225,
      very_positive: 100,
    },
    category_sentiment: {
      overall: 0.65,
      product_quality: 0.8,
      shipping: 0.6,
      price: 0.4,
      customer_service: 0.85,
      user_experience: 0.7,
      checkout_process: 0.75,
      product_selection: 0.8,
      payment_options: 0.7,
      return_process: 0.5,
    },
    top_positive_aspects: [
      { aspect: 'customer service', sentiment: 0.85, count: 150, change: 0.1 },
      { aspect: 'product quality', sentiment: 0.8, count: 200, change: 0.05 },
      { aspect: 'checkout process', sentiment: 0.75, count: 125, change: 0.15 },
    ],
    top_negative_aspects: [
      { aspect: 'price', sentiment: -0.4, count: 75, change: -0.1 },
      { aspect: 'return process', sentiment: -0.3, count: 50, change: -0.05 },
      { aspect: 'shipping time', sentiment: -0.25, count: 40, change: 0.05 },
    ],
    emerging_topics: [
      { topic: 'mobile app', count: 45, sentiment: 0.6, change: 0.8 },
      { topic: 'payment method', count: 30, sentiment: 0.7, change: 0.6 },
      { topic: 'product recommendations', count: 25, sentiment: 0.5, change: 0.9 },
    ],
    created_at: now.toISOString(),
    ...override,
  };
};

/**
 * Create mock sentiment insight
 */
export const createMockSentimentInsight = (override = {}): SentimentInsight => ({
  id: uuidv4(),
  title: 'Negative sentiment in shipping requires attention',
  description: 'Customer feedback shows increasing negative sentiment regarding shipping times and package conditions.',
  insight_type: 'emerging_issue',
  priority: 'high',
  categories: ['shipping', 'return_process'],
  sentiment_scores: {
    shipping: -0.4,
    return_process: -0.3,
    overall: -0.2,
  },
  affected_aspects: ['shipping time', 'package condition', 'delivery tracking'],
  supporting_data: {
    feedback_count: 75,
    representative_samples: [
      'Package arrived damaged',
      'Delivery took much longer than expected',
      'No tracking updates for days',
    ],
    confidence: 0.85,
  },
  recommendations: [
    {
      department: 'logistics',
      action: 'Review shipping carrier performance and consider alternatives',
      expected_impact: 'high',
    },
    {
      department: 'customer_service',
      action: 'Improve proactive communication about shipping delays',
      expected_impact: 'medium',
    },
    {
      department: 'product',
      action: 'Enhance delivery tracking functionality in the app',
      expected_impact: 'medium',
    },
  ],
  created_at: new Date().toISOString(),
  ...override,
});

/**
 * Create mock WebSocket service
 */
export const createMockWebSocketService = () => ({
  initialize: jest.fn(),
  broadcast: jest.fn(),
  shutdown: jest.fn(),
  getClients: jest.fn().mockReturnValue([]),
  handleConnection: jest.fn(),
  handleMessage: jest.fn(),
  handleClose: jest.fn(),
  handleError: jest.fn(),
});

/**
 * Create mock EventBus
 */
export const createMockEventBus = () => ({
  publish: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
  getSubscribers: jest.fn().mockReturnValue({}),
});