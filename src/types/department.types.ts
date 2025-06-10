import { z } from 'zod';
import { PersonaID } from './personas.types';

// Branded type for DepartmentID
export type DepartmentID = string & { readonly __brand: 'DepartmentID' };
export type InsightID = string & { readonly __brand: 'InsightID' };

// Department types
export const DepartmentTypeSchema = z.enum([
  'product',
  'engineering',
  'marketing',
  'ux_ui',
  'pricing',
  'customer_service',
  'technology',
  'operations',
  'business_intelligence'
]);

export type DepartmentType = z.infer<typeof DepartmentTypeSchema>;

// Priority levels
export const PriorityLevelSchema = z.enum([
  'low',
  'medium',
  'high',
  'critical'
]);

export type PriorityLevel = z.infer<typeof PriorityLevelSchema>;

// Evidence schema for supporting an insight
export const EvidenceSchema = z.object({
  persona_id: z.string(),
  feedback: z.string(),
  relevance_score: z.number().min(0).max(1),
  sentiment: z.enum(['positive', 'negative', 'neutral']).optional(),
});

export type Evidence = z.infer<typeof EvidenceSchema>;

// Base insight schema
export const InsightSchema = z.object({
  insight_id: z.string().optional(),
  title: z.string().min(10).max(150),
  description: z.string().min(20),
  is_strength: z.boolean(), // Whether this is a strength to maintain or an issue to fix
  department: DepartmentTypeSchema,
  evidence: z.array(EvidenceSchema).min(1),
  root_cause: z.string().min(10).optional(),
  recommendation: z.string().min(10),
  expected_outcome: z.string().min(10),
  verification_method: z.string().min(10),
  priority: PriorityLevelSchema,
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  status: z.enum(['draft', 'review', 'approved', 'rejected', 'implemented']).default('draft'),
  tags: z.array(z.string()).optional(),
});

export type Insight = z.infer<typeof InsightSchema>;

// Department insight request
export const DepartmentInsightRequestSchema = z.object({
  department: DepartmentTypeSchema,
  feedback_ids: z.array(z.string()).optional(),
  collection_ids: z.array(z.string()).optional(),
  max_insights: z.number().positive().optional(),
  priority_threshold: PriorityLevelSchema.optional(),
  include_strengths: z.boolean().default(true),
});

export type DepartmentInsightRequest = z.infer<typeof DepartmentInsightRequestSchema>;

// Department insight response
export interface DepartmentInsightResponse {
  department: DepartmentType;
  insights: Insight[];
  summary: {
    total_insights: number;
    strengths: number;
    issues: number;
    by_priority: Record<PriorityLevel, number>;
  };
  generated_at: string;
}

// Implementation plan schema
export const ImplementationStepSchema = z.object({
  step_number: z.number().int().positive(),
  description: z.string().min(10),
  owner: z.string().optional(),
  estimated_effort: z.string().optional(),
  dependencies: z.array(z.number().int()).optional(),
  resources_required: z.array(z.string()).optional(),
});

export type ImplementationStep = z.infer<typeof ImplementationStepSchema>;

export const ImplementationPlanSchema = z.object({
  insight_id: z.string(),
  department: DepartmentTypeSchema,
  title: z.string().min(5),
  overview: z.string().min(10),
  steps: z.array(ImplementationStepSchema).min(1),
  timeline_weeks: z.number().int().positive(),
  estimated_cost: z.number().nonnegative().optional(),
  risk_factors: z.array(z.string()).optional(),
  success_metrics: z.array(z.string()).min(1),
  created_at: z.string().datetime().optional(),
  status: z.enum(['draft', 'review', 'approved', 'in_progress', 'completed']).default('draft'),
});

export type ImplementationPlan = z.infer<typeof ImplementationPlanSchema>;

// Department summary types
export interface DepartmentSummary {
  department: DepartmentType;
  name: string;
  icon: string;
  immediate_actions: string[];
  medium_term_initiatives: string[];
  kpis: string[];
}

export interface DepartmentalRecommendations {
  title: string;
  subtitle: string;
  departments: Record<string, DepartmentSummary>;
}