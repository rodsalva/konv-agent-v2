/**
 * Feedback Event Definitions
 */

import { IFeedback, IFeedbackSubmission, IFeedbackProcessingResult } from '@/types/feedback/feedback.types';

// Feedback event names
export enum FeedbackEventType {
  // Lifecycle events
  FEEDBACK_RECEIVED = 'feedback.received',
  FEEDBACK_VALIDATED = 'feedback.validated',
  FEEDBACK_ENRICHED = 'feedback.enriched',
  FEEDBACK_ANALYZED = 'feedback.analyzed',
  FEEDBACK_PROCESSED = 'feedback.processed',
  FEEDBACK_DISTRIBUTED = 'feedback.distributed',
  
  // Error events
  FEEDBACK_VALIDATION_FAILED = 'feedback.validation.failed',
  FEEDBACK_PROCESSING_FAILED = 'feedback.processing.failed',
  
  // Admin events
  FEEDBACK_ARCHIVED = 'feedback.archived',
  FEEDBACK_RESTORED = 'feedback.restored',
  FEEDBACK_DELETED = 'feedback.deleted',
  
  // Batch events
  FEEDBACK_BATCH_RECEIVED = 'feedback.batch.received',
  FEEDBACK_BATCH_PROCESSED = 'feedback.batch.processed',
}

// Base feedback event interface
export interface IFeedbackEvent {
  eventType: FeedbackEventType;
  timestamp: number;
  correlationId?: string;
}

// Feedback received event
export interface IFeedbackReceivedEvent extends IFeedbackEvent {
  eventType: FeedbackEventType.FEEDBACK_RECEIVED;
  feedbackId: string;
  feedback: IFeedbackSubmission;
}

// Feedback validated event
export interface IFeedbackValidatedEvent extends IFeedbackEvent {
  eventType: FeedbackEventType.FEEDBACK_VALIDATED;
  feedbackId: string;
  validatedFeedback: IFeedback;
}

// Feedback enriched event
export interface IFeedbackEnrichedEvent extends IFeedbackEvent {
  eventType: FeedbackEventType.FEEDBACK_ENRICHED;
  feedbackId: string;
  enrichedFeedback: IFeedback;
}

// Feedback analyzed event
export interface IFeedbackAnalyzedEvent extends IFeedbackEvent {
  eventType: FeedbackEventType.FEEDBACK_ANALYZED;
  feedbackId: string;
  analyzedFeedback: IFeedback;
}

// Feedback processed event
export interface IFeedbackProcessedEvent extends IFeedbackEvent {
  eventType: FeedbackEventType.FEEDBACK_PROCESSED;
  feedbackId: string;
  processingResult: IFeedbackProcessingResult;
}

// Feedback distributed event
export interface IFeedbackDistributedEvent extends IFeedbackEvent {
  eventType: FeedbackEventType.FEEDBACK_DISTRIBUTED;
  feedbackId: string;
  distributionTargets: string[];
  distributionResult: Record<string, unknown>;
}

// Feedback error event
export interface IFeedbackErrorEvent extends IFeedbackEvent {
  eventType: FeedbackEventType.FEEDBACK_VALIDATION_FAILED | FeedbackEventType.FEEDBACK_PROCESSING_FAILED;
  feedbackId: string;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  stage: 'validation' | 'enrichment' | 'analysis' | 'processing' | 'distribution';
}

// Union type for all feedback events
export type FeedbackEvent = 
  | IFeedbackReceivedEvent
  | IFeedbackValidatedEvent
  | IFeedbackEnrichedEvent
  | IFeedbackAnalyzedEvent
  | IFeedbackProcessedEvent
  | IFeedbackDistributedEvent
  | IFeedbackErrorEvent;

// Helper functions to create events
export const createFeedbackReceivedEvent = (
  feedbackId: string,
  feedback: IFeedbackSubmission,
  correlationId?: string
): IFeedbackReceivedEvent => ({
  eventType: FeedbackEventType.FEEDBACK_RECEIVED,
  timestamp: Date.now(),
  correlationId,
  feedbackId,
  feedback
});

export const createFeedbackValidatedEvent = (
  feedbackId: string,
  validatedFeedback: IFeedback,
  correlationId?: string
): IFeedbackValidatedEvent => ({
  eventType: FeedbackEventType.FEEDBACK_VALIDATED,
  timestamp: Date.now(),
  correlationId,
  feedbackId,
  validatedFeedback
});

export const createFeedbackErrorEvent = (
  eventType: FeedbackEventType.FEEDBACK_VALIDATION_FAILED | FeedbackEventType.FEEDBACK_PROCESSING_FAILED,
  feedbackId: string,
  error: { code: string; message: string; details?: unknown },
  stage: 'validation' | 'enrichment' | 'analysis' | 'processing' | 'distribution',
  correlationId?: string
): IFeedbackErrorEvent => ({
  eventType,
  timestamp: Date.now(),
  correlationId,
  feedbackId,
  error,
  stage
});