/**
 * Customer Sentiment Analysis Service
 * Analyzes customer feedback to extract sentiment, identify trends, and provide actionable insights
 */

import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/utils/logger';
import { db } from '@/services/database';
import { WebSocketService } from '@/services/websocket';
import { EventBus } from '@/events/event-bus';
import { departmentInsightService } from '@/services/department-insight';
import { 
  SentimentAnalysisID,
  SentimentTrendID,
  SentimentAnalysisRequest,
  SentimentAnalysisResult,
  SentimentAnalysis,
  SentimentTrend,
  SentimentInsight,
  SentimentTrendRequest,
  SentimentCategory,
  SentimentScore,
  FeedbackSourceType,
  FeedbackLanguage,
  SentimentDashboardData
} from '@/types/sentiment.types';
import { 
  SentimentEventType,
  createSentimentAnalysisCompletedEvent,
  createSentimentAnalysisFailedEvent,
  createSentimentTrendGeneratedEvent,
  createSentimentInsightCreatedEvent,
  createSentimentThresholdExceededEvent,
  createSentimentImprovedEvent
} from '@/events/sentiment-events';

/**
 * Service for analyzing customer sentiment from various feedback sources
 */
class SentimentAnalysisService {
  private websocketService: WebSocketService | null = null;
  
  // Sentiment score thresholds for alerts
  private sentimentThresholds: Record<SentimentCategory, number> = {
    [SentimentCategory.OVERALL]: -0.3,
    [SentimentCategory.PRODUCT_QUALITY]: -0.4,
    [SentimentCategory.SHIPPING]: -0.5,
    [SentimentCategory.PRICE]: -0.3,
    [SentimentCategory.CUSTOMER_SERVICE]: -0.4,
    [SentimentCategory.RETURN_PROCESS]: -0.4,
    [SentimentCategory.USER_EXPERIENCE]: -0.3,
    [SentimentCategory.CHECKOUT_PROCESS]: -0.4,
    [SentimentCategory.PRODUCT_SELECTION]: -0.2,
    [SentimentCategory.PAYMENT_OPTIONS]: -0.4
  };

  constructor(private eventBus: EventBus) {
    // Subscribe to relevant events
    this.eventBus.subscribe('feedback.processed', this.handleProcessedFeedback.bind(this));
    this.eventBus.subscribe('sentiment.analysis.completed', this.handleSentimentAnalysisCompleted.bind(this));
    this.eventBus.subscribe('sentiment.threshold.exceeded', this.handleSentimentThresholdExceeded.bind(this));
  }

  /**
   * Initialize the service with dependencies
   */
  initialize(websocketService: WebSocketService): void {
    this.websocketService = websocketService;
    logger.info('SentimentAnalysisService initialized');
  }

  /**
   * Analyze sentiment for customer feedback
   */
  async analyzeSentiment(request: SentimentAnalysisRequest): Promise<SentimentAnalysis> {
    try {
      logger.info('Analyzing sentiment for feedback', { 
        feedbackId: request.feedback_id,
        source: request.feedback_source 
      });

      // Detect language if not provided
      const language = request.language || await this.detectLanguage(request.feedback_text);

      // Perform sentiment analysis
      const analysisResult = await this.performSentimentAnalysis(request.feedback_text, language);

      // Create complete sentiment analysis record
      const analysisId = `sentiment_${uuidv4()}` as SentimentAnalysisID;
      const now = new Date().toISOString();

      const sentimentAnalysis: SentimentAnalysis = {
        id: analysisId,
        feedback_id: request.feedback_id,
        feedback_source: request.feedback_source,
        feedback_text: request.feedback_text,
        language,
        overall_sentiment: analysisResult.overall_sentiment,
        confidence: analysisResult.confidence,
        category_sentiment: analysisResult.category_sentiment || {},
        aspects: analysisResult.aspects || [],
        key_phrases: analysisResult.key_phrases || [],
        entities: analysisResult.entities || [],
        metadata: {
          ...request.metadata,
          analysis_version: '1.0'
        },
        analyzed_at: now,
        created_at: now,
        updated_at: now
      };

      // Save to database
      await this.saveSentimentAnalysis(sentimentAnalysis);

      // Emit event
      this.eventBus.publish(SentimentEventType.SENTIMENT_ANALYSIS_COMPLETED, 
        createSentimentAnalysisCompletedEvent(
          sentimentAnalysis.id,
          sentimentAnalysis.feedback_id,
          sentimentAnalysis.feedback_source,
          sentimentAnalysis.overall_sentiment,
          Object.keys(sentimentAnalysis.category_sentiment) as SentimentCategory[]
        )
      );

      // Check sentiment thresholds
      this.checkSentimentThresholds(sentimentAnalysis);

      return sentimentAnalysis;
    } catch (error) {
      logger.error('Failed to analyze sentiment', { error, feedbackId: request.feedback_id });
      
      // Emit failure event
      this.eventBus.publish(SentimentEventType.SENTIMENT_ANALYSIS_FAILED, 
        createSentimentAnalysisFailedEvent(
          request.feedback_id,
          request.feedback_source,
          error instanceof Error ? error.message : 'Unknown error'
        )
      );
      
      throw error;
    }
  }

