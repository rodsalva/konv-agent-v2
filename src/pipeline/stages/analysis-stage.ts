/**
 * Feedback Analysis Stage
 * Analyzes feedback content for sentiment, entities, and categorization
 */

import { PipelineStage, IPipelineStageContext, IPipelineStageOptions } from '@/pipeline/pipeline-stage';
import { IFeedback, IProcessedFeedback } from '@/types/feedback/feedback.types';
import { logger } from '@/utils/logger';

// Simple sentiment analysis function (placeholder for more advanced analysis)
function analyzeSentiment(text: string): { score: number; label: 'positive' | 'negative' | 'neutral' | 'mixed'; confidence: number } {
  if (!text) {
    return { score: 0, label: 'neutral', confidence: 0.5 };
  }
  
  // Very basic sentiment analysis - in a real system, this would use an NLP API
  const positiveWords = ['good', 'great', 'excellent', 'amazing', 'love', 'best', 'happy', 'satisfied', 'recommend', 'awesome'];
  const negativeWords = ['bad', 'terrible', 'awful', 'poor', 'hate', 'worst', 'unhappy', 'disappointed', 'issue', 'problem'];
  
  const lowerText = text.toLowerCase();
  let positiveCount = 0;
  let negativeCount = 0;
  
  positiveWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) {
      positiveCount += matches.length;
    }
  });
  
  negativeWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) {
      negativeCount += matches.length;
    }
  });
  
  const total = positiveCount + negativeCount;
  
  if (total === 0) {
    return { score: 0, label: 'neutral', confidence: 0.5 };
  }
  
  // Calculate sentiment score (-1 to 1)
  const score = (positiveCount - negativeCount) / total;
  
  // Determine label
  let label: 'positive' | 'negative' | 'neutral' | 'mixed' = 'neutral';
  if (score > 0.2) {
    label = 'positive';
  } else if (score < -0.2) {
    label = 'negative';
  } else if (positiveCount > 0 && negativeCount > 0) {
    label = 'mixed';
  }
  
  // Determine confidence (0 to 1)
  const confidence = Math.min(0.5 + Math.abs(score) / 2, 0.95);
  
  return {
    score: parseFloat(score.toFixed(2)),
    label,
    confidence: parseFloat(confidence.toFixed(2))
  };
}

// Simple entities extraction (placeholder for more advanced extraction)
function extractEntities(text: string): Array<{ text: string; type: string; relevance: number; sentiment?: number }> {
  if (!text) {
    return [];
  }
  
  const entities: Array<{ text: string; type: string; relevance: number; sentiment?: number }> = [];
  
  // Extract product mentions (very basic)
  const productRegex = /\b(product|app|website|platform|service|feature|tool)\b/gi;
  let match;
  while ((match = productRegex.exec(text)) !== null) {
    entities.push({
      text: match[0],
      type: 'product',
      relevance: 0.8
    });
  }
  
  // Extract person mentions (very basic)
  const personRegex = /\b(support|agent|team|staff|representative|employee)\b/gi;
  while ((match = personRegex.exec(text)) !== null) {
    entities.push({
      text: match[0],
      type: 'person',
      relevance: 0.7
    });
  }
  
  return entities;
}

// Simple categories detection (placeholder for more advanced categorization)
function detectCategories(text: string): Array<{ name: string; confidence: number }> {
  if (!text) {
    return [];
  }
  
  const categories: Array<{ name: string; confidence: number }> = [];
  const lowerText = text.toLowerCase();
  
  // Check for common categories
  const categoryPatterns = [
    { name: 'usability', patterns: ['easy to use', 'user friendly', 'intuitive', 'difficult to navigate', 'confusing', 'complicated'], confidence: 0.8 },
    { name: 'performance', patterns: ['slow', 'fast', 'speed', 'loading', 'lag', 'responsive', 'crash'], confidence: 0.85 },
    { name: 'support', patterns: ['help', 'support', 'customer service', 'assistance', 'agent', 'ticket'], confidence: 0.9 },
    { name: 'quality', patterns: ['quality', 'reliable', 'unreliable', 'buggy', 'broken', 'error'], confidence: 0.75 },
    { name: 'value', patterns: ['price', 'expensive', 'cheap', 'cost', 'worth', 'value'], confidence: 0.85 },
    { name: 'feature', patterns: ['feature', 'functionality', 'missing', 'add', 'implement'], confidence: 0.8 }
  ];
  
  categoryPatterns.forEach(category => {
    let found = false;
    category.patterns.forEach(pattern => {
      if (lowerText.includes(pattern)) {
        found = true;
      }
    });
    
    if (found) {
      categories.push({
        name: category.name,
        confidence: category.confidence
      });
    }
  });
  
  return categories;
}

export class AnalysisStage extends PipelineStage<IFeedback, IFeedback> {
  constructor(options: IPipelineStageOptions = { name: 'AnalysisStage' }) {
    super({ 
      name: options.name || 'AnalysisStage',
      ...options 
    });
  }

