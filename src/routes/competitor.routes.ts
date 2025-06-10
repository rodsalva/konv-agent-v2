import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { logger } from '@/utils/logger';
import { competitorBenchmarkService } from '@/services/competitor-benchmark';
import { agentAuthMiddleware } from '@/middleware/auth.middleware';
import {
  CompetitorSchema,
  FeatureComparisonSchema,
  BenchmarkRequestSchema,
  CompetitorID,
  BenchmarkID,
  FeatureCategorySchema
} from '@/types/competitor.types';

const router = Router();

/**
 * @route   GET /api/v1/competitors
 * @desc    Get all competitors
 * @access  Authenticated
 */
router.get('/', agentAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const competitors = await competitorBenchmarkService.getCompetitors();

    res.json({
      success: true,
      data: competitors,
      total: competitors.length,
      correlationId: req.correlationId
    });
  } catch (error) {
    logger.error('Failed to get competitors', { error, correlationId: req.correlationId });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve competitors',
      correlationId: req.correlationId
    });
  }
});

/**
 * @route   GET /api/v1/competitors/:id
 * @desc    Get a single competitor by ID
 * @access  Authenticated
 */
router.get('/:id', agentAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const competitors = await competitorBenchmarkService.getCompetitors(id as CompetitorID);
    
    if (competitors.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Competitor not found',
        correlationId: req.correlationId
      });
    }
    
    res.json({
      success: true,
      data: competitors[0],
      correlationId: req.correlationId
    });
  } catch (error) {
    logger.error('Failed to get competitor', { error, id: req.params.id, correlationId: req.correlationId });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve competitor',
      correlationId: req.correlationId
    });
  }
});

/**
 * @route   POST /api/v1/competitors
 * @desc    Create a new competitor
 * @access  Authenticated
 */
router.post('/', agentAuthMiddleware, async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validationResult = CompetitorSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationResult.error.format(),
        correlationId: req.correlationId
      });
    }
    
    const competitor = await competitorBenchmarkService.addCompetitor(validationResult.data);
    
    res.status(201).json({
      success: true,
      data: competitor,
      message: 'Competitor added successfully',
      correlationId: req.correlationId
    });
  } catch (error) {
    logger.error('Failed to create competitor', { error, correlationId: req.correlationId });
    res.status(500).json({
      success: false,
      error: 'Failed to create competitor',
      correlationId: req.correlationId
    });
  }
});

/**
 * @route   PUT /api/v1/competitors/:id
 * @desc    Update a competitor
 * @access  Authenticated
 */
router.put('/:id', agentAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validate request body
    const validationResult = CompetitorSchema.partial().safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationResult.error.format(),
        correlationId: req.correlationId
      });
    }
    
    const competitor = await competitorBenchmarkService.updateCompetitor(id as CompetitorID, validationResult.data);
    
    res.json({
      success: true,
      data: competitor,
      message: 'Competitor updated successfully',
      correlationId: req.correlationId
    });
  } catch (error) {
    logger.error('Failed to update competitor', { error, id: req.params.id, correlationId: req.correlationId });
    res.status(500).json({
      success: false,
      error: 'Failed to update competitor',
      correlationId: req.correlationId
    });
  }
});

/**
 * @route   GET /api/v1/competitors/:id/overview
 * @desc    Get competitor overview with analysis
 * @access  Authenticated
 */
router.get('/:id/overview', agentAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const overview = await competitorBenchmarkService.getCompetitorOverview(id as CompetitorID);
    
    res.json({
      success: true,
      data: overview,
      correlationId: req.correlationId
    });
  } catch (error) {
    logger.error('Failed to get competitor overview', { error, id: req.params.id, correlationId: req.correlationId });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve competitor overview',
      correlationId: req.correlationId
    });
  }
});

/**
 * @route   GET /api/v1/competitors/analysis/position
 * @desc    Get competitive position analysis
 * @access  Authenticated
 */
