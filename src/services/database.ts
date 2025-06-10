import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { appConfig } from '@/config/environment';
import { logger } from '@/utils/logger';

// Database types (we'll generate these later)
export interface Database {
  public: {
    Tables: {
      agents: {
        Row: {
          id: string;
          name: string;
          type: 'company' | 'customer' | 'insight' | 'product' | 'support' | 'sales';
          status: 'active' | 'inactive' | 'suspended';
          capabilities: string[];
          metadata: Record<string, any>;
          api_key: string | null;
          created_at: string;
          updated_at: string;
          last_seen: string | null;
        };
        Insert: Omit<Database['public']['Tables']['agents']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['agents']['Insert']>;
      };
      agent_messages: {
        Row: {
          id: string;
          from_agent_id: string;
          to_agent_id: string;
          message_type: string;
          method: string | null;
          params: Record<string, any> | null;
          result: Record<string, any> | null;
          error_code: number | null;
          error_message: string | null;
          status: 'pending' | 'delivered' | 'processed' | 'failed';
          correlation_id: string | null;
          created_at: string;
          processed_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['agent_messages']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['agent_messages']['Insert']>;
      };
      feedback_data: {
        Row: {
          id: string;
          customer_agent_id: string;
          company_agent_id: string;
          raw_feedback: Record<string, any>;
          processed_feedback: Record<string, any> | null;
          feedback_type: string | null;
          status: 'raw' | 'processed' | 'analyzed' | 'archived';
          sentiment_score: number | null;
          confidence_score: number | null;
          tags: string[] | null;
          created_at: string;
          processed_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['feedback_data']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['feedback_data']['Insert']>;
      };
      personas: {
        Row: {
          persona_id: string;
          name: string;
          type: string;
          characteristics: Record<string, any>;
          preferences: Record<string, any>;
          behaviors: Record<string, any>;
          customization: Record<string, any> | null;
          created_at: string;
          updated_at: string;
          is_active: boolean;
        };
        Insert: Omit<Database['public']['Tables']['personas']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['personas']['Insert']>;
      };
      persona_interactions: {
        Row: {
          interaction_id: string;
          persona_id: string;
          platform: string;
          timestamp: string;
          questions: Record<string, any>[];
          responses: Record<string, any>[];
          metadata: Record<string, any> | null;
        };
        Insert: Database['public']['Tables']['persona_interactions']['Row'];
        Update: Partial<Database['public']['Tables']['persona_interactions']['Insert']>;
      };
      insights: {
        Row: {
          insight_id: string;
          title: string;
          description: string;
          is_strength: boolean;
          department: string;
          evidence: Record<string, any>[];
          root_cause: string | null;
          recommendation: string;
          expected_outcome: string;
          verification_method: string;
          priority: string;
          created_at: string;
          updated_at: string;
          status: string;
          tags: string[] | null;
        };
        Insert: Omit<Database['public']['Tables']['insights']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['insights']['Insert']>;
      };
      implementation_plans: {
        Row: {
          plan_id: number;
          insight_id: string;
          department: string;
          title: string;
          overview: string;
          steps: Record<string, any>[];
          timeline_weeks: number;
          estimated_cost: number | null;
          risk_factors: string[] | null;
          success_metrics: string[];
          created_at: string;
          updated_at: string;
          status: string;
        };
        Insert: Omit<Database['public']['Tables']['implementation_plans']['Row'], 'plan_id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['implementation_plans']['Insert']>;
      };
      department_metrics: {
        Row: {
          metric_id: number;
          department: string;
          name: string;
          description: string | null;
          current_value: number | null;
          target_value: number | null;
          unit: string | null;
          measurement_frequency: string | null;
          last_updated: string;
          trend: string | null;
          status: string | null;
        };
        Insert: Omit<Database['public']['Tables']['department_metrics']['Row'], 'metric_id' | 'last_updated'>;
        Update: Partial<Database['public']['Tables']['department_metrics']['Insert']>;
      };
    };
  };
}

class DatabaseService {
  private client: SupabaseClient<Database>;

  constructor() {
    this.client = createClient<Database>(
      appConfig.database.url,
      appConfig.database.serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }

  // Agent operations
  async createAgent(agent: Database['public']['Tables']['agents']['Insert']) {
    const { data, error } = await this.client
      .from('agents')
      .insert(agent)
      .select()
      .single();

    if (error) {
      logger.error('Failed to create agent', { error, agent });
      throw new Error(`Failed to create agent: ${error.message}`);
    }

    logger.info('Agent created successfully', { agentId: data.id, name: data.name });
    return data;
  }

  async getAgent(id: string) {
    const { data, error } = await this.client
      .from('agents')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      logger.error('Failed to get agent', { error, agentId: id });
      throw new Error(`Failed to get agent: ${error.message}`);
    }

    return data;
  }

  async getAgentByApiKey(apiKey: string) {
    const { data, error } = await this.client
      .from('agents')
      .select('*')
      .eq('api_key', apiKey)
      .single();

    if (error) {
      logger.error('Failed to get agent by API key', { error });
      throw new Error(`Failed to get agent by API key: ${error.message}`);
    }

    return data;
  }

  async listAgents(type?: string, status?: string) {
    let query = this.client.from('agents').select('*');

    if (type) {
      query = query.eq('type', type);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Failed to list agents', { error, type, status });
      throw new Error(`Failed to list agents: ${error.message}`);
    }

    return data;
  }

  async updateAgent(id: string, updates: Database['public']['Tables']['agents']['Update']) {
    const { data, error } = await this.client
      .from('agents')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update agent', { error, agentId: id, updates });
      throw new Error(`Failed to update agent: ${error.message}`);
    }

    logger.info('Agent updated successfully', { agentId: id });
    return data;
  }

  // Message operations
  async createMessage(message: Database['public']['Tables']['agent_messages']['Insert']) {
    const { data, error } = await this.client
      .from('agent_messages')
      .insert(message)
      .select()
      .single();

    if (error) {
      logger.error('Failed to create message', { error, message });
      throw new Error(`Failed to create message: ${error.message}`);
    }

    logger.debug('Message created successfully', { messageId: data.id });
    return data;
  }

  async getMessages(agentId: string, limit: number = 50) {
    const { data, error } = await this.client
      .from('agent_messages')
      .select('*')
      .or(`from_agent_id.eq.${agentId},to_agent_id.eq.${agentId}`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Failed to get messages', { error, agentId });
      throw new Error(`Failed to get messages: ${error.message}`);
    }

    return data;
  }

  // Feedback operations
  async createFeedback(feedback: Database['public']['Tables']['feedback_data']['Insert']) {
    const { data, error } = await this.client
      .from('feedback_data')
      .insert(feedback)
      .select()
      .single();

    if (error) {
      logger.error('Failed to create feedback', { error, feedback });
      throw new Error(`Failed to create feedback: ${error.message}`);
    }

    logger.info('Feedback created successfully', { feedbackId: data.id });
    return data;
  }

  async getFeedback(id: string) {
    const { data, error } = await this.client
      .from('feedback_data')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      logger.error('Failed to get feedback', { error, feedbackId: id });
      throw new Error(`Failed to get feedback: ${error.message}`);
    }

    return data;
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const { data, error } = await this.client
        .from('agents')
        .select('count')
        .limit(1);

      return !error;
    } catch (error) {
      logger.error('Database health check failed', { error });
      return false;
    }
  }

  // Get the client for advanced operations
  getClient(): SupabaseClient<Database> {
    return this.client;
  }
}

// Export singleton instance
export const db = new DatabaseService();
export default db; 