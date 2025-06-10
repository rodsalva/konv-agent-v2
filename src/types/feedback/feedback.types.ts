/**
 * Feedback Data Type Definitions
 */

import { z } from 'zod';

// Feedback status types
export type FeedbackStatus = 'raw' | 'processed' | 'analyzed' | 'archived';

// Feedback types
export type FeedbackType = 'survey' | 'review' | 'support_ticket' | 'nps' | 'general';

// Base feedback interface
export interface IFeedback {
  id?: string;
  customer_agent_id: string;
  company_agent_id: string;
  raw_feedback: Record<string, unknown>;
  processed_feedback?: Record<string, unknown> | null;
  feedback_type?: FeedbackType | null;
  status: FeedbackStatus;
  sentiment_score?: number | null;
  confidence_score?: number | null;
  tags?: string[] | null;
  created_at?: string;
  processed_at?: string | null;
}

// Feedback metadata for context
export interface IFeedbackContext {
  source: string;
  channel: string;
  sessionId?: string;
  locale?: string;
  device?: string;
  platform?: string;
  userAgent?: string;
  ipAddress?: string;
  timestamp?: string;
  [key: string]: unknown;
}

// Feedback submission interface
export interface IFeedbackSubmission {
  customer_agent_id: string;
  company_agent_id: string;
  content: {
    text?: string;
    rating?: number;
    category?: string;
    options?: Record<string, unknown>;
    attachments?: Array<{
      type: string;
      url: string;
      name?: string;
    }>;
    [key: string]: unknown;
  };
  feedback_type?: FeedbackType;
  context: IFeedbackContext;
  metadata?: Record<string, unknown>;
}

// Feedback processing result
export interface IFeedbackProcessingResult {
  id: string;
  status: FeedbackStatus;
  processed_feedback?: Record<string, unknown>;
  sentiment_score?: number;
  confidence_score?: number;
  tags?: string[];
  insights?: Array<{
    type: string;
    title: string;
    description?: string;
    confidence: number;
    data?: Record<string, unknown>;
  }>;
  processed_at: string;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// Processed feedback data
export interface IProcessedFeedback {
  id: string;
  summary?: string;
  sentiment: {
    score: number;
    label: 'positive' | 'negative' | 'neutral' | 'mixed';
    confidence: number;
  };
  entities?: Array<{
    text: string;
    type: string;
    relevance: number;
    sentiment?: number;
  }>;
  categories?: Array<{
    name: string;
    confidence: number;
  }>;
  keywords?: Array<{
    text: string;
    relevance: number;
  }>;
  language?: string;
  concepts?: Array<{
    text: string;
    relevance: number;
  }>;
  actionable: boolean;
  priority?: number;
  [key: string]: unknown;
}

// Validation schemas
export const feedbackSubmissionSchema = z.object({
  customer_agent_id: z.string().uuid(),
  company_agent_id: z.string().uuid(),
  content: z.object({
    text: z.string().optional(),
    rating: z.number().min(0).max(10).optional(),
    category: z.string().optional(),
    options: z.record(z.unknown()).optional(),
    attachments: z.array(z.object({
      type: z.string(),
      url: z.string().url(),
      name: z.string().optional(),
    })).optional(),
  }).refine(data => 
    data.text !== undefined || 
    data.rating !== undefined || 
    (data.options && Object.keys(data.options).length > 0), 
    {
      message: "Feedback must contain either text, rating, or options"
    }
  ),
  feedback_type: z.enum(['survey', 'review', 'support_ticket', 'nps', 'general']).optional(),
  context: z.object({
    source: z.string(),
    channel: z.string(),
    sessionId: z.string().optional(),
    locale: z.string().optional(),
    device: z.string().optional(),
    platform: z.string().optional(),
    userAgent: z.string().optional(),
    ipAddress: z.string().optional(),
    timestamp: z.string().optional(),
  }).catchall(z.unknown()),
  metadata: z.record(z.unknown()).optional(),
});