router.get('/analysis/position', agentAuthMiddleware, async (req: Request, res: Response) => {
  try {
    // Get competitor IDs from query
    const { competitors } = req.query;
    
    // Parse competitors
    let competitorIds: CompetitorID[] = [];
    
    if (competitors) {
      if (Array.isArray(competitors)) {
        competitorIds = competitors as CompetitorID[];
      } else {
        competitorIds = [competitors as CompetitorID];
      }
    } else {
      // If no competitors specified, get all
      const allCompetitors = await competitorBenchmarkService.getCompetitors();
      competitorIds = allCompetitors.map(c => c.competitor_id as CompetitorID);
    }
    
    // Get position analysis
    const analysis = await competitorBenchmarkService.getCompetitivePosition(competitorIds);
    
    res.json({
      success: true,
      data: analysis,
      correlationId: req.correlationId
    });
  } catch (error) {
    logger.error('Failed to get competitive position', { error, correlationId: req.correlationId });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve competitive position analysis',
      correlationId: req.correlationId
    });
  }
});

/**
 * @route   POST /api/v1/competitors/:id/features
 * @desc    Add feature comparison for a competitor
 * @access  Authenticated
 */
router.post('/:id/features', agentAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validate request body
    const validationResult = FeatureComparisonSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationResult.error.format(),
        correlationId: req.correlationId
      });
    }
    
    // Add competitor_id to feature data
    const featureData = {
      ...validationResult.data,
      competitor_id: id
    };
    
    const feature = await competitorBenchmarkService.addFeatureComparison(featureData);
    
    res.status(201).json({
      success: true,
      data: feature,
      message: 'Feature comparison added successfully',
      correlationId: req.correlationId
    });
  } catch (error) {
    logger.error('Failed to add feature comparison', { error, id: req.params.id, correlationId: req.correlationId });
    res.status(500).json({
      success: false,
      error: 'Failed to add feature comparison',
      correlationId: req.correlationId
    });
  }
});

/**
 * @route   GET /api/v1/competitors/:id/features
 * @desc    Get feature comparisons for a competitor
 * @access  Authenticated
 */
router.get('/:id/features', agentAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { category, is_gap, is_advantage } = req.query;
    
    // Parse query parameters
    const filters: {
      competitor_id: string;
      category?: string;
      is_gap?: boolean;
      is_advantage?: boolean;
    } = {
      competitor_id: id
    };
    
    if (category) {
      // Validate category
      const categoryResult = FeatureCategorySchema.safeParse(category);
      if (categoryResult.success) {
        filters.category = categoryResult.data;
      }
    }
    
    if (is_gap !== undefined) {
      filters.is_gap = is_gap === 'true';
    }
    
    if (is_advantage !== undefined) {
      filters.is_advantage = is_advantage === 'true';
    }
    
    const features = await competitorBenchmarkService.getFeatureComparisons(filters);
    
    res.json({
      success: true,
      data: features,
      total: features.length,
      correlationId: req.correlationId
    });
  } catch (error) {
    logger.error('Failed to get feature comparisons', { error, id: req.params.id, correlationId: req.correlationId });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve feature comparisons',
      correlationId: req.correlationId
    });
  }
});

/**
 * @route   POST /api/v1/competitors/benchmark
 * @desc    Generate a benchmark report
 * @access  Authenticated
 */
router.post('/benchmark', agentAuthMiddleware, async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validationResult = BenchmarkRequestSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationResult.error.format(),
        correlationId: req.correlationId
      });
    }
    
    const report = await competitorBenchmarkService.generateBenchmarkReport(validationResult.data);
    
    res.status(201).json({
      success: true,
      data: report,
      message: 'Benchmark report generated successfully',
      correlationId: req.correlationId
    });
  } catch (error) {
    logger.error('Failed to generate benchmark report', { error, correlationId: req.correlationId });
    res.status(500).json({
      success: false,
      error: 'Failed to generate benchmark report',
      correlationId: req.correlationId
    });
  }
});

/**
 * @route   GET /api/v1/competitors/benchmark/reports
 * @desc    Get all benchmark reports
 * @access  Authenticated
 */
router.get('/benchmark/reports', agentAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    
    const reports = await competitorBenchmarkService.getBenchmarkReports(status as string);
    
    res.json({
      success: true,
      data: reports,
      total: reports.length,
      correlationId: req.correlationId
    });
  } catch (error) {
    logger.error('Failed to get benchmark reports', { error, correlationId: req.correlationId });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve benchmark reports',
      correlationId: req.correlationId
    });
  }
});

