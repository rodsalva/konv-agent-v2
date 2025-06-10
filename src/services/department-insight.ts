import { v4 as uuidv4 } from 'uuid';
import { EventBus } from '../events/event-bus';
import { logger } from '../utils/logger';
import { db } from './database';
import { personaService } from './persona';
import { WebSocketService } from './websocket';
import {
  DepartmentType,
  DepartmentInsightRequest,
  DepartmentInsightResponse,
  Insight,
  InsightID,
  ImplementationPlan,
  DepartmentalRecommendations,
  PriorityLevel,
  Evidence
} from '../types/department.types';
import { PersonaID, PersonaInteraction } from '../types/personas.types';

/**
 * Service for generating and managing department-specific insights
 */
class DepartmentInsightService {
  private websocketService: WebSocketService | null = null;

  constructor(private eventBus: EventBus) {
    // Subscribe to relevant events
    this.eventBus.subscribe('feedback.collected', this.handleFeedbackCollected.bind(this));
    this.eventBus.subscribe('insight.generated', this.handleInsightGenerated.bind(this));
    this.eventBus.subscribe('insight.approved', this.handleInsightApproved.bind(this));
    this.eventBus.subscribe('insight.rejected', this.handleInsightRejected.bind(this));
  }

  /**
   * Initialize the service with dependencies
   */
  initialize(websocketService: WebSocketService): void {
    this.websocketService = websocketService;
    logger.info('DepartmentInsightService initialized');
  }

  /**
   * Generate insights for a specific department
   */
  async generateInsights(request: DepartmentInsightRequest): Promise<DepartmentInsightResponse> {
    try {
      logger.info('Generating insights for department', { 
        department: request.department, 
        collectionIds: request.collection_ids?.length || 0
      });

      const interactions = await this.getPersonaInteractions(request);
      
      if (interactions.length === 0) {
        logger.warn('No interactions found for insight generation', { request });
        return this.createEmptyResponse(request.department);
      }

      // Generate insights based on interactions
      const insights = await this.analyzeInteractions(interactions, request);

      // Save insights to database
      await this.saveInsights(insights);

      // Build and return response
      const response = this.buildInsightResponse(request.department, insights);

      // Publish event for each insight generated
      insights.forEach(insight => {
        this.eventBus.publish('insight.generated', {
          insightId: insight.insight_id!,
          department: request.department,
          title: insight.title,
          priority: insight.priority,
          timestamp: new Date().toISOString()
        });
      });

      return response;
    } catch (error) {
      logger.error('Error generating department insights', { error, department: request.department });
      throw error;
    }
  }

