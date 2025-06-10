/**
 * A2A Protocol Type Definitions
 * Based on A2A specification for cross-platform agent interoperability
 */

// Base agent and session types
export type AgentId = string & { readonly __brand: 'AgentId' };
export type SessionId = string & { readonly __brand: 'SessionId' };

// A2A Lifecycle states
export type A2ALifecycleState = 'discovering' | 'connecting' | 'negotiating' | 'ready' | 'error' | 'disconnected';

// A2A Capability types
export type A2ACapability = 
  | 'messaging'
  | 'streaming'
  | 'file_transfer'
  | 'event_subscription'
  | 'agent_discovery'
  | 'task_execution';

// Branded types for security
export type AgentCardId = string & { readonly __brand: 'AgentCardId' };
export type TaskId = string & { readonly __brand: 'TaskId' };
export type ConversationId = string & { readonly __brand: 'ConversationId' };
export type MessageId = string & { readonly __brand: 'MessageId' };

// Agent Card Schema (for discovery)
export interface AgentCard {
  id: AgentCardId;
  name: string;
  description: string;
  version: string;
  capabilities: A2ACapability[];
  skills: Array<AgentSkill>;
  authentication: AgentAuthentication;
  endpoints: {
    messaging: string;
    discovery?: string;
    events?: string;
  };
  metadata?: Record<string, unknown>;
}

export interface AgentSkill {
  id: string;
  name: string;
  description: string;
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface AgentAuthentication {
  type: 'oauth2' | 'apikey' | 'jwt' | 'none';
  scopes?: string[];
  metadata?: Record<string, unknown>;
}

// Message types
export interface A2AMessage {
  id: MessageId;
  conversationId: ConversationId;
  fromAgent: AgentId;
  toAgent: AgentId;
  type: 'text' | 'binary' | 'json' | 'control';
  content: unknown;
  timestamp: string;
  metadata?: Record<string, unknown>;
  correlationId?: string;
}

export interface A2ATextMessage extends A2AMessage {
  type: 'text';
  content: string;
}

export interface A2AJsonMessage extends A2AMessage {
  type: 'json';
  content: Record<string, unknown>;
}

export interface A2ABinaryMessage extends A2AMessage {
  type: 'binary';
  content: Uint8Array;
  contentType: string;
}

export interface A2AControlMessage extends A2AMessage {
  type: 'control';
  content: {
    action: 'connect' | 'disconnect' | 'ping' | 'ack';
    data?: Record<string, unknown>;
  };
}

// Task execution types
export interface A2ATask {
  id: TaskId;
  name: string;
  agentId: AgentId;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  metadata?: Record<string, unknown>;
}

// Connection and session types
export interface A2ASession {
  id: SessionId;
  agentId: AgentId;
  remoteAgentId: AgentId;
  state: A2ALifecycleState;
  capabilities: A2ACapability[];
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
  metadata?: Record<string, unknown>;
}

// Negotiation types
export interface A2ANegotiationRequest {
  agentId: AgentId;
  capabilities: A2ACapability[];
  supportedMessageTypes: Array<A2AMessage['type']>;
  metadata?: Record<string, unknown>;
}

export interface A2ANegotiationResponse {
  agentId: AgentId;
  accepted: boolean;
  capabilities: A2ACapability[];
  supportedMessageTypes: Array<A2AMessage['type']>;
  sessionId?: SessionId;
  error?: {
    code: string;
    message: string;
  };
  metadata?: Record<string, unknown>;
}

// Event subscription types
export interface A2AEventSubscription {
  eventType: string;
  agentId: AgentId;
  filter?: Record<string, unknown>;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
}

// Error types
export enum A2AErrorCode {
  // Connection errors
  ConnectionFailed = 'CONNECTION_FAILED',
  ConnectionTimeout = 'CONNECTION_TIMEOUT',
  InvalidCredentials = 'INVALID_CREDENTIALS',
  
  // Message errors
  InvalidMessage = 'INVALID_MESSAGE',
  MessageValidationFailed = 'MESSAGE_VALIDATION_FAILED',
  MessageDeliveryFailed = 'MESSAGE_DELIVERY_FAILED',
  
  // Agent errors
  AgentNotFound = 'AGENT_NOT_FOUND',
  AgentUnavailable = 'AGENT_UNAVAILABLE',
  CapabilityNotSupported = 'CAPABILITY_NOT_SUPPORTED',
  
  // Task errors
  TaskValidationFailed = 'TASK_VALIDATION_FAILED',
  TaskExecutionFailed = 'TASK_EXECUTION_FAILED',
  TaskCancelled = 'TASK_CANCELLED',
  
  // System errors
  InternalError = 'INTERNAL_ERROR',
  NotImplemented = 'NOT_IMPLEMENTED',
  RateLimitExceeded = 'RATE_LIMIT_EXCEEDED'
}

export interface A2AError {
  code: A2AErrorCode;
  message: string;
  conversationId?: ConversationId;
  messageId?: MessageId;
  taskId?: TaskId;
  details?: unknown;
  timestamp: string;
  correlationId?: string;
}