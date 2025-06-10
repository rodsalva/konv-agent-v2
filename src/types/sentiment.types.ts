/**
 * Customer Sentiment Analysis Types
 */
import { z } from 'zod';
import { Brand } from './database.types';

// Branded Types for Type-Safety
export type SentimentAnalysisID = Brand<string, 'SentimentAnalysisID'>;
export type SentimentTrendID = Brand<string, 'SentimentTrendID'>;

/**
 * Sentiment Score Range:
 * -1.0 to -0.6: Very Negative
 * -0.6 to -0.2: Negative
 * -0.2 to 0.2:  Neutral
 *  0.2 to 0.6:  Positive
 *  0.6 to 1.0:  Very Positive
 */
export const SentimentScoreSchema = z.number().min(-1).max(1);
export type SentimentScore = z.infer<typeof SentimentScoreSchema>;

/**
 * Confidence Score Range: 0.0 to 1.0
 * Indicates the model's confidence in the sentiment analysis
 */
export const ConfidenceScoreSchema = z.number().min(0).max(1);
export type ConfidenceScore = z.infer<typeof ConfidenceScoreSchema>;

/**
 * Feedback Source Types
 */
export enum FeedbackSourceType {
  PRODUCT_REVIEW = 'product_review',
  CUSTOMER_SUPPORT = 'customer_support',
  SURVEY = 'survey',
  APP_REVIEW = 'app_review',
  SOCIAL_MEDIA = 'social_media',
  CHAT = 'chat',
  EMAIL = 'email',
  OTHER = 'other'
}

/**
 * Sentiment Categories
 */
export enum SentimentCategory {
  OVERALL = 'overall',
  PRODUCT_QUALITY = 'product_quality',
  SHIPPING = 'shipping',
  PRICE = 'price',
  CUSTOMER_SERVICE = 'customer_service',
  RETURN_PROCESS = 'return_process',
  USER_EXPERIENCE = 'user_experience',
  CHECKOUT_PROCESS = 'checkout_process',
  PRODUCT_SELECTION = 'product_selection',
  PAYMENT_OPTIONS = 'payment_options'
}

/**
 * Language Enum
 */
export enum FeedbackLanguage {
  PORTUGUESE = 'pt',
  SPANISH = 'es',
  ENGLISH = 'en',
  UNKNOWN = 'unknown'
}

/**
 * Base Sentiment Analysis Result
 */
export interface SentimentAnalysis {
  id: SentimentAnalysisID;
  feedback_id: string;
  feedback_source: FeedbackSourceType;
  feedback_text: string;
  language: FeedbackLanguage;
  overall_sentiment: SentimentScore;
  confidence: ConfidenceScore;
  category_sentiment: Record<SentimentCategory, SentimentScore>;
  aspects: Array<{
    aspect: string;
    sentiment: SentimentScore;
    confidence: ConfidenceScore;
    excerpts: string[];
  }>;
  key_phrases: string[];
  entities: Array<{
    entity: string;
    type: string;
    sentiment: SentimentScore;
  }>;
  metadata: Record<string, unknown>;
  analyzed_at: string;
  created_at: string;
  updated_at: string;
}

/**
 * Sentiment Trend Analysis
 */
export interface SentimentTrend {
  id: SentimentTrendID;
  period_start: string;
  period_end: string;
  total_feedback_count: number;
  average_sentiment: SentimentScore;
  sentiment_distribution: {
    very_negative: number;
    negative: number;
    neutral: number;
    positive: number;
    very_positive: number;
  };
  category_sentiment: Record<SentimentCategory, SentimentScore>;
  top_positive_aspects: Array<{
    aspect: string;
    sentiment: SentimentScore;
    count: number;
    change: number; // Change from previous period
  }>;
  top_negative_aspects: Array<{
    aspect: string;
    sentiment: SentimentScore;
    count: number;
    change: number; // Change from previous period
  }>;
  emerging_topics: Array<{
    topic: string;
    count: number;
    sentiment: SentimentScore;
    change: number; // Change from previous period
  }>;
  created_at: string;
}

