import express from 'express';
import { z } from 'zod';
import { logger } from '../utils/logger';
import { departmentInsightService } from '../services/department-insight';
import { 
  DepartmentInsightRequestSchema,
  DepartmentTypeSchema,
  PriorityLevelSchema,
  ImplementationPlanSchema,
  InsightID
} from '../types/department.types';

const router = express.Router();

// Schema for ID param validation
const IdParamSchema = z.object({
  insightId: z.string().min(10)
});

// Schema for department param validation
const DepartmentParamSchema = z.object({
  department: DepartmentTypeSchema
});

// Schema for filter query validation
const FilterQuerySchema = z.object({
  priority: PriorityLevelSchema.optional(),
  is_strength: z.enum(['true', 'false']).optional().transform(val => val === 'true'),
  status: z.string().optional(),
  limit: z.string().optional().transform(val => parseInt(val, 10)),
  offset: z.string().optional().transform(val => parseInt(val, 10)),
});

// POST /api/v1/departments/:department/insights/generate - Generate insights for a department
router.post('/:department/insights/generate', async (req: express.Request, res: express.Response) => {
  try {
    // Validate department param
    const departmentValidation = DepartmentParamSchema.safeParse({ department: req.params.department });
    
    if (!departmentValidation.success) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid department',
        errors: departmentValidation.error.format(),
        correlationId: req.correlationId
      });
    }
    
    // Validate request body
    const validationResult = DepartmentInsightRequestSchema.safeParse({
      ...req.body,
      department: req.params.department
    });
    
    if (!validationResult.success) {
      logger.warn('Invalid insight generation request', { 
        errors: validationResult.error.format(),
        correlationId: req.correlationId 
      });
      
      return res.status(400).json({
        status: 'error',
        message: 'Invalid insight generation request',
        errors: validationResult.error.format(),
        correlationId: req.correlationId
      });
    }
    
    const insightRequest = validationResult.data;
    
    // Generate insights
    const result = await departmentInsightService.generateInsights(insightRequest);
    
    // Return success response
    return res.status(200).json({
      status: 'success',
      message: `Generated ${result.insights.length} insights for ${req.params.department}`,
      data: result,
      correlationId: req.correlationId
    });
  } catch (error) {
    logger.error('Error generating insights', { error, department: req.params.department, correlationId: req.correlationId });
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to generate insights',
      error: error instanceof Error ? error.message : 'Unknown error',
      correlationId: req.correlationId
    });
  }
});

// GET /api/v1/departments/:department/insights - Get insights for a department
router.get('/:department/insights', async (req: express.Request, res: express.Response) => {
  try {
    // Validate department param
    const departmentValidation = DepartmentParamSchema.safeParse({ department: req.params.department });
    
    if (!departmentValidation.success) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid department',
        errors: departmentValidation.error.format(),
        correlationId: req.correlationId
      });
    }
    
    // Validate and parse query parameters
    const validationResult = FilterQuerySchema.safeParse(req.query);
    
    if (!validationResult.success) {
      logger.warn('Invalid filter parameters', { 
        errors: validationResult.error.format(),
        correlationId: req.correlationId 
      });
      
      return res.status(400).json({
        status: 'error',
        message: 'Invalid filter parameters',
        errors: validationResult.error.format(),
        correlationId: req.correlationId
      });
    }
    
    const filters = validationResult.data;
    
    // Get insights with filters
    const insights = await departmentInsightService.getInsights(
      departmentValidation.data.department,
      filters
    );
    
    // Return success response
    return res.json({
      status: 'success',
      data: {
        department: req.params.department,
        insights,
        total: insights.length,
        filter_criteria: filters
      },
      correlationId: req.correlationId
    });
  } catch (error) {
    logger.error('Error getting insights', { 
      error, 
      department: req.params.department, 
      correlationId: req.correlationId 
    });
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get insights',
      error: error instanceof Error ? error.message : 'Unknown error',
      correlationId: req.correlationId
    });
  }
});