  protected async execute(context: IPipelineStageContext<IFeedback>): Promise<IFeedback> {
    const { data, metadata } = context;
    const feedbackId = data.id as string;
    
    logger.debug('Analyzing feedback data', { 
      feedbackId,
      correlationId: metadata.correlationId 
    });
    
    try {
      // Extract text content from feedback
      const content = data.raw_feedback.content as any;
      const text = content.text || '';
      
      // Get rating if available
      const rating = typeof content.rating === 'number' ? content.rating : null;
      
      // Process analytics based on feedback type
      let processedFeedback: IProcessedFeedback = {
        id: feedbackId,
        sentiment: { score: 0, label: 'neutral', confidence: 0.5 },
        actionable: false
      };
      
      // For text-based feedback, perform text analysis
      if (text) {
        // Analyze sentiment
        processedFeedback.sentiment = analyzeSentiment(text);
        
        // Extract entities
        const entities = extractEntities(text);
        if (entities.length > 0) {
          processedFeedback.entities = entities;
        }
        
        // Detect categories
        const categories = detectCategories(text);
        if (categories.length > 0) {
          processedFeedback.categories = categories;
        }
        
        // Generate a simple summary
        if (text.length > 100) {
          processedFeedback.summary = text.substring(0, 100) + '...';
        }
      }
      
      // For rating-based feedback, derive sentiment from rating
      if (rating !== null) {
        let ratingScore: number;
        let ratingLabel: 'positive' | 'negative' | 'neutral' | 'mixed';
        let ratingConfidence: number;
        
        if (data.feedback_type === 'nps') {
          // NPS (0-10 scale)
          // 0-6: Detractors, 7-8: Passives, 9-10: Promoters
          if (rating >= 9) {
            ratingScore = 0.9;
            ratingLabel = 'positive';
            ratingConfidence = 0.9;
          } else if (rating >= 7) {
            ratingScore = 0.3;
            ratingLabel = 'neutral';
            ratingConfidence = 0.8;
          } else {
            ratingScore = -0.7;
            ratingLabel = 'negative';
            ratingConfidence = 0.85;
          }
        } else {
          // Generic rating (assuming 0-5 scale)
          if (rating > 3) {
            ratingScore = 0.7;
            ratingLabel = 'positive';
            ratingConfidence = 0.85;
          } else if (rating === 3) {
            ratingScore = 0;
            ratingLabel = 'neutral';
            ratingConfidence = 0.8;
          } else {
            ratingScore = -0.7;
            ratingLabel = 'negative';
            ratingConfidence = 0.85;
          }
        }
        
        // If we have both text and rating, combine them
        if (text) {
          processedFeedback.sentiment = {
            score: (processedFeedback.sentiment.score + ratingScore) / 2,
            label: ratingScore > processedFeedback.sentiment.score ? ratingLabel : processedFeedback.sentiment.label,
            confidence: Math.max(processedFeedback.sentiment.confidence, ratingConfidence)
          };
        } else {
          processedFeedback.sentiment = {
            score: ratingScore,
            label: ratingLabel,
            confidence: ratingConfidence
          };
        }
      }
      
      // Determine if feedback is actionable
      processedFeedback.actionable = (
        processedFeedback.sentiment.label === 'negative' || 
        (processedFeedback.categories && processedFeedback.categories.some(c => 
          c.name === 'support' || c.name === 'quality' || c.name === 'performance'
        ))
      );
      
      // Set priority if actionable
      if (processedFeedback.actionable) {
        // Priority scale: 1 (highest) to 10 (lowest)
        let priority = 5; // Default medium priority
        
        // Higher priority for negative sentiment
        if (processedFeedback.sentiment.label === 'negative') {
          priority -= 2;
        }
        
        // Higher priority for certain categories
        if (processedFeedback.categories) {
          if (processedFeedback.categories.some(c => c.name === 'support')) {
            priority -= 1;
          }
          if (processedFeedback.categories.some(c => c.name === 'quality')) {
            priority -= 1;
          }
        }
        
        // Clamp to valid range
        processedFeedback.priority = Math.max(1, Math.min(10, priority));
      }
      
      // Update the feedback object with processed data
      const analyzedFeedback: IFeedback = {
        ...data,
        processed_feedback: processedFeedback,
        sentiment_score: processedFeedback.sentiment.score,
        confidence_score: processedFeedback.sentiment.confidence,
        tags: processedFeedback.categories?.map(c => c.name) || [],
        status: 'analyzed'
      };
      
      logger.debug('Feedback analysis successful', { 
        feedbackId,
        sentiment: processedFeedback.sentiment.label,
        actionable: processedFeedback.actionable,
        correlationId: metadata.correlationId
      });
      
      return analyzedFeedback;
    } catch (error) {
      logger.error('Error analyzing feedback', { 
        error, 
        feedbackId,
        correlationId: metadata.correlationId 
      });
      throw error;
    }
  }
}