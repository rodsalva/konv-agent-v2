import { v4 as uuidv4 } from 'uuid';
import { EventBus } from '../events/event-bus';
import { logger } from '../utils/logger';
import { db } from './database';
import { WebSocketService } from './websocket';
import { departmentInsightService } from './department-insight';
import {
  CompetitorID,
  BenchmarkID,
  Competitor,
  FeatureComparison,
  BenchmarkReport,
  CompetitivePersonaAnalysis,
  CompetitiveCategoryRating,
  BenchmarkRequest,
  CompetitorOverviewResponse,
  CompetitivePositionResponse,
  FeatureCategory
} from '../types/competitor.types';
import { DepartmentType } from '../types/department.types';

/**
 * Service for managing competitor benchmarking and competitive analysis
 */
class CompetitorBenchmarkService {
  private websocketService: WebSocketService | null = null;

  constructor(private eventBus: EventBus) {
    // Subscribe to relevant events
    this.eventBus.subscribe('competitor.added', this.handleCompetitorAdded.bind(this));
    this.eventBus.subscribe('competitor.updated', this.handleCompetitorUpdated.bind(this));
    this.eventBus.subscribe('feature.comparison.added', this.handleFeatureComparisonAdded.bind(this));
    this.eventBus.subscribe('benchmark.report.created', this.handleBenchmarkReportCreated.bind(this));
  }

  /**
   * Initialize the service with dependencies
   */
  initialize(websocketService: WebSocketService): void {
    this.websocketService = websocketService;
    logger.info('CompetitorBenchmarkService initialized');
  }

  /**
   * Add a new competitor to the system
   */
  async addCompetitor(competitor: Omit<Competitor, 'competitor_id' | 'created_at' | 'updated_at' | 'last_analyzed'>): Promise<Competitor> {
    try {
      const competitorId = `competitor_${uuidv4()}` as CompetitorID;
      const now = new Date().toISOString();

      const newCompetitor: Competitor = {
        ...competitor,
        competitor_id: competitorId,
        created_at: now,
        updated_at: now,
        is_active: true
      };

      // Store in database
      const { data, error } = await db.supabase
        .from('competitors')
        .insert(newCompetitor)
        .select()
        .single();

      if (error) {
        logger.error('Error creating competitor', { error, competitor: competitor.name });
        throw new Error(`Failed to create competitor: ${error.message}`);
      }

      // Publish event
      this.eventBus.publish('competitor.added', {
        competitorId,
        name: competitor.name,
        timestamp: now
      });

      return data as Competitor;
    } catch (error) {
      logger.error('Error in addCompetitor', { error });
      throw error;
    }
  }

  /**
   * Get all competitors or a specific competitor
   */
  async getCompetitors(competitorId?: CompetitorID): Promise<Competitor[]> {
    try {
      let query = db.supabase
        .from('competitors')
        .select('*')
        .eq('is_active', true);

      if (competitorId) {
        query = query.eq('competitor_id', competitorId);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching competitors', { error, competitorId });
        throw new Error(`Failed to fetch competitors: ${error.message}`);
      }

      return data as Competitor[];
    } catch (error) {
      logger.error('Error in getCompetitors', { error });
      throw error;
    }
  }

  /**
   * Update an existing competitor
   */
  async updateCompetitor(competitorId: CompetitorID, updates: Partial<Competitor>): Promise<Competitor> {
    try {
      const now = new Date().toISOString();
      
      // Remove protected fields from updates
      const { competitor_id, created_at, ...validUpdates } = updates;

      const updatedCompetitor = {
        ...validUpdates,
        updated_at: now
      };

      // Update in database
      const { data, error } = await db.supabase
        .from('competitors')
        .update(updatedCompetitor)
        .eq('competitor_id', competitorId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating competitor', { error, competitorId });
        throw new Error(`Failed to update competitor: ${error.message}`);
      }

      // Publish event
      this.eventBus.publish('competitor.updated', {
        competitorId,
        timestamp: now
      });

      return data as Competitor;
    } catch (error) {
      logger.error('Error in updateCompetitor', { error });
      throw error;
    }
  }

