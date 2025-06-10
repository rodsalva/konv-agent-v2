-- Create personas table
CREATE TABLE public.personas (
    persona_id VARCHAR PRIMARY KEY,
    name VARCHAR NOT NULL,
    type VARCHAR NOT NULL,
    characteristics JSONB NOT NULL,
    preferences JSONB NOT NULL,
    behaviors JSONB NOT NULL,
    customization JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- Create persona_interactions table
CREATE TABLE public.persona_interactions (
    interaction_id VARCHAR PRIMARY KEY,
    persona_id VARCHAR NOT NULL REFERENCES public.personas(persona_id),
    platform VARCHAR NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    questions JSONB NOT NULL,
    responses JSONB NOT NULL,
    metadata JSONB,
    CONSTRAINT fk_persona
        FOREIGN KEY(persona_id)
        REFERENCES public.personas(persona_id)
        ON DELETE CASCADE
);

-- Create insights table
CREATE TABLE public.insights (
    insight_id VARCHAR PRIMARY KEY,
    title VARCHAR NOT NULL,
    description TEXT NOT NULL,
    personas JSONB NOT NULL,
    departments VARCHAR[] NOT NULL,
    priority VARCHAR NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create index for faster persona queries by type
CREATE INDEX idx_personas_type ON public.personas(type);

-- Create index for active personas
CREATE INDEX idx_personas_active ON public.personas(is_active);

-- Create index for interactions by persona
CREATE INDEX idx_interactions_persona ON public.persona_interactions(persona_id);

-- Create index for insights by priority
CREATE INDEX idx_insights_priority ON public.insights(priority);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.persona_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;

-- Create policy for personas access
CREATE POLICY "Allow authenticated access to personas"
    ON public.personas
    FOR ALL
    TO authenticated
    USING (true);

-- Create policy for persona_interactions access
CREATE POLICY "Allow authenticated access to persona_interactions"
    ON public.persona_interactions
    FOR ALL
    TO authenticated
    USING (true);

-- Create policy for insights access
CREATE POLICY "Allow authenticated access to insights"
    ON public.insights
    FOR ALL
    TO authenticated
    USING (true);

-- Enable change tracking for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_personas_updated_at
    BEFORE UPDATE ON public.personas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();