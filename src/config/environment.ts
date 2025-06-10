import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Environment validation schema
const envSchema = z.object({
  // Supabase Configuration
  SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase service role key is required'),
  
  // Application Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).pipe(z.number().min(1000).max(65535)).default('3000'),
  API_VERSION: z.string().default('v1'),
  
  // MCP Protocol Configuration
  MCP_SERVER_NAME: z.string().default('feedback-intelligence-backend'),
  MCP_SERVER_VERSION: z.string().default('1.0.0'),
  MCP_TRANSPORT: z.enum(['stdio', 'http', 'websocket']).default('stdio'),
  
  // Security Configuration
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  API_KEY_PREFIX: z.string().default('mcp_agent_'),
  CORS_ORIGIN: z.string().default('http://localhost:3000,http://localhost:3001'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).pipe(z.number().positive()).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).pipe(z.number().positive()).default('100'),
  
  // Agent Configuration
  MAX_AGENTS_PER_TYPE: z.string().transform(Number).pipe(z.number().positive()).default('50'),
  AGENT_TIMEOUT_MS: z.string().transform(Number).pipe(z.number().positive()).default('30000'),
  MESSAGE_QUEUE_SIZE: z.string().transform(Number).pipe(z.number().positive()).default('1000'),
  
  // Logging Configuration
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  LOG_FORMAT: z.enum(['json', 'pretty']).default('json'),
});

// Validate environment variables
const envResult = envSchema.safeParse(process.env);

if (!envResult.success) {
  console.error('❌ Invalid environment configuration:');
  console.error(envResult.error.format());
  process.exit(1);
}

export const env = envResult.data;

// Derived configurations
export const appConfig = {
  // Database
  database: {
    url: env.SUPABASE_URL,
    anonKey: env.SUPABASE_ANON_KEY,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  },
  
  // Server
  server: {
    port: env.PORT,
    env: env.NODE_ENV,
    apiVersion: env.API_VERSION,
    corsOrigins: env.CORS_ORIGIN.split(',').map(origin => origin.trim()),
  },
  
  // MCP Protocol
  mcp: {
    serverName: env.MCP_SERVER_NAME,
    serverVersion: env.MCP_SERVER_VERSION,
    transport: env.MCP_TRANSPORT,
    capabilities: ['tools', 'resources', 'prompts'],
  },
  
  // Security
  security: {
    jwtSecret: env.JWT_SECRET,
    apiKeyPrefix: env.API_KEY_PREFIX,
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  },
  
  // Agents
  agents: {
    maxPerType: env.MAX_AGENTS_PER_TYPE,
    timeoutMs: env.AGENT_TIMEOUT_MS,
    messageQueueSize: env.MESSAGE_QUEUE_SIZE,
  },
  
  // Logging
  logging: {
    level: env.LOG_LEVEL,
    format: env.LOG_FORMAT,
  },
} as const;

export default appConfig; 