// POST /api/v1/departments/insights/:insightId/implementation - Create implementation plan
router.post('/insights/:insightId/implementation', async (req: express.Request, res: express.Response) => {
  try {
    // Validate insight ID
    const idValidation = IdParamSchema.safeParse({ insightId: req.params.insightId });
    
    if (!idValidation.success) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid insight ID',
        errors: idValidation.error.format(),
        correlationId: req.correlationId
      });
    }
    
    // Validate request body
    const validationResult = ImplementationPlanSchema
      .omit({ insight_id: true, created_at: true })
      .safeParse(req.body);
    
    if (!validationResult.success) {
      logger.warn('Invalid implementation plan', { 
        errors: validationResult.error.format(),
        correlationId: req.correlationId 
      });
      
      return res.status(400).json({
        status: 'error',
        message: 'Invalid implementation plan',
        errors: validationResult.error.format(),
        correlationId: req.correlationId
      });
    }
    
    const insightId = req.params.insightId as InsightID;
    const implementationPlan = validationResult.data;
    
    // Create implementation plan
    const result = await departmentInsightService.createImplementationPlan(insightId, implementationPlan);
    
    // Return success response
    return res.status(201).json({
      status: 'success',
      message: 'Implementation plan created successfully',
      data: result,
      correlationId: req.correlationId
    });
  } catch (error) {
    logger.error('Error creating implementation plan', { 
      error, 
      insightId: req.params.insightId,
      correlationId: req.correlationId 
    });
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create implementation plan',
      error: error instanceof Error ? error.message : 'Unknown error',
      correlationId: req.correlationId
    });
  }
});

// GET /api/v1/departments/:department/implementation-plans - Get implementation plans
router.get('/:department/implementation-plans', async (req: express.Request, res: express.Response) => {
  try {
    // Validate department param
    const departmentValidation = DepartmentParamSchema.safeParse({ department: req.params.department });
    
    if (!departmentValidation.success) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid department',
        errors: departmentValidation.error.format(),
        correlationId: req.correlationId
      });
    }
    
    // Get implementation plans
    const plans = await departmentInsightService.getImplementationPlans(
      departmentValidation.data.department
    );
    
    // Return success response
    return res.json({
      status: 'success',
      data: {
        department: req.params.department,
        plans,
        total: plans.length
      },
      correlationId: req.correlationId
    });
  } catch (error) {
    logger.error('Error getting implementation plans', { 
      error, 
      department: req.params.department, 
      correlationId: req.correlationId 
    });
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get implementation plans',
      error: error instanceof Error ? error.message : 'Unknown error',
      correlationId: req.correlationId
    });
  }
});

// GET /api/v1/departments/recommendations - Get all department recommendations
router.get('/recommendations', async (req: express.Request, res: express.Response) => {
  try {
    // Generate departmental recommendations
    const recommendations = await departmentInsightService.generateDepartmentalRecommendations();
    
    // Return success response
    return res.json({
      status: 'success',
      data: recommendations,
      correlationId: req.correlationId
    });
  } catch (error) {
    logger.error('Error generating departmental recommendations', { error, correlationId: req.correlationId });
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to generate departmental recommendations',
      error: error instanceof Error ? error.message : 'Unknown error',
      correlationId: req.correlationId
    });
  }
});

