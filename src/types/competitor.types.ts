import { z } from 'zod';
import { PersonaID } from './personas.types';
import { DepartmentType } from './department.types';

// Branded type for CompetitorID
export type CompetitorID = string & { readonly __brand: 'CompetitorID' };
export type BenchmarkID = string & { readonly __brand: 'BenchmarkID' };

// Feature category types
export const FeatureCategorySchema = z.enum([
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
]);

export type FeatureCategory = z.infer<typeof FeatureCategorySchema>;

// Rating scale
export const RatingSchema = z.number().int().min(1).max(10);
export type Rating = z.infer<typeof RatingSchema>;

// Competitor schema
export const CompetitorSchema = z.object({
  competitor_id: z.string().optional(),
  name: z.string().min(2).max(100),
  url: z.string().url(),
  logo_url: z.string().url().optional(),
  description: z.string().optional(),
  primary_market: z.string(),
  secondary_markets: z.array(z.string()).optional(),
  company_size: z.enum(['small', 'medium', 'large', 'enterprise']).optional(),
  is_active: z.boolean().default(true),
  tags: z.array(z.string()).optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  last_analyzed: z.string().datetime().optional(),
});

export type Competitor = z.infer<typeof CompetitorSchema>;

// Feature comparison schema
export const FeatureComparisonSchema = z.object({
  feature_id: z.string().optional(),
  competitor_id: z.string(),
  category: FeatureCategorySchema,
  feature_name: z.string().min(2).max(200),
  feature_description: z.string(),
  competitor_implementation: z.string(),
  mercadolivre_implementation: z.string().optional(),
  competitor_rating: RatingSchema,
  mercadolivre_rating: RatingSchema.optional(),
  is_competitive_advantage: z.boolean().optional(),
  is_gap: z.boolean().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  related_departments: z.array(z.string()).optional(),
  screenshots: z.array(z.string().url()).optional(),
  notes: z.string().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type FeatureComparison = z.infer<typeof FeatureComparisonSchema>;

// Benchmark report schema
export const BenchmarkReportSchema = z.object({
  benchmark_id: z.string().optional(),
  title: z.string().min(5).max(200),
  competitors: z.array(z.string()),
  departments: z.array(z.string()),
  summary: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  opportunities: z.array(z.string()),
  threats: z.array(z.string()),
  category_scores: z.record(z.string(), z.number()),
  overall_score: z.number().min(1).max(10),
  recommendations: z.array(z.object({
    title: z.string(),
    description: z.string(),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    department: z.string(),
    estimated_effort: z.string().optional()
  })),
  created_at: z.string().datetime().optional(),
  author: z.string().optional(),
  report_period: z.object({
    start_date: z.string().datetime(),
    end_date: z.string().datetime()
  }),
  status: z.enum(['draft', 'review', 'published', 'archived']).default('draft'),
});

export type BenchmarkReport = z.infer<typeof BenchmarkReportSchema>;

// Competitive analysis by persona schema
export const CompetitivePersonaAnalysisSchema = z.object({
  analysis_id: z.string().optional(),
  persona_id: z.string(),
  competitor_id: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  feature_ratings: z.record(z.string(), z.number()),
  overall_rating: z.number().min(1).max(10),
  comments: z.string(),
  created_at: z.string().datetime().optional(),
});

export type CompetitivePersonaAnalysis = z.infer<typeof CompetitivePersonaAnalysisSchema>;

// Competitive category rating schema
export const CompetitiveCategoryRatingSchema = z.object({
  rating_id: z.string().optional(),
  competitor_id: z.string(),
  category: FeatureCategorySchema,
  mercadolivre_score: RatingSchema,
  competitor_score: RatingSchema,
  gap_score: z.number().min(-9).max(9),
  notes: z.string().optional(),
  created_at: z.string().datetime().optional(),
});

export type CompetitiveCategoryRating = z.infer<typeof CompetitiveCategoryRatingSchema>;

// Benchmark request schema
export const BenchmarkRequestSchema = z.object({
  competitors: z.array(z.string()).min(1),
  categories: z.array(FeatureCategorySchema).optional(),
  departments: z.array(z.string()).optional(),
  title: z.string().min(5).optional(),
});

export type BenchmarkRequest = z.infer<typeof BenchmarkRequestSchema>;

// Competitor overview response
export interface CompetitorOverviewResponse {
  competitor: Competitor;
  feature_count: number;
  categories: Record<FeatureCategory, number>;
  average_ratings: {
    competitor: number;
    mercadolivre: number;
    gap: number;
  };
  top_advantages: FeatureComparison[];
  top_gaps: FeatureComparison[];
  last_updated: string;
}

// Competitive position response
export interface CompetitivePositionResponse {
  mercadolivre: {
    name: string;
    overall_score: number;
    category_scores: Record<FeatureCategory, number>;
  };
  competitors: Array<{
    competitor_id: string;
    name: string;
    overall_score: number;
    category_scores: Record<FeatureCategory, number>;
  }>;
  strongest_categories: Array<{
    category: FeatureCategory;
    advantage_score: number;
  }>;
  weakest_categories: Array<{
    category: FeatureCategory;
    gap_score: number;
  }>;
  generated_at: string;
}