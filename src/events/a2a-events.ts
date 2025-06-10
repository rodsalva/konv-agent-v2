/**
 * A2A Events Module
 * Defines event types and handlers for Agent-to-Agent (A2A) communication
 */
import { eventBus, EventHandler } from './event-bus';
import { logger } from '@/utils/logger';
import {
  A2AMessage,
  A2AError,
  AgentId,
  SessionId,
  A2ALifecycleState,
  ConversationId
} from '@/types/a2a.types';

// A2A Event Types
export type A2AEventType =
  // Lifecycle events
  | 'a2a:agent:discovered'
  | 'a2a:agent:connecting'
  | 'a2a:agent:connected'
  | 'a2a:agent:disconnected'
  | 'a2a:connection:result'
  | 'a2a:state:changed'
  // Message events
  | 'a2a:message:incoming'
  | 'a2a:message:outgoing'
  | 'a2a:message:delivered'
  | 'a2a:message:failed'
  // Task events
  | 'a2a:task:created'
  | 'a2a:task:updated'
  | 'a2a:task:completed'
  | 'a2a:task:failed'
  // Error events
  | 'a2a:error';

// Event payload types
export interface A2AAgentDiscoveredEvent {
  agentId: AgentId;
  capabilities?: string[];
  metadata?: Record<string, unknown>;
}

export interface A2AAgentConnectingEvent {
  agentId: AgentId;
  remoteAgentId: AgentId;
  sessionId: SessionId;
}

export interface A2AAgentConnectedEvent {
  agentId: AgentId;
  remoteAgentId: AgentId;
  sessionId: SessionId;
  capabilities: string[];
}

export interface A2AAgentDisconnectedEvent {
  agentId: AgentId;
  remoteAgentId: AgentId;
  sessionId: SessionId;
  reason?: string;
}

export interface A2AConnectionResultEvent {
  agentId: AgentId;
  remoteAgentId: AgentId;
  sessionId: SessionId;
  success: boolean;
  error?: A2AError;
}

export interface A2AStateChangedEvent {
  agentId: AgentId;
  oldState: A2ALifecycleState;
  newState: A2ALifecycleState;
  sessionId: SessionId;
}

export interface A2AMessageEvent {
  message: A2AMessage;
}

export interface A2AMessageDeliveredEvent {
  messageId: string;
  conversationId: ConversationId;
  timestamp: string;
}

export interface A2AMessageFailedEvent {
  messageId: string;
  conversationId: ConversationId;
  error: A2AError;
  timestamp: string;
}

