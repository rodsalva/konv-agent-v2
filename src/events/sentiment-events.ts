/**
 * Sentiment Analysis Event Definitions
 */

import { 
  SentimentAnalysisID, 
  SentimentTrendID, 
  SentimentCategory, 
  SentimentScore, 
  FeedbackSourceType,
  SentimentAnalysis,
  SentimentInsight
} from '@/types/sentiment.types';

// Sentiment analysis event names
export enum SentimentEventType {
  // Analysis events
  SENTIMENT_ANALYSIS_COMPLETED = 'sentiment.analysis.completed',
  SENTIMENT_ANALYSIS_FAILED = 'sentiment.analysis.failed',
  
  // Trend events
  SENTIMENT_TREND_GENERATED = 'sentiment.trend.generated',
  
  // Insight events
  SENTIMENT_INSIGHT_CREATED = 'sentiment.insight.created',
  SENTIMENT_INSIGHT_UPDATED = 'sentiment.insight.updated',
  
  // Threshold events
  SENTIMENT_THRESHOLD_EXCEEDED = 'sentiment.threshold.exceeded',
  SENTIMENT_IMPROVED = 'sentiment.improved'
}

// Base sentiment event interface
export interface ISentimentEvent {
  eventType: SentimentEventType;
  timestamp: number;
  correlationId?: string;
}

// Sentiment analysis completed event
export interface ISentimentAnalysisCompletedEvent extends ISentimentEvent {
  eventType: SentimentEventType.SENTIMENT_ANALYSIS_COMPLETED;
  analysisId: SentimentAnalysisID;
  feedbackId: string;
  feedbackSource: FeedbackSourceType;
  overallSentiment: SentimentScore;
  categories: SentimentCategory[];
}

// Sentiment analysis failed event
export interface ISentimentAnalysisFailedEvent extends ISentimentEvent {
  eventType: SentimentEventType.SENTIMENT_ANALYSIS_FAILED;
  feedbackId: string;
  feedbackSource: FeedbackSourceType;
  error: string;
}

// Sentiment trend generated event
export interface ISentimentTrendGeneratedEvent extends ISentimentEvent {
  eventType: SentimentEventType.SENTIMENT_TREND_GENERATED;
  trendId: SentimentTrendID;
  periodStart: string;
  periodEnd: string;
  averageSentiment: SentimentScore;
  feedbackCount: number;
}

// Sentiment insight created event
export interface ISentimentInsightCreatedEvent extends ISentimentEvent {
  eventType: SentimentEventType.SENTIMENT_INSIGHT_CREATED;
  insightId: string;
  title: string;
  insightType: string;
  priority: string;
  categories: SentimentCategory[];
}

// Sentiment insight updated event
export interface ISentimentInsightUpdatedEvent extends ISentimentEvent {
  eventType: SentimentEventType.SENTIMENT_INSIGHT_UPDATED;
  insightId: string;
  updatedFields: string[];
}

// Sentiment threshold exceeded event
export interface ISentimentThresholdExceededEvent extends ISentimentEvent {
  eventType: SentimentEventType.SENTIMENT_THRESHOLD_EXCEEDED;
  category: SentimentCategory;
  currentScore: SentimentScore;
  thresholdValue: SentimentScore;
  feedbackCount: number;
}

// Sentiment improved event
export interface ISentimentImprovedEvent extends ISentimentEvent {
  eventType: SentimentEventType.SENTIMENT_IMPROVED;
  category: SentimentCategory;
  previousScore: SentimentScore;
  currentScore: SentimentScore;
  improvement: number;
  periodDays: number;
}

// Union type for all sentiment events
export type SentimentEvent = 
  | ISentimentAnalysisCompletedEvent
  | ISentimentAnalysisFailedEvent
  | ISentimentTrendGeneratedEvent
  | ISentimentInsightCreatedEvent
  | ISentimentInsightUpdatedEvent
  | ISentimentThresholdExceededEvent
  | ISentimentImprovedEvent;

// Helper functions to create events
export const createSentimentAnalysisCompletedEvent = (
  analysisId: SentimentAnalysisID,
  feedbackId: string,
  feedbackSource: FeedbackSourceType,
  overallSentiment: SentimentScore,
  categories: SentimentCategory[],
  correlationId?: string
): ISentimentAnalysisCompletedEvent => ({
  eventType: SentimentEventType.SENTIMENT_ANALYSIS_COMPLETED,
  timestamp: Date.now(),
  correlationId,
  analysisId,
  feedbackId,
  feedbackSource,
  overallSentiment,
  categories
});

export const createSentimentAnalysisFailedEvent = (
  feedbackId: string,
  feedbackSource: FeedbackSourceType,
  error: string,
  correlationId?: string
): ISentimentAnalysisFailedEvent => ({
  eventType: SentimentEventType.SENTIMENT_ANALYSIS_FAILED,
  timestamp: Date.now(),
  correlationId,
  feedbackId,
  feedbackSource,
  error
});

export const createSentimentTrendGeneratedEvent = (
  trendId: SentimentTrendID,
  periodStart: string,
  periodEnd: string,
  averageSentiment: SentimentScore,
  feedbackCount: number,
  correlationId?: string
): ISentimentTrendGeneratedEvent => ({
  eventType: SentimentEventType.SENTIMENT_TREND_GENERATED,
  timestamp: Date.now(),
  correlationId,
  trendId,
  periodStart,
  periodEnd,
  averageSentiment,
  feedbackCount
});

export const createSentimentInsightCreatedEvent = (
  insightId: string,
  title: string,
  insightType: string,
  priority: string,
  categories: SentimentCategory[],
  correlationId?: string
): ISentimentInsightCreatedEvent => ({
  eventType: SentimentEventType.SENTIMENT_INSIGHT_CREATED,
  timestamp: Date.now(),
  correlationId,
  insightId,
  title,
  insightType,
  priority,
  categories
});

export const createSentimentThresholdExceededEvent = (
  category: SentimentCategory,
  currentScore: SentimentScore,
  thresholdValue: SentimentScore,
  feedbackCount: number,
  correlationId?: string
): ISentimentThresholdExceededEvent => ({
  eventType: SentimentEventType.SENTIMENT_THRESHOLD_EXCEEDED,
  timestamp: Date.now(),
  correlationId,
  category,
  currentScore,
  thresholdValue,
  feedbackCount
});

export const createSentimentImprovedEvent = (
  category: SentimentCategory,
  previousScore: SentimentScore,
  currentScore: SentimentScore,
  improvement: number,
  periodDays: number,
  correlationId?: string
): ISentimentImprovedEvent => ({
  eventType: SentimentEventType.SENTIMENT_IMPROVED,
  timestamp: Date.now(),
  correlationId,
  category,
  previousScore,
  currentScore,
  improvement,
  periodDays
});