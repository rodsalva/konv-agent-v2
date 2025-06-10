/**
 * Sentiment Events Tests
 */
import {
  SentimentEventType,
  createSentimentAnalysisCompletedEvent,
  createSentimentAnalysisFailedEvent,
  createSentimentTrendGeneratedEvent,
  createSentimentInsightCreatedEvent,
  createSentimentThresholdExceededEvent,
  createSentimentImprovedEvent
} from '@/events/sentiment-events';
import { SentimentCategory } from '@/types/sentiment.types';
import { v4 as uuidv4 } from 'uuid';

describe('Sentiment Events', () => {
  describe('Event Creation', () => {
    it('should create sentiment analysis completed event', () => {
      const analysisId = `sentiment_${uuidv4()}` as any;
      const feedbackId = uuidv4();
      const correlationId = uuidv4();
      
      const event = createSentimentAnalysisCompletedEvent(
        analysisId,
        feedbackId,
        'product_review',
        0.8,
        [SentimentCategory.OVERALL, SentimentCategory.PRODUCT_QUALITY],
        correlationId
      );
      
      expect(event).toBeDefined();
      expect(event.eventType).toBe(SentimentEventType.SENTIMENT_ANALYSIS_COMPLETED);
      expect(event.analysisId).toBe(analysisId);
      expect(event.feedbackId).toBe(feedbackId);
      expect(event.overallSentiment).toBe(0.8);
      expect(event.categories).toContain(SentimentCategory.PRODUCT_QUALITY);
      expect(event.correlationId).toBe(correlationId);
      expect(event.timestamp).toBeDefined();
    });
    
    it('should create sentiment analysis failed event', () => {
      const feedbackId = uuidv4();
      const error = 'Test error message';
      
      const event = createSentimentAnalysisFailedEvent(
        feedbackId,
        'product_review',
        error
      );
      
      expect(event).toBeDefined();
      expect(event.eventType).toBe(SentimentEventType.SENTIMENT_ANALYSIS_FAILED);
      expect(event.feedbackId).toBe(feedbackId);
      expect(event.error).toBe(error);
      expect(event.timestamp).toBeDefined();
    });
    
    it('should create sentiment trend generated event', () => {
      const trendId = `trend_${uuidv4()}` as any;
      const periodStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const periodEnd = new Date().toISOString();
      
      const event = createSentimentTrendGeneratedEvent(
        trendId,
        periodStart,
        periodEnd,
        0.65,
        500
      );
      
      expect(event).toBeDefined();
      expect(event.eventType).toBe(SentimentEventType.SENTIMENT_TREND_GENERATED);
      expect(event.trendId).toBe(trendId);
      expect(event.periodStart).toBe(periodStart);
      expect(event.periodEnd).toBe(periodEnd);
      expect(event.averageSentiment).toBe(0.65);
      expect(event.feedbackCount).toBe(500);
      expect(event.timestamp).toBeDefined();
    });
    
    it('should create sentiment insight created event', () => {
      const insightId = uuidv4();
      const title = 'Test Insight';
      const insightType = 'emerging_issue';
      const priority = 'high';
      const categories = [SentimentCategory.SHIPPING, SentimentCategory.PRODUCT_QUALITY];
      
      const event = createSentimentInsightCreatedEvent(
        insightId,
        title,
        insightType,
        priority,
        categories
      );
      
      expect(event).toBeDefined();
      expect(event.eventType).toBe(SentimentEventType.SENTIMENT_INSIGHT_CREATED);
      expect(event.insightId).toBe(insightId);
      expect(event.title).toBe(title);
      expect(event.insightType).toBe(insightType);
      expect(event.priority).toBe(priority);
      expect(event.categories).toEqual(categories);
      expect(event.timestamp).toBeDefined();
    });
    
    it('should create sentiment threshold exceeded event', () => {
      const category = SentimentCategory.SHIPPING;
      const currentScore = -0.5;
      const thresholdValue = -0.3;
      const feedbackCount = 75;
      
      const event = createSentimentThresholdExceededEvent(
        category,
        currentScore,
        thresholdValue,
        feedbackCount
      );
      
      expect(event).toBeDefined();
      expect(event.eventType).toBe(SentimentEventType.SENTIMENT_THRESHOLD_EXCEEDED);
      expect(event.category).toBe(category);
      expect(event.currentScore).toBe(currentScore);
      expect(event.thresholdValue).toBe(thresholdValue);
      expect(event.feedbackCount).toBe(feedbackCount);
      expect(event.timestamp).toBeDefined();
    });
    
    it('should create sentiment improved event', () => {
      const category = SentimentCategory.CUSTOMER_SERVICE;
      const previousScore = 0.3;
      const currentScore = 0.7;
      const improvement = 0.4;
      const periodDays = 30;
      
      const event = createSentimentImprovedEvent(
        category,
        previousScore,
        currentScore,
        improvement,
        periodDays
      );
      
      expect(event).toBeDefined();
      expect(event.eventType).toBe(SentimentEventType.SENTIMENT_IMPROVED);
      expect(event.category).toBe(category);
      expect(event.previousScore).toBe(previousScore);
      expect(event.currentScore).toBe(currentScore);
      expect(event.improvement).toBe(improvement);
      expect(event.periodDays).toBe(periodDays);
      expect(event.timestamp).toBeDefined();
    });
  });
});