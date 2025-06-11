-- Insert 15 diverse persona profiles for MercadoLibre exploration
-- Each profile has different exploration time preferences and characteristics

-- Function to generate unique persona IDs
CREATE OR REPLACE FUNCTION generate_persona_id()
RETURNS VARCHAR AS $$
BEGIN
  RETURN 'persona_' || substr(md5(random()::text), 1, 12);
END;
$$ LANGUAGE plpgsql;

-- Main insertion of personas
INSERT INTO public.personas (
  persona_id, 
  name, 
  type, 
  characteristics, 
  preferences, 
  behaviors, 
  customization,
  created_at, 
  updated_at, 
  is_active
)
VALUES
-- Fast explorers (brief sessions)
(
  generate_persona_id(),
  'Busy Professional',
  'business_buyer',
  '{
    "age_range": "35-44",
    "income_level": "high",
    "tech_savviness": 8,
    "price_sensitivity": 4,
    "research_depth": 5,
    "decision_speed": 9
  }',
  '{
    "preferred_categories": ["electronics", "office supplies", "services"],
    "important_factors": ["speed", "quality", "service"],
    "payment_preferences": ["credit", "pix"]
  }',
  '{
    "shopping_frequency": "weekly",
    "average_session_duration": 5,
    "device_preference": "mobile",
    "social_influence": 3
  }',
  '{
    "custom_attributes": {
      "exploration_time": "brief",
      "time_spent_minutes": 5,
      "impatience_level": 8,
      "prefers_quick_checkout": true
    }
  }',
  NOW(),
  NOW(),
  TRUE
),
(
  generate_persona_id(),
  'Impulse Buyer',
  'luxury_shopper',
  '{
    "age_range": "25-34",
    "income_level": "high",
    "tech_savviness": 7,
    "price_sensitivity": 3,
    "research_depth": 2,
    "decision_speed": 10
  }',
  '{
    "preferred_categories": ["fashion", "electronics", "luxury"],
    "important_factors": ["quality", "speed"],
    "payment_preferences": ["credit"]
  }',
  '{
    "shopping_frequency": "weekly",
    "average_session_duration": 8,
    "device_preference": "mobile",
    "social_influence": 8
  }',
  '{
    "custom_attributes": {
      "exploration_time": "brief",
      "time_spent_minutes": 8,
      "likes_flash_sales": true,
      "brand_conscious": true
    }
  }',
  NOW(),
  NOW(),
  TRUE
),
(
  generate_persona_id(),
  'Quick Deal Hunter',
  'budget_shopper',
  '{
    "age_range": "18-24",
    "income_level": "low",
    "tech_savviness": 9,
    "price_sensitivity": 9,
    "research_depth": 4,
    "decision_speed": 7
  }',
  '{
    "preferred_categories": ["electronics", "groceries", "fashion"],
    "important_factors": ["price", "speed"],
    "payment_preferences": ["pix", "debit"]
  }',
  '{
    "shopping_frequency": "daily",
    "average_session_duration": 10,
    "device_preference": "mobile",
    "social_influence": 7
  }',
  '{
    "custom_attributes": {
      "exploration_time": "brief",
      "time_spent_minutes": 10,
      "coupon_hunter": true,
      "price_comparison_focused": true
    }
  }',
  NOW(),
  NOW(),
  TRUE
),

