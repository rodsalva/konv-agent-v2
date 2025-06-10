// Type definitions for Persona API
import { z } from 'zod';

// Branded type for PersonaID
export type PersonaID = string & { readonly __brand: 'PersonaID' };

// Persona characteristics schema
export const PersonaCharacteristicsSchema = z.object({
  age_range: z.enum(['18-24', '25-34', '35-44', '45-54', '55-64', '65+']),
  income_level: z.enum(['low', 'medium', 'high', 'very_high']),
  tech_savviness: z.number().int().min(1).max(10),
  price_sensitivity: z.number().int().min(1).max(10),
  research_depth: z.number().int().min(1).max(10),
  decision_speed: z.number().int().min(1).max(10),
});

export type PersonaCharacteristics = z.infer<typeof PersonaCharacteristicsSchema>;

// Persona preferences schema
export const PersonaPreferencesSchema = z.object({
  preferred_categories: z.array(z.string()),
  avoided_categories: z.array(z.string()).optional(),
  important_factors: z.array(z.enum(['price', 'quality', 'speed', 'service'])),
  payment_preferences: z.array(z.enum(['credit', 'debit', 'pix', 'installments'])),
});

export type PersonaPreferences = z.infer<typeof PersonaPreferencesSchema>;

// Persona behaviors schema
export const PersonaBehaviorsSchema = z.object({
  shopping_frequency: z.enum(['daily', 'weekly', 'monthly', 'rarely']),
  average_session_duration: z.number().int().positive(),
  device_preference: z.enum(['mobile', 'desktop', 'tablet']),
  social_influence: z.number().int().min(1).max(10),
});

export type PersonaBehaviors = z.infer<typeof PersonaBehaviorsSchema>;

// Persona config schema (for creation/update)
export const PersonaConfigSchema = z.object({
  name: z.string().min(3).max(100),
  type: z.enum([
    'tech_enthusiast', 
    'budget_shopper', 
    'gift_buyer', 
    'family_shopper', 
    'business_buyer', 
    'senior_shopper', 
    'luxury_shopper'
  ]),
  characteristics: PersonaCharacteristicsSchema,
  preferences: PersonaPreferencesSchema,
  behaviors: PersonaBehaviorsSchema,
  customization: z.object({
    custom_attributes: z.record(z.unknown()).optional(),
    behavior_overrides: z.record(z.unknown()).optional(),
  }).optional(),
});

export type PersonaConfig = z.infer<typeof PersonaConfigSchema>;

// Persona entity schema (database model)
export const PersonaSchema = PersonaConfigSchema.extend({
  persona_id: z.string().min(10),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  is_active: z.boolean().default(true),
});

export type Persona = z.infer<typeof PersonaSchema>;

// Persona creation response
export interface PersonaCreationResponse {
  persona_id: PersonaID;
  name: string;
  type: string;
  created_at: string;
}

// Persona interaction schema
export const PersonaInteractionSchema = z.object({
  interaction_id: z.string().min(10),
  persona_id: z.string().min(10),
  platform: z.string(),
  timestamp: z.string().datetime(),
  questions: z.array(z.object({
    id: z.string(),
    text: z.string(),
    category: z.enum(['experience', 'features', 'comparison', 'discovery']),
  })),
  responses: z.array(z.object({
    question_id: z.string(),
    answer: z.string(),
    sentiment: z.enum(['positive', 'negative', 'neutral']).optional(),
    keywords: z.array(z.string()).optional(),
  })),
  metadata: z.record(z.unknown()).optional(),
});

export type PersonaInteraction = z.infer<typeof PersonaInteractionSchema>;

// Feedback request schema
export const FeedbackRequestSchema = z.object({
  platform: z.object({
    name: z.string(),
    url: z.string().url(),
    context: z.record(z.unknown()).optional(),
  }),
  questions: z.array(z.object({
    id: z.string(),
    text: z.string(),
    category: z.enum(['experience', 'features', 'comparison', 'discovery']),
  })).min(1),
  settings: z.object({
    detail_level: z.enum(['low', 'medium', 'high']).default('medium'),
    focus_areas: z.array(z.string()).optional(),
    max_response_length: z.number().int().positive().optional(),
  }).optional(),
});

export type FeedbackRequest = z.infer<typeof FeedbackRequestSchema>;

// Feedback collection response
export interface FeedbackCollectionResponse {
  collection_id: string;
  persona_id: PersonaID;
  platform: string;
  timestamp: string;
  status: 'in_progress' | 'completed' | 'failed';
  responses?: Array<{
    question_id: string;
    answer: string;
  }>;
}

// Persona insights response
export interface PersonaInsight {
  insight_id: string;
  title: string;
  description: string;
  personas: Array<{
    persona_id: PersonaID;
    relevance_score: number;
    evidence: string;
  }>;
  departments: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
}

export interface PersonaInsightsResponse {
  insights: PersonaInsight[];
  total: number;
  categories: Record<string, number>;
}