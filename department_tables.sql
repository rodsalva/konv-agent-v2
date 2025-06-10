-- Create insights table
CREATE TABLE public.insights (
    insight_id VARCHAR PRIMARY KEY,
    title VARCHAR NOT NULL,
    description TEXT NOT NULL,
    is_strength BOOLEAN NOT NULL,
    department VARCHAR NOT NULL CHECK (department IN ('product', 'engineering', 'marketing', 'ux_ui', 'pricing', 'customer_service', 'technology', 'operations', 'business_intelligence')),
    evidence JSONB NOT NULL,
    root_cause TEXT,
    recommendation TEXT NOT NULL,
    expected_outcome TEXT NOT NULL,
    verification_method TEXT NOT NULL,
    priority VARCHAR NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'rejected', 'implemented')),
    tags VARCHAR[] 
);

-- Create implementation_plans table
CREATE TABLE public.implementation_plans (
    plan_id SERIAL PRIMARY KEY,
    insight_id VARCHAR NOT NULL REFERENCES public.insights(insight_id) ON DELETE CASCADE,
    department VARCHAR NOT NULL CHECK (department IN ('product', 'engineering', 'marketing', 'ux_ui', 'pricing', 'customer_service', 'technology', 'operations', 'business_intelligence')),
    title VARCHAR NOT NULL,
    overview TEXT NOT NULL,
    steps JSONB NOT NULL,
    timeline_weeks INTEGER NOT NULL,
    estimated_cost NUMERIC,
    risk_factors VARCHAR[],
    success_metrics VARCHAR[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'in_progress', 'completed')),
    CONSTRAINT fk_insight
        FOREIGN KEY(insight_id)
        REFERENCES public.insights(insight_id)
        ON DELETE CASCADE
);

-- Create department_metrics table for tracking KPIs
CREATE TABLE public.department_metrics (
    metric_id SERIAL PRIMARY KEY,
    department VARCHAR NOT NULL CHECK (department IN ('product', 'engineering', 'marketing', 'ux_ui', 'pricing', 'customer_service', 'technology', 'operations', 'business_intelligence')),
    name VARCHAR NOT NULL,
    description TEXT,
    current_value NUMERIC,
    target_value NUMERIC,
    unit VARCHAR,
    measurement_frequency VARCHAR,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    trend VARCHAR CHECK (trend IN ('increasing', 'decreasing', 'stable', 'fluctuating')),
    status VARCHAR CHECK (status IN ('on_track', 'at_risk', 'behind', 'achieved', 'not_started'))
);

-- Create indices for faster querying
CREATE INDEX idx_insights_department ON public.insights(department);
CREATE INDEX idx_insights_priority ON public.insights(priority);
CREATE INDEX idx_insights_status ON public.insights(status);
CREATE INDEX idx_insights_strength ON public.insights(is_strength);
CREATE INDEX idx_implementation_department ON public.implementation_plans(department);
CREATE INDEX idx_implementation_status ON public.implementation_plans(status);
CREATE INDEX idx_metrics_department ON public.department_metrics(department);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.implementation_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_metrics ENABLE ROW LEVEL SECURITY;

-- Create policy for insights access
CREATE POLICY "Allow authenticated access to insights"
    ON public.insights
    FOR ALL
    TO authenticated
    USING (true);

-- Create policy for implementation_plans access
CREATE POLICY "Allow authenticated access to implementation_plans"
    ON public.implementation_plans
    FOR ALL
    TO authenticated
    USING (true);

-- Create policy for department_metrics access
CREATE POLICY "Allow authenticated access to department_metrics"
    ON public.department_metrics
    FOR ALL
    TO authenticated
    USING (true);

-- Enable change tracking for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_insights_updated_at
    BEFORE UPDATE ON public.insights
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_implementation_plans_updated_at
    BEFORE UPDATE ON public.implementation_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();