export interface A2ATaskEvent {
  taskId: string;
  agentId: AgentId;
  status: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface A2AErrorEvent {
  error: A2AError;
}

// Event publishing functions
export function publishAgentDiscovered(payload: A2AAgentDiscoveredEvent, correlationId?: string): Promise<void> {
  logger.debug('Publishing agent discovered event', { 
    agentId: payload.agentId,
    correlationId 
  });
  
  return eventBus.publish('a2a:agent:discovered', payload, {
    publisher: 'a2a:events',
    correlationId
  });
}

export function publishAgentConnecting(payload: A2AAgentConnectingEvent, correlationId?: string): Promise<void> {
  logger.debug('Publishing agent connecting event', { 
    agentId: payload.agentId,
    remoteAgentId: payload.remoteAgentId,
    sessionId: payload.sessionId,
    correlationId 
  });
  
  return eventBus.publish('a2a:agent:connecting', payload, {
    publisher: 'a2a:events',
    correlationId
  });
}

export function publishAgentConnected(payload: A2AAgentConnectedEvent, correlationId?: string): Promise<void> {
  logger.info('Publishing agent connected event', { 
    agentId: payload.agentId,
    remoteAgentId: payload.remoteAgentId,
    sessionId: payload.sessionId,
    capabilities: payload.capabilities,
    correlationId 
  });
  
  return eventBus.publish('a2a:agent:connected', payload, {
    publisher: 'a2a:events',
    correlationId
  });
}

export function publishAgentDisconnected(payload: A2AAgentDisconnectedEvent, correlationId?: string): Promise<void> {
  logger.info('Publishing agent disconnected event', { 
    agentId: payload.agentId,
    remoteAgentId: payload.remoteAgentId,
    sessionId: payload.sessionId,
    reason: payload.reason,
    correlationId 
  });
  
  return eventBus.publish('a2a:agent:disconnected', payload, {
    publisher: 'a2a:events',
    correlationId
  });
}

export function publishConnectionResult(payload: A2AConnectionResultEvent, correlationId?: string): Promise<void> {
  logger.info('Publishing connection result event', { 
    agentId: payload.agentId,
    remoteAgentId: payload.remoteAgentId,
    sessionId: payload.sessionId,
    success: payload.success,
    error: payload.error,
    correlationId 
  });
  
  return eventBus.publish('a2a:connection:result', payload, {
    publisher: 'a2a:events',
    correlationId
  });
}

export function publishStateChanged(payload: A2AStateChangedEvent, correlationId?: string): Promise<void> {
  logger.debug('Publishing state changed event', { 
    agentId: payload.agentId,
    oldState: payload.oldState,
    newState: payload.newState,
    sessionId: payload.sessionId,
    correlationId 
  });
  
  return eventBus.publish('a2a:state:changed', payload, {
    publisher: 'a2a:events',
    correlationId
  });
}

export function publishMessageIncoming(payload: A2AMessageEvent, correlationId?: string): Promise<void> {
  logger.debug('Publishing message incoming event', { 
    messageId: payload.message.id,
    conversationId: payload.message.conversationId,
    fromAgent: payload.message.fromAgent,
    toAgent: payload.message.toAgent,
    type: payload.message.type,
    correlationId: correlationId || payload.message.correlationId
  });
  
  return eventBus.publish('a2a:message:incoming', payload, {
    publisher: 'a2a:events',
    correlationId: correlationId || payload.message.correlationId
  });
}

export function publishMessageOutgoing(payload: A2AMessageEvent, correlationId?: string): Promise<void> {
  logger.debug('Publishing message outgoing event', { 
    messageId: payload.message.id,
    conversationId: payload.message.conversationId,
    fromAgent: payload.message.fromAgent,
    toAgent: payload.message.toAgent,
    type: payload.message.type,
    correlationId: correlationId || payload.message.correlationId
  });
  
  return eventBus.publish('a2a:message:outgoing', payload, {
    publisher: 'a2a:events',
    correlationId: correlationId || payload.message.correlationId
  });
}

export function publishMessageDelivered(payload: A2AMessageDeliveredEvent, correlationId?: string): Promise<void> {
  logger.debug('Publishing message delivered event', { 
    messageId: payload.messageId,
    conversationId: payload.conversationId,
    timestamp: payload.timestamp,
    correlationId 
  });
  
  return eventBus.publish('a2a:message:delivered', payload, {
    publisher: 'a2a:events',
    correlationId
  });
}

export function publishMessageFailed(payload: A2AMessageFailedEvent, correlationId?: string): Promise<void> {
  logger.warn('Publishing message failed event', { 
    messageId: payload.messageId,
    conversationId: payload.conversationId,
    error: payload.error,
    timestamp: payload.timestamp,
    correlationId 
  });
  
  return eventBus.publish('a2a:message:failed', payload, {
    publisher: 'a2a:events',
    correlationId
  });
}

export function publishTaskEvent(eventType: 'a2a:task:created' | 'a2a:task:updated' | 'a2a:task:completed' | 'a2a:task:failed', payload: A2ATaskEvent, correlationId?: string): Promise<void> {
  logger.debug(`Publishing ${eventType} event`, { 
    taskId: payload.taskId,
    agentId: payload.agentId,
    status: payload.status,
    timestamp: payload.timestamp,
    correlationId 
  });
  
  return eventBus.publish(eventType, payload, {
    publisher: 'a2a:events',
    correlationId
  });
}

export function publishError(payload: A2AErrorEvent, correlationId?: string): Promise<void> {
  logger.error('Publishing error event', { 
    errorCode: payload.error.code,
    errorMessage: payload.error.message,
    conversationId: payload.error.conversationId,
    messageId: payload.error.messageId,
    taskId: payload.error.taskId,
    timestamp: payload.error.timestamp,
    correlationId 
  });
  
  return eventBus.publish('a2a:error', payload, {
    publisher: 'a2a:events',
    correlationId
  });
}

// Helper for subscribing to A2A events
export function subscribeToA2AEvent<T>(eventType: A2AEventType, handler: EventHandler<T>): void {
  eventBus.subscribe<T>(eventType, handler);
  logger.debug(`Subscribed to ${eventType} event`);
}

// Helper for unsubscribing from A2A events
export function unsubscribeFromA2AEvent<T>(eventType: A2AEventType, handler: EventHandler<T>): void {
  eventBus.unsubscribe<T>(eventType, handler);
  logger.debug(`Unsubscribed from ${eventType} event`);
}