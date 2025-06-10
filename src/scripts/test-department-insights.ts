/**
 * Test script for the Department Insights functionality
 * 
 * This script demonstrates the generation and retrieval of department-specific insights.
 * It generates insights for multiple departments and displays the results.
 */

import axios from 'axios';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';
import { DepartmentType } from '../types/department.types';

// Load environment variables
dotenv.config();

const API_URL = `http://localhost:${process.env.PORT || 3001}/api/v1`;

// Test generating and retrieving department insights
async function testDepartmentInsights() {
  try {
    logger.info('Starting Department Insights test...');

    // Generate insights for multiple departments
    const departments: DepartmentType[] = ['product', 'engineering', 'marketing', 'ux_ui', 'customer_service'];
    
    // Arrays to store the generated insight IDs by department
    const insightsByDepartment: Record<string, string[]> = {};
    
    // Generate insights for each department
    for (const department of departments) {
      logger.info(`Generating insights for ${department} department`);
      
      const insightRequest = {
        // Use existing feedback collections if available
        collection_ids: [],
        max_insights: 5,
        include_strengths: true
      };
      
      const response = await axios.post(
        `${API_URL}/departments/${department}/insights/generate`, 
        insightRequest
      );
      
      const generatedInsights = response.data.data.insights;
      insightsByDepartment[department] = generatedInsights.map((insight: any) => insight.insight_id);
      
      logger.info(`Generated ${generatedInsights.length} insights for ${department} department`, {
        strengths: generatedInsights.filter((i: any) => i.is_strength).length,
        issues: generatedInsights.filter((i: any) => !i.is_strength).length
      });
    }
    
    // Now create an implementation plan for one of the insights
    if (insightsByDepartment.product && insightsByDepartment.product.length > 0) {
      const insightId = insightsByDepartment.product[0];
      
      logger.info(`Creating implementation plan for insight: ${insightId}`);
      
      const implementationPlan = {
        department: 'product' as DepartmentType,
        title: 'Product Comparison Enhancement Implementation',
        overview: 'This plan outlines the steps to improve the product comparison functionality to highlight key differences between similar products.',
        steps: [
          {
            step_number: 1,
            description: 'Design UI mockups for enhanced comparison view with visual highlighting',
            owner: 'Design Team',
            estimated_effort: '1 week',
            dependencies: [],
            resources_required: ['UI Designer', 'UX Researcher']
          },
          {
            step_number: 2,
            description: 'Develop backend service to identify key differences between products',
            owner: 'Backend Team',
            estimated_effort: '2 weeks',
            dependencies: [],
            resources_required: ['Senior Backend Developer', 'Data Analyst']
          },
          {
            step_number: 3,
            description: 'Implement frontend comparison component with diff highlighting',
            owner: 'Frontend Team',
            estimated_effort: '2 weeks',
            dependencies: [1, 2],
            resources_required: ['Frontend Developer', 'UI Designer']
          },
          {
            step_number: 4,
            description: 'QA testing and performance optimization',
            owner: 'QA Team',
            estimated_effort: '1 week',
            dependencies: [3],
            resources_required: ['QA Engineer', 'Performance Engineer']
          }
        ],
        timeline_weeks: 6,
        estimated_cost: 35000,
        risk_factors: [
          'Resource availability for dedicated development',
          'Complex edge cases in product data structure'
        ],
        success_metrics: [
          'Reduce time to identify key differences by 50%',
          'Increase comparison usage by 25%',
          'Improve user satisfaction with comparison feature by 30%'
        ],
        status: 'draft'
      };
      
      const planResponse = await axios.post(
        `${API_URL}/departments/insights/${insightId}/implementation`,
        implementationPlan
      );
      
      logger.info('Implementation plan created successfully', {
        insightId,
        planId: planResponse.data.data.plan_id
      });
    }
    
    // Generate departmental recommendations summary
    logger.info('Generating departmental recommendations summary');
    
    const recommendationsResponse = await axios.get(`${API_URL}/departments/recommendations`);
    const recommendations = recommendationsResponse.data.data;
    
    logger.info('Generated departmental recommendations', {
      departments: Object.keys(recommendations.departments).length,
      title: recommendations.title
    });
    
    // Print out the dashboard URL
    logger.info('Department recommendations dashboard available at:');
    logger.info(`http://localhost:${process.env.PORT || 3001}/departments`);
    
    logger.info('Department Insights test completed successfully!');
  } catch (error) {
    logger.error('Error in Department Insights test', { error });
  }
}

// Run the test
if (require.main === module) {
  testDepartmentInsights();
}