// GET /api/v1/departments/recommendations/view - HTML view of department recommendations
router.get('/recommendations/view', async (req: express.Request, res: express.Response) => {
  try {
    // Generate departmental recommendations
    const departmentalData = await departmentInsightService.generateDepartmentalRecommendations();
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Department Recommendations</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
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
        
        .executive-summary {
            background: #f8f9fa;
            padding: 30px;
            border-bottom: 3px solid #28a745;
        }
        
        .executive-summary h2 {
            color: #28a745;
            margin-bottom: 20px;
            font-size: 1.8em;
        }
        
        .priorities-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        
        .priority-card {
            background: white;
            border-radius: 10px;
            padding: 20px;
            border-left: 5px solid #28a745;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .priority-number {
            background: #28a745;
            color: white;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            margin-bottom: 15px;
        }
        
        .departments-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
            gap: 30px;
            padding: 30px;
        }
        
        .department-card {
            background: #f8f9fa;
            border-radius: 15px;
            overflow: hidden;
            border: 1px solid #dee2e6;
            transition: transform 0.3s ease;
        }
        
        .department-card:hover {
            transform: translateY(-5px);
        }
        
        .department-header {
            padding: 25px;
            color: white;
            font-weight: 600;
            font-size: 1.3em;
        }
        
        .department-header.product { background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); }
        .department-header.engineering { background: linear-gradient(135deg, #28a745 0%, #1e7e34 100%); }
        .department-header.marketing { background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%); color: #333; }
        .department-header.customer-service { background: linear-gradient(135deg, #17a2b8 0%, #117a8b 100%); }
        .department-header.business-intelligence { background: linear-gradient(135deg, #6f42c1 0%, #59359a 100%); }
        .department-header.operations { background: linear-gradient(135deg, #e83e8c 0%, #e21e7b 100%); }
        
        .department-content {
            padding: 25px;
            background: white;
        }
        
        .section {
            margin-bottom: 25px;
        }
        
        .section h4 {
            color: #495057;
            margin-bottom: 15px;
            font-size: 1.1em;
            border-bottom: 2px solid #e9ecef;
            padding-bottom: 8px;
        }
        
        .action-list {
            list-style: none;
            padding: 0;
        }
        
        .action-list li {
            background: #f8f9fa;
            margin: 8px 0;
            padding: 12px 15px;
            border-radius: 8px;
            border-left: 4px solid #28a745;
            position: relative;
        }
        
        .action-list li::before {
            content: "✓";
            color: #28a745;
            font-weight: bold;
            margin-right: 10px;
        }
        
        .kpi-tag {
            display: inline-block;
            background: #e3f2fd;
            color: #1976d2;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.85em;
            margin: 2px;
        }
        
        .timeline-badge {
            background: #fff3cd;
            color: #856404;
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 0.9em;
            font-weight: 600;
        }
        
        .impact-badge {
            background: #d1ecf1;
            color: #0c5460;
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 0.9em;
            font-weight: 600;
        }
        
        .footer {
            background: #343a40;
            color: white;
            text-align: center;
            padding: 20px;
            font-size: 0.9em;
        }
        
        @media (max-width: 768px) {
            .departments-grid {
                grid-template-columns: 1fr;
                padding: 20px;
            }
            
            .priorities-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏢 ${departmentalData.title}</h1>
            <p>${departmentalData.subtitle}</p>
        </div>
        
        <div class="executive-summary">
            <h2>📋 Executive Summary</h2>
            <p><strong>Expected ROI:</strong> 15-25% improvement in key metrics within 6 months</p>
            <p><strong>Implementation Budget:</strong> R$ 800K - 1.2M for full implementation</p>
            <p><strong>Resource Requirements:</strong> 15-20 engineering months, 3-4 designers, 2 senior PMs</p>
            
            <div class="priorities-grid">
                <div class="priority-card">
                    <div class="priority-number">1</div>
                    <h3>Enhanced Product Discovery</h3>
                    <p><span class="timeline-badge">3 months</span> <span class="impact-badge">High conversion impact</span></p>
                    <p>Departments: Product, Engineering</p>
                </div>
                <div class="priority-card">
                    <div class="priority-number">2</div>
                    <h3>Persona-Based Personalization</h3>
                    <p><span class="timeline-badge">6 months</span> <span class="impact-badge">Engagement & retention</span></p>
                    <p>Departments: Marketing, Product, BI</p>
                </div>
                <div class="priority-card">
                    <div class="priority-number">3</div>
                    <h3>Gift Experience Enhancement</h3>
                    <p><span class="timeline-badge">4 months</span> <span class="impact-badge">Higher order value</span></p>
                    <p>Departments: Product, Operations</p>
                </div>
            </div>
        </div>
        
        <div class="departments-grid">
            ${Object.entries(departmentalData.departments).map(([key, dept]) => `
                <div class="department-card">
                    <div class="department-header ${key.replace('_', '-')}">
                        ${dept.icon} ${dept.name}
                    </div>
                    <div class="department-content">
                        <div class="section">
                            <h4>🎯 Immediate Actions</h4>
                            <ul class="action-list">
                                ${dept.immediate_actions.map(action => `<li>${action}</li>`).join('')}
                            </ul>
                        </div>
                        
                        <div class="section">
                            <h4>🚀 Medium-term Initiatives</h4>
                            <ul class="action-list">
                                ${dept.medium_term_initiatives.map(initiative => `<li>${initiative}</li>`).join('')}
                            </ul>
                        </div>
                        
                        <div class="section">
                            <h4>📊 Key Performance Indicators</h4>
                            <div>
                                ${dept.kpis.map(kpi => `<span class="kpi-tag">${kpi}</span>`).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="footer">
            Generated by Feedback Intelligence Platform | ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
        </div>
    </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    logger.error('Error generating department view', { error, correlationId: req.correlationId });
    res.status(500).send('<h1>Error generating department view</h1>');
  }
});

export default router;