  /**
   * Generate sentiment trend analysis for a specified period
   */
  async generateSentimentTrend(request: SentimentTrendRequest): Promise<SentimentTrend> {
    try {
      logger.info('Generating sentiment trend', { 
        periodStart: request.period_start,
        periodEnd: request.period_end 
      });

      // Get sentiment analyses for the specified period
      const analyses = await this.getSentimentAnalyses({
        period_start: request.period_start,
        period_end: request.period_end,
        sources: request.feedback_sources
      });

      if (analyses.length === 0) {
        throw new Error('No sentiment data available for the specified period');
      }

      // Calculate average sentiment
      const averageSentiment = this.calculateAverageSentiment(analyses);
      
      // Calculate sentiment distribution
      const distribution = this.calculateSentimentDistribution(analyses);
      
      // Calculate category sentiment
      const categoryScores = this.calculateCategorySentiment(analyses, request.categories);
      
      // Get top aspects (positive and negative)
      const topAspects = this.extractTopAspects(analyses);
      
      // Identify emerging topics
      const emergingTopics = await this.identifyEmergingTopics(
        request.period_start, 
        request.period_end
      );

      // Create trend record
      const trendId = `trend_${uuidv4()}` as SentimentTrendID;
      const now = new Date().toISOString();

      const trend: SentimentTrend = {
        id: trendId,
        period_start: request.period_start,
        period_end: request.period_end,
        total_feedback_count: analyses.length,
        average_sentiment: averageSentiment,
        sentiment_distribution: distribution,
        category_sentiment: categoryScores,
        top_positive_aspects: topAspects.positive,
        top_negative_aspects: topAspects.negative,
        emerging_topics: emergingTopics,
        created_at: now
      };

      // Save to database
      await this.saveSentimentTrend(trend);

      // Emit event
      this.eventBus.publish(SentimentEventType.SENTIMENT_TREND_GENERATED, 
        createSentimentTrendGeneratedEvent(
          trend.id,
          trend.period_start,
          trend.period_end,
          trend.average_sentiment,
          trend.total_feedback_count
        )
      );

      // Generate insights from trend
      await this.generateInsightsFromTrend(trend);

      return trend;
    } catch (error) {
      logger.error('Failed to generate sentiment trend', { 
        error, 
        periodStart: request.period_start, 
        periodEnd: request.period_end 
      });
      throw error;
    }
  }