/**
 * @route   GET /api/v1/competitors/benchmark/reports/:id
 * @desc    Get a benchmark report by ID
 * @access  Authenticated
 */
router.get('/benchmark/reports/:id', agentAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const reports = await competitorBenchmarkService.getBenchmarkReports();
    const report = reports.find(r => r.benchmark_id === id);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Benchmark report not found',
        correlationId: req.correlationId
      });
    }
    
    res.json({
      success: true,
      data: report,
      correlationId: req.correlationId
    });
  } catch (error) {
    logger.error('Failed to get benchmark report', { error, id: req.params.id, correlationId: req.correlationId });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve benchmark report',
      correlationId: req.correlationId
    });
  }
});

/**
 * @route   GET /api/v1/competitors/benchmark/visualization
 * @desc    Get HTML visualization for competitive benchmarking
 * @access  Authenticated
 */
router.get('/benchmark/visualization', agentAuthMiddleware, async (req: Request, res: Response) => {
  try {
    // Generate data for visualization
    const allCompetitors = await competitorBenchmarkService.getCompetitors();
    
    if (allCompetitors.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No competitors found',
        correlationId: req.correlationId
      });
    }
    
    // Get competitive position for all competitors
    const competitorIds = allCompetitors.map(c => c.competitor_id as CompetitorID);
    const positionAnalysis = await competitorBenchmarkService.getCompetitivePosition(competitorIds);
    
    // Get recent benchmark reports
    const benchmarkReports = await competitorBenchmarkService.getBenchmarkReports('published');
    
    // Generate HTML visualization
    const html = generateBenchmarkVisualization(allCompetitors, positionAnalysis, benchmarkReports.slice(0, 3));
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    logger.error('Failed to generate benchmark visualization', { error, correlationId: req.correlationId });
    res.status(500).send('<h1>Error generating benchmark visualization</h1><p>An error occurred while generating the visualization.</p>');
  }
});

/**
 * Generate HTML visualization for competitive benchmarking
 */