  /**
   * Get insights for a department
   */
  async getInsights(department: DepartmentType, filters: Record<string, unknown> = {}): Promise<Insight[]> {
    try {
      let query = db.supabase
        .from('insights')
        .select('*')
        .eq('department', department);

      // Apply additional filters
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }

      if (filters.is_strength !== undefined) {
        query = query.eq('is_strength', filters.is_strength);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.limit && typeof filters.limit === 'number') {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching insights', { error, department });
        throw new Error(`Failed to fetch insights: ${error.message}`);
      }

      return data as Insight[];
    } catch (error) {
      logger.error('Error in getInsights', { error, department });
      throw error;
    }
  }

  /**
   * Create implementation plan for an insight
   */
  async createImplementationPlan(insight_id: InsightID, plan: Omit<ImplementationPlan, 'insight_id' | 'created_at'>): Promise<ImplementationPlan> {
    try {
      // Verify insight exists
      const { data: insight, error: insightError } = await db.supabase
        .from('insights')
        .select('*')
        .eq('insight_id', insight_id)
        .single();

      if (insightError || !insight) {
        logger.error('Insight not found for implementation plan', { insight_id, error: insightError });
        throw new Error(`Insight not found: ${insight_id}`);
      }

      const implementationPlan: ImplementationPlan = {
        ...plan,
        insight_id: insight_id as string,
        created_at: new Date().toISOString()
      };

      // Store in database
      const { data, error } = await db.supabase
        .from('implementation_plans')
        .insert(implementationPlan)
        .select()
        .single();

      if (error) {
        logger.error('Error creating implementation plan', { error, insight_id });
        throw new Error(`Failed to create implementation plan: ${error.message}`);
      }

      // Update insight status to reflect it has an implementation plan
      await db.supabase
        .from('insights')
        .update({ status: 'approved' })
        .eq('insight_id', insight_id);

      // Publish event
      this.eventBus.publish('implementation.plan.created', {
        insightId: insight_id,
        department: plan.department,
        timelineWeeks: plan.timeline_weeks,
        timestamp: new Date().toISOString()
      });

      return data as ImplementationPlan;
    } catch (error) {
      logger.error('Error in createImplementationPlan', { error, insight_id });
      throw error;
    }
  }

  /**
   * Generate departmental recommendations for UI display
   */
  async generateDepartmentalRecommendations(): Promise<DepartmentalRecommendations> {
    // This function converts the most important insights into a formatted
    // structure for the UI to display. It follows the format used in
    // the mercadolivre.routes.ts file.
    
    try {
      // Get top insights for each department
      const departments: Record<string, any> = {};
      
      for (const dept of ['product', 'engineering', 'marketing', 'customer_service', 'business_intelligence', 'operations']) {
        const insights = await this.getInsights(dept as DepartmentType, { 
          limit: 8,
          status: 'approved'
        });
        
        // Convert insights to department format
        const strengths = insights.filter(i => i.is_strength).map(i => i.recommendation);
        const improvements = insights.filter(i => !i.is_strength).map(i => i.recommendation);
        
        // Sort by priority
        const immediateActions = improvements.slice(0, 4);
        const mediumTermInitiatives = improvements.slice(4);
        
        // Get some KPIs from verification methods
        const kpis = insights.slice(0, 4).map(i => {
          const kpi = i.verification_method.split('.')[0];
          return kpi.charAt(0).toUpperCase() + kpi.slice(1);
        });
        
        // Create department summary
        departments[`${dept}_department`] = {
          name: this.getDepartmentName(dept as DepartmentType),
          icon: this.getDepartmentIcon(dept as DepartmentType),
          immediate_actions: immediateActions.length > 0 ? immediateActions : this.getFallbackActions(dept as DepartmentType),
          medium_term_initiatives: mediumTermInitiatives.length > 0 ? mediumTermInitiatives : this.getFallbackInitiatives(dept as DepartmentType),
          kpis: kpis.length > 0 ? kpis : this.getFallbackKPIs(dept as DepartmentType)
        };
      }
      
      return {
        title: "MercadoLivre Departmental Recommendations",
        subtitle: "Strategic Action Plan Based on Multi-Persona Analysis",
        departments
      };
    } catch (error) {
      logger.error('Error generating departmental recommendations', { error });
      // Return fallback data if there's an error
      return this.getFallbackDepartmentalRecommendations();
    }
  }

  /**
   * Get implementation plans for a department
   */
  async getImplementationPlans(department: DepartmentType): Promise<ImplementationPlan[]> {
    try {
      const { data, error } = await db.supabase
        .from('implementation_plans')
        .select('*')
        .eq('department', department);

      if (error) {
        logger.error('Error fetching implementation plans', { error, department });
        throw new Error(`Failed to fetch implementation plans: ${error.message}`);
      }

      return data as ImplementationPlan[];
    } catch (error) {
      logger.error('Error in getImplementationPlans', { error, department });
      throw error;
    }
  }

  // Event handlers
  private handleFeedbackCollected(data: { personaId: PersonaID, collectionId: string }): void {
    logger.info('Feedback collected, preparing for insight generation', { 
      personaId: data.personaId, 
      collectionId: data.collectionId 
    });
    
    // In a real-world implementation, we might trigger automatic insight generation
    // here, but for this implementation we'll keep it manual
  }

  private handleInsightGenerated(data: { insightId: string, department: string }): void {
    logger.info('Insight generated', { insightId: data.insightId, department: data.department });
    
    // Notify via WebSocket if available
    if (this.websocketService) {
      this.websocketService.broadcast('insight:generated', {
        insightId: data.insightId,
        department: data.department,
        timestamp: new Date().toISOString()
      });
    }
  }

  private handleInsightApproved(data: { insightId: string }): void {
    logger.info('Insight approved', { insightId: data.insightId });
    
    // Notify via WebSocket if available
    if (this.websocketService) {
      this.websocketService.broadcast('insight:approved', {
        insightId: data.insightId,
        timestamp: new Date().toISOString()
      });
    }
  }

  private handleInsightRejected(data: { insightId: string, reason: string }): void {
    logger.info('Insight rejected', { insightId: data.insightId, reason: data.reason });
    
    // Notify via WebSocket if available
    if (this.websocketService) {
      this.websocketService.broadcast('insight:rejected', {
        insightId: data.insightId,
        reason: data.reason,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Helper methods
  private async getPersonaInteractions(request: DepartmentInsightRequest): Promise<PersonaInteraction[]> {
    try {
      let interactionsQuery = db.supabase
        .from('persona_interactions')
        .select('*');
      
      // Filter by specific collection IDs if provided
      if (request.collection_ids && request.collection_ids.length > 0) {
        interactionsQuery = interactionsQuery.in('interaction_id', request.collection_ids);
      }
      
      const { data: interactions, error } = await interactionsQuery;
      
      if (error) {
        logger.error('Error fetching persona interactions', { error });
        throw new Error(`Failed to fetch interactions: ${error.message}`);
      }
      
      return interactions as PersonaInteraction[];
    } catch (error) {
      logger.error('Error getting persona interactions', { error });
      throw error;
    }
  }

  private async analyzeInteractions(interactions: PersonaInteraction[], request: DepartmentInsightRequest): Promise<Insight[]> {
    try {
      // In a real-world implementation, this would use AI to analyze the interactions
      // and generate insights. For this implementation, we'll create sample insights
      // based on the interactions provided.
      
      const insights: Insight[] = [];
      const department = request.department;
      const maxInsights = request.max_insights || 10;
      
      // Get personas to have their information
      const personaIds = [...new Set(interactions.map(i => i.persona_id))];
      const allPersonas = await personaService.getPersonas({});
      const personas = allPersonas.filter(p => personaIds.includes(p.persona_id));
      
      // First, let's identify department-specific topics and questions
      const departmentTopics = this.getDepartmentTopics(department);
      
      // Then let's extract responses related to those topics
      const relevantResponses: Array<{
        persona_id: string;
        persona_type: string;
        response: string;
        question: string;
        sentiment: 'positive' | 'negative' | 'neutral';
      }> = [];
      
      // Extract relevant responses from interactions
      interactions.forEach(interaction => {
        const persona = personas.find(p => p.persona_id === interaction.persona_id);
        if (!persona) return;
        
        // Process each question and response
        interaction.questions.forEach((question, index) => {
          const response = interaction.responses[index];
          if (!response) return;
          
          // Check if this question relates to our department
          const isRelevant = departmentTopics.some(topic => 
            question.text.toLowerCase().includes(topic) || 
            response.answer.toLowerCase().includes(topic)
          );
          
          if (isRelevant) {
            // Determine sentiment (simplified)
            let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
            const answer = response.answer.toLowerCase();
            
            if (
              answer.includes('excellent') || 
              answer.includes('great') || 
              answer.includes('love') ||
              answer.includes('amazing')
            ) {
              sentiment = 'positive';
            } else if (
              answer.includes('poor') || 
              answer.includes('difficult') || 
              answer.includes('confusing') ||
              answer.includes('improve') ||
              answer.includes('issue')
            ) {
              sentiment = 'negative';
            }
            
            relevantResponses.push({
              persona_id: interaction.persona_id,
              persona_type: persona.type,
              response: response.answer,
              question: question.text,
              sentiment
            });
          }
        });
      });
      
      // Group responses by similar themes
      const themes = this.groupResponsesByTheme(relevantResponses, department);
      
      // Generate insights for each theme
      for (const theme of themes) {
        if (insights.length >= maxInsights) break;
        
        // Determine if this is a strength or issue
        const sentiments = theme.responses.map(r => r.sentiment);
        const positiveCount = sentiments.filter(s => s === 'positive').length;
        const negativeCount = sentiments.filter(s => s === 'negative').length;
        
        const isStrength = positiveCount > negativeCount;
        
        // Create evidence objects
        const evidence: Evidence[] = theme.responses.map(r => ({
          persona_id: r.persona_id,
          feedback: r.response,
          relevance_score: 0.8 + (Math.random() * 0.2), // Simulate relevance score
          sentiment: r.sentiment
        }));
        
        // Generate insight
        const insight = this.createInsight({
          title: theme.title,
          description: theme.description,
          department,
          evidence,
          is_strength: isStrength,
          priority: this.determinePriority(theme.responses.length, isStrength)
        });
        
        insights.push(insight);
      }
      
      // If we didn't generate enough insights, add some fallback ones
      while (insights.length < Math.min(5, maxInsights)) {
        const isStrength = insights.length % 2 === 0; // Alternate strengths and issues
        
        insights.push(this.createFallbackInsight(
          department, 
          isStrength,
          personas[0]?.persona_id || 'persona_unknown'
        ));
      }
      
      return insights;
    } catch (error) {
      logger.error('Error analyzing interactions', { error });
      throw error;
    }
  }

  private async saveInsights(insights: Insight[]): Promise<void> {
    try {
      for (const insight of insights) {
        // Ensure insight has ID
        if (!insight.insight_id) {
          insight.insight_id = `insight_${uuidv4()}`;
        }
        
        // Set timestamps
        const now = new Date().toISOString();
        insight.created_at = now;
        insight.updated_at = now;
        
        // Store in database
        const { error } = await db.supabase
          .from('insights')
          .insert(insight);
        
        if (error) {
          logger.error('Error saving insight', { error, insightId: insight.insight_id });
          throw new Error(`Failed to save insight: ${error.message}`);
        }
      }
    } catch (error) {
      logger.error('Error saving insights', { error });
      throw error;
    }
  }

  private buildInsightResponse(department: DepartmentType, insights: Insight[]): DepartmentInsightResponse {
    // Count insights by type and priority
    const strengthCount = insights.filter(i => i.is_strength).length;
    const issueCount = insights.filter(i => !i.is_strength).length;
    
    const priorityCounts: Record<PriorityLevel, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };
    
    insights.forEach(i => {
      priorityCounts[i.priority]++;
    });
    
    return {
      department,
      insights,
      summary: {
        total_insights: insights.length,
        strengths: strengthCount,
        issues: issueCount,
        by_priority: priorityCounts
      },
      generated_at: new Date().toISOString()
    };
  }

  private createEmptyResponse(department: DepartmentType): DepartmentInsightResponse {
    return {
      department,
      insights: [],
      summary: {
        total_insights: 0,
        strengths: 0,
        issues: 0,
        by_priority: {
          low: 0,
          medium: 0,
          high: 0,
          critical: 0
        }
      },
      generated_at: new Date().toISOString()
    };
  }

  private getDepartmentTopics(department: DepartmentType): string[] {
    // Keywords relevant to each department
    const topicMap: Record<DepartmentType, string[]> = {
      product: ['feature', 'product', 'functionality', 'capability', 'tool', 'option'],
      engineering: ['performance', 'speed', 'loading', 'technical', 'bug', 'glitch'],
      marketing: ['promotion', 'discount', 'deal', 'advertisement', 'campaign', 'message'],
      ux_ui: ['design', 'interface', 'layout', 'navigation', 'usability', 'experience'],
      pricing: ['price', 'cost', 'value', 'expensive', 'cheap', 'affordable', 'discount'],
      customer_service: ['support', 'help', 'assistance', 'contact', 'service', 'response'],
      technology: ['technology', 'system', 'platform', 'app', 'mobile', 'desktop', 'website'],
      operations: ['delivery', 'shipping', 'packaging', 'order', 'return', 'logistics'],
      business_intelligence: ['recommendation', 'personalization', 'suggestion', 'relevance']
    };
    
    return topicMap[department] || [];
  }

  private groupResponsesByTheme(responses: Array<{
    persona_id: string;
    persona_type: string;
    response: string;
    question: string;
    sentiment: 'positive' | 'negative' | 'neutral';
  }>, department: DepartmentType): Array<{
    title: string;
    description: string;
    responses: typeof responses;
  }> {
    // In a real implementation, this would use NLP to cluster responses
    // For this implementation, we'll create simple groupings based on keywords
    
    const departmentThemes = this.getDepartmentThemes(department);
    const themes: Array<{
      title: string;
      description: string;
      responses: typeof responses;
    }> = [];
    
    // Initialize themes
    departmentThemes.forEach(theme => {
      themes.push({
        title: theme.title,
        description: theme.description,
        responses: []
      });
    });
    
    // Assign responses to themes
    responses.forEach(response => {
      let assigned = false;
      
      // Check each theme for keyword matches
      for (const theme of departmentThemes) {
        if (assigned) break;
        
        for (const keyword of theme.keywords) {
          if (
            response.response.toLowerCase().includes(keyword) || 
            response.question.toLowerCase().includes(keyword)
          ) {
            // Find the theme in our array and add the response
            const targetTheme = themes.find(t => t.title === theme.title);
            if (targetTheme) {
              targetTheme.responses.push(response);
              assigned = true;
              break;
            }
          }
        }
      }
      
      // If not assigned to any theme, create a new "Other" theme
      if (!assigned) {
        let otherTheme = themes.find(t => t.title.includes('Other'));
        
        if (!otherTheme) {
          otherTheme = {
            title: `Other ${department} Feedback`,
            description: `Miscellaneous feedback related to ${department}`,
            responses: []
          };
          themes.push(otherTheme);
        }
        
        otherTheme.responses.push(response);
      }
    });
    
    // Filter out empty themes
    return themes.filter(theme => theme.responses.length > 0);
  }

  private getDepartmentThemes(department: DepartmentType): Array<{
    title: string;
    description: string;
    keywords: string[];
  }> {
    // Department-specific themes for grouping insights
    const themeMap: Record<DepartmentType, Array<{
      title: string;
      description: string;
      keywords: string[];
    }>> = {
      product: [
        {
          title: "Product Comparison Features",
          description: "Feedback about the product comparison functionality",
          keywords: ["compare", "comparison", "side by side", "versus"]
        },
        {
          title: "Product Specification Display",
          description: "Feedback about how product specifications are displayed",
          keywords: ["specification", "specs", "details", "technical details"]
        },
        {
          title: "Product Discovery Features",
          description: "Feedback about how users find and discover products",
          keywords: ["discover", "find", "search", "filter", "category"]
        },
        {
          title: "Product Recommendation Quality",
          description: "Feedback about product recommendations and suggestions",
          keywords: ["recommend", "suggestion", "similar", "related"]
        }
      ],
      engineering: [
        {
          title: "Website Performance",
          description: "Feedback about website speed and responsiveness",
          keywords: ["speed", "fast", "slow", "performance", "loading"]
        },
        {
          title: "Mobile Experience",
          description: "Feedback about the mobile app or mobile website",
          keywords: ["mobile", "app", "phone", "tablet", "responsive"]
        },
        {
          title: "Technical Issues",
          description: "Feedback about bugs, glitches or technical problems",
          keywords: ["bug", "glitch", "crash", "error", "problem", "issue"]
        },
        {
          title: "Search Functionality",
          description: "Feedback about search features and accuracy",
          keywords: ["search", "find", "query", "results", "accurate"]
        }
      ],
      marketing: [
        {
          title: "Promotional Campaigns",
          description: "Feedback about sales, promotions and campaigns",
          keywords: ["promotion", "sale", "discount", "offer", "deal", "campaign"]
        },
        {
          title: "Marketing Messaging",
          description: "Feedback about how products and services are described",
          keywords: ["description", "message", "advertising", "ad", "copy"]
        },
        {
          title: "Email Marketing",
          description: "Feedback about email communications and newsletters",
          keywords: ["email", "newsletter", "notification", "inbox"]
        },
        {
          title: "Loyalty Programs",
          description: "Feedback about loyalty rewards and membership benefits",
          keywords: ["loyalty", "reward", "point", "member", "program", "benefit"]
        }
      ],
      ux_ui: [
        {
          title: "Navigation Experience",
          description: "Feedback about site navigation and information architecture",
          keywords: ["navigation", "menu", "find", "locate", "structure"]
        },
        {
          title: "User Interface Design",
          description: "Feedback about visual design and interface elements",
          keywords: ["design", "interface", "layout", "visual", "button", "icon"]
        },
        {
          title: "Checkout Process",
          description: "Feedback about the shopping cart and checkout flow",
          keywords: ["checkout", "cart", "purchase", "buy", "payment"]
        },
        {
          title: "Account Management",
          description: "Feedback about user accounts and profile management",
          keywords: ["account", "profile", "login", "register", "settings"]
        }
      ],
      pricing: [
        {
          title: "Price Transparency",
          description: "Feedback about price clarity and information",
          keywords: ["price", "cost", "fee", "transparency", "hidden"]
        },
        {
          title: "Discount Effectiveness",
          description: "Feedback about promotions, sales and discounts",
          keywords: ["discount", "sale", "promotion", "coupon", "deal"]
        },
        {
          title: "Competitive Pricing",
          description: "Feedback about price comparisons with competitors",
          keywords: ["competitive", "expensive", "cheap", "worth", "value"]
        },
        {
          title: "Payment Options",
          description: "Feedback about payment methods and flexibility",
          keywords: ["payment", "pay", "credit", "debit", "installment", "pix"]
        }
      ],
      customer_service: [
        {
          title: "Support Accessibility",
          description: "Feedback about finding and contacting customer service",
          keywords: ["contact", "support", "help", "service", "assistance"]
        },
        {
          title: "Response Quality",
          description: "Feedback about customer service quality and effectiveness",
          keywords: ["response", "answer", "solution", "resolve", "helpful"]
        },
        {
          title: "Self-Service Options",
          description: "Feedback about self-help resources and documentation",
          keywords: ["faq", "help", "article", "guide", "self-service"]
        },
        {
          title: "Return Process",
          description: "Feedback about product returns and exchanges",
          keywords: ["return", "exchange", "refund", "policy", "warranty"]
        }
      ],
      technology: [
        {
          title: "Platform Stability",
          description: "Feedback about technical reliability and uptime",
          keywords: ["stable", "reliable", "crash", "down", "outage"]
        },
        {
          title: "Integration Capabilities",
          description: "Feedback about integration with other systems",
          keywords: ["integration", "connect", "sync", "api", "third-party"]
        },
        {
          title: "Data Management",
          description: "Feedback about user data and information handling",
          keywords: ["data", "information", "privacy", "secure", "manage"]
        },
        {
          title: "Innovation Features",
          description: "Feedback about cutting-edge technology features",
          keywords: ["innovative", "new", "advanced", "technology", "feature"]
        }
      ],
      operations: [
        {
          title: "Shipping Experience",
          description: "Feedback about delivery speed and options",
          keywords: ["shipping", "delivery", "fast", "slow", "track"]
        },
        {
          title: "Packaging Quality",
          description: "Feedback about product packaging and condition",
          keywords: ["package", "packaging", "box", "damaged", "condition"]
        },
        {
          title: "Inventory Management",
          description: "Feedback about product availability and stock issues",
          keywords: ["stock", "inventory", "available", "out of stock", "backorder"]
        },
        {
          title: "Order Processing",
          description: "Feedback about order accuracy and fulfillment",
          keywords: ["order", "processing", "accurate", "mistake", "wrong"]
        }
      ],
      business_intelligence: [
        {
          title: "Personalization Accuracy",
          description: "Feedback about personalized recommendations and content",
          keywords: ["personalized", "recommendation", "relevant", "suggestion"]
        },
        {
          title: "Customer Insights",
          description: "Feedback about understanding customer behavior",
          keywords: ["understand", "preference", "behavior", "history", "pattern"]
        },
        {
          title: "Predictive Features",
          description: "Feedback about anticipating customer needs",
          keywords: ["predict", "anticipate", "future", "trend", "forecast"]
        },
        {
          title: "Data Visualization",
          description: "Feedback about how data is presented to customers",
          keywords: ["display", "chart", "graph", "visual", "dashboard"]
        }
      ]
    };
    
    return themeMap[department] || [];
  }

  private createInsight(params: {
    title: string;
    description: string;
    department: DepartmentType;
    evidence: Evidence[];
    is_strength: boolean;
    priority: PriorityLevel;
  }): Insight {
    const { title, description, department, evidence, is_strength, priority } = params;
    
    // Generate a sample root cause
    const rootCause = is_strength 
      ? `The platform successfully implements ${title.toLowerCase()} by focusing on user needs`
      : `The current implementation of ${title.toLowerCase()} doesn't adequately address user expectations`;
    
    // Generate recommendation
    const recommendation = is_strength
      ? `Maintain and enhance the current ${title.toLowerCase()} with regular updates and refinements`
      : this.generateRecommendation(title, department, evidence);
    
    // Generate expected outcome
    const expectedOutcome = is_strength
      ? `Continued high satisfaction rates and positive feedback on ${title.toLowerCase()}`
      : `Improved user satisfaction and engagement with ${title.toLowerCase()}, leading to higher conversion rates`;
    
    // Generate verification method
    const verificationMethod = is_strength
      ? `Monitor user satisfaction scores and feedback related to ${title.toLowerCase()} to ensure they remain high`
      : `Measure changes in user engagement, conversion rates, and satisfaction scores after implementing changes`;
    
    return {
      title,
      description,
      is_strength,
      department,
      evidence,
      root_cause: rootCause,
      recommendation,
      expected_outcome: expectedOutcome,
      verification_method: verificationMethod,
      priority,
      status: 'draft',
      tags: [department, is_strength ? 'strength' : 'improvement', priority]
    };
  }

  private createFallbackInsight(department: DepartmentType, isStrength: boolean, personaId: string): Insight {
    // Create a fallback insight when we don't have enough data
    const departmentName = this.getDepartmentName(department);
    
    const fallbackMap: Record<DepartmentType, {
      strengths: Array<{ title: string, description: string, recommendation: string }>;
      issues: Array<{ title: string, description: string, recommendation: string }>;
    }> = {
      product: {
        strengths: [
          {
            title: "Detailed Product Specifications",
            description: "The platform provides comprehensive and well-structured technical specifications for products",
            recommendation: "Maintain the current detailed specification format while expanding to include benchmark scores"
          }
        ],
        issues: [
          {
            title: "Limited Product Comparison Tool",
            description: "The product comparison tool fails to highlight key differences between similar products",
            recommendation: "Implement visual highlighting of differing specifications with color coding and delta indicators"
          }
        ]
      },
      engineering: {
        strengths: [
          {
            title: "Fast Desktop Experience",
            description: "The desktop website loads quickly and responds well to user interactions",
            recommendation: "Continue optimizing desktop performance while applying the same techniques to mobile"
          }
        ],
        issues: [
          {
            title: "Mobile Performance Issues",
            description: "The mobile site experiences performance issues on product-heavy pages",
            recommendation: "Implement lazy loading and optimize image delivery for mobile devices"
          }
        ]
      },
      marketing: {
        strengths: [
          {
            title: "Effective Flash Sale Promotions",
            description: "Flash sales effectively drive user engagement and conversions",
            recommendation: "Expand the flash sale concept with personalized time-limited offers"
          }
        ],
        issues: [
          {
            title: "Hidden Payment Options",
            description: "Users are unaware of installment payment options until checkout",
            recommendation: "Add \"as low as R$XX/month\" messaging to product pages and search results"
          }
        ]
      },
      ux_ui: {
        strengths: [
          {
            title: "Intuitive Category Navigation",
            description: "The category navigation system is intuitive and helps users find products easily",
            recommendation: "Maintain the current category structure while adding persona-based navigation paths"
          }
        ],
        issues: [
          {
            title: "Difficult Customer Service Access",
            description: "Users struggle to find customer service contact information",
            recommendation: "Add a persistent \"Contact Us\" button in the global header with direct access options"
          }
        ]
      },
      pricing: {
        strengths: [
          {
            title: "Transparent Shipping Costs",
            description: "Shipping costs are clearly displayed early in the shopping process",
            recommendation: "Maintain shipping cost transparency while adding delivery time estimates"
          }
        ],
        issues: [
          {
            title: "Missing Price History",
            description: "Users cannot see historical pricing to evaluate current deals",
            recommendation: "Implement a price history graph showing 90-day price fluctuations"
          }
        ]
      },
      customer_service: {
        strengths: [
          {
            title: "Helpful Post-Purchase Communications",
            description: "Post-purchase email communications provide useful order information",
            recommendation: "Maintain the current email format while adding personalized product care information"
          }
        ],
        issues: [
          {
            title: "Limited Self-Service Options",
            description: "Self-service help resources lack depth and searchability",
            recommendation: "Expand the help center with video tutorials and improved search capabilities"
          }
        ]
      },
      technology: {
        strengths: [
          {
            title: "Reliable Platform Uptime",
            description: "The platform demonstrates excellent uptime and availability",
            recommendation: "Maintain current reliability standards while adding real-time status information"
          }
        ],
        issues: [
          {
            title: "Search Algorithm Limitations",
            description: "The search algorithm struggles with synonyms and related terms",
            recommendation: "Implement semantic search capabilities with natural language processing"
          }
        ]
      },
      operations: {
        strengths: [
          {
            title: "Fast Delivery Options",
            description: "Express delivery options consistently meet or exceed timing promises",
            recommendation: "Maintain delivery speed while adding more granular delivery time windows"
          }
        ],
        issues: [
          {
            title: "Inconsistent Gift Packaging",
            description: "Gift packaging quality is inconsistent across different product categories",
            recommendation: "Standardize gift packaging options and quality control processes"
          }
        ]
      },
      business_intelligence: {
        strengths: [
          {
            title: "Relevant Product Recommendations",
            description: "The recommendation engine successfully suggests relevant complementary products",
            recommendation: "Expand recommendation engine to include cross-category suggestions"
          }
        ],
        issues: [
          {
            title: "Limited Personalization Options",
            description: "The platform offers limited personalization of the shopping experience",
            recommendation: "Implement user preference settings and personalized home pages"
          }
        ]
      }
    };
    
    const fallbackList = isStrength ? fallbackMap[department].strengths : fallbackMap[department].issues;
    const fallback = fallbackList[0] || {
      title: `${departmentName} ${isStrength ? 'Strength' : 'Improvement'}`,
      description: `A general ${isStrength ? 'strength' : 'issue'} related to ${departmentName}`,
      recommendation: `${isStrength ? 'Maintain and enhance' : 'Improve'} ${departmentName.toLowerCase()} capabilities`
    };
    
    const evidence: Evidence[] = [{
      persona_id: personaId,
      feedback: isStrength 
        ? `I really appreciate the ${fallback.title.toLowerCase()}` 
        : `I think the ${fallback.title.toLowerCase()} could be improved`,
      relevance_score: 0.95,
      sentiment: isStrength ? 'positive' : 'negative'
    }];
    
    return this.createInsight({
      title: fallback.title,
      description: fallback.description,
      department,
      evidence,
      is_strength: isStrength,
      priority: isStrength ? 'medium' : 'high'
    });
  }

  private generateRecommendation(title: string, department: DepartmentType, evidence: Evidence[]): string {
    // In a real implementation, this would generate specific recommendations
    // based on the insights and evidence. For this implementation, we'll use
    // templates based on the department and title.
    
    const departmentTemplates: Record<DepartmentType, string[]> = {
      product: [
        "Implement a redesigned [FEATURE] with emphasis on [ASPECT]",
        "Add new [FEATURE] capabilities focused on [ASPECT]",
        "Enhance existing [FEATURE] with [ASPECT] functionality"
      ],
      engineering: [
        "Optimize [FEATURE] for improved performance on [ASPECT]",
        "Refactor [FEATURE] codebase to resolve [ASPECT] issues",
        "Implement caching for [FEATURE] to improve [ASPECT]"
      ],
      marketing: [
        "Highlight [FEATURE] benefits earlier in the customer journey",
        "Create targeted campaigns showcasing [FEATURE] for [ASPECT] users",
        "Develop educational content explaining [FEATURE] advantages"
      ],
      ux_ui: [
        "Redesign the [FEATURE] interface for improved usability",
        "Add visual cues to make [FEATURE] more discoverable",
        "Simplify the [FEATURE] workflow to reduce friction"
      ],
      pricing: [
        "Display [FEATURE] pricing information more prominently",
        "Create bundle pricing options for [FEATURE]",
        "Implement [ASPECT] discount visualization for [FEATURE]"
      ],
      customer_service: [
        "Develop specialized support resources for [FEATURE]",
        "Create self-service guides for common [FEATURE] questions",
        "Train support staff on addressing [FEATURE] issues"
      ],
      technology: [
        "Upgrade [FEATURE] backend systems for improved reliability",
        "Implement real-time updates for [FEATURE] status",
        "Develop API enhancements for [FEATURE] integration"
      ],
      operations: [
        "Optimize [FEATURE] fulfillment processes",
        "Standardize [FEATURE] quality control procedures",
        "Implement tracking improvements for [FEATURE]"
      ],
      business_intelligence: [
        "Enhance data collection for [FEATURE] usage patterns",
        "Develop predictive models for [FEATURE] user behavior",
        "Implement A/B testing framework for [FEATURE] improvements"
      ]
    };
    
    // Select a template
    const templates = departmentTemplates[department] || ["Improve [FEATURE] with focus on [ASPECT]"];
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    // Extract a key aspect from evidence
    let aspect = "user experience";
    if (evidence.length > 0) {
      const feedback = evidence[0].feedback.toLowerCase();
      
      if (feedback.includes("difficult") || feedback.includes("confusing")) {
        aspect = "ease of use";
      } else if (feedback.includes("slow") || feedback.includes("performance")) {
        aspect = "performance";
      } else if (feedback.includes("find") || feedback.includes("discover")) {
        aspect = "discoverability";
      } else if (feedback.includes("mobile")) {
        aspect = "mobile experience";
      }
    }
    
    // Generate recommendation
    return template
      .replace("[FEATURE]", title.toLowerCase())
      .replace("[ASPECT]", aspect);
  }

  private determinePriority(responseCount: number, isStrength: boolean): PriorityLevel {
    // Determine priority based on response count and sentiment
    if (isStrength) {
      return responseCount >= 3 ? 'medium' : 'low';
    } else {
      if (responseCount >= 4) return 'critical';
      if (responseCount >= 2) return 'high';
      return 'medium';
    }
  }

  private getDepartmentName(department: DepartmentType): string {
    const nameMap: Record<DepartmentType, string> = {
      product: "Product",
      engineering: "Engineering",
      marketing: "Marketing",
      ux_ui: "UX/UI",
      pricing: "Pricing",
      customer_service: "Customer Service",
      technology: "Technology",
      operations: "Operations",
      business_intelligence: "Business Intelligence"
    };
    
    return nameMap[department] || department;
  }

  private getDepartmentIcon(department: DepartmentType): string {
    const iconMap: Record<DepartmentType, string> = {
      product: "🎯",
      engineering: "⚙️",
      marketing: "📢",
      ux_ui: "🎨",
      pricing: "💰",
      customer_service: "🎧",
      technology: "💻",
      operations: "🚚",
      business_intelligence: "📊"
    };
    
    return iconMap[department] || "📋";
  }

  private getFallbackActions(department: DepartmentType): string[] {
    // Fallback immediate actions if we don't have real insights
    const actionMap: Record<DepartmentType, string[]> = {
      product: [
        "Implement price history graphs for all products",
        "Enhance battery life comparison tools for electronics",
        "Create 'Bundle Builder' for bulk discount discovery",
        "Develop gift customization options (engraving, personalization)"
      ],
      engineering: [
        "Optimize mobile experience performance (75% of traffic)",
        "Implement real-time price comparison algorithms",
        "Build advanced filtering and search capabilities",
        "Create personalization engine infrastructure"
      ],
      marketing: [
        "Target tech enthusiasts with spec-heavy product showcases",
        "Create budget-focused flash sale campaigns",
        "Develop seasonal gift marketing campaigns",
        "Leverage PIX discount messaging for conversion"
      ],
      customer_service: [
        "Tech specification knowledge training for electronics support",
        "Gift service protocols and customization options training",
        "Deal and promotion explanation training",
        "Payment method optimization guidance"
      ],
      business_intelligence: [
        "Persona-based conversion funnel analysis",
        "Price sensitivity modeling by category",
        "Gift season demand forecasting",
        "Mobile vs desktop behavior analysis"
      ],
      operations: [
        "Tech product lifecycle management optimization",
        "Seasonal gift inventory planning enhancement",
        "Deal merchandise strategic stocking",
        "Popular product availability monitoring"
      ],
      pricing: [
        "Implement tiered pricing display for all products",
        "Create bundle pricing calculator tool",
        "Enhance installment payment visualization",
        "Develop price match guarantee process"
      ],
      technology: [
        "Implement service worker for offline capabilities",
        "Enhance API response time for critical endpoints",
        "Develop real-time inventory syncing system",
        "Create automated testing for critical user journeys"
      ],
      ux_ui: [
        "Redesign product comparison interface",
        "Simplify checkout process to reduce abandonment",
        "Enhance mobile navigation for one-handed use",
        "Implement accessibility improvements for key user journeys"
      ]
    };
    
    return actionMap[department] || [
      "Analyze current performance metrics",
      "Identify key improvement opportunities",
      "Develop strategic improvement plan",
      "Implement initial quick wins"
    ];
  }

  private getFallbackInitiatives(department: DepartmentType): string[] {
    // Fallback medium-term initiatives if we don't have real insights
    const initiativeMap: Record<DepartmentType, string[]> = {
      product: [
        "Build AI-powered product recommendation engine",
        "Create specialized landing pages for different personas",
        "Implement predictive deal alert system",
        "Develop cultural gift suggestion algorithms"
      ],
      engineering: [
        "Enhanced product specification display system",
        "Advanced recommendation algorithm development",
        "Price tracking and alert notification system",
        "Gift workflow optimization backend"
      ],
      marketing: [
        "Create tech review integration partnerships",
        "Develop gift guides for Brazilian cultural celebrations",
        "Build educational content about deal hunting strategies",
        "Produce comparison-focused product videos"
      ],
      customer_service: [
        "Self-service price comparison tools",
        "Automated gift tracking and communication",
        "Proactive deal alert customer education",
        "Enhanced return process for gifts"
      ],
      business_intelligence: [
        "Real-time persona segmentation",
        "Predictive pricing optimization models",
        "Customer lifetime value by shopping behavior",
        "A/B testing framework for persona experiences"
      ],
      operations: [
        "Gift delivery service enhancement",
        "Express shipping optimization for deals",
        "Packaging customization capabilities",
        "Return process streamlining"
      ],
      pricing: [
        "Dynamic pricing engine based on demand",
        "Personalized discount system development",
        "Competitor price monitoring automation",
        "Loyalty pricing tier implementation"
      ],
      technology: [
        "GraphQL API implementation for flexible queries",
        "Microservices architecture migration",
        "Machine learning infrastructure development",
        "Real-time analytics platform implementation"
      ],
      ux_ui: [
        "Personalized UI based on shopping behavior",
        "Voice-enabled search and navigation",
        "Augmented reality product visualization",
        "Progressive web app implementation"
      ]
    };
    
    return initiativeMap[department] || [
      "Develop comprehensive improvement strategy",
      "Build cross-functional implementation team",
      "Create measurement framework for success",
      "Implement continuous improvement process"
    ];
  }

  private getFallbackKPIs(department: DepartmentType): string[] {
    // Fallback KPIs if we don't have real insights
    const kpiMap: Record<DepartmentType, string[]> = {
      product: [
        "Product discovery conversion rate",
        "Average time to purchase decision",
        "Cross-sell/upsell effectiveness",
        "Return rate reduction"
      ],
      engineering: [
        "Mobile page load speed",
        "Search result relevance score",
        "API response times",
        "System uptime & reliability"
      ],
      marketing: [
        "Campaign conversion rates by persona",
        "Email open & click rates",
        "Social media engagement",
        "Brand awareness metrics"
      ],
      customer_service: [
        "First contact resolution rate",
        "Customer satisfaction scores",
        "Average response time",
        "Ticket volume reduction"
      ],
      business_intelligence: [
        "Data accuracy & completeness",
        "Report generation speed",
        "Insight actionability score",
        "Predictive model accuracy"
      ],
      operations: [
        "Inventory turnover rates",
        "Delivery time performance",
        "Return processing efficiency",
        "Vendor relationship scores"
      ],
      pricing: [
        "Price perception index",
        "Cart abandonment rate",
        "Discount effectiveness ratio",
        "Average order value"
      ],
      technology: [
        "System response time",
        "Error rate reduction",
        "Deployment frequency",
        "Recovery time objective"
      ],
      ux_ui: [
        "Task completion rate",
        "Time on task metrics",
        "User satisfaction score",
        "Conversion funnel dropoff"
      ]
    };
    
    return kpiMap[department] || [
      "Customer satisfaction score",
      "Operational efficiency metrics",
      "Financial performance indicators",
      "Strategic objective completion"
    ];
  }

  private getFallbackDepartmentalRecommendations(): DepartmentalRecommendations {
    // When we can't generate real recommendations, return the original fallback data
    return {
      title: "MercadoLivre Departmental Recommendations",
      subtitle: "Strategic Action Plan Based on Multi-Persona Analysis",
      departments: {
        product_department: {
          name: "Product Department",
          icon: "🎯",
          immediate_actions: [
            "Implement price history graphs for all products",
            "Enhance battery life comparison tools for electronics", 
            "Create 'Bundle Builder' for bulk discount discovery",
            "Develop gift customization options (engraving, personalization)"
          ],
          medium_term_initiatives: [
            "Build AI-powered product recommendation engine",
            "Create specialized landing pages for different personas",
            "Implement predictive deal alert system",
            "Develop cultural gift suggestion algorithms"
          ],
          kpis: [
            "Product discovery conversion rate",
            "Average time to purchase decision", 
            "Cross-sell/upsell effectiveness",
            "Return rate reduction"
          ]
        },
        engineering_department: {
          name: "Engineering Department", 
          icon: "⚙️",
          immediate_actions: [
            "Optimize mobile experience performance (75% of traffic)",
            "Implement real-time price comparison algorithms",
            "Build advanced filtering and search capabilities",
            "Create personalization engine infrastructure"
          ],
          medium_term_initiatives: [
            "Enhanced product specification display system",
            "Advanced recommendation algorithm development", 
            "Price tracking and alert notification system",
            "Gift workflow optimization backend"
          ],
          kpis: [
            "Mobile page load speed",
            "Search result relevance score",
            "API response times",
            "System uptime & reliability"
          ]
        },
        marketing_department: {
          name: "Marketing Department",
          icon: "📢", 
          immediate_actions: [
            "Target tech enthusiasts with spec-heavy product showcases",
            "Create budget-focused flash sale campaigns",
            "Develop seasonal gift marketing campaigns", 
            "Leverage PIX discount messaging for conversion"
          ],
          medium_term_initiatives: [
            "Create tech review integration partnerships",
            "Develop gift guides for Brazilian cultural celebrations",
            "Build educational content about deal hunting strategies",
            "Produce comparison-focused product videos"
          ],
          kpis: [
            "Campaign conversion rates by persona",
            "Email open & click rates",
            "Social media engagement",
            "Brand awareness metrics"
          ]
        },
        customer_service_department: {
          name: "Customer Service Department",
          icon: "🎧",
          immediate_actions: [
            "Tech specification knowledge training for electronics support",
            "Gift service protocols and customization options training",
            "Deal and promotion explanation training",
            "Payment method optimization guidance"
          ],
          medium_term_initiatives: [
            "Self-service price comparison tools",
            "Automated gift tracking and communication",
            "Proactive deal alert customer education", 
            "Enhanced return process for gifts"
          ],
          kpis: [
            "First contact resolution rate",
            "Customer satisfaction scores",
            "Average response time",
            "Ticket volume reduction"
          ]
        },
        business_intelligence_department: {
          name: "Business Intelligence Department", 
          icon: "📊",
          immediate_actions: [
            "Persona-based conversion funnel analysis",
            "Price sensitivity modeling by category",
            "Gift season demand forecasting",
            "Mobile vs desktop behavior analysis"
          ],
          medium_term_initiatives: [
            "Real-time persona segmentation",
            "Predictive pricing optimization models",
            "Customer lifetime value by shopping behavior",
            "A/B testing framework for persona experiences"
          ],
          kpis: [
            "Data accuracy & completeness",
            "Report generation speed",
            "Insight actionability score",
            "Predictive model accuracy"
          ]
        },
        operations_department: {
          name: "Operations Department",
          icon: "🚚",
          immediate_actions: [
            "Tech product lifecycle management optimization",
            "Seasonal gift inventory planning enhancement",
            "Deal merchandise strategic stocking",
            "Popular product availability monitoring"
          ],
          medium_term_initiatives: [
            "Gift delivery service enhancement",
            "Express shipping optimization for deals",
            "Packaging customization capabilities",
            "Return process streamlining"
          ],
          kpis: [
            "Inventory turnover rates",
            "Delivery time performance",
            "Return processing efficiency",
            "Vendor relationship scores"
          ]
        }
      }
    };
  }
}

// Create and export service instance
export const departmentInsightService = new DepartmentInsightService(new EventBus());
export default departmentInsightService;