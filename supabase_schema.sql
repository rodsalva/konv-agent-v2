-- MCP Agent Backend Database Schema
-- Run this in Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Agent Types Enum
CREATE TYPE agent_type AS ENUM ('company', 'customer', 'insight', 'product', 'support', 'sales');
CREATE TYPE agent_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE message_status AS ENUM ('pending', 'delivered', 'processed', 'failed');
CREATE TYPE feedback_status AS ENUM ('raw', 'processed', 'analyzed', 'archived');

-- 1. Agents Table
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type agent_type NOT NULL,
    status agent_status DEFAULT 'active',
    capabilities JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    api_key VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE
);

-- 2. Agent Messages Table (MCP Protocol)
CREATE TABLE agent_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_agent_id UUID NOT NULL REFERENCES agents(id),
    to_agent_id UUID NOT NULL REFERENCES agents(id),
    message_type VARCHAR(50) NOT NULL, -- 'request', 'response', 'notification'
    method VARCHAR(100), -- MCP method name
    params JSONB,
    result JSONB,
    error_code INTEGER,
    error_message TEXT,
    status message_status DEFAULT 'pending',
    correlation_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- 3. Feedback Data Table
CREATE TABLE feedback_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_agent_id UUID NOT NULL REFERENCES agents(id),
    company_agent_id UUID NOT NULL REFERENCES agents(id),
    raw_feedback JSONB NOT NULL,
    processed_feedback JSONB,
    feedback_type VARCHAR(100), -- 'survey', 'review', 'support_ticket', 'nps'
    status feedback_status DEFAULT 'raw',
    sentiment_score DECIMAL(3,2),
    confidence_score DECIMAL(3,2),
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- 4. Insights Table
CREATE TABLE insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    insight_agent_id UUID NOT NULL REFERENCES agents(id),
    feedback_ids UUID[] NOT NULL,
    insight_type VARCHAR(100), -- 'pattern', 'recommendation', 'alert'
    title VARCHAR(255) NOT NULL,
    description TEXT,
    insights JSONB NOT NULL,
    confidence_score DECIMAL(3,2),
    priority INTEGER DEFAULT 5, -- 1-10 scale
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID
);

-- 5. Audit Logs Table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL, -- 'agent', 'message', 'feedback', 'insight'
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'deleted', 'processed'
    old_values JSONB,
    new_values JSONB,
    performed_by UUID REFERENCES agents(id),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Agent Capabilities Table
CREATE TABLE agent_capabilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id),
    capability_name VARCHAR(100) NOT NULL,
    capability_config JSONB DEFAULT '{}',
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(agent_id, capability_name)
);

-- Create Indexes for Performance
CREATE INDEX idx_agents_type ON agents(type);
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agent_messages_from_to ON agent_messages(from_agent_id, to_agent_id);
CREATE INDEX idx_agent_messages_correlation ON agent_messages(correlation_id);
CREATE INDEX idx_agent_messages_created_at ON agent_messages(created_at);
CREATE INDEX idx_feedback_customer_agent ON feedback_data(customer_agent_id);
CREATE INDEX idx_feedback_status ON feedback_data(status);
CREATE INDEX idx_feedback_created_at ON feedback_data(created_at);
CREATE INDEX idx_insights_status ON insights(status);
CREATE INDEX idx_insights_priority ON insights(priority);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Create Functions for Auto-updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create Triggers
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Setup
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create initial RLS policies (basic - you'll refine these)
CREATE POLICY "Enable read access for service role" ON agents
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for service role" ON agents
    FOR INSERT WITH CHECK (true);

-- Create similar policies for other tables
CREATE POLICY "Enable read access for service role" ON agent_messages
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for service role" ON agent_messages
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for service role" ON feedback_data
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for service role" ON feedback_data
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for service role" ON insights
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for service role" ON insights
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for service role" ON audit_logs
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for service role" ON audit_logs
    FOR INSERT WITH CHECK (true);

-- Insert some sample data for testing
INSERT INTO agents (name, type, capabilities, api_key) VALUES
('Company Survey Agent', 'company', '["feedback_collection", "survey_management"]', encode(gen_random_bytes(32), 'hex')),
('Customer Feedback Agent', 'customer', '["feedback_response", "data_sharing"]', encode(gen_random_bytes(32), 'hex')),
('Insight Analysis Agent', 'insight', '["data_analysis", "pattern_recognition", "report_generation"]', encode(gen_random_bytes(32), 'hex')),
('Product Team Agent', 'product', '["insight_consumption", "feedback_review"]', encode(gen_random_bytes(32), 'hex'));

-- Create a view for agent statistics
CREATE VIEW agent_stats AS
SELECT 
    a.id,
    a.name,
    a.type,
    a.status,
    COUNT(DISTINCT am_from.id) as messages_sent,
    COUNT(DISTINCT am_to.id) as messages_received,
    COUNT(DISTINCT fd.id) as feedback_processed,
    a.last_seen,
    a.created_at
FROM agents a
LEFT JOIN agent_messages am_from ON a.id = am_from.from_agent_id
LEFT JOIN agent_messages am_to ON a.id = am_to.to_agent_id
LEFT JOIN feedback_data fd ON a.id = fd.customer_agent_id OR a.id = fd.company_agent_id
GROUP BY a.id, a.name, a.type, a.status, a.last_seen, a.created_at; 