  /**
   * Get sentiment insights based on filters
   */
  async getSentimentInsights(filters: {
    priority?: string;
    categories?: SentimentCategory[];
    insight_type?: string;
    period_start?: string;
    period_end?: string;
    limit?: number;
  } = {}): Promise<SentimentInsight[]> {
    try {
      // Build query
      let query = db.supabase
        .from('sentiment_insights')
        .select('*');

      // Apply filters
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }

      if (filters.insight_type) {
        query = query.eq('insight_type', filters.insight_type);
      }

      if (filters.categories && filters.categories.length > 0) {
        // Find insights where at least one category matches
        query = query.overlaps('categories', filters.categories);
      }

      if (filters.period_start) {
        query = query.gte('created_at', filters.period_start);
      }

      if (filters.period_end) {
        query = query.lte('created_at', filters.period_end);
      }

      // Order by created_at desc and apply limit
      query = query.order('created_at', { ascending: false });
      
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data as SentimentInsight[];
    } catch (error) {
      logger.error('Failed to get sentiment insights', { error, filters });
      throw error;
    }
  }

  /**
   * Get dashboard data for sentiment visualization
   */
  async getDashboardData(period_days: number = 30): Promise<SentimentDashboardData> {
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - period_days);

      // Get recent analyses
      const analyses = await this.getSentimentAnalyses({
        period_start: startDate.toISOString(),
        period_end: endDate.toISOString()
      });

      if (analyses.length === 0) {
        throw new Error('No sentiment data available for the specified period');
      }

      // Calculate overall sentiment
      const overallSentiment = this.calculateAverageSentiment(analyses);

      // Calculate sentiment distribution
      const distribution = this.calculateSentimentDistribution(analyses);

      // Calculate category sentiment
      const categoryScores = this.calculateCategorySentiment(analyses);

      // Get trending aspects
      const trendingAspects = this.extractTopAspects(analyses, 5);

      // Get recent insights
      const insights = await this.getSentimentInsights({
        period_start: startDate.toISOString(),
        period_end: endDate.toISOString(),
        limit: 5
      });

      // Calculate sentiment over time (daily)
      const sentimentOverTime = await this.calculateSentimentOverTime(
        startDate.toISOString(),
        endDate.toISOString()
      );

      return {
        overall_sentiment: overallSentiment,
        feedback_count: analyses.length,
        sentiment_distribution: distribution,
        category_sentiment: categoryScores,
        trending_aspects: {
          positive: trendingAspects.positive,
          negative: trendingAspects.negative
        },
        recent_insights: insights,
        sentiment_over_time: sentimentOverTime
      };
    } catch (error) {
      logger.error('Failed to get dashboard data', { error });
      throw error;
    }
  }

  // Private methods

  /**
   * Detect language of the provided text
   */
  private async detectLanguage(text: string): Promise<FeedbackLanguage> {
    // In a real implementation, this would use a language detection service
    // For now, use a simple heuristic based on common words
    
    const portugueseWords = ['o', 'a', 'e', 'de', 'que', 'para', 'com', 'não', 'uma', 'os'];
    const spanishWords = ['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'ser', 'por'];
    const englishWords = ['the', 'a', 'of', 'and', 'to', 'in', 'that', 'is', 'for', 'it'];
    
    const lowerText = text.toLowerCase();
    const words = lowerText.split(/\s+/);
    
    let ptCount = 0;
    let esCount = 0;
    let enCount = 0;
    
    words.forEach(word => {
      if (portugueseWords.includes(word)) ptCount++;
      if (spanishWords.includes(word)) esCount++;
      if (englishWords.includes(word)) enCount++;
    });
    
    if (ptCount > esCount && ptCount > enCount) {
      return FeedbackLanguage.PORTUGUESE;
    } else if (esCount > ptCount && esCount > enCount) {
      return FeedbackLanguage.SPANISH;
    } else if (enCount > ptCount && enCount > esCount) {
      return FeedbackLanguage.ENGLISH;
    }
    
    return FeedbackLanguage.UNKNOWN;
  }

  /**
   * Perform sentiment analysis on the provided text
   */
  private async performSentimentAnalysis(text: string, language: FeedbackLanguage): Promise<SentimentAnalysisResult> {
    // In a real implementation, this would call an NLP service like Amazon Comprehend, Google Natural Language API, etc.
    // For demonstration purposes, we'll use a simplified analysis approach
    
    // Calculate overall sentiment score (-1 to 1)
    const sentimentScore = this.calculateSimpleSentiment(text, language);
    
    // Generate category scores
    const categoryScores: Record<SentimentCategory, number> = {};
    
    // For each category, calculate a sentiment score
    Object.values(SentimentCategory).forEach(category => {
      if (category === SentimentCategory.OVERALL) {
        categoryScores[category] = sentimentScore;
        return;
      }
      
      // Check if text mentions the category
      const categoryTerms = this.getCategoryTerms(category, language);
      const categoryMentioned = categoryTerms.some(term => text.toLowerCase().includes(term.toLowerCase()));
      
      if (categoryMentioned) {
        // Calculate sentiment for sentences containing category terms
        const sentences = this.splitIntoSentences(text);
        const relevantSentences = sentences.filter(sentence => 
          categoryTerms.some(term => sentence.toLowerCase().includes(term.toLowerCase()))
        );
        
        if (relevantSentences.length > 0) {
          const categorySentiment = relevantSentences.reduce((sum, sentence) => 
            sum + this.calculateSimpleSentiment(sentence, language), 0
          ) / relevantSentences.length;
          
          categoryScores[category] = categorySentiment;
        } else {
          categoryScores[category] = 0; // Neutral if no specific mentions
        }
      }
    });
    
    // Extract aspects (product or service features mentioned in the feedback)
    const aspects = this.extractAspects(text, language);
    
    // Extract key phrases
    const keyPhrases = this.extractKeyPhrases(text);
    
    // Extract entities (people, organizations, products, etc.)
    const entities = this.extractEntities(text);
    
    return {
      feedback_id: '',  // Will be set by the caller
      feedback_source: FeedbackSourceType.OTHER,  // Will be set by the caller
      language,
      overall_sentiment: sentimentScore,
      confidence: 0.85,  // Confidence score would be provided by a real NLP service
      category_sentiment: categoryScores,
      aspects,
      key_phrases: keyPhrases,
      entities
    };
  }
  
  /**
   * Calculate a simple sentiment score for demonstration purposes
   */
  private calculateSimpleSentiment(text: string, language: FeedbackLanguage): number {
    const sentimentWords = this.getSentimentWords(language);
    const words = text.toLowerCase().match(/\b(\w+)\b/g) || [];
    
    let score = 0;
    let wordCount = 0;
    
    words.forEach(word => {
      if (sentimentWords.positive.includes(word)) {
        score += 1;
        wordCount++;
      } else if (sentimentWords.negative.includes(word)) {
        score -= 1;
        wordCount++;
      }
    });
    
    // Normalize score to range [-1, 1]
    return wordCount > 0 ? score / Math.max(wordCount, 5) : 0;
  }
  
  /**
   * Get sentiment words based on language
   */
  private getSentimentWords(language: FeedbackLanguage): { positive: string[], negative: string[] } {
    switch (language) {
      case FeedbackLanguage.PORTUGUESE:
        return {
          positive: ['bom', 'ótimo', 'excelente', 'maravilhoso', 'incrível', 'adoro', 'gosto', 'perfeito', 'recomendo', 'satisfeito'],
          negative: ['ruim', 'péssimo', 'terrível', 'horrível', 'decepcionante', 'odeio', 'não gosto', 'insatisfeito', 'problema', 'defeito']
        };
      case FeedbackLanguage.SPANISH:
        return {
          positive: ['bueno', 'genial', 'excelente', 'maravilloso', 'increíble', 'adoro', 'me gusta', 'perfecto', 'recomiendo', 'satisfecho'],
          negative: ['malo', 'pésimo', 'terrible', 'horrible', 'decepcionante', 'odio', 'no me gusta', 'insatisfecho', 'problema', 'defecto']
        };
      case FeedbackLanguage.ENGLISH:
      default:
        return {
          positive: ['good', 'great', 'excellent', 'wonderful', 'amazing', 'love', 'like', 'perfect', 'recommend', 'satisfied'],
          negative: ['bad', 'poor', 'terrible', 'horrible', 'disappointing', 'hate', 'dislike', 'unsatisfied', 'problem', 'defect']
        };
    }
  }
  
  /**
   * Get terms related to each sentiment category
   */
  private getCategoryTerms(category: SentimentCategory, language: FeedbackLanguage): string[] {
    // Map of category terms in different languages
    const categoryTermsMap: Record<FeedbackLanguage, Record<SentimentCategory, string[]>> = {
      [FeedbackLanguage.PORTUGUESE]: {
        [SentimentCategory.OVERALL]: ['tudo', 'geral', 'experiência', 'serviço'],
        [SentimentCategory.PRODUCT_QUALITY]: ['qualidade', 'produto', 'material', 'durabilidade', 'confiabilidade'],
        [SentimentCategory.SHIPPING]: ['entrega', 'frete', 'envio', 'transporte', 'embalagem'],
        [SentimentCategory.PRICE]: ['preço', 'valor', 'custo', 'caro', 'barato', 'promoção'],
        [SentimentCategory.CUSTOMER_SERVICE]: ['atendimento', 'suporte', 'assistência', 'serviço ao cliente'],
        [SentimentCategory.RETURN_PROCESS]: ['devolução', 'retorno', 'reembolso', 'troca'],
        [SentimentCategory.USER_EXPERIENCE]: ['experiência', 'usabilidade', 'interface', 'navegação', 'design'],
        [SentimentCategory.CHECKOUT_PROCESS]: ['pagamento', 'checkout', 'finalizar compra', 'carrinho'],
        [SentimentCategory.PRODUCT_SELECTION]: ['seleção', 'variedade', 'opções', 'produtos disponíveis'],
        [SentimentCategory.PAYMENT_OPTIONS]: ['pagamento', 'opções de pagamento', 'cartão', 'boleto', 'pix']
      },
      [FeedbackLanguage.SPANISH]: {
        [SentimentCategory.OVERALL]: ['todo', 'general', 'experiencia', 'servicio'],
        [SentimentCategory.PRODUCT_QUALITY]: ['calidad', 'producto', 'material', 'durabilidad', 'fiabilidad'],
        [SentimentCategory.SHIPPING]: ['entrega', 'envío', 'transporte', 'embalaje'],
        [SentimentCategory.PRICE]: ['precio', 'valor', 'costo', 'caro', 'barato', 'promoción'],
        [SentimentCategory.CUSTOMER_SERVICE]: ['atención', 'soporte', 'asistencia', 'servicio al cliente'],
        [SentimentCategory.RETURN_PROCESS]: ['devolución', 'retorno', 'reembolso', 'cambio'],
        [SentimentCategory.USER_EXPERIENCE]: ['experiencia', 'usabilidad', 'interfaz', 'navegación', 'diseño'],
        [SentimentCategory.CHECKOUT_PROCESS]: ['pago', 'checkout', 'finalizar compra', 'carrito'],
        [SentimentCategory.PRODUCT_SELECTION]: ['selección', 'variedad', 'opciones', 'productos disponibles'],
        [SentimentCategory.PAYMENT_OPTIONS]: ['pago', 'opciones de pago', 'tarjeta', 'transferencia']
      },
      [FeedbackLanguage.ENGLISH]: {
        [SentimentCategory.OVERALL]: ['overall', 'general', 'experience', 'service'],
        [SentimentCategory.PRODUCT_QUALITY]: ['quality', 'product', 'material', 'durability', 'reliability'],
        [SentimentCategory.SHIPPING]: ['shipping', 'delivery', 'package', 'transport'],
        [SentimentCategory.PRICE]: ['price', 'value', 'cost', 'expensive', 'cheap', 'promotion'],
        [SentimentCategory.CUSTOMER_SERVICE]: ['customer service', 'support', 'assistance', 'help'],
        [SentimentCategory.RETURN_PROCESS]: ['return', 'refund', 'exchange'],
        [SentimentCategory.USER_EXPERIENCE]: ['experience', 'usability', 'interface', 'navigation', 'design'],
        [SentimentCategory.CHECKOUT_PROCESS]: ['payment', 'checkout', 'cart', 'purchase'],
        [SentimentCategory.PRODUCT_SELECTION]: ['selection', 'variety', 'options', 'available products'],
        [SentimentCategory.PAYMENT_OPTIONS]: ['payment', 'payment options', 'card', 'transfer']
      },
      [FeedbackLanguage.UNKNOWN]: {
        [SentimentCategory.OVERALL]: [],
        [SentimentCategory.PRODUCT_QUALITY]: [],
        [SentimentCategory.SHIPPING]: [],
        [SentimentCategory.PRICE]: [],
        [SentimentCategory.CUSTOMER_SERVICE]: [],
        [SentimentCategory.RETURN_PROCESS]: [],
        [SentimentCategory.USER_EXPERIENCE]: [],
        [SentimentCategory.CHECKOUT_PROCESS]: [],
        [SentimentCategory.PRODUCT_SELECTION]: [],
        [SentimentCategory.PAYMENT_OPTIONS]: []
      }
    };
    
    return categoryTermsMap[language][category] || [];
  }
  
  /**
   * Split text into sentences
   */
  private splitIntoSentences(text: string): string[] {
    // Simple sentence splitting by common punctuation
    return text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  }
  
  /**
   * Extract aspects from text
   */
  private extractAspects(text: string, language: FeedbackLanguage): Array<{
    aspect: string;
    sentiment: number;
    confidence: number;
    excerpts: string[];
  }> {
    // In a real implementation, this would use a more sophisticated NLP approach
    // For demonstration, we'll use a simplified approach
    
    const sentences = this.splitIntoSentences(text);
    const aspects: Record<string, {
      sentiment: number;
      confidence: number;
      excerpts: string[];
    }> = {};
    
    // Common product aspects in e-commerce
    const commonAspects = this.getCommonAspects(language);
    
    sentences.forEach(sentence => {
      commonAspects.forEach(aspect => {
        if (sentence.toLowerCase().includes(aspect.toLowerCase())) {
          const sentimentScore = this.calculateSimpleSentiment(sentence, language);
          
          if (!aspects[aspect]) {
            aspects[aspect] = {
              sentiment: sentimentScore,
              confidence: 0.8,
              excerpts: [sentence.trim()]
            };
          } else {
            aspects[aspect].excerpts.push(sentence.trim());
            
            // Update average sentiment
            const total = aspects[aspect].sentiment * (aspects[aspect].excerpts.length - 1) + sentimentScore;
            aspects[aspect].sentiment = total / aspects[aspect].excerpts.length;
          }
        }
      });
    });
    
    // Convert to array format
    return Object.entries(aspects).map(([aspect, data]) => ({
      aspect,
      sentiment: data.sentiment,
      confidence: data.confidence,
      excerpts: data.excerpts
    }));
  }
  
  /**
   * Get common product aspects based on language
   */
  private getCommonAspects(language: FeedbackLanguage): string[] {
    switch (language) {
      case FeedbackLanguage.PORTUGUESE:
        return [
          'preço', 'qualidade', 'entrega', 'embalagem', 'atendimento', 'produto', 
          'envio', 'devolução', 'app', 'aplicativo', 'site', 'navegação', 'pagamento',
          'reembolso', 'garantia', 'cupom', 'desconto', 'promoção', 'frete'
        ];
      case FeedbackLanguage.SPANISH:
        return [
          'precio', 'calidad', 'entrega', 'embalaje', 'atención', 'producto',
          'envío', 'devolución', 'app', 'aplicación', 'sitio', 'navegación', 'pago',
          'reembolso', 'garantía', 'cupón', 'descuento', 'promoción', 'envío gratis'
        ];
      case FeedbackLanguage.ENGLISH:
      default:
        return [
          'price', 'quality', 'delivery', 'packaging', 'service', 'product',
          'shipping', 'return', 'app', 'application', 'website', 'navigation', 'payment',
          'refund', 'warranty', 'coupon', 'discount', 'promotion', 'free shipping'
        ];
    }
  }
  
  /**
   * Extract key phrases from text
   */
  private extractKeyPhrases(text: string): string[] {
    // In a real implementation, this would use a key phrase extraction service
    // For demonstration, extract noun phrases using a simple approach
    
    const sentences = this.splitIntoSentences(text);
    const phrases: string[] = [];
    
    sentences.forEach(sentence => {
      // Extract noun phrases of 2-4 words
      const words = sentence.split(/\s+/);
      
      for (let i = 0; i < words.length; i++) {
        for (let j = 2; j <= 4; j++) {
          if (i + j <= words.length) {
            const phrase = words.slice(i, i + j).join(' ');
            if (phrase.length > 5 && !phrases.includes(phrase)) {
              phrases.push(phrase);
            }
          }
        }
      }
    });
    
    // Limit to top 10 phrases
    return phrases.slice(0, 10);
  }
  
  /**
   * Extract entities from text
   */
  private extractEntities(text: string): Array<{
    entity: string;
    type: string;
    sentiment: number;
  }> {
    // In a real implementation, this would use a named entity recognition service
    // For demonstration, use a simplified approach
    
    const entities: Array<{
      entity: string;
      type: string;
      sentiment: number;
    }> = [];
    
    // Simplified product entity extraction
    const productPatterns = [
      /\b(produto|product|producto)\s+([A-Za-z0-9\s]+)/i,
      /\b(modelo|model|modelo)\s+([A-Za-z0-9\s-]+)/i,
      /\b(marca|brand|marca)\s+([A-Za-z0-9\s]+)/i
    ];
    
    productPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches && matches[2]) {
        const entity = matches[2].trim();
        const context = text.substring(Math.max(0, text.indexOf(entity) - 50), Math.min(text.length, text.indexOf(entity) + entity.length + 50));
        
        entities.push({
          entity,
          type: 'PRODUCT',
          sentiment: this.calculateSimpleSentiment(context, FeedbackLanguage.UNKNOWN)
        });
      }
    });
    
    return entities;
  }

  /**
   * Save sentiment analysis to database
   */
  private async saveSentimentAnalysis(analysis: SentimentAnalysis): Promise<void> {
    try {
      const { error } = await db.supabase
        .from('sentiment_analyses')
        .insert(analysis);
      
      if (error) {
        throw error;
      }
    } catch (error) {
      logger.error('Failed to save sentiment analysis', { error, analysisId: analysis.id });
      throw error;
    }
  }

  /**
   * Save sentiment trend to database
   */
  private async saveSentimentTrend(trend: SentimentTrend): Promise<void> {
    try {
      const { error } = await db.supabase
        .from('sentiment_trends')
        .insert(trend);
      
      if (error) {
        throw error;
      }
    } catch (error) {
      logger.error('Failed to save sentiment trend', { error, trendId: trend.id });
      throw error;
    }
  }

  /**
   * Get sentiment analyses based on filters
   */
  private async getSentimentAnalyses(filters: {
    period_start?: string;
    period_end?: string;
    sources?: FeedbackSourceType[];
    feedbackIds?: string[];
  } = {}): Promise<SentimentAnalysis[]> {
    try {
      // Build query
      let query = db.supabase
        .from('sentiment_analyses')
        .select('*');

      // Apply filters
      if (filters.period_start) {
        query = query.gte('created_at', filters.period_start);
      }

      if (filters.period_end) {
        query = query.lte('created_at', filters.period_end);
      }

      if (filters.sources && filters.sources.length > 0) {
        query = query.in('feedback_source', filters.sources);
      }

      if (filters.feedbackIds && filters.feedbackIds.length > 0) {
        query = query.in('feedback_id', filters.feedbackIds);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data as SentimentAnalysis[];
    } catch (error) {
      logger.error('Failed to get sentiment analyses', { error, filters });
      throw error;
    }
  }

  /**
   * Calculate average sentiment from multiple analyses
   */
  private calculateAverageSentiment(analyses: SentimentAnalysis[]): SentimentScore {
    if (analyses.length === 0) {
      return 0;
    }

    const sum = analyses.reduce((total, analysis) => total + analysis.overall_sentiment, 0);
    return sum / analyses.length;
  }

  /**
   * Calculate sentiment distribution
   */
  private calculateSentimentDistribution(analyses: SentimentAnalysis[]): {
    very_negative: number;
    negative: number;
    neutral: number;
    positive: number;
    very_positive: number;
  } {
    const distribution = {
      very_negative: 0,
      negative: 0,
      neutral: 0,
      positive: 0,
      very_positive: 0
    };

    analyses.forEach(analysis => {
      const score = analysis.overall_sentiment;

      if (score < -0.6) {
        distribution.very_negative++;
      } else if (score < -0.2) {
        distribution.negative++;
      } else if (score < 0.2) {
        distribution.neutral++;
      } else if (score < 0.6) {
        distribution.positive++;
      } else {
        distribution.very_positive++;
      }
    });

    return distribution;
  }

  /**
   * Calculate sentiment by category
   */
  private calculateCategorySentiment(
    analyses: SentimentAnalysis[],
    categories?: SentimentCategory[]
  ): Record<SentimentCategory, SentimentScore> {
    const categoryScores: Record<SentimentCategory, { sum: number, count: number }> = {} as any;
    
    // Initialize categories
    const categoriesToTrack = categories || Object.values(SentimentCategory);
    categoriesToTrack.forEach(category => {
      categoryScores[category] = { sum: 0, count: 0 };
    });

    // Sum sentiment scores by category
    analyses.forEach(analysis => {
      Object.entries(analysis.category_sentiment).forEach(([category, score]) => {
        if (categoriesToTrack.includes(category as SentimentCategory)) {
          categoryScores[category as SentimentCategory].sum += score;
          categoryScores[category as SentimentCategory].count++;
        }
      });
    });

    // Calculate averages
    const result: Record<SentimentCategory, SentimentScore> = {} as any;
    
    Object.entries(categoryScores).forEach(([category, data]) => {
      result[category as SentimentCategory] = data.count > 0 
        ? data.sum / data.count 
        : 0;
    });

    return result;
  }

  /**
   * Extract top positive and negative aspects
   */
  private extractTopAspects(analyses: SentimentAnalysis[], limit: number = 10): {
    positive: Array<{
      aspect: string;
      sentiment: SentimentScore;
      count: number;
    }>;
    negative: Array<{
      aspect: string;
      sentiment: SentimentScore;
      count: number;
    }>;
  } {
    // Collect all aspects
    const aspectData: Record<string, {
      sentimentSum: number;
      count: number;
    }> = {};

    analyses.forEach(analysis => {
      analysis.aspects.forEach(aspect => {
        if (!aspectData[aspect.aspect]) {
          aspectData[aspect.aspect] = {
            sentimentSum: 0,
            count: 0
          };
        }

        aspectData[aspect.aspect].sentimentSum += aspect.sentiment;
        aspectData[aspect.aspect].count++;
      });
    });

    // Convert to array with average sentiment
    const aspectArray = Object.entries(aspectData).map(([aspect, data]) => ({
      aspect,
      sentiment: data.count > 0 ? data.sentimentSum / data.count : 0,
      count: data.count
    }));

    // Split into positive and negative, then sort and limit
    const positive = aspectArray
      .filter(a => a.sentiment > 0)
      .sort((a, b) => b.sentiment - a.sentiment)
      .slice(0, limit);

    const negative = aspectArray
      .filter(a => a.sentiment < 0)
      .sort((a, b) => a.sentiment - b.sentiment)
      .slice(0, limit);

    return { positive, negative };
  }

  /**
   * Identify emerging topics in feedback
   */
  private async identifyEmergingTopics(
    periodStart: string,
    periodEnd: string
  ): Promise<Array<{
    topic: string;
    count: number;
    sentiment: SentimentScore;
    change: number;
  }>> {
    // In a real implementation, this would compare current period with previous period
    // For demonstration, use a simplified approach
    
    // Calculate previous period
    const currentStartDate = new Date(periodStart);
    const currentEndDate = new Date(periodEnd);
    const periodLength = currentEndDate.getTime() - currentStartDate.getTime();
    
    const previousEndDate = new Date(currentStartDate);
    previousEndDate.setDate(previousEndDate.getDate() - 1);
    
    const previousStartDate = new Date(previousEndDate);
    previousStartDate.setTime(previousStartDate.getTime() - periodLength);
    
    // Get analyses for current and previous periods
    const currentAnalyses = await this.getSentimentAnalyses({
      period_start: periodStart,
      period_end: periodEnd
    });
    
    const previousAnalyses = await this.getSentimentAnalyses({
      period_start: previousStartDate.toISOString(),
      period_end: previousEndDate.toISOString()
    });
    
    // Extract topics (key phrases) from analyses
    const extractTopics = (analyses: SentimentAnalysis[]): Record<string, {
      count: number;
      sentimentSum: number;
    }> => {
      const topics: Record<string, {
        count: number;
        sentimentSum: number;
      }> = {};
      
      analyses.forEach(analysis => {
        analysis.key_phrases.forEach(phrase => {
          if (!topics[phrase]) {
            topics[phrase] = {
              count: 0,
              sentimentSum: 0
            };
          }
          
          topics[phrase].count++;
          topics[phrase].sentimentSum += analysis.overall_sentiment;
        });
      });
      
      return topics;
    };
    
    const currentTopics = extractTopics(currentAnalyses);
    const previousTopics = extractTopics(previousAnalyses);
    
    // Calculate changes and identify emerging topics
    const emergingTopics: Array<{
      topic: string;
      count: number;
      sentiment: SentimentScore;
      change: number;
    }> = [];
    
    Object.entries(currentTopics).forEach(([topic, data]) => {
      const previousData = previousTopics[topic];
      const previousCount = previousData?.count || 0;
      
      const change = previousCount > 0
        ? (data.count - previousCount) / previousCount
        : data.count > 0 ? 1 : 0;
      
      // Consider a topic "emerging" if it has significant growth or is new
      if (change >= 0.5 || (previousCount === 0 && data.count >= 3)) {
        emergingTopics.push({
          topic,
          count: data.count,
          sentiment: data.count > 0 ? data.sentimentSum / data.count : 0,
          change
        });
      }
    });
    
    // Sort by change (highest first) and limit to top 10
    return emergingTopics
      .sort((a, b) => b.change - a.change)
      .slice(0, 10);
  }

  /**
   * Calculate sentiment over time
   */
  private async calculateSentimentOverTime(
    startDate: string,
    endDate: string
  ): Promise<Array<{
    date: string;
    sentiment: SentimentScore;
    feedback_count: number;
  }>> {
    try {
      // Get all analyses for the period
      const analyses = await this.getSentimentAnalyses({
        period_start: startDate,
        period_end: endDate
      });
      
      // Group by date
      const dateMap: Record<string, {
        sentimentSum: number;
        count: number;
      }> = {};
      
      analyses.forEach(analysis => {
        const date = analysis.created_at.split('T')[0]; // Extract YYYY-MM-DD
        
        if (!dateMap[date]) {
          dateMap[date] = {
            sentimentSum: 0,
            count: 0
          };
        }
        
        dateMap[date].sentimentSum += analysis.overall_sentiment;
        dateMap[date].count++;
      });
      
      // Fill in missing dates
      const result: Array<{
        date: string;
        sentiment: SentimentScore;
        feedback_count: number;
      }> = [];
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateString = d.toISOString().split('T')[0];
        const data = dateMap[dateString];
        
        result.push({
          date: dateString,
          sentiment: data ? data.sentimentSum / data.count : 0,
          feedback_count: data ? data.count : 0
        });
      }
      
      return result;
    } catch (error) {
      logger.error('Failed to calculate sentiment over time', { error, startDate, endDate });
      throw error;
    }
  }

  /**
   * Generate insights from sentiment trend
   */
  private async generateInsightsFromTrend(trend: SentimentTrend): Promise<void> {
    try {
      // Generate insights for negative categories
      const insights: SentimentInsight[] = [];
      
      // Find categories with negative sentiment
      const negativeCategories = Object.entries(trend.category_sentiment)
        .filter(([, score]) => score < -0.2)
        .sort(([, a], [, b]) => a - b)
        .slice(0, 3)
        .map(([category]) => category as SentimentCategory);
      
      if (negativeCategories.length > 0) {
        // Create an improvement opportunity insight
        const insight: SentimentInsight = {
          id: `insight_${uuidv4()}`,
          title: `Negative sentiment in ${negativeCategories.length} categories requires attention`,
          description: `Customer feedback shows negative sentiment in ${negativeCategories.map(c => c.replace('_', ' ')).join(', ')}. Immediate action recommended.`,
          insight_type: 'improvement_opportunity',
          priority: 'high',
          categories: negativeCategories,
          sentiment_scores: trend.category_sentiment,
          affected_aspects: trend.top_negative_aspects.slice(0, 3).map(a => a.aspect),
          supporting_data: {
            feedback_count: trend.total_feedback_count,
            representative_samples: [],
            confidence: 0.85
          },
          recommendations: [
            {
              department: 'customer_service',
              action: `Address negative feedback related to ${negativeCategories[0].replace('_', ' ')}`,
              expected_impact: 'high'
            },
            {
              department: 'product',
              action: 'Review and improve affected features based on feedback',
              expected_impact: 'medium'
            }
          ],
          created_at: new Date().toISOString()
        };
        
        insights.push(insight);
        
        // Save insight to database
        await db.supabase
          .from('sentiment_insights')
          .insert(insight);
        
        // Emit event
        this.eventBus.publish(SentimentEventType.SENTIMENT_INSIGHT_CREATED, 
          createSentimentInsightCreatedEvent(
            insight.id,
            insight.title,
            insight.insight_type,
            insight.priority,
            insight.categories
          )
        );
        
        // Notify department insight service
        await departmentInsightService.processSentimentInsight(insight);
      }
      
      // Identify emerging negative topics
      const emergingNegativeTopics = trend.emerging_topics
        .filter(topic => topic.sentiment < -0.3)
        .slice(0, 3);
      
      if (emergingNegativeTopics.length > 0) {
        const insight: SentimentInsight = {
          id: `insight_${uuidv4()}`,
          title: `Emerging negative topics detected`,
          description: `New or increasing negative feedback around topics: ${emergingNegativeTopics.map(t => t.topic).join(', ')}. Monitor closely.`,
          insight_type: 'emerging_issue',
          priority: 'medium',
          categories: Object.keys(trend.category_sentiment).slice(0, 3) as SentimentCategory[],
          sentiment_scores: trend.category_sentiment,
          affected_aspects: emergingNegativeTopics.map(t => t.topic),
          supporting_data: {
            feedback_count: emergingNegativeTopics.reduce((sum, t) => sum + t.count, 0),
            representative_samples: [],
            confidence: 0.75
          },
          recommendations: [
            {
              department: 'product',
              action: 'Investigate emerging negative topics and prepare action plan',
              expected_impact: 'medium'
            }
          ],
          created_at: new Date().toISOString()
        };
        
        insights.push(insight);
        
        // Save insight to database
        await db.supabase
          .from('sentiment_insights')
          .insert(insight);
        
        // Emit event
        this.eventBus.publish(SentimentEventType.SENTIMENT_INSIGHT_CREATED, 
          createSentimentInsightCreatedEvent(
            insight.id,
            insight.title,
            insight.insight_type,
            insight.priority,
            insight.categories
          )
        );
      }
      
      // If overall sentiment is positive, generate positive insight
      if (trend.average_sentiment > 0.4) {
        const positiveCategories = Object.entries(trend.category_sentiment)
          .filter(([, score]) => score > 0.4)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([category]) => category as SentimentCategory);
        
        if (positiveCategories.length > 0) {
          const insight: SentimentInsight = {
            id: `insight_${uuidv4()}`,
            title: `Strong positive sentiment in ${positiveCategories.length} categories`,
            description: `Customer feedback shows very positive sentiment in ${positiveCategories.map(c => c.replace('_', ' ')).join(', ')}. These are competitive strengths.`,
            insight_type: 'competitive_advantage',
            priority: 'medium',
            categories: positiveCategories,
            sentiment_scores: trend.category_sentiment,
            affected_aspects: trend.top_positive_aspects.slice(0, 3).map(a => a.aspect),
            supporting_data: {
              feedback_count: trend.total_feedback_count,
              representative_samples: [],
              confidence: 0.85
            },
            recommendations: [
              {
                department: 'marketing',
                action: `Highlight positive aspects of ${positiveCategories[0].replace('_', ' ')} in marketing`,
                expected_impact: 'medium'
              }
            ],
            created_at: new Date().toISOString()
          };
          
          insights.push(insight);
          
          // Save insight to database
          await db.supabase
            .from('sentiment_insights')
            .insert(insight);
          
          // Emit event
          this.eventBus.publish(SentimentEventType.SENTIMENT_INSIGHT_CREATED, 
            createSentimentInsightCreatedEvent(
              insight.id,
              insight.title,
              insight.insight_type,
              insight.priority,
              insight.categories
            )
          );
        }
      }
      
      logger.info('Generated insights from sentiment trend', { 
        trendId: trend.id, 
        insightCount: insights.length 
      });
    } catch (error) {
      logger.error('Failed to generate insights from trend', { error, trendId: trend.id });
    }
  }

  /**
   * Check sentiment thresholds and emit alerts if exceeded
   */
  private checkSentimentThresholds(analysis: SentimentAnalysis): void {
    try {
      // Check each category against thresholds
      Object.entries(analysis.category_sentiment).forEach(([category, score]) => {
        const threshold = this.sentimentThresholds[category as SentimentCategory];
        
        if (threshold && score < threshold) {
          // Threshold exceeded, emit event
          this.eventBus.publish(SentimentEventType.SENTIMENT_THRESHOLD_EXCEEDED, 
            createSentimentThresholdExceededEvent(
              category as SentimentCategory,
              score,
              threshold,
              1
            )
          );
          
          logger.warn('Sentiment threshold exceeded', { 
            category, 
            score, 
            threshold,
            feedbackId: analysis.feedback_id 
          });
          
          // Notify via WebSocket
          if (this.websocketService) {
            this.websocketService.broadcast('sentiment:threshold_exceeded', {
              category,
              score,
              threshold,
              timestamp: new Date().toISOString()
            });
          }
        }
      });
    } catch (error) {
      logger.error('Error checking sentiment thresholds', { 
        error, 
        analysisId: analysis.id 
      });
    }
  }

  // Event handlers

  /**
   * Handle processed feedback event
   */
  private async handleProcessedFeedback(data: {
    feedbackId: string;
    source: string;
    text: string;
  }): Promise<void> {
    try {
      logger.info('Handling processed feedback event', { feedbackId: data.feedbackId });
      
      // Check if already analyzed
      const existingAnalyses = await this.getSentimentAnalyses({
        feedbackIds: [data.feedbackId]
      });
      
      if (existingAnalyses.length > 0) {
        logger.info('Feedback already analyzed, skipping', { feedbackId: data.feedbackId });
        return;
      }
      
      // Analyze sentiment
      await this.analyzeSentiment({
        feedback_id: data.feedbackId,
        feedback_text: data.text,
        feedback_source: data.source as FeedbackSourceType
      });
    } catch (error) {
      logger.error('Error handling processed feedback event', { 
        error, 
        feedbackId: data.feedbackId 
      });
    }
  }

  /**
   * Handle sentiment analysis completed event
   */
  private async handleSentimentAnalysisCompleted(data: {
    analysisId: string;
    feedbackId: string;
    overallSentiment: number;
  }): Promise<void> {
    try {
      logger.info('Handling sentiment analysis completed event', { 
        analysisId: data.analysisId 
      });
      
      // Check if we need to generate a trend report
      // For demonstration, generate a daily trend if we have enough analyses
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayStr = today.toISOString();
      const tomorrowStr = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString();
      
      const todayAnalyses = await this.getSentimentAnalyses({
        period_start: todayStr,
        period_end: tomorrowStr
      });
      
      // Generate trend every 10 analyses
      if (todayAnalyses.length % 10 === 0 && todayAnalyses.length > 0) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7); // Last 7 days
        
        await this.generateSentimentTrend({
          period_start: startDate.toISOString(),
          period_end: new Date().toISOString()
        });
      }
    } catch (error) {
      logger.error('Error handling sentiment analysis completed event', { 
        error, 
        analysisId: data.analysisId 
      });
    }
  }

  /**
   * Handle sentiment threshold exceeded event
   */
  private async handleSentimentThresholdExceeded(data: {
    category: string;
    currentScore: number;
    thresholdValue: number;
  }): Promise<void> {
    try {
      logger.info('Handling sentiment threshold exceeded event', { 
        category: data.category 
      });
      
      // In a real implementation, this might trigger notifications, create support tickets, etc.
      // For demonstration, log the event
      logger.warn('Sentiment threshold exceeded, alerting stakeholders', {
        category: data.category,
        score: data.currentScore,
        threshold: data.thresholdValue
      });
    } catch (error) {
      logger.error('Error handling sentiment threshold exceeded event', { 
        error, 
        category: data.category 
      });
    }
  }
}

// Create and export service instance
export const sentimentAnalysisService = new SentimentAnalysisService(new EventBus());
export default sentimentAnalysisService;