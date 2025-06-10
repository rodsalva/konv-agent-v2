-- Competitive Benchmarking System Database Schema
-- This should be run after the main schema has been applied

-- Create enums for feature categories and priorities
CREATE TYPE feature_category AS ENUM (
  'product_discovery',
  'search',
  'navigation',
  'product_detail',
  'pricing',
  'checkout',
  'payment',
  'shipping',
  'returns',
  'customer_service',
  'mobile_experience',
  'personalization',
  'security',
  'promotions',
  'social_integration',
  'loyalty',
  'other'
);

CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE company_size AS ENUM ('small', 'medium', 'large', 'enterprise');
CREATE TYPE benchmark_status AS ENUM ('draft', 'review', 'published', 'archived');

-- 1. Competitors Table
CREATE TABLE competitors (
  competitor_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  url VARCHAR(255) NOT NULL,
  logo_url VARCHAR(255),
  description TEXT,
  primary_market VARCHAR(100) NOT NULL,
  secondary_markets TEXT[],
  company_size company_size,
  is_active BOOLEAN DEFAULT TRUE,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_analyzed TIMESTAMP WITH TIME ZONE
);

-- 2. Feature Comparisons Table
CREATE TABLE feature_comparisons (
  feature_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competitor_id UUID NOT NULL REFERENCES competitors(competitor_id),
  category feature_category NOT NULL,
  feature_name VARCHAR(200) NOT NULL,
  feature_description TEXT NOT NULL,
  competitor_implementation TEXT NOT NULL,
  mercadolivre_implementation TEXT,
  competitor_rating INTEGER NOT NULL CHECK (competitor_rating BETWEEN 1 AND 10),
  mercadolivre_rating INTEGER CHECK (mercadolivre_rating BETWEEN 1 AND 10),
  is_competitive_advantage BOOLEAN,
  is_gap BOOLEAN,
  priority priority_level,
  related_departments TEXT[],
  screenshots TEXT[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Benchmark Reports Table
CREATE TABLE benchmark_reports (
  benchmark_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  competitors UUID[] NOT NULL,
  departments TEXT[] NOT NULL,
  summary TEXT NOT NULL,
  strengths TEXT[],
  weaknesses TEXT[],
  opportunities TEXT[],
  threats TEXT[],
  category_scores JSONB NOT NULL,
  overall_score NUMERIC(3,1) NOT NULL CHECK (overall_score BETWEEN 1 AND 10),
  recommendations JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  author UUID REFERENCES agents(id),
  report_period JSONB NOT NULL,
  status benchmark_status DEFAULT 'draft'
);

-- 4. Competitive Persona Analysis Table
CREATE TABLE competitive_persona_analyses (
  analysis_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  persona_id UUID NOT NULL REFERENCES personas(persona_id),
  competitor_id UUID NOT NULL REFERENCES competitors(competitor_id),
  strengths TEXT[],
  weaknesses TEXT[],
  feature_ratings JSONB NOT NULL,
  overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 10),
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES agents(id),
  UNIQUE(persona_id, competitor_id)
);

-- 5. Category Ratings Table
CREATE TABLE competitive_category_ratings (
  rating_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competitor_id UUID NOT NULL REFERENCES competitors(competitor_id),
  category feature_category NOT NULL,
  mercadolivre_score NUMERIC(3,1) NOT NULL CHECK (mercadolivre_score BETWEEN 1 AND 10),
  competitor_score NUMERIC(3,1) NOT NULL CHECK (competitor_score BETWEEN 1 AND 10),
  gap_score NUMERIC(3,1) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(competitor_id, category)
);

-- Create indexes for performance
CREATE INDEX idx_feature_comparisons_competitor ON feature_comparisons(competitor_id);
CREATE INDEX idx_feature_comparisons_category ON feature_comparisons(category);
CREATE INDEX idx_feature_comparisons_advantage ON feature_comparisons(is_competitive_advantage) WHERE is_competitive_advantage = TRUE;
CREATE INDEX idx_feature_comparisons_gap ON feature_comparisons(is_gap) WHERE is_gap = TRUE;
CREATE INDEX idx_benchmark_reports_status ON benchmark_reports(status);
CREATE INDEX idx_benchmark_reports_created ON benchmark_reports(created_at);
CREATE INDEX idx_competitive_persona_competitor ON competitive_persona_analyses(competitor_id);
CREATE INDEX idx_competitive_persona_persona ON competitive_persona_analyses(persona_id);
CREATE INDEX idx_category_ratings_competitor ON competitive_category_ratings(competitor_id);
CREATE INDEX idx_category_ratings_category ON competitive_category_ratings(category);
CREATE INDEX idx_competitors_market ON competitors(primary_market);
CREATE INDEX idx_competitors_active ON competitors(is_active);

-- Create update trigger for competitors table
CREATE TRIGGER update_competitors_updated_at
BEFORE UPDATE ON competitors
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE benchmark_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitive_persona_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitive_category_ratings ENABLE ROW LEVEL SECURITY;

-- Create policies for service role access
CREATE POLICY "Enable read access for service role" ON competitors
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for service role" ON competitors
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for service role" ON competitors
  FOR UPDATE USING (true);

-- Create similar policies for other tables
CREATE POLICY "Enable read access for service role" ON feature_comparisons
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for service role" ON feature_comparisons
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for service role" ON feature_comparisons
  FOR UPDATE USING (true);

CREATE POLICY "Enable read access for service role" ON benchmark_reports
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for service role" ON benchmark_reports
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for service role" ON benchmark_reports
  FOR UPDATE USING (true);

CREATE POLICY "Enable read access for service role" ON competitive_persona_analyses
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for service role" ON competitive_persona_analyses
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for service role" ON competitive_persona_analyses
  FOR UPDATE USING (true);

CREATE POLICY "Enable read access for service role" ON competitive_category_ratings
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for service role" ON competitive_category_ratings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for service role" ON competitive_category_ratings
  FOR UPDATE USING (true);

-- Insert sample data
INSERT INTO competitors (name, url, primary_market, description, company_size, tags) VALUES
('Amazon', 'https://www.amazon.com', 'Global', 'Leading global e-commerce marketplace with vast product selection and fast delivery.', 'enterprise', ARRAY['marketplace', 'global', 'tech-giant']),
('Alibaba', 'https://www.alibaba.com', 'China', 'Largest e-commerce company in China with global B2B and B2C platforms.', 'enterprise', ARRAY['marketplace', 'global', 'b2b']),
('Magalu', 'https://www.magazineluiza.com.br', 'Brazil', 'Major Brazilian retail chain with strong omnichannel presence.', 'large', ARRAY['retail', 'electronics', 'brazil']),
('Americanas', 'https://www.americanas.com.br', 'Brazil', 'Brazilian e-commerce platform offering a wide range of products.', 'large', ARRAY['marketplace', 'brazil', 'retail']);