-- Customer Sentiment Analysis Database Schema
-- This should be run after the main schema has been applied

-- Create enums for sentiment categories and feedback sources
CREATE TYPE sentiment_category AS ENUM (
  'overall',
  'product_quality',
  'shipping',
  'price',
  'customer_service',
  'return_process',
  'user_experience',
  'checkout_process',
  'product_selection',
  'payment_options'
);

CREATE TYPE feedback_source_type AS ENUM (
  'product_review',
  'customer_support',
  'survey',
  'app_review',
  'social_media',
  'chat',
  'email',
  'other'
);

CREATE TYPE feedback_language AS ENUM (
  'pt',
  'es',
  'en',
  'unknown'
);

CREATE TYPE insight_type AS ENUM (
  'trend_change',
  'emerging_issue',
  'improvement_opportunity',
  'competitive_advantage'
);

CREATE TYPE priority_level AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

-- 1. Sentiment Analyses Table
CREATE TABLE sentiment_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feedback_id UUID NOT NULL,
  feedback_source feedback_source_type NOT NULL,
  feedback_text TEXT NOT NULL,
  language feedback_language NOT NULL,
  overall_sentiment NUMERIC(3,2) NOT NULL CHECK (overall_sentiment BETWEEN -1 AND 1),
  confidence NUMERIC(3,2) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  category_sentiment JSONB NOT NULL,
  aspects JSONB NOT NULL,
  key_phrases TEXT[],
  entities JSONB,
  metadata JSONB,
  analyzed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Sentiment Trends Table
CREATE TABLE sentiment_trends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  total_feedback_count INTEGER NOT NULL,
  average_sentiment NUMERIC(3,2) NOT NULL CHECK (average_sentiment BETWEEN -1 AND 1),
  sentiment_distribution JSONB NOT NULL,
  category_sentiment JSONB NOT NULL,
  top_positive_aspects JSONB NOT NULL,
  top_negative_aspects JSONB NOT NULL,
  emerging_topics JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT period_check CHECK (period_end > period_start)
);

-- 3. Sentiment Insights Table
CREATE TABLE sentiment_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  insight_type insight_type NOT NULL,
  priority priority_level NOT NULL,
  categories sentiment_category[] NOT NULL,
  sentiment_scores JSONB NOT NULL,
  affected_aspects TEXT[] NOT NULL,
  supporting_data JSONB NOT NULL,
  recommendations JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Sentiment Thresholds Table
CREATE TABLE sentiment_thresholds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category sentiment_category NOT NULL,
  threshold_value NUMERIC(3,2) NOT NULL CHECK (threshold_value BETWEEN -1 AND 1),
  alert_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category)
);

-- 5. Sentiment Alerts Table
CREATE TABLE sentiment_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category sentiment_category NOT NULL,
  current_score NUMERIC(3,2) NOT NULL CHECK (current_score BETWEEN -1 AND 1),
  threshold_value NUMERIC(3,2) NOT NULL CHECK (threshold_value BETWEEN -1 AND 1),
  feedback_count INTEGER NOT NULL,
  is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX idx_sentiment_analyses_feedback_id ON sentiment_analyses(feedback_id);
CREATE INDEX idx_sentiment_analyses_feedback_source ON sentiment_analyses(feedback_source);
CREATE INDEX idx_sentiment_analyses_overall_sentiment ON sentiment_analyses(overall_sentiment);
CREATE INDEX idx_sentiment_analyses_created_at ON sentiment_analyses(created_at);
CREATE INDEX idx_sentiment_trends_period ON sentiment_trends(period_start, period_end);
CREATE INDEX idx_sentiment_trends_created_at ON sentiment_trends(created_at);
CREATE INDEX idx_sentiment_insights_insight_type ON sentiment_insights(insight_type);
CREATE INDEX idx_sentiment_insights_priority ON sentiment_insights(priority);
CREATE INDEX idx_sentiment_insights_created_at ON sentiment_insights(created_at);
CREATE INDEX idx_sentiment_alerts_category ON sentiment_alerts(category);
CREATE INDEX idx_sentiment_alerts_is_resolved ON sentiment_alerts(is_resolved);

-- Create update trigger for updated_at fields
CREATE TRIGGER update_sentiment_analyses_updated_at
BEFORE UPDATE ON sentiment_analyses
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sentiment_thresholds_updated_at
BEFORE UPDATE ON sentiment_thresholds
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE sentiment_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentiment_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentiment_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentiment_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentiment_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for service role access
CREATE POLICY "Enable read access for service role" ON sentiment_analyses
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for service role" ON sentiment_analyses
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for service role" ON sentiment_analyses
  FOR UPDATE USING (true);

-- Create similar policies for other tables
CREATE POLICY "Enable read access for service role" ON sentiment_trends
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for service role" ON sentiment_trends
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for service role" ON sentiment_insights
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for service role" ON sentiment_insights
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for service role" ON sentiment_thresholds
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for service role" ON sentiment_thresholds
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for service role" ON sentiment_thresholds
  FOR UPDATE USING (true);

CREATE POLICY "Enable read access for service role" ON sentiment_alerts
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for service role" ON sentiment_alerts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for service role" ON sentiment_alerts
  FOR UPDATE USING (true);

-- Insert default sentiment thresholds
INSERT INTO sentiment_thresholds (category, threshold_value) VALUES
  ('overall', -0.3),
  ('product_quality', -0.4),
  ('shipping', -0.5),
  ('price', -0.3),
  ('customer_service', -0.4),
  ('return_process', -0.4),
  ('user_experience', -0.3),
  ('checkout_process', -0.4),
  ('product_selection', -0.2),
  ('payment_options', -0.4);