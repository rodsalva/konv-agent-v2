import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { logger } from '@/utils/logger';
import { sentimentAnalysisService } from '@/services/sentiment-analysis';
import { agentAuthMiddleware } from '@/middleware/auth.middleware';
import {
  SentimentAnalysisID,
  SentimentTrendID,
  SentimentAnalysisRequestSchema,
  SentimentTrendRequestSchema,
  SentimentCategory,
  FeedbackSourceType
} from '@/types/sentiment.types';

const router = Router();

/**
 * @route   POST /api/v1/sentiment/analyze
 * @desc    Analyze sentiment for feedback
 * @access  Authenticated
 */
router.post('/analyze', agentAuthMiddleware, async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validationResult = SentimentAnalysisRequestSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationResult.error.format(),
        correlationId: req.correlationId
      });
    }
    
    const analysis = await sentimentAnalysisService.analyzeSentiment(validationResult.data);
    
    res.status(201).json({
      success: true,
      data: analysis,
      correlationId: req.correlationId
    });
  } catch (error) {
    logger.error('Failed to analyze sentiment', { error, correlationId: req.correlationId });
    res.status(500).json({
      success: false,
      error: 'Failed to analyze sentiment',
      correlationId: req.correlationId
    });
  }
});

/**
 * @route   POST /api/v1/sentiment/trends
 * @desc    Generate sentiment trend for a period
 * @access  Authenticated
 */
router.post('/trends', agentAuthMiddleware, async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validationResult = SentimentTrendRequestSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationResult.error.format(),
        correlationId: req.correlationId
      });
    }
    
    const trend = await sentimentAnalysisService.generateSentimentTrend(validationResult.data);
    
    res.status(201).json({
      success: true,
      data: trend,
      correlationId: req.correlationId
    });
  } catch (error) {
    logger.error('Failed to generate sentiment trend', { error, correlationId: req.correlationId });
    res.status(500).json({
      success: false,
      error: 'Failed to generate sentiment trend',
      correlationId: req.correlationId
    });
  }
});

/**
 * @route   GET /api/v1/sentiment/insights
 * @desc    Get sentiment insights with optional filtering
 * @access  Authenticated
 */
router.get('/insights', agentAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { priority, categories, insight_type, period_start, period_end, limit } = req.query;
    
    // Parse categories
    let parsedCategories: SentimentCategory[] | undefined;
    if (categories) {
      if (Array.isArray(categories)) {
        parsedCategories = categories as SentimentCategory[];
      } else {
        parsedCategories = [categories as SentimentCategory];
      }
    }
    
    // Parse limit
    const parsedLimit = limit ? parseInt(limit as string, 10) : undefined;
    
    const insights = await sentimentAnalysisService.getSentimentInsights({
      priority: priority as string,
      categories: parsedCategories,
      insight_type: insight_type as string,
      period_start: period_start as string,
      period_end: period_end as string,
      limit: parsedLimit
    });
    
    res.json({
      success: true,
      data: insights,
      total: insights.length,
      correlationId: req.correlationId
    });
  } catch (error) {
    logger.error('Failed to get sentiment insights', { error, correlationId: req.correlationId });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve sentiment insights',
      correlationId: req.correlationId
    });
  }
});

/**
 * @route   GET /api/v1/sentiment/dashboard
 * @desc    Get sentiment dashboard data
 * @access  Authenticated
 */
router.get('/dashboard', agentAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { period_days } = req.query;
    
    // Parse period_days
    const parsedPeriodDays = period_days ? parseInt(period_days as string, 10) : 30;
    
    const dashboardData = await sentimentAnalysisService.getDashboardData(parsedPeriodDays);
    
    res.json({
      success: true,
      data: dashboardData,
      correlationId: req.correlationId
    });
  } catch (error) {
    logger.error('Failed to get sentiment dashboard data', { error, correlationId: req.correlationId });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve sentiment dashboard data',
      correlationId: req.correlationId
    });
  }
});