-- Medium explorers (standard sessions)
(
  generate_persona_id(),
  'Soccer Mom',
  'family_shopper',
  '{
    "age_range": "35-44",
    "income_level": "medium",
    "tech_savviness": 6,
    "price_sensitivity": 7,
    "research_depth": 6,
    "decision_speed": 5
  }',
  '{
    "preferred_categories": ["home", "toys", "clothing", "groceries"],
    "important_factors": ["price", "quality", "service"],
    "payment_preferences": ["credit", "installments"]
  }',
  '{
    "shopping_frequency": "weekly",
    "average_session_duration": 15,
    "device_preference": "tablet",
    "social_influence": 6
  }',
  '{
    "custom_attributes": {
      "exploration_time": "medium",
      "time_spent_minutes": 15,
      "family_focused": true,
      "reviews_important": true
    }
  }',
  NOW(),
  NOW(),
  TRUE
),
(
  generate_persona_id(),
  'Teacher',
  'budget_shopper',
  '{
    "age_range": "45-54",
    "income_level": "medium",
    "tech_savviness": 5,
    "price_sensitivity": 8,
    "research_depth": 7,
    "decision_speed": 6
  }',
  '{
    "preferred_categories": ["books", "office supplies", "home"],
    "important_factors": ["price", "quality"],
    "payment_preferences": ["credit", "installments", "pix"]
  }',
  '{
    "shopping_frequency": "monthly",
    "average_session_duration": 20,
    "device_preference": "desktop",
    "social_influence": 4
  }',
  '{
    "custom_attributes": {
      "exploration_time": "medium",
      "time_spent_minutes": 20,
      "educational_focus": true,
      "seasonal_shopper": true
    }
  }',
  NOW(),
  NOW(),
  TRUE
),
(
  generate_persona_id(),
  'Weekend DIYer',
  'family_shopper',
  '{
    "age_range": "35-44",
    "income_level": "medium",
    "tech_savviness": 6,
    "price_sensitivity": 6,
    "research_depth": 7,
    "decision_speed": 5
  }',
  '{
    "preferred_categories": ["tools", "home improvement", "garden"],
    "important_factors": ["quality", "price"],
    "payment_preferences": ["credit", "installments"]
  }',
  '{
    "shopping_frequency": "monthly",
    "average_session_duration": 18,
    "device_preference": "desktop",
    "social_influence": 5
  }',
  '{
    "custom_attributes": {
      "exploration_time": "medium",
      "time_spent_minutes": 18,
      "project_based_shopping": true,
      "tutorial_videos_valued": true
    }
  }',
  NOW(),
  NOW(),
  TRUE
),
(
  generate_persona_id(),
  'College Student',
  'budget_shopper',
  '{
    "age_range": "18-24",
    "income_level": "low",
    "tech_savviness": 9,
    "price_sensitivity": 10,
    "research_depth": 6,
    "decision_speed": 4
  }',
  '{
    "preferred_categories": ["electronics", "books", "fashion", "home"],
    "important_factors": ["price", "quality"],
    "payment_preferences": ["pix", "debit", "installments"]
  }',
  '{
    "shopping_frequency": "monthly",
    "average_session_duration": 25,
    "device_preference": "mobile",
    "social_influence": 8
  }',
  '{
    "custom_attributes": {
      "exploration_time": "medium",
      "time_spent_minutes": 25,
      "budget_conscious": true,
      "deals_focused": true
    }
  }',
  NOW(),
  NOW(),
  TRUE
),
(
  generate_persona_id(),
  'Fitness Enthusiast',
  'tech_enthusiast',
  '{
    "age_range": "25-34",
    "income_level": "medium",
    "tech_savviness": 8,
    "price_sensitivity": 5,
    "research_depth": 7,
    "decision_speed": 6
  }',
  '{
    "preferred_categories": ["fitness", "electronics", "health", "clothing"],
    "important_factors": ["quality", "price"],
    "payment_preferences": ["credit", "pix"]
  }',
  '{
    "shopping_frequency": "monthly",
    "average_session_duration": 22,
    "device_preference": "mobile",
    "social_influence": 7
  }',
  '{
    "custom_attributes": {
      "exploration_time": "medium",
      "time_spent_minutes": 22,
      "health_conscious": true,
      "wearable_tech_interested": true
    }
  }',
  NOW(),
  NOW(),
  TRUE
),
(
  generate_persona_id(),
  'Young Parent',
  'family_shopper',
  '{
    "age_range": "25-34",
    "income_level": "medium",
    "tech_savviness": 7,
    "price_sensitivity": 7,
    "research_depth": 8,
    "decision_speed": 5
  }',
  '{
    "preferred_categories": ["baby", "toys", "home", "groceries"],
    "important_factors": ["quality", "price", "service"],
    "payment_preferences": ["credit", "installments"]
  }',
  '{
    "shopping_frequency": "weekly",
    "average_session_duration": 20,
    "device_preference": "mobile",
    "social_influence": 6
  }',
  '{
    "custom_attributes": {
      "exploration_time": "medium",
      "time_spent_minutes": 20,
      "safety_conscious": true,
      "parenting_reviews_valued": true
    }
  }',
  NOW(),
  NOW(),
  TRUE
),

