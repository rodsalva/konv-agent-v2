-- Schema for storing real conversation data from MercadoLivre agent explorations
-- This enables persistent storage of agent interactions, observations, and analysis

-- Conversations table - tracks high-level exploration sessions
CREATE TABLE public.conversations (
    conversation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR NOT NULL CHECK (status IN ('in_progress', 'completed', 'failed', 'cancelled')),
    initiator_agent_id VARCHAR NOT NULL REFERENCES public.personas(persona_id),
    exploration_type VARCHAR NOT NULL,
    platform VARCHAR NOT NULL,
    metadata JSONB,
    summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Messages table - stores individual messages within conversations
CREATE TABLE public.messages (
    message_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(conversation_id) ON DELETE CASCADE,
    sender_id VARCHAR NOT NULL REFERENCES public.personas(persona_id),
    receiver_id VARCHAR REFERENCES public.personas(persona_id),
    message_type VARCHAR NOT NULL CHECK (message_type IN ('observation', 'question', 'response', 'system', 'analysis')),
    content TEXT NOT NULL,
    metadata JSONB,
    sentiment VARCHAR,
    entities JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    parent_id UUID REFERENCES public.messages(message_id),
    sequence_num INTEGER NOT NULL,
    is_visible BOOLEAN DEFAULT TRUE NOT NULL
);

-- Observations table - stores structured observations from agent explorations
CREATE TABLE public.observations (
    observation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(conversation_id) ON DELETE CASCADE,
    message_id UUID REFERENCES public.messages(message_id),
    agent_id VARCHAR NOT NULL REFERENCES public.personas(persona_id),
    agent_type VARCHAR NOT NULL,
    category VARCHAR NOT NULL,
    observation_text TEXT NOT NULL,
    importance_score INTEGER CHECK (importance_score BETWEEN 1 AND 10),
    confidence_score FLOAT CHECK (confidence_score BETWEEN 0 AND 1),
    related_entities JSONB,
    metadata JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    is_actionable BOOLEAN DEFAULT FALSE NOT NULL,
    status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'actioned', 'dismissed'))
);

-- ExplorationResults table - stores final analysis results
CREATE TABLE public.exploration_results (
    result_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(conversation_id) ON DELETE CASCADE,
    agent_id VARCHAR NOT NULL REFERENCES public.personas(persona_id),
    agent_type VARCHAR NOT NULL,
    result_type VARCHAR NOT NULL,
    title VARCHAR NOT NULL,
    summary TEXT NOT NULL,
    full_analysis TEXT,
    findings JSONB NOT NULL,
    evidence JSONB,
    metrics JSONB,
    departments JSONB,
    recommendations JSONB,
    next_steps TEXT,
    exploration_time_seconds INTEGER,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    verified_by VARCHAR REFERENCES public.personas(persona_id),
    verification_status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    verification_notes TEXT
);

-- Categories table - for organizing observations and analysis
CREATE TABLE public.categories (
    category_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL UNIQUE,
    parent_id UUID REFERENCES public.categories(category_id),
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ObservationCategories table - many-to-many relationship
CREATE TABLE public.observation_categories (
    observation_id UUID NOT NULL REFERENCES public.observations(observation_id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(category_id) ON DELETE CASCADE,
    relevance_score FLOAT CHECK (relevance_score BETWEEN 0 AND 1),
    PRIMARY KEY (observation_id, category_id)
);

-- SessionMetrics table - performance metrics for conversations
CREATE TABLE public.session_metrics (
    metrics_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(conversation_id) ON DELETE CASCADE,
    exploration_duration_seconds INTEGER NOT NULL,
    agent_count INTEGER NOT NULL,
    message_count INTEGER NOT NULL,
    observation_count INTEGER NOT NULL,
    actionable_observations_count INTEGER,
    categories_covered INTEGER,
    average_observation_importance FLOAT,
    average_observation_confidence FLOAT,
    performance_metrics JSONB,
    resource_usage JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ExplorationTasks table - tasks generated from observations
CREATE TABLE public.exploration_tasks (
    task_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(conversation_id) ON DELETE CASCADE,
    title VARCHAR NOT NULL,
    description TEXT NOT NULL,
    assigned_to VARCHAR,
    status VARCHAR NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
    priority VARCHAR NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    due_date TIMESTAMP WITH TIME ZONE,
    source_observation_id UUID REFERENCES public.observations(observation_id),
    department VARCHAR NOT NULL,
    expected_impact VARCHAR CHECK (expected_impact IN ('minimal', 'moderate', 'significant', 'major')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better query performance
CREATE INDEX idx_conversations_status ON public.conversations(status);
CREATE INDEX idx_conversations_platform ON public.conversations(platform);
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_timestamp ON public.messages(timestamp);
CREATE INDEX idx_observations_conversation_id ON public.observations(conversation_id);
CREATE INDEX idx_observations_agent_id ON public.observations(agent_id);
CREATE INDEX idx_observations_category ON public.observations(category);
CREATE INDEX idx_observations_importance ON public.observations(importance_score);
CREATE INDEX idx_exploration_results_conversation_id ON public.exploration_results(conversation_id);
CREATE INDEX idx_exploration_tasks_status ON public.exploration_tasks(status);
CREATE INDEX idx_exploration_tasks_department ON public.exploration_tasks(department);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exploration_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.observation_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exploration_tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated access
CREATE POLICY "Allow authenticated access to conversations"
    ON public.conversations FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated access to messages"
    ON public.messages FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated access to observations"
    ON public.observations FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated access to exploration_results"
    ON public.exploration_results FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated access to categories"
    ON public.categories FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated access to observation_categories"
    ON public.observation_categories FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated access to session_metrics"
    ON public.session_metrics FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated access to exploration_tasks"
    ON public.exploration_tasks FOR ALL TO authenticated USING (true);

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exploration_tasks_updated_at
    BEFORE UPDATE ON public.exploration_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically complete conversations when end_time is set
CREATE OR REPLACE FUNCTION complete_conversation_on_end_time()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.end_time IS NOT NULL AND OLD.end_time IS NULL THEN
        NEW.status = 'completed';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER auto_complete_conversation
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW
    EXECUTE FUNCTION complete_conversation_on_end_time();

-- Create function to update task status when completed_at is set
CREATE OR REPLACE FUNCTION update_task_status_on_completion()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL THEN
        NEW.status = 'completed';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER auto_update_task_status
    BEFORE UPDATE ON public.exploration_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_task_status_on_completion();