/**
 * @route   GET /api/v1/sentiment/dashboard/view
 * @desc    Get HTML visualization for sentiment dashboard
 * @access  Authenticated
 */
router.get('/dashboard/view', agentAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { period_days } = req.query;
    
    // Parse period_days
    const parsedPeriodDays = period_days ? parseInt(period_days as string, 10) : 30;
    
    // Get dashboard data
    const dashboardData = await sentimentAnalysisService.getDashboardData(parsedPeriodDays);
    
    // Generate HTML
    const html = generateSentimentDashboard(dashboardData, parsedPeriodDays);
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    logger.error('Failed to generate sentiment dashboard', { error, correlationId: req.correlationId });
    res.status(500).send('<h1>Error generating sentiment dashboard</h1><p>An error occurred while generating the dashboard.</p>');
  }
});

/**
 * Generate HTML dashboard for sentiment visualization
 */
function generateSentimentDashboard(dashboardData: any, periodDays: number): string {
  // Get sentiment color based on score
  const getSentimentColor = (score: number): string => {
    if (score < -0.6) return '#d32f2f'; // Very negative - dark red
    if (score < -0.2) return '#f44336'; // Negative - red
    if (score < 0.2) return '#ffc107';  // Neutral - amber
    if (score < 0.6) return '#4caf50';  // Positive - green
    return '#2e7d32';                   // Very positive - dark green
  };
  
  // Get sentiment label based on score
  const getSentimentLabel = (score: number): string => {
    if (score < -0.6) return 'Very Negative';
    if (score < -0.2) return 'Negative';
    if (score < 0.2) return 'Neutral';
    if (score < 0.6) return 'Positive';
    return 'Very Positive';
  };
  
  // Format sentiment score for display
  const formatSentimentScore = (score: number): string => {
    const formattedScore = (score * 100).toFixed(1);
    return score >= 0 ? `+${formattedScore}%` : `${formattedScore}%`;
  };
  
  // Calculate total feedback count
  const totalFeedback = dashboardData.feedback_count;
  
  // Format category names for display
  const formatCategoryName = (category: string): string => {
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MercadoLivre Customer Sentiment Dashboard</title>
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
            background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
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
            color: #6a11cb;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 3px solid #e9ecef;
        }
        
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 20px;
        }
        
        .overview-card {
            background: white;
            border-radius: 15px;
            padding: 20px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.05);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
        }
        
        .sentiment-score {
            font-size: 3em;
            font-weight: bold;
            margin: 10px 0;
            color: ${getSentimentColor(dashboardData.overall_sentiment)};
        }
        
        .sentiment-label {
            font-size: 1.2em;
            color: ${getSentimentColor(dashboardData.overall_sentiment)};
            font-weight: 600;
        }
        
        .distribution-card {
            background: white;
            border-radius: 15px;
            padding: 20px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.05);
        }
        
        .distribution-bar {
            height: 40px;
            border-radius: 20px;
            margin: 15px 0;
            background: #f1f3f5;
            position: relative;
            overflow: hidden;
        }
        
        .distribution-segment {
            height: 100%;
            position: absolute;
            top: 0;
        }
        
        .very-negative {
            left: 0;
            background-color: #d32f2f;
        }
        
        .negative {
            background-color: #f44336;
        }
        
        .neutral {
            background-color: #ffc107;
        }
        
        .positive {
            background-color: #4caf50;
        }
        
        .very-positive {
            background-color: #2e7d32;
        }
        
        .distribution-legend {
            display: flex;
            justify-content: space-between;
            margin-top: 10px;
        }
        
        .legend-item {
            display: flex;
            align-items: center;
            font-size: 0.85em;
        }
        
        .legend-color {
            width: 12px;
            height: 12px;
            border-radius: 3px;
            margin-right: 5px;
        }
        
        .category-list {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 15px;
        }
        
        .category-item {
            background: white;
            border-radius: 10px;
            padding: 15px;
            box-shadow: 0 3px 10px rgba(0,0,0,0.05);
        }
        
        .category-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        
        .category-name {
            font-weight: 600;
            color: #495057;
        }
        
        .category-score {
            font-weight: bold;
            padding: 3px 10px;
            border-radius: 15px;
            font-size: 0.9em;
        }
        
        .progress-bar {
            height: 8px;
            border-radius: 4px;
            background: #f1f3f5;
            overflow: hidden;
            margin-top: 5px;
        }
        
        .progress-fill {
            height: 100%;
            border-radius: 4px;
        }
        
        .aspect-list {
            margin-top: 20px;
        }
        
        .aspect-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 15px;
            background: white;
            border-radius: 10px;
            margin-bottom: 10px;
            box-shadow: 0 3px 10px rgba(0,0,0,0.05);
        }
        
        .aspect-name {
            font-weight: 500;
        }
        
        .aspect-score {
            font-weight: bold;
            padding: 3px 10px;
            border-radius: 15px;
            font-size: 0.9em;
        }
        
        .aspect-count {
            color: #6c757d;
            font-size: 0.85em;
            margin-left: 5px;
        }
        
        .insight-card {
            background: white;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 15px;
            box-shadow: 0 3px 10px rgba(0,0,0,0.05);
        }
        
        .insight-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
        }
        
        .insight-title {
            font-weight: 600;
            color: #343a40;
        }
        
        .insight-priority {
            padding: 3px 10px;
            border-radius: 15px;
            font-size: 0.8em;
            font-weight: 600;
        }
        
        .priority-critical {
            background: #ffebee;
            color: #c62828;
        }
        
        .priority-high {
            background: #fff8e1;
            color: #ff8f00;
        }
        
        .priority-medium {
            background: #e8f5e9;
            color: #2e7d32;
        }
        
        .priority-low {
            background: #e3f2fd;
            color: #1565c0;
        }
        
        .insight-categories {
            display: flex;
            gap: 5px;
            margin-top: 10px;
        }
        
        .insight-category {
            padding: 3px 8px;
            border-radius: 15px;
            background: #f1f3f5;
            color: #495057;
            font-size: 0.8em;
        }
        
        .chart {
            width: 100%;
            height: 300px;
            margin-top: 20px;
            position: relative;
        }
        
        .chart-container {
            width: 100%;
            height: 100%;
            position: relative;
            padding-bottom: 20px;
        }
        
        .chart-point {
            position: absolute;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            transform: translate(-50%, -50%);
        }
        
        .chart-line {
            position: absolute;
            height: 2px;
            z-index: 1;
        }
        
        .chart-axis {
            position: absolute;
            background: #dee2e6;
        }
        
        .chart-axis-x {
            bottom: 0;
            left: 0;
            width: 100%;
            height: 1px;
        }
        
        .chart-axis-y {
            top: 0;
            left: 0;
            width: 1px;
            height: calc(100% - 20px);
        }
        
        .chart-label {
            position: absolute;
            font-size: 0.8em;
            color: #6c757d;
        }
        
        .chart-label-y {
            left: -25px;
            transform: translateY(-50%);
        }
        
        .chart-label-x {
            bottom: -20px;
            transform: translateX(-50%);
        }
        
        .chart-grid-line {
            position: absolute;
            background: #f1f3f5;
            z-index: 0;
        }
        
        .chart-grid-line-y {
            width: 100%;
            height: 1px;
            left: 0;
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
            
            .grid {
                grid-template-columns: 1fr;
            }
            
            .category-list {
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
            <h1>📊 MercadoLivre Customer Sentiment Dashboard</h1>
            <p>Analysis of customer feedback across all channels</p>
            <div class="stats">
                <div class="stat">
                    <span class="stat-number">${totalFeedback}</span>
                    <span class="stat-label">Feedback Analyzed</span>
                </div>
                <div class="stat">
                    <span class="stat-number">${formatSentimentScore(dashboardData.overall_sentiment)}</span>
                    <span class="stat-label">Overall Sentiment</span>
                </div>
                <div class="stat">
                    <span class="stat-number">${periodDays}</span>
                    <span class="stat-label">Day Period</span>
                </div>
            </div>
        </div>
        
        <div class="main-content">
            <div class="section">
                <h2>Sentiment Overview</h2>
                <div class="grid">
                    <div class="overview-card">
                        <h3>Overall Sentiment</h3>
                        <div class="sentiment-score">${formatSentimentScore(dashboardData.overall_sentiment)}</div>
                        <div class="sentiment-label">${getSentimentLabel(dashboardData.overall_sentiment)}</div>
                    </div>
                    
                    <div class="distribution-card">
                        <h3>Sentiment Distribution</h3>
                        <div class="distribution-bar">
                            ${(() => {
                                const total = Object.values(dashboardData.sentiment_distribution).reduce((a: any, b: any) => a + b, 0) as number;
                                let position = 0;
                                let segments = '';
                                
                                const addSegment = (count: number, className: string) => {
                                  const width = (count / total) * 100;
                                  segments += `<div class="distribution-segment ${className}" style="left: ${position}%; width: ${width}%;"></div>`;
                                  position += width;
                                };
                                
                                addSegment(dashboardData.sentiment_distribution.very_negative, 'very-negative');
                                addSegment(dashboardData.sentiment_distribution.negative, 'negative');
                                addSegment(dashboardData.sentiment_distribution.neutral, 'neutral');
                                addSegment(dashboardData.sentiment_distribution.positive, 'positive');
                                addSegment(dashboardData.sentiment_distribution.very_positive, 'very-positive');
                                
                                return segments;
                            })()}
                        </div>
                        <div class="distribution-legend">
                            <div class="legend-item">
                                <div class="legend-color" style="background-color: #d32f2f;"></div>
                                <span>Very Negative (${dashboardData.sentiment_distribution.very_negative})</span>
                            </div>
                            <div class="legend-item">
                                <div class="legend-color" style="background-color: #f44336;"></div>
                                <span>Negative (${dashboardData.sentiment_distribution.negative})</span>
                            </div>
                            <div class="legend-item">
                                <div class="legend-color" style="background-color: #ffc107;"></div>
                                <span>Neutral (${dashboardData.sentiment_distribution.neutral})</span>
                            </div>
                            <div class="legend-item">
                                <div class="legend-color" style="background-color: #4caf50;"></div>
                                <span>Positive (${dashboardData.sentiment_distribution.positive})</span>
                            </div>
                            <div class="legend-item">
                                <div class="legend-color" style="background-color: #2e7d32;"></div>
                                <span>Very Positive (${dashboardData.sentiment_distribution.very_positive})</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2>Category Analysis</h2>
                <div class="category-list">
                    ${Object.entries(dashboardData.category_sentiment).map(([category, score]: [string, number]) => `
                        <div class="category-item">
                            <div class="category-header">
                                <div class="category-name">${formatCategoryName(category)}</div>
                                <div class="category-score" style="background: ${getSentimentColor(score)}1A; color: ${getSentimentColor(score)};">
                                    ${formatSentimentScore(score)}
                                </div>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${Math.max(0, (score + 1) / 2 * 100)}%; background: ${getSentimentColor(score)};"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="section">
                <h2>Trending Aspects</h2>
                <div class="grid">
                    <div>
                        <h3>Top Positive Aspects</h3>
                        <div class="aspect-list">
                            ${dashboardData.trending_aspects.positive.map((aspect: any) => `
                                <div class="aspect-item">
                                    <div class="aspect-name">${aspect.aspect}</div>
                                    <div>
                                        <span class="aspect-score" style="background: ${getSentimentColor(aspect.sentiment)}1A; color: ${getSentimentColor(aspect.sentiment)};">
                                            ${formatSentimentScore(aspect.sentiment)}
                                        </span>
                                        <span class="aspect-count">${aspect.count} mentions</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div>
                        <h3>Top Negative Aspects</h3>
                        <div class="aspect-list">
                            ${dashboardData.trending_aspects.negative.map((aspect: any) => `
                                <div class="aspect-item">
                                    <div class="aspect-name">${aspect.aspect}</div>
                                    <div>
                                        <span class="aspect-score" style="background: ${getSentimentColor(aspect.sentiment)}1A; color: ${getSentimentColor(aspect.sentiment)};">
                                            ${formatSentimentScore(aspect.sentiment)}
                                        </span>
                                        <span class="aspect-count">${aspect.count} mentions</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2>Recent Insights</h2>
                ${dashboardData.recent_insights.map((insight: any) => `
                    <div class="insight-card">
                        <div class="insight-header">
                            <div class="insight-title">${insight.title}</div>
                            <div class="insight-priority priority-${insight.priority}">${insight.priority}</div>
                        </div>
                        <p>${insight.description}</p>
                        <div class="insight-categories">
                            ${insight.categories.map((category: string) => `
                                <div class="insight-category">${formatCategoryName(category)}</div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div class="section">
                <h2>Sentiment Over Time</h2>
                <div class="chart">
                    <div class="chart-container">
                        ${(() => {
                            const data = dashboardData.sentiment_over_time;
                            const maxCount = Math.max(...data.map((d: any) => d.feedback_count));
                            const chartWidth = 100;
                            const chartHeight = 100;
                            
                            // Create X and Y axes
                            let chart = `
                                <div class="chart-axis chart-axis-x"></div>
                                <div class="chart-axis chart-axis-y"></div>
                            `;
                            
                            // Add grid lines
                            for (let i = 0; i <= 4; i++) {
                                const yPos = i * 25;
                                chart += `
                                    <div class="chart-grid-line chart-grid-line-y" style="bottom: ${yPos}%;"></div>
                                    <div class="chart-label chart-label-y" style="bottom: ${yPos}%;">
                                        ${formatSentimentScore((i - 2) / 2)}
                                    </div>
                                `;
                            }
                            
                            // Add data points and lines
                            for (let i = 0; i < data.length; i++) {
                                const point = data[i];
                                const xPos = (i / (data.length - 1)) * chartWidth;
                                const yPos = ((point.sentiment + 1) / 2) * chartHeight;
                                const size = Math.max(5, Math.min(15, (point.feedback_count / maxCount) * 15 + 5));
                                
                                chart += `
                                    <div class="chart-point" style="bottom: ${yPos}%; left: ${xPos}%; width: ${size}px; height: ${size}px; background: ${getSentimentColor(point.sentiment)};"></div>
                                `;
                                
                                // Add connecting line to next point
                                if (i < data.length - 1) {
                                    const nextPoint = data[i + 1];
                                    const nextXPos = ((i + 1) / (data.length - 1)) * chartWidth;
                                    const nextYPos = ((nextPoint.sentiment + 1) / 2) * chartHeight;
                                    
                                    const length = Math.sqrt(Math.pow(nextXPos - xPos, 2) + Math.pow(nextYPos - yPos, 2));
                                    const angle = Math.atan2(nextYPos - yPos, nextXPos - xPos) * (180 / Math.PI);
                                    
                                    chart += `
                                        <div class="chart-line" style="
                                            bottom: ${yPos}%; 
                                            left: ${xPos}%; 
                                            width: ${length}%; 
                                            transform: rotate(${angle}deg);
                                            transform-origin: left center;
                                            background: ${getSentimentColor((point.sentiment + nextPoint.sentiment) / 2)};
                                        "></div>
                                    `;
                                }
                                
                                // Add X-axis label for every few data points
                                if (i === 0 || i === Math.floor(data.length / 2) || i === data.length - 1) {
                                    const date = new Date(point.date);
                                    chart += `
                                        <div class="chart-label chart-label-x" style="left: ${xPos}%;">
                                            ${date.toLocaleDateString()}
                                        </div>
                                    `;
                                }
                            }
                            
                            return chart;
                        })()}
                    </div>
                </div>
            </div>
        </div>
        
        <div class="footer">
            Generated by MercadoLivre Sentiment Analysis System | ${new Date().toLocaleString()}
        </div>
    </div>
</body>
</html>
  `;
}

export default router;