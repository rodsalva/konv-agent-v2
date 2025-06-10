/**
 * Department Event Definitions
 */

import { DepartmentType, PriorityLevel, InsightID } from '@/types/department.types';

// Department event names
export enum DepartmentEventType {
  // Insight events
  INSIGHT_GENERATED = 'insight.generated',
  INSIGHT_APPROVED = 'insight.approved',
  INSIGHT_REJECTED = 'insight.rejected',
  INSIGHT_IMPLEMENTED = 'insight.implemented',
  
  // Implementation events
  IMPLEMENTATION_PLAN_CREATED = 'implementation.plan.created',
  IMPLEMENTATION_PLAN_UPDATED = 'implementation.plan.updated',
  IMPLEMENTATION_PLAN_COMPLETED = 'implementation.plan.completed',
  
  // Department events
  DEPARTMENT_RECOMMENDATIONS_GENERATED = 'department.recommendations.generated'
}

// Base department event interface
export interface IDepartmentEvent {
  eventType: DepartmentEventType;
  timestamp: number;
  correlationId?: string;
}

// Insight generated event
export interface IInsightGeneratedEvent extends IDepartmentEvent {
  eventType: DepartmentEventType.INSIGHT_GENERATED;
  insightId: string;
  department: DepartmentType;
  title: string;
  priority: PriorityLevel;
}

// Insight approved event
export interface IInsightApprovedEvent extends IDepartmentEvent {
  eventType: DepartmentEventType.INSIGHT_APPROVED;
  insightId: string;
  department: DepartmentType;
  approvedBy: string;
}

// Insight rejected event
export interface IInsightRejectedEvent extends IDepartmentEvent {
  eventType: DepartmentEventType.INSIGHT_REJECTED;
  insightId: string;
  department: DepartmentType;
  rejectedBy: string;
  reason: string;
}

// Insight implemented event
export interface IInsightImplementedEvent extends IDepartmentEvent {
  eventType: DepartmentEventType.INSIGHT_IMPLEMENTED;
  insightId: string;
  department: DepartmentType;
  implementedBy: string;
  implementationDate: string;
}

// Implementation plan created event
export interface IImplementationPlanCreatedEvent extends IDepartmentEvent {
  eventType: DepartmentEventType.IMPLEMENTATION_PLAN_CREATED;
  insightId: string;
  department: DepartmentType;
  timelineWeeks: number;
}

// Implementation plan updated event
export interface IImplementationPlanUpdatedEvent extends IDepartmentEvent {
  eventType: DepartmentEventType.IMPLEMENTATION_PLAN_UPDATED;
  insightId: string;
  department: DepartmentType;
  updates: string[];
}

// Implementation plan completed event
export interface IImplementationPlanCompletedEvent extends IDepartmentEvent {
  eventType: DepartmentEventType.IMPLEMENTATION_PLAN_COMPLETED;
  insightId: string;
  department: DepartmentType;
  completionDate: string;
  outcome: string;
}

// Department recommendations generated event
export interface IDepartmentRecommendationsGeneratedEvent extends IDepartmentEvent {
  eventType: DepartmentEventType.DEPARTMENT_RECOMMENDATIONS_GENERATED;
  departments: DepartmentType[];
  totalRecommendations: number;
}

// Union type for all department events
export type DepartmentEvent = 
  | IInsightGeneratedEvent
  | IInsightApprovedEvent
  | IInsightRejectedEvent
  | IInsightImplementedEvent
  | IImplementationPlanCreatedEvent
  | IImplementationPlanUpdatedEvent
  | IImplementationPlanCompletedEvent
  | IDepartmentRecommendationsGeneratedEvent;

// Helper functions to create events
export const createInsightGeneratedEvent = (
  insightId: string,
  department: DepartmentType,
  title: string,
  priority: PriorityLevel,
  correlationId?: string
): IInsightGeneratedEvent => ({
  eventType: DepartmentEventType.INSIGHT_GENERATED,
  timestamp: Date.now(),
  correlationId,
  insightId,
  department,
  title,
  priority
});

export const createInsightApprovedEvent = (
  insightId: string,
  department: DepartmentType,
  approvedBy: string,
  correlationId?: string
): IInsightApprovedEvent => ({
  eventType: DepartmentEventType.INSIGHT_APPROVED,
  timestamp: Date.now(),
  correlationId,
  insightId,
  department,
  approvedBy
});

export const createInsightRejectedEvent = (
  insightId: string,
  department: DepartmentType,
  rejectedBy: string,
  reason: string,
  correlationId?: string
): IInsightRejectedEvent => ({
  eventType: DepartmentEventType.INSIGHT_REJECTED,
  timestamp: Date.now(),
  correlationId,
  insightId,
  department,
  rejectedBy,
  reason
});

export const createImplementationPlanCreatedEvent = (
  insightId: string,
  department: DepartmentType,
  timelineWeeks: number,
  correlationId?: string
): IImplementationPlanCreatedEvent => ({
  eventType: DepartmentEventType.IMPLEMENTATION_PLAN_CREATED,
  timestamp: Date.now(),
  correlationId,
  insightId,
  department,
  timelineWeeks
});

export const createDepartmentRecommendationsGeneratedEvent = (
  departments: DepartmentType[],
  totalRecommendations: number,
  correlationId?: string
): IDepartmentRecommendationsGeneratedEvent => ({
  eventType: DepartmentEventType.DEPARTMENT_RECOMMENDATIONS_GENERATED,
  timestamp: Date.now(),
  correlationId,
  departments,
  totalRecommendations
});