function generateBenchmarkVisualization(
  competitors: any[],
  positionAnalysis: any,
  reports: any[]
): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MercadoLivre Competitive Benchmarking</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            min-height: 100vh;
            padding: 20px;
            line-height: 1.6;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
            padding: 30px;
            text-align: center;
            color: white;
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            font-weight: 700;
        }
        
        .header p {
            font-size: 1.2em;
            opacity: 0.9;
        }
        
        .stats {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin-top: 20px;
        }
        
        .stat {
            background: rgba(255,255,255,0.2);
            padding: 15px 25px;
            border-radius: 10px;
            text-align: center;
        }
        
        .stat-number {
            font-size: 2em;
            font-weight: bold;
            display: block;
        }
        
        .stat-label {
            font-size: 0.9em;
            opacity: 0.8;
        }
        
        .main-content {
            padding: 30px;
        }
        
        .section {
            margin-bottom: 40px;
            padding: 30px;
            background: #f8f9fa;
            border-radius: 15px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.05);
        }
        
        .section h2 {
            color: #0056b3;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 3px solid #e9ecef;
        }
        
        .card-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        
        .card {
            background: white;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
            padding: 20px;
            transition: transform 0.3s ease;
        }
        
        .card:hover {
            transform: translateY(-5px);
        }
        
        .card h3 {
            color: #343a40;
            margin-bottom: 10px;
            font-size: 1.25em;
        }
        
        .card-meta {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .card-logo {
            width: 40px;
            height: 40px;
            border-radius: 5px;
            margin-right: 10px;
            background: #f1f3f5;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: #495057;
        }
        
        .card-detail {
            display: flex;
            justify-content: space-between;
            margin-top: 5px;
            font-size: 0.9em;
            color: #6c757d;
        }
        
        .tag {
            display: inline-block;
            background: #e9ecef;
            color: #495057;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8em;
            margin-right: 5px;
            margin-bottom: 5px;
        }
        
        .score {
            display: flex;
            align-items: center;
            margin: 15px 0;
        }
        
        .score-label {
            width: 120px;
            font-size: 0.9em;
            color: #495057;
        }
        
        .score-bar {
            flex-grow: 1;
            height: 8px;
            background: #e9ecef;
            border-radius: 4px;
            overflow: hidden;
            position: relative;
        }
        
        .score-fill {
            height: 100%;
            border-radius: 4px;
            transition: width 1s ease;
        }
        
        .ml-score {
            background: #007bff;
        }
        
        .competitor-score {
            background: #6c757d;
        }
        
        .score-number {
            margin-left: 10px;
            font-weight: bold;
            width: 30px;
            text-align: right;
        }
        
        .advantage {
            color: #28a745;
            margin-left: 10px;
        }
        
        .gap {
            color: #dc3545;
            margin-left: 10px;
        }
        
        .report-section {
            padding: 20px;
            border: 1px solid #e9ecef;
            border-radius: 10px;
            margin-bottom: 20px;
        }
        
        .report-section h3 {
            margin-bottom: 15px;
            color: #0056b3;
        }
        
        .report-meta {
            display: flex;
            justify-content: space-between;
            font-size: 0.9em;
            color: #6c757d;
            margin-bottom: 15px;
        }
        
        .insight-list {
            list-style: none;
        }
        
        .insight-list li {
            padding: 10px 0;
            border-bottom: 1px solid #f1f3f5;
        }
        
        .insight-list li:last-child {
            border-bottom: none;
        }
        
        .recommendation {
            background: #e9f7fe;
            border-left: 4px solid #007bff;
            padding: 15px;
            margin-bottom: 10px;
            border-radius: 5px;
        }
        
        .recommendation h4 {
            color: #0056b3;
            margin-bottom: 5px;
        }
        
        .recommendation-meta {
            display: flex;
            font-size: 0.8em;
            color: #6c757d;
            margin-top: 10px;
        }
        
        .recommendation-meta span {
            margin-right: 15px;
        }
        
        .high-priority {
            color: #dc3545;
            font-weight: bold;
        }
        
        .medium-priority {
            color: #fd7e14;
        }
        
        .low-priority {
            color: #28a745;
        }
        
        .footer {
            background: #343a40;
            color: white;
            text-align: center;
            padding: 20px;
            font-size: 0.9em;
        }
        
        @media (max-width: 768px) {
            .stats {
                flex-direction: column;
                gap: 10px;
            }
            
            .card-grid {
                grid-template-columns: 1fr;
            }
            
            .main-content {
                padding: 15px;
            }
            
            .section {
                padding: 15px;
                margin-bottom: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏆 MercadoLivre Competitive Benchmarking</h1>
            <p>Strategic Competitive Analysis Dashboard</p>
            <div class="stats">
                <div class="stat">
                    <span class="stat-number">${competitors.length}</span>
                    <span class="stat-label">Competitors Analyzed</span>
                </div>
                <div class="stat">
                    <span class="stat-number">${positionAnalysis.strongest_categories.length + positionAnalysis.weakest_categories.length}</span>
                    <span class="stat-label">Key Categories</span>
                </div>
                <div class="stat">
                    <span class="stat-number">${positionAnalysis.mercadolivre.overall_score.toFixed(1)}/10</span>
                    <span class="stat-label">Overall Score</span>
                </div>
            </div>
        </div>
        
        <div class="main-content">
            <div class="section">
                <h2>📊 Competitive Position</h2>
                <p>How MercadoLivre compares against major competitors across key categories.</p>
                
                <div class="report-section">
                    <h3>MercadoLivre Strengths</h3>
                    <div class="insight-list">
                        ${positionAnalysis.strongest_categories.map(category => `
                            <div class="score">
                                <div class="score-label">${category.category.replace(/_/g, ' ')}</div>
                                <div class="score-bar">
                                    <div class="score-fill ml-score" style="width: ${positionAnalysis.mercadolivre.category_scores[category.category] * 10}%;"></div>
                                </div>
                                <div class="score-number">${positionAnalysis.mercadolivre.category_scores[category.category].toFixed(1)}</div>
                                <div class="advantage">+${category.advantage_score.toFixed(1)}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="report-section">
                    <h3>Improvement Opportunities</h3>
                    <div class="insight-list">
                        ${positionAnalysis.weakest_categories.map(category => `
                            <div class="score">
                                <div class="score-label">${category.category.replace(/_/g, ' ')}</div>
                                <div class="score-bar">
                                    <div class="score-fill ml-score" style="width: ${positionAnalysis.mercadolivre.category_scores[category.category] * 10}%;"></div>
                                </div>
                                <div class="score-number">${positionAnalysis.mercadolivre.category_scores[category.category].toFixed(1)}</div>
                                <div class="gap">-${category.gap_score.toFixed(1)}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2>🏢 Competitor Analysis</h2>
                <p>Overview of key competitors in the marketplace.</p>
                
                <div class="card-grid">
                    ${competitors.map(competitor => `
                        <div class="card">
                            <div class="card-meta">
                                <div class="card-logo">${competitor.name.substring(0, 2).toUpperCase()}</div>
                                <div>
                                    <h3>${competitor.name}</h3>
                                    <div>${competitor.primary_market}</div>
                                </div>
                            </div>
                            <p>${competitor.description || 'E-commerce competitor with presence in Latin America.'}</p>
                            <div style="margin-top: 15px;">
                                ${competitor.tags ? competitor.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : ''}
                                ${competitor.company_size ? `<span class="tag">${competitor.company_size} company</span>` : ''}
                            </div>
                            ${positionAnalysis.competitors.find(c => c.competitor_id === competitor.competitor_id) ? `
                                <div style="margin-top: 20px;">
                                    <div class="card-detail">
                                        <span>Overall Score:</span>
                                        <span><strong>${positionAnalysis.competitors.find(c => c.competitor_id === competitor.competitor_id).overall_score.toFixed(1)}/10</strong></span>
                                    </div>
                                    <div class="card-detail">
                                        <span>Top Category:</span>
                                        <span>
                                            ${Object.entries(positionAnalysis.competitors.find(c => c.competitor_id === competitor.competitor_id).category_scores)
                                                .sort((a, b) => b[1] - a[1])
                                                .slice(0, 1)
                                                .map(([category, score]) => `${category.replace(/_/g, ' ')} (${Number(score).toFixed(1)})`)
                                                .join('')}
                                        </span>
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
            
            ${reports.length > 0 ? `
                <div class="section">
                    <h2>📑 Recent Benchmark Reports</h2>
                    <p>Key insights from recent competitive analysis reports.</p>
                    
                    ${reports.map(report => `
                        <div class="report-section">
                            <h3>${report.title}</h3>
                            <div class="report-meta">
                                <span>Generated: ${new Date(report.created_at).toLocaleDateString()}</span>
                                <span>Status: ${report.status}</span>
                                <span>Score: ${report.overall_score.toFixed(1)}/10</span>
                            </div>
                            
                            <div style="margin-bottom: 20px;">
                                <h4 style="margin-bottom: 10px; color: #28a745;">Strengths:</h4>
                                <ul class="insight-list">
                                    ${report.strengths.slice(0, 3).map(strength => `<li>${strength}</li>`).join('')}
                                </ul>
                            </div>
                            
                            <div style="margin-bottom: 20px;">
                                <h4 style="margin-bottom: 10px; color: #dc3545;">Weaknesses:</h4>
                                <ul class="insight-list">
                                    ${report.weaknesses.slice(0, 3).map(weakness => `<li>${weakness}</li>`).join('')}
                                </ul>
                            </div>
                            
                            <div>
                                <h4 style="margin-bottom: 10px; color: #0056b3;">Top Recommendations:</h4>
                                ${report.recommendations.slice(0, 3).map(rec => `
                                    <div class="recommendation">
                                        <h4>${rec.title}</h4>
                                        <p>${rec.description}</p>
                                        <div class="recommendation-meta">
                                            <span class="${rec.priority}-priority">Priority: ${rec.priority}</span>
                                            <span>Department: ${rec.department}</span>
                                            ${rec.estimated_effort ? `<span>Effort: ${rec.estimated_effort}</span>` : ''}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        </div>
        
        <div class="footer">
            Generated by MercadoLivre Competitive Intelligence Platform | ${new Date().toLocaleString()}
        </div>
    </div>
</body>
</html>
  `;
}

export default router;