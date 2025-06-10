/**
 * Test script for the Competitive Benchmarking System
 * 
 * This script demonstrates the functionality of the competitor benchmarking system
 * by creating competitors, adding feature comparisons, and generating benchmark reports.
 */

import { logger } from '../utils/logger';
import { db } from '../services/database';
import { competitorBenchmarkService } from '../services/competitor-benchmark';
import { FeatureCategory } from '../types/competitor.types';

async function testCompetitorBenchmark() {
  try {
    logger.info('Starting Competitor Benchmarking System test...');
    
    // 1. Create sample competitors (if they don't exist)
    const competitors = await competitorBenchmarkService.getCompetitors();
    
    let amazonId = '';
    let magaluId = '';
    
    if (competitors.length === 0) {
      logger.info('Creating sample competitors...');
      
      // Create Amazon
      const amazon = await competitorBenchmarkService.addCompetitor({
        name: 'Amazon',
        url: 'https://www.amazon.com',
        primary_market: 'Global',
        description: 'Leading global e-commerce marketplace with vast product selection and fast delivery.',
        company_size: 'enterprise',
        tags: ['marketplace', 'global', 'tech-giant']
      });
      
      amazonId = amazon.competitor_id;
      
      // Create Magalu
      const magalu = await competitorBenchmarkService.addCompetitor({
        name: 'Magalu',
        url: 'https://www.magazineluiza.com.br',
        primary_market: 'Brazil',
        description: 'Major Brazilian retail chain with strong omnichannel presence.',
        company_size: 'large',
        tags: ['retail', 'electronics', 'brazil']
      });
      
      magaluId = magalu.competitor_id;
      
      // Create Americanas
      await competitorBenchmarkService.addCompetitor({
        name: 'Americanas',
        url: 'https://www.americanas.com.br',
        primary_market: 'Brazil',
        description: 'Brazilian e-commerce platform offering a wide range of products.',
        company_size: 'large',
        tags: ['marketplace', 'brazil', 'retail']
      });
    } else {
      // Use existing competitors
      amazonId = competitors.find(c => c.name === 'Amazon')?.competitor_id || '';
      magaluId = competitors.find(c => c.name === 'Magalu')?.competitor_id || '';
      
      if (!amazonId || !magaluId) {
        throw new Error('Required competitors not found in database');
      }
    }
    
    logger.info('Adding feature comparisons...');
    
    // 2. Add feature comparisons for Amazon
    if (amazonId) {
      // Check if we already have features for Amazon
      const amazonFeatures = await competitorBenchmarkService.getFeatureComparisons({
        competitor_id: amazonId
      });
      
      if (amazonFeatures.length === 0) {
        // Add product discovery features
        await competitorBenchmarkService.addFeatureComparison({
          competitor_id: amazonId,
          category: 'product_discovery' as FeatureCategory,
          feature_name: 'Personalized Recommendations',
          feature_description: 'Algorithmic product recommendations based on browsing and purchase history',
          competitor_implementation: 'Advanced ML-based recommendations with high accuracy and personalization',
          mercadolivre_implementation: 'Basic recommendation system with limited personalization',
          competitor_rating: 9,
          mercadolivre_rating: 6,
          priority: 'high',
          related_departments: ['product', 'engineering', 'data_science']
        });
        
        await competitorBenchmarkService.addFeatureComparison({
          competitor_id: amazonId,
          category: 'search' as FeatureCategory,
          feature_name: 'Search Autocomplete',
          feature_description: 'Predictive search suggestions as user types',
          competitor_implementation: 'Fast, typo-tolerant search autocomplete with categorized suggestions',
          mercadolivre_implementation: 'Basic search autocomplete with some delays',
          competitor_rating: 8,
          mercadolivre_rating: 7,
          priority: 'medium',
          related_departments: ['engineering', 'ux_ui']
        });
        
        await competitorBenchmarkService.addFeatureComparison({
          competitor_id: amazonId,
          category: 'mobile_experience' as FeatureCategory,
          feature_name: 'Mobile App Experience',
          feature_description: 'Overall mobile application user experience',
          competitor_implementation: 'Comprehensive app with offline capabilities and push notifications',
          mercadolivre_implementation: 'Full-featured app with good performance and usability',
          competitor_rating: 8,
          mercadolivre_rating: 8,
          priority: 'medium',
          related_departments: ['mobile', 'ux_ui']
        });
      }
    }
    
    // 3. Add feature comparisons for Magalu
    if (magaluId) {
      // Check if we already have features for Magalu
      const magaluFeatures = await competitorBenchmarkService.getFeatureComparisons({
        competitor_id: magaluId
      });
      
      if (magaluFeatures.length === 0) {
        // Add features
        await competitorBenchmarkService.addFeatureComparison({
          competitor_id: magaluId,
          category: 'product_detail' as FeatureCategory,
          feature_name: 'Product Image Gallery',
          feature_description: 'Multiple product images with zoom and 360-degree view',
          competitor_implementation: 'Basic image gallery with limited views',
          mercadolivre_implementation: 'Advanced image gallery with 360-degree view for many products',
          competitor_rating: 6,
          mercadolivre_rating: 8,
          priority: 'low',
          related_departments: ['product', 'ux_ui']
        });
        
        await competitorBenchmarkService.addFeatureComparison({
          competitor_id: magaluId,
          category: 'checkout' as FeatureCategory,
          feature_name: 'One-click Checkout',
          feature_description: 'Simplified checkout process with saved payment and shipping info',
          competitor_implementation: 'Multi-step checkout with some friction points',
          mercadolivre_implementation: 'Streamlined checkout with saved information',
          competitor_rating: 5,
          mercadolivre_rating: 8,
          priority: 'medium',
          related_departments: ['product', 'engineering']
        });
        
        await competitorBenchmarkService.addFeatureComparison({
          competitor_id: magaluId,
          category: 'loyalty' as FeatureCategory,
          feature_name: 'Loyalty Program',
          feature_description: 'Customer rewards and loyalty system',
          competitor_implementation: 'Comprehensive loyalty program with tiered benefits',
          mercadolivre_implementation: 'Basic loyalty features with limited rewards',
          competitor_rating: 9,
          mercadolivre_rating: 5,
          priority: 'high',
          related_departments: ['marketing', 'product']
        });
      }
    }
    
    logger.info('Generating benchmark report...');
    
    // 4. Generate benchmark report
    const benchmarkReport = await competitorBenchmarkService.generateBenchmarkReport({
      competitors: [amazonId, magaluId],
      categories: ['product_discovery', 'search', 'product_detail', 'checkout', 'mobile_experience', 'loyalty'] as FeatureCategory[],
      departments: ['product', 'engineering', 'marketing', 'ux_ui'],
      title: 'E-commerce Competitive Analysis'
    });
    
    logger.info('Benchmark report generated:', { 
      benchmark_id: benchmarkReport.benchmark_id,
      title: benchmarkReport.title,
      competitors: benchmarkReport.competitors.length,
      overall_score: benchmarkReport.overall_score
    });
    
    // 5. Get competitive position analysis
    logger.info('Generating competitive position analysis...');
    const positionAnalysis = await competitorBenchmarkService.getCompetitivePosition([amazonId, magaluId]);
    
    logger.info('Competitive position analysis complete:', {
      mercadolivre_score: positionAnalysis.mercadolivre.overall_score,
      competitor_count: positionAnalysis.competitors.length,
      strengths: positionAnalysis.strongest_categories.length,
      gaps: positionAnalysis.weakest_categories.length
    });
    
    logger.info('Competitor Benchmarking System test completed successfully.');
    logger.info('');
    logger.info('To view the benchmark visualization, visit:');
    logger.info('http://localhost:3000/competitors');
    
    return {
      success: true,
      benchmark_id: benchmarkReport.benchmark_id,
      message: 'Competitor Benchmarking System test completed successfully'
    };
  } catch (error) {
    logger.error('Error in competitor benchmark test:', { error });
    throw error;
  }
}

// Execute if this script is run directly
if (require.main === module) {
  testCompetitorBenchmark()
    .then(() => {
      logger.info('Test script completed');
      process.exit(0);
    })
    .catch(error => {
      logger.error('Test script failed:', { error });
      process.exit(1);
    });
}

export default testCompetitorBenchmark;