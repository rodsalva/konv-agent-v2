/**
 * Persona Event Definitions
 */

import { PersonaID } from '@/types/personas.types';

// Persona event names
export enum PersonaEventType {
  // Lifecycle events
  PERSONA_CREATED = 'persona.created',
  PERSONA_UPDATED = 'persona.updated',
  PERSONA_DELETED = 'persona.deleted',
  
  // Feedback events
  FEEDBACK_COLLECTION_STARTED = 'feedback.collection.started',
  FEEDBACK_COLLECTION_COMPLETED = 'feedback.collection.completed',
  FEEDBACK_COLLECTION_FAILED = 'feedback.collection.failed',
  FEEDBACK_COLLECTED = 'feedback.collected',
  
  // Insight events
  INSIGHT_GENERATED = 'insight.generated',
  INSIGHT_APPROVED = 'insight.approved',
  INSIGHT_REJECTED = 'insight.rejected',
}

// Base persona event interface
export interface IPersonaEvent {
  eventType: PersonaEventType;
  timestamp: number;
  correlationId?: string;
}

// Persona created event
export interface IPersonaCreatedEvent extends IPersonaEvent {
  eventType: PersonaEventType.PERSONA_CREATED;
  personaId: PersonaID;
  personaType: string;
}

// Persona updated event
export interface IPersonaUpdatedEvent extends IPersonaEvent {
  eventType: PersonaEventType.PERSONA_UPDATED;
  personaId: PersonaID;
  updatedFields: string[];
}

// Persona deleted event
export interface IPersonaDeletedEvent extends IPersonaEvent {
  eventType: PersonaEventType.PERSONA_DELETED;
  personaId: PersonaID;
}

// Feedback collection started event
export interface IFeedbackCollectionStartedEvent extends IPersonaEvent {
  eventType: PersonaEventType.FEEDBACK_COLLECTION_STARTED;
  personaId: PersonaID;
  collectionId: string;
  platform: string;
  questionCount: number;
}

// Feedback collection completed event
export interface IFeedbackCollectionCompletedEvent extends IPersonaEvent {
  eventType: PersonaEventType.FEEDBACK_COLLECTION_COMPLETED;
  personaId: PersonaID;
  collectionId: string;
  platform: string;
  responseCount: number;
}

// Feedback collection failed event
export interface IFeedbackCollectionFailedEvent extends IPersonaEvent {
  eventType: PersonaEventType.FEEDBACK_COLLECTION_FAILED;
  personaId: PersonaID;
  collectionId: string;
  platform: string;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// Feedback collected event
export interface IFeedbackCollectedEvent extends IPersonaEvent {
  eventType: PersonaEventType.FEEDBACK_COLLECTED;
  personaId: PersonaID;
  collectionId: string;
  platform: string;
}

// Insight generated event
export interface IInsightGeneratedEvent extends IPersonaEvent {
  eventType: PersonaEventType.INSIGHT_GENERATED;
  insightId: string;
  title: string;
  personaIds: PersonaID[];
  departments: string[];
  priority: string;
}

// Insight approved event
export interface IInsightApprovedEvent extends IPersonaEvent {
  eventType: PersonaEventType.INSIGHT_APPROVED;
  insightId: string;
  approvedBy: string;
  implementationPriority: string;
}

// Insight rejected event
export interface IInsightRejectedEvent extends IPersonaEvent {
  eventType: PersonaEventType.INSIGHT_REJECTED;
  insightId: string;
  rejectedBy: string;
  reason: string;
}

// Union type for all persona events
export type PersonaEvent = 
  | IPersonaCreatedEvent
  | IPersonaUpdatedEvent
  | IPersonaDeletedEvent
  | IFeedbackCollectionStartedEvent
  | IFeedbackCollectionCompletedEvent
  | IFeedbackCollectionFailedEvent
  | IFeedbackCollectedEvent
  | IInsightGeneratedEvent
  | IInsightApprovedEvent
  | IInsightRejectedEvent;

// Helper functions to create events
export const createPersonaCreatedEvent = (
  personaId: PersonaID,
  personaType: string,
  correlationId?: string
): IPersonaCreatedEvent => ({
  eventType: PersonaEventType.PERSONA_CREATED,
  timestamp: Date.now(),
  correlationId,
  personaId,
  personaType
});

export const createPersonaUpdatedEvent = (
  personaId: PersonaID,
  updatedFields: string[],
  correlationId?: string
): IPersonaUpdatedEvent => ({
  eventType: PersonaEventType.PERSONA_UPDATED,
  timestamp: Date.now(),
  correlationId,
  personaId,
  updatedFields
});

export const createPersonaDeletedEvent = (
  personaId: PersonaID,
  correlationId?: string
): IPersonaDeletedEvent => ({
  eventType: PersonaEventType.PERSONA_DELETED,
  timestamp: Date.now(),
  correlationId,
  personaId
});

export const createFeedbackCollectedEvent = (
  personaId: PersonaID,
  collectionId: string,
  platform: string,
  correlationId?: string
): IFeedbackCollectedEvent => ({
  eventType: PersonaEventType.FEEDBACK_COLLECTED,
  timestamp: Date.now(),
  correlationId,
  personaId,
  collectionId,
  platform
});

export const createInsightGeneratedEvent = (
  insightId: string,
  title: string,
  personaIds: PersonaID[],
  departments: string[],
  priority: string,
  correlationId?: string
): IInsightGeneratedEvent => ({
  eventType: PersonaEventType.INSIGHT_GENERATED,
  timestamp: Date.now(),
  correlationId,
  insightId,
  title,
  personaIds,
  departments,
  priority
});