  /**
   * Add a feature comparison
   */
  async addFeatureComparison(feature: Omit<FeatureComparison, 'feature_id' | 'created_at' | 'updated_at'>): Promise<FeatureComparison> {
    try {
      const featureId = `feature_${uuidv4()}`;
      const now = new Date().toISOString();

      // Calculate if this is an advantage or gap
      const isCompetitiveAdvantage = 
        feature.mercadolivre_rating !== undefined && 
        feature.mercadolivre_rating > feature.competitor_rating;
      
      const isGap = 
        feature.mercadolivre_rating !== undefined && 
        feature.mercadolivre_rating < feature.competitor_rating;

      const newFeature: FeatureComparison = {
        ...feature,
        feature_id: featureId,
        created_at: now,
        updated_at: now,
        is_competitive_advantage: isCompetitiveAdvantage,
        is_gap: isGap
      };

      // Store in database
      const { data, error } = await db.supabase
        .from('feature_comparisons')
        .insert(newFeature)
        .select()
        .single();

      if (error) {
        logger.error('Error creating feature comparison', { error, feature: feature.feature_name });
        throw new Error(`Failed to create feature comparison: ${error.message}`);
      }

      // Publish event
      this.eventBus.publish('feature.comparison.added', {
        featureId,
        competitorId: feature.competitor_id,
        category: feature.category,
        isGap,
        isAdvantage: isCompetitiveAdvantage,
        timestamp: now
      });

      return data as FeatureComparison;
    } catch (error) {
      logger.error('Error in addFeatureComparison', { error });
      throw error;
    }
  }

