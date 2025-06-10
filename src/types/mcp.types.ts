/**
 * MCP Protocol Type Definitions
 * Based on MCP specification v2025-03-26
 */

// Base JSON-RPC 2.0 Types
export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: Record<string, unknown>;
  error?: JsonRpcError;
}

export interface JsonRpcNotification {
  jsonrpc: '2.0';
  method: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

// MCP Protocol Types with strict typing
export type MCPMethod = `${string}/${string}` | 'initialize' | 'ping' | 'shutdown';

export interface MCPRequest extends JsonRpcRequest {
  id: string | number;
  method: MCPMethod;
  params?: Record<string, unknown>;
}

export interface MCPResponse extends JsonRpcResponse {
  id: string | number;
  result?: Record<string, unknown>;
  error?: JsonRpcError;
}

export interface MCPNotification extends JsonRpcNotification {
  method: MCPMethod;
  params?: Record<string, unknown>;
}

// Agent Types
export type AgentID = string & { readonly __brand: 'AgentID' };
export type SessionToken = string & { readonly __brand: 'SessionToken' };
export type ResourceURI = string & { readonly __brand: 'ResourceURI' };

// MCP Capability Types
export type MCPCapability = 'tools' | 'resources' | 'prompts' | 'sampling';

export interface IAgentCapability {
  name: string;
  version: string;
  config?: Record<string, unknown>;
}

// MCP Message Types (Discriminated Union)
export type AgentMessage = 
  | { type: 'tool_call'; agentId: AgentID; tool: string; params: unknown }
  | { type: 'resource_request'; agentId: AgentID; uri: ResourceURI }
  | { type: 'prompt_request'; agentId: AgentID; prompt: string; variables?: Record<string, unknown> }
  | { type: 'sampling_request'; agentId: AgentID; prompt: string; options?: Record<string, unknown> };

// MCP Lifecycle states
export type MCPLifecycleState = 'initializing' | 'ready' | 'processing' | 'error' | 'shutdown';

// MCP Initialize params and result
export interface MCPInitializeParams {
  capabilities?: MCPCapability[];
  agentInfo?: {
    name: string;
    version: string;
    agentType?: string;
  };
}

export interface MCPInitializeResult {
  capabilities: MCPCapability[];
  serverInfo: {
    name: string;
    version: string;
  };
}

// Error codes based on JSON-RPC + MCP specific
export enum MCPErrorCode {
  // JSON-RPC error codes
  ParseError = -32700,
  InvalidRequest = -32600,
  MethodNotFound = -32601,
  InvalidParams = -32602,
  InternalError = -32603,
  
  // MCP specific error codes
  UnauthorizedAgent = -33001,
  CapabilityNotSupported = -33002,
  ResourceNotFound = -33003,
  OperationTimeout = -33004,
  RateLimitExceeded = -33005,
  PromptValidationError = -33006,
  ToolExecutionError = -33007
}

// Agent Card Schema (for discovery)
export interface IAgentCard {
  id: string;
  name: string;
  description: string;
  version: string;
  capabilities: MCPCapability[];
  skills: Array<{
    id: string;
    name: string;
    description: string;
    inputSchema?: Record<string, unknown>;
    outputSchema?: Record<string, unknown>;
  }>;
  authentication: {
    type: 'oauth2' | 'apikey' | 'jwt';
    scopes?: string[];
  };
}