-- Thorough explorers (lengthy sessions)
(
  generate_persona_id(),
  'Retiree',
  'senior_shopper',
  '{
    "age_range": "65+",
    "income_level": "medium",
    "tech_savviness": 4,
    "price_sensitivity": 6,
    "research_depth": 9,
    "decision_speed": 3
  }',
  '{
    "preferred_categories": ["health", "home", "books", "garden"],
    "important_factors": ["service", "quality", "price"],
    "payment_preferences": ["credit", "debit"]
  }',
  '{
    "shopping_frequency": "weekly",
    "average_session_duration": 45,
    "device_preference": "desktop",
    "social_influence": 3
  }',
  '{
    "custom_attributes": {
      "exploration_time": "lengthy",
      "time_spent_minutes": 45,
      "prefers_phone_support": true,
      "reads_all_details": true
    }
  }',
  NOW(),
  NOW(),
  TRUE
),
(
  generate_persona_id(),
  'Luxury Collector',
  'luxury_shopper',
  '{
    "age_range": "45-54",
    "income_level": "very_high",
    "tech_savviness": 7,
    "price_sensitivity": 2,
    "research_depth": 10,
    "decision_speed": 4
  }',
  '{
    "preferred_categories": ["collectibles", "art", "luxury", "jewelry"],
    "important_factors": ["quality", "service"],
    "payment_preferences": ["credit"]
  }',
  '{
    "shopping_frequency": "monthly",
    "average_session_duration": 40,
    "device_preference": "desktop",
    "social_influence": 5
  }',
  '{
    "custom_attributes": {
      "exploration_time": "lengthy",
      "time_spent_minutes": 40,
      "authenticity_focused": true,
      "detailed_history_important": true
    }
  }',
  NOW(),
  NOW(),
  TRUE
),
(
  generate_persona_id(),
  'Research Scientist',
  'tech_enthusiast',
  '{
    "age_range": "35-44",
    "income_level": "high",
    "tech_savviness": 10,
    "price_sensitivity": 4,
    "research_depth": 10,
    "decision_speed": 3
  }',
  '{
    "preferred_categories": ["electronics", "books", "office", "specialized equipment"],
    "important_factors": ["quality", "service"],
    "payment_preferences": ["credit", "pix"]
  }',
  '{
    "shopping_frequency": "monthly",
    "average_session_duration": 50,
    "device_preference": "desktop",
    "social_influence": 2
  }',
  '{
    "custom_attributes": {
      "exploration_time": "lengthy",
      "time_spent_minutes": 50,
      "technical_specs_focused": true,
      "comparative_analysis": true
    }
  }',
  NOW(),
  NOW(),
  TRUE
),
(
  generate_persona_id(),
  'Small Business Owner',
  'business_buyer',
  '{
    "age_range": "35-44",
    "income_level": "medium",
    "tech_savviness": 7,
    "price_sensitivity": 7,
    "research_depth": 8,
    "decision_speed": 4
  }',
  '{
    "preferred_categories": ["office supplies", "electronics", "services", "wholesale"],
    "important_factors": ["price", "quality", "service"],
    "payment_preferences": ["credit", "pix", "installments"]
  }',
  '{
    "shopping_frequency": "weekly",
    "average_session_duration": 35,
    "device_preference": "desktop",
    "social_influence": 4
  }',
  '{
    "custom_attributes": {
      "exploration_time": "lengthy",
      "time_spent_minutes": 35,
      "bulk_purchase_focused": true,
      "business_reviews_important": true
    }
  }',
  NOW(),
  NOW(),
  TRUE
),
(
  generate_persona_id(),
  'Gamer',
  'tech_enthusiast',
  '{
    "age_range": "18-24",
    "income_level": "medium",
    "tech_savviness": 10,
    "price_sensitivity": 5,
    "research_depth": 9,
    "decision_speed": 5
  }',
  '{
    "preferred_categories": ["gaming", "electronics", "collectibles"],
    "important_factors": ["quality", "price"],
    "payment_preferences": ["credit", "pix", "installments"]
  }',
  '{
    "shopping_frequency": "monthly",
    "average_session_duration": 40,
    "device_preference": "desktop",
    "social_influence": 7
  }',
  '{
    "custom_attributes": {
      "exploration_time": "lengthy",
      "time_spent_minutes": 40,
      "specs_comparison_focused": true,
      "community_reviews_valued": true
    }
  }',
  NOW(),
  NOW(),
  TRUE
),
(
  generate_persona_id(),
  'Professional Chef',
  'business_buyer',
  '{
    "age_range": "35-44",
    "income_level": "high",
    "tech_savviness": 6,
    "price_sensitivity": 5,
    "research_depth": 9,
    "decision_speed": 4
  }',
  '{
    "preferred_categories": ["kitchen", "food", "appliances", "wholesale"],
    "important_factors": ["quality", "service", "price"],
    "payment_preferences": ["credit", "pix"]
  }',
  '{
    "shopping_frequency": "weekly",
    "average_session_duration": 30,
    "device_preference": "tablet",
    "social_influence": 5
  }',
  '{
    "custom_attributes": {
      "exploration_time": "lengthy",
      "time_spent_minutes": 30,
      "professional_grade_focused": true,
      "brand_reputation_important": true
    }
  }',
  NOW(),
  NOW(),
  TRUE
);

-- Create index for exploration time queries
CREATE INDEX IF NOT EXISTS idx_persona_exploration_time 
ON public.personas ((customization->>'exploration_time'));

-- Create index for time spent queries
CREATE INDEX IF NOT EXISTS idx_persona_time_spent 
ON public.personas (((customization->>'time_spent_minutes')::int));