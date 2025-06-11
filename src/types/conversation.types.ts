// Type definitions for Conversation API
import { z } from 'zod';
import { PersonaID } from './personas.types';

// Branded types
export type ConversationID = string & { readonly __brand: 'ConversationID' };
export type MessageID = string & { readonly __brand: 'MessageID' };
export type ObservationID = string & { readonly __brand: 'ObservationID' };
export type ResultID = string & { readonly __brand: 'ResultID' };
export type CategoryID = string & { readonly __brand: 'CategoryID' };
export type TaskID = string & { readonly __brand: 'TaskID' };
export type MetricsID = string & { readonly __brand: 'MetricsID' };

// Conversation status
export const ConversationStatusEnum = z.enum([
  'in_progress',
  'completed', 
  'failed',
  'cancelled'
]);

export type ConversationStatus = z.infer<typeof ConversationStatusEnum>;

// Message type
export const MessageTypeEnum = z.enum([
  'observation',
  'question',
  'response',
  'system',
  'analysis'
]);

export type MessageType = z.infer<typeof MessageTypeEnum>;

// Observation status
export const ObservationStatusEnum = z.enum([
  'pending',
  'reviewed',
  'actioned',
  'dismissed'
]);

export type ObservationStatus = z.infer<typeof ObservationStatusEnum>;

// Verification status
export const VerificationStatusEnum = z.enum([
  'pending',
  'verified',
  'rejected'
]);

export type VerificationStatus = z.infer<typeof VerificationStatusEnum>;

// Task status
export const TaskStatusEnum = z.enum([
  'open',
  'in_progress',
  'completed',
  'cancelled'
]);

export type TaskStatus = z.infer<typeof TaskStatusEnum>;

// Priority
export const PriorityEnum = z.enum([
  'low',
  'medium',
  'high',
  'critical'
]);

export type Priority = z.infer<typeof PriorityEnum>;

// Expected impact
export const ImpactEnum = z.enum([
  'minimal',
  'moderate',
  'significant',
  'major'
]);

export type Impact = z.infer<typeof ImpactEnum>;

// Conversation schema
export const ConversationSchema = z.object({
  conversation_id: z.string().uuid(),
  title: z.string().min(3).max(200),
  start_time: z.string().datetime(),
  end_time: z.string().datetime().optional(),
  status: ConversationStatusEnum,
  initiator_agent_id: z.string(),
  exploration_type: z.string(),
  platform: z.string(),
  metadata: z.record(z.unknown()).optional(),
  summary: z.string().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
});

export type Conversation = z.infer<typeof ConversationSchema>;

// Message schema
export const MessageSchema = z.object({
  message_id: z.string().uuid(),
  conversation_id: z.string().uuid(),
  sender_id: z.string(),
  receiver_id: z.string().optional(),
  message_type: MessageTypeEnum,
  content: z.string(),
  metadata: z.record(z.unknown()).optional(),
  sentiment: z.string().optional(),
  entities: z.record(z.unknown()).optional(),
  timestamp: z.string().datetime(),
  parent_id: z.string().uuid().optional(),
  sequence_num: z.number().int(),
  is_visible: z.boolean().default(true)
});

export type Message = z.infer<typeof MessageSchema>;

// Observation schema
export const ObservationSchema = z.object({
  observation_id: z.string().uuid(),
  conversation_id: z.string().uuid(),
  message_id: z.string().uuid().optional(),
  agent_id: z.string(),
  agent_type: z.string(),
  category: z.string(),
  observation_text: z.string(),
  importance_score: z.number().int().min(1).max(10).optional(),
  confidence_score: z.number().min(0).max(1).optional(),
  related_entities: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
  timestamp: z.string().datetime(),
  is_actionable: z.boolean().default(false),
  status: ObservationStatusEnum.default('pending')
});

export type Observation = z.infer<typeof ObservationSchema>;

// Category schema
export const CategorySchema = z.object({
  category_id: z.string().uuid(),
  name: z.string(),
  parent_id: z.string().uuid().optional(),
  description: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  created_at: z.string().datetime()
});

export type Category = z.infer<typeof CategorySchema>;

// ExplorationResult schema
export const ExplorationResultSchema = z.object({
  result_id: z.string().uuid(),
  conversation_id: z.string().uuid(),
  agent_id: z.string(),
  agent_type: z.string(),
  result_type: z.string(),
  title: z.string(),
  summary: z.string(),
  full_analysis: z.string().optional(),
  findings: z.array(z.object({
    finding: z.string(),
    importance: z.number().int().min(1).max(10),
    category: z.string()
  })),
  evidence: z.record(z.unknown()).optional(),
  metrics: z.record(z.unknown()).optional(),
  departments: z.array(z.object({
    name: z.string(),
    relevance: z.number().min(0).max(1),
    recommendations: z.array(z.string())
  })).optional(),
  recommendations: z.array(z.object({
    recommendation: z.string(),
    priority: PriorityEnum,
    implementation_difficulty: z.number().int().min(1).max(10).optional(),
    expected_impact: ImpactEnum.optional()
  })).optional(),
  next_steps: z.string().optional(),
  exploration_time_seconds: z.number().int().optional(),
  timestamp: z.string().datetime(),
  verified_by: z.string().optional(),
  verification_status: VerificationStatusEnum.default('pending'),
  verification_notes: z.string().optional()
});

