/**
 * Test script for the Customer Sentiment Analysis System
 * 
 * This script demonstrates the functionality of the sentiment analysis system
 * by analyzing sample feedback, generating trends, and creating insights.
 */

import { logger } from '../utils/logger';
import { db } from '../services/database';
import { sentimentAnalysisService } from '../services/sentiment-analysis';
import { FeedbackSourceType, FeedbackLanguage } from '../types/sentiment.types';

async function testSentimentAnalysis() {
  try {
    logger.info('Starting Customer Sentiment Analysis test...');
    
    // 1. Analyze sentiment for sample feedback items
    logger.info('Analyzing sentiment for sample feedback...');
    
    const sampleFeedback = [
      {
        id: 'feedback_1',
        text: 'Estou muito satisfeito com a rapidez da entrega e a qualidade do produto. O preço foi excelente comparado com outras lojas. Recomendo para todos!',
        source: FeedbackSourceType.PRODUCT_REVIEW,
        language: FeedbackLanguage.PORTUGUESE
      },
      {
        id: 'feedback_2',
        text: 'A entrega atrasou dois dias e quando chegou a embalagem estava danificada. O produto funciona, mas fiquei decepcionado com o serviço de entrega.',
        source: FeedbackSourceType.PRODUCT_REVIEW,
        language: FeedbackLanguage.PORTUGUESE
      },
      {
        id: 'feedback_3',
        text: 'El proceso de pago es complicado y tuve problemas para finalizar mi compra. El servicio al cliente no fue muy útil para resolver mi problema.',
        source: FeedbackSourceType.CUSTOMER_SUPPORT,
        language: FeedbackLanguage.SPANISH
      },
      {
        id: 'feedback_4',
        text: 'Great selection of products and competitive prices. The website is easy to navigate and I found exactly what I was looking for. Will shop here again!',
        source: FeedbackSourceType.SURVEY,
        language: FeedbackLanguage.ENGLISH
      },
      {
        id: 'feedback_5',
        text: 'O aplicativo é muito bom, mas precisa melhorar a estabilidade. Às vezes trava durante o checkout e perco meu carrinho de compras.',
        source: FeedbackSourceType.APP_REVIEW,
        language: FeedbackLanguage.PORTUGUESE
      }
    ];
    
    const analysisResults = [];
    
    for (const feedback of sampleFeedback) {
      const result = await sentimentAnalysisService.analyzeSentiment({
        feedback_id: feedback.id,
        feedback_text: feedback.text,
        feedback_source: feedback.source,
        language: feedback.language
      });
      
      analysisResults.push(result);
      
      logger.info(`Analyzed feedback ${feedback.id}`, {
        sentiment: result.overall_sentiment,
        confidence: result.confidence
      });
    }
    
    // 2. Generate sentiment trend
    logger.info('Generating sentiment trend...');
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7); // Last 7 days
    
    const trend = await sentimentAnalysisService.generateSentimentTrend({
      period_start: startDate.toISOString(),
      period_end: endDate.toISOString()
    });
    
    logger.info('Sentiment trend generated', {
      trend_id: trend.id,
      average_sentiment: trend.average_sentiment,
      feedback_count: trend.total_feedback_count
    });
    
    // 3. Get insights
    logger.info('Getting sentiment insights...');
    
    const insights = await sentimentAnalysisService.getSentimentInsights({
      limit: 5
    });
    
    logger.info(`Retrieved ${insights.length} sentiment insights`);
    
    // 4. Get dashboard data
    logger.info('Getting dashboard data...');
    
    const dashboardData = await sentimentAnalysisService.getDashboardData(30);
    
    logger.info('Dashboard data retrieved', {
      overall_sentiment: dashboardData.overall_sentiment,
      feedback_count: dashboardData.feedback_count
    });
    
    logger.info('Customer Sentiment Analysis test completed successfully.');
    logger.info('');
    logger.info('To view the sentiment dashboard, visit:');
    logger.info('http://localhost:3000/sentiment');
    
    return {
      success: true,
      message: 'Customer Sentiment Analysis test completed successfully',
      results: {
        analyses: analysisResults.length,
        trend_id: trend.id,
        insights: insights.length
      }
    };
  } catch (error) {
    logger.error('Error in sentiment analysis test:', { error });
    throw error;
  }
}

// Execute if this script is run directly
if (require.main === module) {
  testSentimentAnalysis()
    .then(() => {
      logger.info('Test script completed');
      process.exit(0);
    })
    .catch(error => {
      logger.error('Test script failed:', { error });
      process.exit(1);
    });
}

export default testSentimentAnalysis;