# Cursor Rules: MCP Agent-to-Agent Backend (Final Version 2025)

## 🚀 Overview
These cursor rules establish comprehensive guidelines for building robust, secure, and scalable MCP (Model Context Protocol) agent-to-agent backend systems using TypeScript and modern distributed architecture patterns.

## 📋 Table of Contents
- [Protocol Implementation](#protocol-implementation)
- [TypeScript & Code Quality](#typescript--code-quality)
- [Architecture & Design Patterns](#architecture--design-patterns)
- [Security & Reliability](#security--reliability)
- [Performance & Monitoring](#performance--monitoring)
- [Error Handling & Resilience](#error-handling--resilience)
- [Data Management](#data-management)
- [Testing & Quality Assurance](#testing--quality-assurance)
- [Documentation & Compliance](#documentation--compliance)

---

## 🔧 Protocol Implementation

### MCP Protocol Compliance (v2025-03-26)
- **MUST** follow MCP specification v2025-03-26 strictly for all message formats
- **MUST** use JSON-RPC 2.0 as the base protocol for all agent communications
- **MUST** implement proper capability negotiation during initialization phase
- **MUST** handle MCP lifecycle phases: Initialization → Operation → Shutdown
- **MUST** support both stdio and HTTP+SSE transport mechanisms
- **SHOULD** implement Server-Sent Events (SSE) for real-time agent communication
- **SHOULD** plan for Streamable HTTP transport when available

### Message Handling
```typescript
// Required message types with strict typing
interface MCPRequest extends JsonRpcRequest {
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

interface MCPResponse extends JsonRpcResponse {
  id: string | number;
  result?: Record<string, unknown>;
  error?: JsonRpcError;
}

interface MCPNotification extends JsonRpcNotification {
  method: string;
  params?: Record<string, unknown>;
}
```

### Capability Management
- **MUST** declare all server capabilities during initialization
- **MUST** respect negotiated capabilities throughout session lifecycle
- **MUST** implement proper feature flags for progressive capability rollout
- **SHOULD** use capability versioning for backward compatibility
- **SHOULD** implement capability discovery mechanisms for agent networks

### Resource & Tool Security
- **MUST** validate all tool parameters using strict schema validation (Zod recommended)
- **MUST** implement resource access controls with principle of least privilege
- **MUST** sanitize all prompt templates to prevent injection attacks
- **MUST** implement tool isolation boundaries to prevent cross-contamination
- **SHOULD** use resource URI validation and normalization
- **SHOULD** implement tool usage auditing and rate limiting

---

## 💻 TypeScript & Code Quality

### Strict Mode Configuration
```typescript
// tsconfig.json - Required settings
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictPropertyInitialization": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### Modern TypeScript Patterns (2025)
- **MUST** use template literal types for MCP method names and event types
- **MUST** implement discriminated unions for agent message handling
- **MUST** use `satisfies` operator for type-safe configuration objects
- **MUST** leverage const assertions (`as const`) for immutable data structures
- **SHOULD** use branded types for agent IDs, session tokens, and resource URIs
- **SHOULD** implement generic constraints for reusable agent components
- **SHOULD** use utility types (`Partial`, `Pick`, `Omit`) for data transformation

### Advanced Type Safety
```typescript
// Branded types for agent security
type AgentID = string & { readonly __brand: 'AgentID' };
type SessionToken = string & { readonly __brand: 'SessionToken' };
type ResourceURI = string & { readonly __brand: 'ResourceURI' };

// Template literal types for MCP methods
type MCPMethod = `${string}/${string}` | 'initialize' | 'ping' | 'shutdown';

// Discriminated unions for message routing
type AgentMessage = 
  | { type: 'tool_call'; agentId: AgentID; tool: string; params: unknown }
  | { type: 'resource_request'; agentId: AgentID; uri: ResourceURI }
  | { type: 'sampling_request'; agentId: AgentID; prompt: string };
```

### Code Organization
- **MUST** use consistent interface naming with `I` prefix for public interfaces
- **MUST** implement proper barrel exports (`index.ts`) for clean module boundaries
- **MUST** separate types into dedicated `.types.ts` files for complex domains
- **SHOULD** use absolute imports with path mapping for internal modules
- **SHOULD** implement consistent error types across agent communication layers

---

## 🏗️ Architecture & Design Patterns

### Event-Driven Architecture
- **MUST** design agent communication as event-driven from the ground up
- **MUST** implement event sourcing for agent interaction history and auditability
- **MUST** use EventBridge or similar service for agent event routing
- **MUST** implement CQRS pattern for separating agent commands from queries
- **SHOULD** use Dead Letter Queues (DLQ) for failed agent communications
- **SHOULD** implement event replay capabilities for agent state recovery

### Distributed Systems Patterns
```typescript
// Circuit breaker pattern for agent resilience
class AgentCircuitBreaker {
  private failureThreshold = 5;
  private timeoutDuration = 60000;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  async callAgent<T>(agentCall: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      throw new Error('Circuit breaker is OPEN');
    }
    // Implementation with timeout and failure tracking
  }
}
```

- **MUST** implement circuit breaker pattern for external agent calls
- **MUST** use correlation IDs for distributed tracing across agent interactions
- **MUST** implement idempotent operations for all agent message handling
- **MUST** design for horizontal scaling with stateless agent components
- **SHOULD** implement bulkhead pattern to isolate agent subsystems
- **SHOULD** use leader election for agent coordination when needed

### Dependency Injection & Service Composition
- **MUST** use dependency injection container (tsyringe, inversify, or similar)
- **MUST** implement service interfaces for all external dependencies
- **MUST** use factory patterns for creating agent instances
- **SHOULD** implement decorator pattern for agent capability enhancement
- **SHOULD** use strategy pattern for different MCP transport mechanisms

---

## 🔒 Security & Reliability

### Authentication & Authorization
- **MUST** implement proper authentication before any agent communication
- **MUST** use OAuth 2.1+ for agent-to-agent authentication where applicable
- **MUST** implement role-based access control (RBAC) for agent capabilities
- **MUST** validate all incoming MCP messages against schema before processing
- **MUST** implement rate limiting per agent to prevent abuse
- **SHOULD** use mutual TLS (mTLS) for agent-to-agent communication
- **SHOULD** implement token rotation and refresh mechanisms

### MCP-Specific Security
```typescript
// Input validation for MCP tool parameters
const ToolParameterSchema = z.object({
  method: z.string().regex(/^[a-zA-Z0-9_]+$/),
  params: z.record(z.unknown()).optional(),
}).strict();

// Prevent tool poisoning attacks
const validateToolDescription = (description: string): boolean => {
  const suspiciousPatterns = [
    /IMPORTANT.*INSTRUCTION/i,
    /after.*use.*tool/i,
    /send.*data.*to/i
  ];
  return !suspiciousPatterns.some(pattern => pattern.test(description));
};
```

### Data Protection
- **MUST** encrypt all sensitive agent data at rest using AES-256
- **MUST** encrypt all agent communications in transit using TLS 1.3+
- **MUST** implement proper key management using cloud KMS or equivalent
- **MUST** sanitize all logs to prevent sensitive data leakage
- **MUST** implement data classification for agent-handled information
- **SHOULD** use encryption for agent session tokens and credentials
- **SHOULD** implement data retention policies for agent interaction logs

### Prompt Security & Injection Prevention
- **MUST** implement layered defense against prompt injection attacks
- **MUST** validate and sanitize all tool descriptions for malicious instructions
- **MUST** separate system prompts from user-provided content
- **MUST** implement content filtering for multi-modal agent communications
- **SHOULD** use prompt templates with parameter binding to prevent injection
- **SHOULD** implement prompt consistency verification across environments

---

## ⚡ Performance & Monitoring

### Metrics & Observability
- **MUST** implement distributed tracing with correlation IDs across all agent calls
- **MUST** track MCP message latency, throughput, and error rates
- **MUST** monitor agent communication queue depths and processing times
- **MUST** implement health checks for all agent services with graceful degradation
- **SHOULD** use structured logging (JSON) with consistent correlation fields
- **SHOULD** implement custom metrics for agent-specific business logic

### Connection Management
```typescript
// Connection pooling for agent communications
class AgentConnectionPool {
  private pools: Map<AgentID, ConnectionPool> = new Map();
  private maxConnections = 100;
  private idleTimeout = 30000;
  
  async getConnection(agentId: AgentID): Promise<AgentConnection> {
    // Implement connection reuse and lifecycle management
  }
}
```

- **MUST** use connection pooling for database and external service connections
- **MUST** implement proper timeout handling for all agent communications
- **MUST** set appropriate timeouts for MCP initialization and operation phases
- **SHOULD** implement connection retry logic with exponential backoff
- **SHOULD** monitor and alert on connection pool exhaustion

### Caching & State Management
- **MUST** implement caching for frequently accessed agent capabilities and schemas
- **MUST** use Redis or equivalent for distributed agent session state
- **MUST** implement cache invalidation strategies for agent configuration changes
- **SHOULD** use in-memory caching for agent routing and discovery information
- **SHOULD** implement cache warming strategies for critical agent data

---

## 🚨 Error Handling & Resilience

### Error Classification & Recovery
```typescript
// Structured error handling for agent operations
class AgentError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly agentId: AgentID,
    public readonly retryable: boolean = false,
    public readonly correlationId: string
  ) {
    super(message);
    this.name = 'AgentError';
  }
}

// Error recovery strategies
const errorRecoveryStrategies = {
  NETWORK_ERROR: { retryable: true, maxRetries: 3, backoffMs: 1000 },
  AUTHENTICATION_ERROR: { retryable: false, maxRetries: 0, backoffMs: 0 },
  RATE_LIMIT_ERROR: { retryable: true, maxRetries: 5, backoffMs: 5000 },
} as const;
```

### Graceful Degradation
- **MUST** implement graceful degradation when agents are unavailable
- **MUST** use MCP error format for all structured error responses
- **MUST** implement proper retry logic with exponential backoff and jitter
- **MUST** log all errors with correlation IDs for distributed debugging
- **SHOULD** implement fallback mechanisms for critical agent functionality
- **SHOULD** use saga pattern for complex multi-agent transactions

### Dead Letter Queue Management
- **MUST** implement DLQ for failed agent messages with categorization
- **MUST** provide DLQ monitoring and alerting for operational visibility
- **MUST** implement DLQ replay functionality for recovered agents
- **SHOULD** implement automatic DLQ processing for transient failures
- **SHOULD** use DLQ analytics to identify systemic agent communication issues

---

## 💾 Data Management

### Database Design
- **MUST** design for eventual consistency in distributed agent state
- **MUST** use proper database transactions for critical agent operations
- **MUST** implement optimistic locking for agent state modifications
- **MUST** partition agent data by tenant/organization for multi-tenancy
- **SHOULD** use event sourcing for agent interaction history
- **SHOULD** implement read replicas for agent query optimization

### State Management
```typescript
// Agent state management with event sourcing
interface AgentEvent {
  id: string;
  agentId: AgentID;
  type: string;
  payload: unknown;
  timestamp: Date;
  version: number;
}

class AgentStateManager {
  async applyEvent(event: AgentEvent): Promise<void> {
    // Implement event application with proper versioning
  }
  
  async getAgentState(agentId: AgentID): Promise<AgentState> {
    // Rebuild state from events or use snapshots
  }
}
```

### Data Consistency
- **MUST** implement idempotent operations for all agent message handlers
- **MUST** use database transactions where strong consistency is required
- **MUST** implement proper data validation before state changes
- **SHOULD** use optimistic concurrency control for agent state updates
- **SHOULD** implement conflict resolution strategies for concurrent modifications

---

## 🧪 Testing & Quality Assurance

### Testing Strategy
- **MUST** write unit tests for all critical agent communication paths
- **MUST** implement integration tests for MCP protocol compliance
- **MUST** test error scenarios and edge cases in agent interactions
- **MUST** implement contract testing between agent services
- **SHOULD** use property-based testing for agent message validation
- **SHOULD** implement load testing for agent communication scalability

### Test Patterns
```typescript
// Testing MCP message handling
describe('AgentMessageHandler', () => {
  it('should handle tool calls with proper validation', async () => {
    const mockAgent = createMockAgent();
    const handler = new AgentMessageHandler(mockAgent);
    
    const toolCall: MCPRequest = {
      jsonrpc: '2.0',
      id: '123',
      method: 'tools/call',
      params: { name: 'calculator', args: { a: 1, b: 2 } }
    };
    
    const result = await handler.handle(toolCall);
    expect(result.result).toEqual({ answer: 3 });
  });
});
```

### Security Testing
- **MUST** implement security testing for agent authentication and authorization
- **MUST** test for prompt injection vulnerabilities in agent communications
- **MUST** validate input sanitization and output encoding
- **SHOULD** implement fuzzing tests for MCP message parsing
- **SHOULD** test for common vulnerabilities (OWASP Top 10 for LLMs)

---

## 📚 Documentation & Compliance

### API Documentation
- **MUST** document all MCP endpoints and message formats using OpenAPI/AsyncAPI
- **MUST** include sequence diagrams for complex agent interactions
- **MUST** document agent capability negotiation and lifecycle management
- **MUST** provide examples for all supported agent interaction patterns
- **SHOULD** maintain API documentation automatically from code annotations
- **SHOULD** document error codes and recovery procedures

### Compliance & Auditing
```typescript
// Audit logging for agent interactions
interface AgentAuditLog {
  timestamp: Date;
  correlationId: string;
  agentId: AgentID;
  action: string;
  resource?: ResourceURI;
  result: 'success' | 'failure';
  metadata: Record<string, unknown>;
}
```

- **MUST** implement comprehensive audit logging for all agent activities
- **MUST** ensure audit logs are tamper-proof and properly retained
- **MUST** document data classification and handling procedures
- **SHOULD** implement compliance monitoring for regulatory requirements
- **SHOULD** provide audit trail visualization and reporting tools

### Operational Documentation
- **MUST** document deployment procedures and rollback strategies
- **MUST** provide runbooks for common operational scenarios
- **MUST** document monitoring and alerting configuration
- **SHOULD** maintain architecture decision records (ADRs)
- **SHOULD** document disaster recovery procedures

---

## 🎯 Implementation Priorities

### Phase 1: Foundation (🔴 Critical)
- [ ] Implement MCP protocol compliance with strict TypeScript types
- [ ] Set up authentication and authorization framework
- [ ] Implement basic error handling and logging
- [ ] Create agent discovery and registration system

### Phase 2: Security & Reliability (🟡 High)
- [ ] Implement comprehensive security controls and input validation
- [ ] Add circuit breakers and retry mechanisms
- [ ] Set up monitoring and distributed tracing
- [ ] Implement graceful degradation patterns

### Phase 3: Advanced Features (🟢 Medium)
- [ ] Add event sourcing and CQRS patterns
- [ ] Implement advanced caching and performance optimization
- [ ] Add comprehensive testing and quality assurance
- [ ] Create operational tooling and documentation

---

## 📖 References & Standards

### Official Documentation
- [MCP Specification 2025-03-26](https://modelcontextprotocol.io/specification/2025-03-26)
- [JSON-RPC 2.0 Specification](https://www.jsonrpc.org/specification)
- [TypeScript 5.4+ Documentation](https://www.typescriptlang.org/docs/)

### Security Guidelines
- [OWASP Top 10 for LLMs](https://genai.owasp.org/)
- [MCP Security Checklist](https://github.com/slowmist/MCP-Security-Checklist)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

### Architecture Patterns
- [Event-Driven Architecture Patterns](https://docs.aws.amazon.com/eventbridge/)
- [Microservices Patterns](https://microservices.io/patterns/)
- [Cloud Design Patterns](https://docs.microsoft.com/en-us/azure/architecture/patterns/)

---

**Version**: 1.0  
**Last Updated**: January 2025  
**Next Review**: March 2025

*These cursor rules represent the current best practices for MCP agent-to-agent backend development and should be updated as the ecosystem evolves.* 