export type ExplorationResult = z.infer<typeof ExplorationResultSchema>;

// SessionMetrics schema
export const SessionMetricsSchema = z.object({
  metrics_id: z.string().uuid(),
  conversation_id: z.string().uuid(),
  exploration_duration_seconds: z.number().int(),
  agent_count: z.number().int(),
  message_count: z.number().int(),
  observation_count: z.number().int(),
  actionable_observations_count: z.number().int().optional(),
  categories_covered: z.number().int().optional(),
  average_observation_importance: z.number().optional(),
  average_observation_confidence: z.number().optional(),
  performance_metrics: z.record(z.unknown()).optional(),
  resource_usage: z.record(z.unknown()).optional(),
  timestamp: z.string().datetime()
});

export type SessionMetrics = z.infer<typeof SessionMetricsSchema>;

// ExplorationTask schema
export const ExplorationTaskSchema = z.object({
  task_id: z.string().uuid(),
  conversation_id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  assigned_to: z.string().optional(),
  status: TaskStatusEnum.default('open'),
  priority: PriorityEnum.default('medium'),
  due_date: z.string().datetime().optional(),
  source_observation_id: z.string().uuid().optional(),
  department: z.string(),
  expected_impact: ImpactEnum.optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  completed_at: z.string().datetime().optional()
});

export type ExplorationTask = z.infer<typeof ExplorationTaskSchema>;

// Request schemas for API endpoints
export const CreateConversationSchema = z.object({
  title: z.string().min(3).max(200),
  initiator_agent_id: z.string(),
  exploration_type: z.string(),
  platform: z.string(),
  metadata: z.record(z.unknown()).optional()
});

export type CreateConversationRequest = z.infer<typeof CreateConversationSchema>;

export const CreateMessageSchema = z.object({
  conversation_id: z.string().uuid(),
  sender_id: z.string(),
  receiver_id: z.string().optional(),
  message_type: MessageTypeEnum,
  content: z.string(),
  metadata: z.record(z.unknown()).optional(),
  parent_id: z.string().uuid().optional()
});

export type CreateMessageRequest = z.infer<typeof CreateMessageSchema>;

export const CreateObservationSchema = z.object({
  conversation_id: z.string().uuid(),
  message_id: z.string().uuid().optional(),
  agent_id: z.string(),
  agent_type: z.string(),
  category: z.string(),
  observation_text: z.string(),
  importance_score: z.number().int().min(1).max(10).optional(),
  confidence_score: z.number().min(0).max(1).optional(),
  related_entities: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
  is_actionable: z.boolean().optional()
});

export type CreateObservationRequest = z.infer<typeof CreateObservationSchema>;

export const CreateExplorationResultSchema = z.object({
  conversation_id: z.string().uuid(),
  agent_id: z.string(),
  agent_type: z.string(),
  result_type: z.string(),
  title: z.string(),
  summary: z.string(),
  full_analysis: z.string().optional(),
  findings: z.array(z.object({
    finding: z.string(),
    importance: z.number().int().min(1).max(10),
    category: z.string()
  })),
  evidence: z.record(z.unknown()).optional(),
  metrics: z.record(z.unknown()).optional(),
  departments: z.array(z.object({
    name: z.string(),
    relevance: z.number().min(0).max(1),
    recommendations: z.array(z.string())
  })).optional(),
  recommendations: z.array(z.object({
    recommendation: z.string(),
    priority: PriorityEnum,
    implementation_difficulty: z.number().int().min(1).max(10).optional(),
    expected_impact: ImpactEnum.optional()
  })).optional(),
  next_steps: z.string().optional(),
  exploration_time_seconds: z.number().int().optional()
});

export type CreateExplorationResultRequest = z.infer<typeof CreateExplorationResultSchema>;

// Response interfaces
export interface ConversationResponse {
  conversation: Conversation;
}

export interface ConversationsListResponse {
  conversations: Conversation[];
  total: number;
  page: number;
  limit: number;
}

export interface MessagesListResponse {
  messages: Message[];
  total: number;
  page: number;
  limit: number;
}

export interface ObservationsListResponse {
  observations: Observation[];
  total: number;
  page: number;
  limit: number;
}

export interface ExplorationResultsListResponse {
  results: ExplorationResult[];
  total: number;
  page: number;
  limit: number;
}

export interface ConversationSummaryResponse {
  conversation_id: ConversationID;
  title: string;
  status: ConversationStatus;
  start_time: string;
  end_time?: string;
  message_count: number;
  observation_count: number;
  agent_count: number;
  exploration_time_seconds?: number;
  key_findings: string[];
}

export interface DepartmentInsightsResponse {
  department: string;
  insights: Array<{
    title: string;
    description: string;
    priority: Priority;
    source_conversations: ConversationID[];
    created_at: string;
  }>;
  recommendations: Array<{
    recommendation: string;
    priority: Priority;
    expected_impact: Impact;
  }>;
}