/**
 * Sentiment Insights
 */
export interface SentimentInsight {
  id: string;
  title: string;
  description: string;
  insight_type: 'trend_change' | 'emerging_issue' | 'improvement_opportunity' | 'competitive_advantage';
  priority: 'low' | 'medium' | 'high' | 'critical';
  categories: SentimentCategory[];
  sentiment_scores: Record<SentimentCategory, SentimentScore>;
  affected_aspects: string[];
  supporting_data: {
    feedback_count: number;
    representative_samples: string[];
    confidence: ConfidenceScore;
  };
  recommendations: Array<{
    department: string;
    action: string;
    expected_impact: 'low' | 'medium' | 'high';
  }>;
  created_at: string;
}

// Zod Schemas for Validation

export const SentimentAnalysisRequestSchema = z.object({
  feedback_id: z.string().min(1),
  feedback_text: z.string().min(1),
  feedback_source: z.nativeEnum(FeedbackSourceType),
  language: z.nativeEnum(FeedbackLanguage).optional(),
  metadata: z.record(z.unknown()).optional()
});
export type SentimentAnalysisRequest = z.infer<typeof SentimentAnalysisRequestSchema>;

export const SentimentAspectSchema = z.object({
  aspect: z.string().min(1),
  sentiment: SentimentScoreSchema,
  confidence: ConfidenceScoreSchema,
  excerpts: z.array(z.string())
});
export type SentimentAspect = z.infer<typeof SentimentAspectSchema>;

export const SentimentEntitySchema = z.object({
  entity: z.string().min(1),
  type: z.string().min(1),
  sentiment: SentimentScoreSchema
});
export type SentimentEntity = z.infer<typeof SentimentEntitySchema>;

export const SentimentAnalysisResultSchema = z.object({
  feedback_id: z.string().min(1),
  feedback_source: z.nativeEnum(FeedbackSourceType),
  language: z.nativeEnum(FeedbackLanguage),
  overall_sentiment: SentimentScoreSchema,
  confidence: ConfidenceScoreSchema,
  category_sentiment: z.record(z.nativeEnum(SentimentCategory), SentimentScoreSchema).optional(),
  aspects: z.array(SentimentAspectSchema).optional(),
  key_phrases: z.array(z.string()).optional(),
  entities: z.array(SentimentEntitySchema).optional(),
  metadata: z.record(z.unknown()).optional()
});
export type SentimentAnalysisResult = z.infer<typeof SentimentAnalysisResultSchema>;

export const SentimentTrendRequestSchema = z.object({
  period_start: z.string().datetime(),
  period_end: z.string().datetime(),
  feedback_sources: z.array(z.nativeEnum(FeedbackSourceType)).optional(),
  categories: z.array(z.nativeEnum(SentimentCategory)).optional()
});
export type SentimentTrendRequest = z.infer<typeof SentimentTrendRequestSchema>;

// Response Types
export interface SentimentAnalysisResponse {
  success: boolean;
  data: SentimentAnalysis;
}

export interface SentimentAnalysisListResponse {
  success: boolean;
  data: SentimentAnalysis[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface SentimentTrendResponse {
  success: boolean;
  data: SentimentTrend;
}

export interface SentimentInsightResponse {
  success: boolean;
  data: SentimentInsight[];
  total: number;
}

export interface SentimentDashboardData {
  overall_sentiment: SentimentScore;
  feedback_count: number;
  sentiment_distribution: {
    very_negative: number;
    negative: number;
    neutral: number;
    positive: number;
    very_positive: number;
  };
  category_sentiment: Record<SentimentCategory, SentimentScore>;
  trending_aspects: {
    positive: Array<{
      aspect: string;
      sentiment: SentimentScore;
      count: number;
    }>;
    negative: Array<{
      aspect: string;
      sentiment: SentimentScore;
      count: number;
    }>;
  };
  recent_insights: SentimentInsight[];
  sentiment_over_time: Array<{
    date: string;
    sentiment: SentimentScore;
    feedback_count: number;
  }>;
}