  /**
   * Get feature comparisons
   */
  async getFeatureComparisons(filters: {
    competitor_id?: string;
    category?: FeatureCategory;
    is_gap?: boolean;
    is_advantage?: boolean;
  } = {}): Promise<FeatureComparison[]> {
    try {
      let query = db.supabase
        .from('feature_comparisons')
        .select('*');

      // Apply filters
      if (filters.competitor_id) {
        query = query.eq('competitor_id', filters.competitor_id);
      }

      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.is_gap !== undefined) {
        query = query.eq('is_gap', filters.is_gap);
      }

      if (filters.is_advantage !== undefined) {
        query = query.eq('is_competitive_advantage', filters.is_advantage);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching feature comparisons', { error, filters });
        throw new Error(`Failed to fetch feature comparisons: ${error.message}`);
      }

      return data as FeatureComparison[];
    } catch (error) {
      logger.error('Error in getFeatureComparisons', { error });
      throw error;
    }
  }

  /**
   * Create a benchmark report
   */
  async createBenchmarkReport(report: Omit<BenchmarkReport, 'benchmark_id' | 'created_at'>): Promise<BenchmarkReport> {
    try {
      const benchmarkId = `benchmark_${uuidv4()}` as BenchmarkID;
      const now = new Date().toISOString();

      const newReport: BenchmarkReport = {
        ...report,
        benchmark_id: benchmarkId,
        created_at: now
      };

      // Store in database
      const { data, error } = await db.supabase
        .from('benchmark_reports')
        .insert(newReport)
        .select()
        .single();

      if (error) {
        logger.error('Error creating benchmark report', { error, title: report.title });
        throw new Error(`Failed to create benchmark report: ${error.message}`);
      }

      // Publish event
      this.eventBus.publish('benchmark.report.created', {
        benchmarkId,
        title: report.title,
        competitors: report.competitors.length,
        timestamp: now
      });

      return data as BenchmarkReport;
    } catch (error) {
      logger.error('Error in createBenchmarkReport', { error });
      throw error;
    }
  }

  /**
   * Get benchmark reports
   */
  async getBenchmarkReports(status?: string): Promise<BenchmarkReport[]> {
    try {
      let query = db.supabase
        .from('benchmark_reports')
        .select('*');

      if (status) {
        query = query.eq('status', status);
      }

      // Order by creation date, newest first
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching benchmark reports', { error, status });
        throw new Error(`Failed to fetch benchmark reports: ${error.message}`);
      }

      return data as BenchmarkReport[];
    } catch (error) {
      logger.error('Error in getBenchmarkReports', { error });
      throw error;
    }
  }

  /**
   * Generate a new benchmark report for competitors
   */
  async generateBenchmarkReport(request: BenchmarkRequest): Promise<BenchmarkReport> {
    try {
      logger.info('Generating benchmark report', { 
        competitors: request.competitors.length,
        categories: request.categories?.length || 'all' 
      });

      // Get competitors
      const competitors = await Promise.all(
        request.competitors.map(id => this.getCompetitors(id as CompetitorID))
      );
      
      const competitorEntities = competitors.flatMap(c => c);
      
      if (competitorEntities.length === 0) {
        throw new Error('No valid competitors found for benchmark');
      }

      // Get feature comparisons for these competitors
      const featureComparisons: FeatureComparison[] = [];
      
      for (const competitor of request.competitors) {
        const features = await this.getFeatureComparisons({ competitor_id: competitor });
        featureComparisons.push(...features);
      }
      
      if (featureComparisons.length === 0) {
        logger.warn('No feature comparisons found for benchmark', { request });
        // Create a minimal report with placeholders
        return this.createMinimalBenchmarkReport(request, competitorEntities);
      }

      // Filter by categories if specified
      let filteredFeatures = featureComparisons;
      if (request.categories && request.categories.length > 0) {
        filteredFeatures = featureComparisons.filter(f => 
          request.categories!.includes(f.category)
        );
      }

      // Generate benchmark report
      const report = this.analyzeBenchmarkData(filteredFeatures, competitorEntities, request);
      
      // Save to database
      return this.createBenchmarkReport(report);
    } catch (error) {
      logger.error('Error generating benchmark report', { error, request });
      throw error;
    }
  }

  /**
   * Generate competitor overview
   */
  async getCompetitorOverview(competitorId: CompetitorID): Promise<CompetitorOverviewResponse> {
    try {
      // Get competitor
      const competitors = await this.getCompetitors(competitorId);
      
      if (competitors.length === 0) {
        throw new Error(`Competitor not found: ${competitorId}`);
      }
      
      const competitor = competitors[0];
      
      // Get feature comparisons
      const features = await this.getFeatureComparisons({ competitor_id: competitorId });
      
      // Count features by category
      const categories: Record<FeatureCategory, number> = {} as Record<FeatureCategory, number>;
      
      features.forEach(f => {
        if (!categories[f.category]) {
          categories[f.category] = 0;
        }
        categories[f.category]++;
      });
      
      // Calculate average ratings
      let competitorTotal = 0;
      let mercadolivreTotal = 0;
      let ratedFeatureCount = 0;
      
      features.forEach(f => {
        competitorTotal += f.competitor_rating;
        
        if (f.mercadolivre_rating !== undefined) {
          mercadolivreTotal += f.mercadolivre_rating;
          ratedFeatureCount++;
        }
      });
      
      const competitorAvg = features.length > 0 ? competitorTotal / features.length : 0;
      const mercadolivreAvg = ratedFeatureCount > 0 ? mercadolivreTotal / ratedFeatureCount : 0;
      
      // Get top advantages and gaps
      const advantages = features
        .filter(f => f.is_competitive_advantage)
        .sort((a, b) => {
          const aDiff = (a.mercadolivre_rating || 0) - a.competitor_rating;
          const bDiff = (b.mercadolivre_rating || 0) - b.competitor_rating;
          return bDiff - aDiff;
        })
        .slice(0, 5);
      
      const gaps = features
        .filter(f => f.is_gap)
        .sort((a, b) => {
          const aDiff = a.competitor_rating - (a.mercadolivre_rating || 0);
          const bDiff = b.competitor_rating - (b.mercadolivre_rating || 0);
          return bDiff - aDiff;
        })
        .slice(0, 5);
      
      return {
        competitor,
        feature_count: features.length,
        categories,
        average_ratings: {
          competitor: competitorAvg,
          mercadolivre: mercadolivreAvg,
          gap: mercadolivreAvg - competitorAvg
        },
        top_advantages: advantages,
        top_gaps: gaps,
        last_updated: competitor.last_analyzed || competitor.updated_at || competitor.created_at || new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error getting competitor overview', { error, competitorId });
      throw error;
    }
  }

  /**
   * Generate competitive position analysis
   */
  async getCompetitivePosition(competitorIds: CompetitorID[]): Promise<CompetitivePositionResponse> {
    try {
      // Get all competitors
      const allCompetitors: Competitor[] = [];
      
      for (const id of competitorIds) {
        const competitors = await this.getCompetitors(id);
        allCompetitors.push(...competitors);
      }
      
      if (allCompetitors.length === 0) {
        throw new Error('No valid competitors found');
      }
      
      // Calculate category scores for each competitor
      const competitorScores: Array<{
        competitor_id: string;
        name: string;
        overall_score: number;
        category_scores: Record<FeatureCategory, number>;
      }> = [];
      
      const mercadolivreScores: Record<FeatureCategory, number[]> = {};
      const mercadolivreCategoryCounts: Record<FeatureCategory, number> = {};
      
      // Process each competitor
      for (const competitor of allCompetitors) {
        const features = await this.getFeatureComparisons({ competitor_id: competitor.competitor_id });
        
        // Group features by category
        const categoryFeatures: Record<string, FeatureComparison[]> = {};
        
        features.forEach(f => {
          if (!categoryFeatures[f.category]) {
            categoryFeatures[f.category] = [];
          }
          categoryFeatures[f.category].push(f);
        });
        
        // Calculate scores by category
        const categoryScores: Record<FeatureCategory, number> = {} as Record<FeatureCategory, number>;
        let overallTotal = 0;
        let overallCount = 0;
        
        Object.entries(categoryFeatures).forEach(([category, catFeatures]) => {
          let competitorTotal = 0;
          let mercadolivreTotal = 0;
          let ratedCount = 0;
          
          catFeatures.forEach(f => {
            competitorTotal += f.competitor_rating;
            
            if (f.mercadolivre_rating !== undefined) {
              mercadolivreTotal += f.mercadolivre_rating;
              ratedCount++;
              
              // Accumulate MercadoLivre scores
              if (!mercadolivreScores[category as FeatureCategory]) {
                mercadolivreScores[category as FeatureCategory] = [];
                mercadolivreCategoryCounts[category as FeatureCategory] = 0;
              }
              
              mercadolivreScores[category as FeatureCategory].push(f.mercadolivre_rating);
              mercadolivreCategoryCounts[category as FeatureCategory]++;
            }
          });
          
          const competitorAvg = catFeatures.length > 0 ? competitorTotal / catFeatures.length : 0;
          categoryScores[category as FeatureCategory] = competitorAvg;
          
          overallTotal += competitorTotal;
          overallCount += catFeatures.length;
        });
        
        const overallScore = overallCount > 0 ? overallTotal / overallCount : 0;
        
        competitorScores.push({
          competitor_id: competitor.competitor_id,
          name: competitor.name,
          overall_score: overallScore,
          category_scores: categoryScores
        });
      }
      
      // Calculate MercadoLivre's average scores
      const mercadolivreCategoryScores: Record<FeatureCategory, number> = {} as Record<FeatureCategory, number>;
      let mercadolivreOverallTotal = 0;
      let mercadolivreOverallCount = 0;
      
      Object.entries(mercadolivreScores).forEach(([category, scores]) => {
        const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        mercadolivreCategoryScores[category as FeatureCategory] = avg;
        
        mercadolivreOverallTotal += scores.reduce((a, b) => a + b, 0);
        mercadolivreOverallCount += scores.length;
      });
      
      const mercadolivreOverallScore = mercadolivreOverallCount > 0 
        ? mercadolivreOverallTotal / mercadolivreOverallCount 
        : 0;
      
      // Calculate strongest and weakest categories
      const categoryGaps: Array<{
        category: FeatureCategory;
        advantage_score: number;
        gap_score: number;
      }> = [];
      
      Object.entries(mercadolivreCategoryScores).forEach(([category, mlScore]) => {
        // Calculate average competitor score for this category
        let competitorTotal = 0;
        let competitorCount = 0;
        
        competitorScores.forEach(comp => {
          if (comp.category_scores[category as FeatureCategory]) {
            competitorTotal += comp.category_scores[category as FeatureCategory];
            competitorCount++;
          }
        });
        
        const competitorAvg = competitorCount > 0 ? competitorTotal / competitorCount : 0;
        const gap = mlScore - competitorAvg;
        
        categoryGaps.push({
          category: category as FeatureCategory,
          advantage_score: gap > 0 ? gap : 0,
          gap_score: gap < 0 ? Math.abs(gap) : 0
        });
      });
      
      // Sort for strongest and weakest
      const strongestCategories = [...categoryGaps]
        .filter(c => c.advantage_score > 0)
        .sort((a, b) => b.advantage_score - a.advantage_score)
        .slice(0, 3)
        .map(c => ({
          category: c.category,
          advantage_score: c.advantage_score
        }));
      
      const weakestCategories = [...categoryGaps]
        .filter(c => c.gap_score > 0)
        .sort((a, b) => b.gap_score - a.gap_score)
        .slice(0, 3)
        .map(c => ({
          category: c.category,
          gap_score: c.gap_score
        }));
      
      return {
        mercadolivre: {
          name: 'MercadoLivre',
          overall_score: mercadolivreOverallScore,
          category_scores: mercadolivreCategoryScores
        },
        competitors: competitorScores,
        strongest_categories: strongestCategories,
        weakest_categories: weakestCategories,
        generated_at: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error generating competitive position', { error, competitorIds });
      throw error;
    }
  }

  // Event handlers
  private handleCompetitorAdded(data: { competitorId: CompetitorID, name: string }): void {
    logger.info('Competitor added', { competitorId: data.competitorId, name: data.name });
    
    // Notify via WebSocket if available
    if (this.websocketService) {
      this.websocketService.broadcast('competitor:added', {
        competitorId: data.competitorId,
        name: data.name,
        timestamp: new Date().toISOString()
      });
    }
  }

  private handleCompetitorUpdated(data: { competitorId: CompetitorID }): void {
    logger.info('Competitor updated', { competitorId: data.competitorId });
    
    // Notify via WebSocket if available
    if (this.websocketService) {
      this.websocketService.broadcast('competitor:updated', {
        competitorId: data.competitorId,
        timestamp: new Date().toISOString()
      });
    }
  }

  private handleFeatureComparisonAdded(data: { 
    featureId: string;
    competitorId: string;
    category: string;
    isGap: boolean;
    isAdvantage: boolean;
  }): void {
    logger.info('Feature comparison added', { 
      featureId: data.featureId,
      competitorId: data.competitorId,
      category: data.category,
      isGap: data.isGap,
      isAdvantage: data.isAdvantage
    });
    
    // Notify via WebSocket if available
    if (this.websocketService) {
      this.websocketService.broadcast('feature:added', {
        featureId: data.featureId,
        competitorId: data.competitorId,
        category: data.category,
        isGap: data.isGap,
        isAdvantage: data.isAdvantage,
        timestamp: new Date().toISOString()
      });
    }
  }

  private handleBenchmarkReportCreated(data: { 
    benchmarkId: string;
    title: string;
    competitors: number;
  }): void {
    logger.info('Benchmark report created', { 
      benchmarkId: data.benchmarkId,
      title: data.title,
      competitors: data.competitors
    });
    
    // Notify via WebSocket if available
    if (this.websocketService) {
      this.websocketService.broadcast('benchmark:created', {
        benchmarkId: data.benchmarkId,
        title: data.title,
        competitors: data.competitors,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Helper methods
  private analyzeBenchmarkData(
    features: FeatureComparison[],
    competitors: Competitor[],
    request: BenchmarkRequest
  ): Omit<BenchmarkReport, 'benchmark_id' | 'created_at'> {
    // Prepare base data
    const title = request.title || `Competitive Benchmark: ${competitors.map(c => c.name).join(' vs. ')}`;
    const competitorIds = competitors.map(c => c.competitor_id!);
    const departmentList = request.departments || ['product', 'engineering', 'marketing', 'ux_ui', 'technology'];
    
    // Group features by category
    const featuresByCategory: Record<string, FeatureComparison[]> = {};
    
    features.forEach(f => {
      if (!featuresByCategory[f.category]) {
        featuresByCategory[f.category] = [];
      }
      featuresByCategory[f.category].push(f);
    });
    
    // Calculate category scores
    const categoryScores: Record<string, number> = {};
    let overallScore = 0;
    let totalFeatures = 0;
    
    Object.entries(featuresByCategory).forEach(([category, catFeatures]) => {
      let mercadolivreTotal = 0;
      let ratedCount = 0;
      
      catFeatures.forEach(f => {
        if (f.mercadolivre_rating !== undefined) {
          mercadolivreTotal += f.mercadolivre_rating;
          ratedCount++;
        }
      });
      
      const avgScore = ratedCount > 0 ? mercadolivreTotal / ratedCount : 0;
      categoryScores[category] = avgScore;
      
      overallScore += mercadolivreTotal;
      totalFeatures += ratedCount;
    });
    
    overallScore = totalFeatures > 0 ? overallScore / totalFeatures : 0;
    
    // Identify strengths and weaknesses
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    
    features.forEach(f => {
      if (f.is_competitive_advantage) {
        const diff = (f.mercadolivre_rating || 0) - f.competitor_rating;
        if (diff >= 2) { // Significant advantage
          strengths.push(`Strong ${f.category} capabilities in ${f.feature_name}`);
        }
      }
      
      if (f.is_gap) {
        const diff = f.competitor_rating - (f.mercadolivre_rating || 0);
        if (diff >= 2) { // Significant gap
          weaknesses.push(`${f.category} gap in ${f.feature_name} compared to competitors`);
        }
      }
    });
    
    // Deduplicate and limit
    const uniqueStrengths = [...new Set(strengths)].slice(0, 10);
    const uniqueWeaknesses = [...new Set(weaknesses)].slice(0, 10);
    
    // Generate opportunities and threats
    const opportunities: string[] = [];
    const threats: string[] = [];
    
    uniqueWeaknesses.forEach(w => {
      // Convert weaknesses to opportunities
      const category = w.split(' ')[0].toLowerCase();
      opportunities.push(`Improve ${category} capabilities to close competitive gaps`);
    });
    
    // Find major gaps as threats
    const majorGaps = features
      .filter(f => f.is_gap && f.mercadolivre_rating !== undefined && (f.competitor_rating - f.mercadolivre_rating) >= 3)
      .map(f => `Competitor advantage in ${f.feature_name} (${f.category})`);
    
    threats.push(...majorGaps.slice(0, 5));
    
    // Add market threats
    threats.push('Market share risk in areas with significant feature gaps');
    threats.push('Customer migration to competitors with superior features');
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(features, departmentList as DepartmentType[]);
    
    // Create summary
    const summary = `This benchmark report compares MercadoLivre against ${competitors.length} competitors (${competitors.map(c => c.name).join(', ')}). The analysis covers ${features.length} features across ${Object.keys(featuresByCategory).length} categories. MercadoLivre's overall competitive score is ${overallScore.toFixed(1)}/10. Key strengths include ${uniqueStrengths.slice(0, 3).join(', ')}. Major improvement areas include ${uniqueWeaknesses.slice(0, 3).join(', ')}.`;
    
    // Create report
    return {
      title,
      competitors: competitorIds,
      departments: departmentList,
      summary,
      strengths: uniqueStrengths,
      weaknesses: uniqueWeaknesses,
      opportunities,
      threats,
      category_scores: categoryScores,
      overall_score: overallScore,
      recommendations,
      report_period: {
        start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
        end_date: new Date().toISOString()
      },
      status: 'draft'
    };
  }

  private createMinimalBenchmarkReport(
    request: BenchmarkRequest,
    competitors: Competitor[]
  ): Promise<BenchmarkReport> {
    // Create a minimal report when no feature data is available
    const title = request.title || `Competitive Benchmark: ${competitors.map(c => c.name).join(' vs. ')}`;
    const competitorIds = competitors.map(c => c.competitor_id!);
    const departmentList = request.departments || ['product', 'engineering', 'marketing', 'ux_ui', 'technology'];
    
    const categoryScores: Record<string, number> = {};
    request.categories?.forEach(c => {
      categoryScores[c] = 5; // Neutral score
    });
    
    if (!request.categories || request.categories.length === 0) {
      // Default categories
      ['product_discovery', 'search', 'navigation', 'product_detail', 'checkout'].forEach(c => {
        categoryScores[c] = 5;
      });
    }
    
    const report: Omit<BenchmarkReport, 'benchmark_id' | 'created_at'> = {
      title,
      competitors: competitorIds,
      departments: departmentList,
      summary: `Initial benchmark report for ${competitors.map(c => c.name).join(', ')}. No feature comparison data is available yet. This report serves as a placeholder until detailed competitive analysis is performed.`,
      strengths: ['To be determined through feature analysis'],
      weaknesses: ['To be determined through feature analysis'],
      opportunities: [
        'Conduct detailed competitive analysis',
        'Identify feature gaps through user research',
        'Analyze competitor strengths to inform product roadmap'
      ],
      threats: [
        'Unknown competitive position due to lack of data',
        'Potential unidentified feature gaps',
        'Market trends not currently being tracked'
      ],
      category_scores: categoryScores,
      overall_score: 5, // Neutral score
      recommendations: [
        {
          title: 'Conduct Competitive Feature Analysis',
          description: 'Perform detailed feature comparison across all competitors',
          priority: 'high',
          department: 'product',
          estimated_effort: '2-3 weeks'
        },
        {
          title: 'Implement Competitive Monitoring',
          description: 'Set up regular competitive analysis process',
          priority: 'medium',
          department: 'marketing',
          estimated_effort: '1-2 weeks'
        }
      ],
      report_period: {
        start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
        end_date: new Date().toISOString()
      },
      status: 'draft'
    };
    
    return this.createBenchmarkReport(report);
  }

  private generateRecommendations(
    features: FeatureComparison[],
    departments: DepartmentType[]
  ): Array<{
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    department: string;
    estimated_effort?: string;
  }> {
    const recommendations: Array<{
      title: string;
      description: string;
      priority: 'low' | 'medium' | 'high' | 'critical';
      department: string;
      estimated_effort?: string;
    }> = [];
    
    // Find major gaps and group by category
    const gapsByCategory: Record<string, FeatureComparison[]> = {};
    
    features
      .filter(f => f.is_gap && f.mercadolivre_rating !== undefined)
      .forEach(f => {
        if (!gapsByCategory[f.category]) {
          gapsByCategory[f.category] = [];
        }
        gapsByCategory[f.category].push(f);
      });
    
    // Generate category-specific recommendations
    Object.entries(gapsByCategory).forEach(([category, gaps]) => {
      // Sort by gap size
      gaps.sort((a, b) => {
        const aGap = a.competitor_rating - (a.mercadolivre_rating || 0);
        const bGap = b.competitor_rating - (b.mercadolivre_rating || 0);
        return bGap - aGap;
      });
      
      if (gaps.length === 0) return;
      
      // Calculate average gap size
      const avgGap = gaps.reduce((sum, g) => sum + (g.competitor_rating - (g.mercadolivre_rating || 0)), 0) / gaps.length;
      
      // Determine priority
      let priority: 'low' | 'medium' | 'high' | 'critical';
      if (avgGap >= 3) priority = 'critical';
      else if (avgGap >= 2) priority = 'high';
      else if (avgGap >= 1) priority = 'medium';
      else priority = 'low';
      
      // Determine department
      let department: string;
      switch (category) {
        case 'product_discovery':
        case 'product_detail':
        case 'search':
          department = 'product';
          break;
        case 'navigation':
        case 'checkout':
        case 'mobile_experience':
          department = 'ux_ui';
          break;
        case 'pricing':
        case 'promotions':
        case 'loyalty':
          department = 'marketing';
          break;
        case 'shipping':
        case 'returns':
          department = 'operations';
          break;
        case 'payment':
        case 'security':
          department = 'engineering';
          break;
        case 'personalization':
          department = 'technology';
          break;
        default:
          department = departments[Math.floor(Math.random() * departments.length)];
      }
      
      // Create recommendation
      const topFeatures = gaps.slice(0, 3).map(g => g.feature_name).join(', ');
      
      let title = `Improve ${category.replace('_', ' ')} capabilities`;
      let description = `Address competitive gaps in ${category.replace('_', ' ')} features, particularly ${topFeatures}`;
      
      if (gaps.length === 1) {
        title = `Implement ${gaps[0].feature_name} in ${category.replace('_', ' ')}`;
        description = `Close competitive gap in ${gaps[0].feature_name} where competitors rate ${gaps[0].competitor_rating}/10 vs our ${gaps[0].mercadolivre_rating}/10`;
      }
      
      // Estimate effort
      let estimated_effort: string;
      if (avgGap >= 3) estimated_effort = '3-6 months';
      else if (avgGap >= 2) estimated_effort = '2-3 months';
      else estimated_effort = '1-2 months';
      
      recommendations.push({
        title,
        description,
        priority,
        department,
        estimated_effort
      });
    });
    
    // Ensure we have recommendations for multiple departments
    const departmentsWithRecs = new Set(recommendations.map(r => r.department));
    
    // If we don't have enough departments covered, add some general recommendations
    if (departmentsWithRecs.size < Math.min(3, departments.length)) {
      for (const dept of departments) {
        if (!departmentsWithRecs.has(dept)) {
          let rec;
          
          switch (dept) {
            case 'product':
              rec = {
                title: 'Conduct Product Feature Gap Analysis',
                description: 'Perform detailed analysis of product features compared to competitors to identify improvement opportunities',
                priority: 'medium',
                department: dept,
                estimated_effort: '1-2 months'
              };
              break;
            case 'engineering':
              rec = {
                title: 'Improve Technical Performance',
                description: 'Address performance gaps in page load times and transaction processing compared to competitors',
                priority: 'medium',
                department: dept,
                estimated_effort: '2-3 months'
              };
              break;
            case 'marketing':
              rec = {
                title: 'Enhance Value Proposition Messaging',
                description: 'Clarify and strengthen competitive messaging based on identified strengths',
                priority: 'medium',
                department: dept,
                estimated_effort: '1 month'
              };
              break;
            case 'ux_ui':
              rec = {
                title: 'Streamline User Journeys',
                description: 'Simplify critical user flows based on competitive analysis of friction points',
                priority: 'high',
                department: dept,
                estimated_effort: '2-3 months'
              };
              break;
            default:
              rec = {
                title: `Improve ${dept.replace('_', ' ')} Capabilities`,
                description: `Address competitive gaps in ${dept.replace('_', ' ')} through targeted improvements`,
                priority: 'medium',
                department: dept,
                estimated_effort: '1-3 months'
              };
          }
          
          recommendations.push(rec);
          departmentsWithRecs.add(dept);
          
          // Stop after adding 3 general recommendations
          if (departmentsWithRecs.size >= Math.min(3, departments.length)) {
            break;
          }
        }
      }
    }
    
    return recommendations;
  }
}

// Create and export service instance
export const competitorBenchmarkService = new CompetitorBenchmarkService(new EventBus());
export default competitorBenchmarkService;