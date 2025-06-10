#!/usr/bin/env tsx

// Create Company Agents Script
// Creates the 3 specialized company agents

import { db } from '../services/database';
import { logger } from '../utils/logger';
import crypto from 'crypto';
import { appConfig } from '../config/environment';

interface AgentSpec {
  name: string;
  type: 'company' | 'customer' | 'insight' | 'product' | 'support' | 'sales';
  capabilities: string[];
  metadata: Record<string, unknown>;
  description: string;
}

const companyAgentSpecs: AgentSpec[] = [
  {
    name: 'Company Context Agent',
    type: 'company',
    capabilities: [
      'context_gathering',
      'company_intelligence',
      'market_research',
      'competitive_analysis',
      'internal_data_collection',
      'stakeholder_mapping',
      'business_process_understanding'
    ],
    metadata: {
      role: 'context_collector',
      scope: 'company_wide',
      access_level: 'comprehensive',
      data_sources: [
        'internal_systems',
        'public_data',
        'market_intelligence',
        'customer_interactions',
        'employee_feedback',
        'financial_data',
        'operational_metrics'
      ],
      priority: 'high',
      automation_level: 'continuous',
      responsibility: 'Gathers all available context about the company, its operations, market position, customers, and internal processes'
    },
    description: 'Specialized agent that continuously gathers comprehensive context about the company from all available sources'
  },
  {
    name: 'Inter-Agent Communication Agent',
    type: 'insight',
    capabilities: [
      'agent_communication',
      'feedback_orchestration',
      'cross_company_negotiation',
      'information_brokering',
      'relationship_management',
      'feedback_routing',
      'priority_assessment',
      'communication_protocols'
    ],
    metadata: {
      role: 'communication_hub',
      scope: 'inter_company',
      communication_channels: [
        'internal_agents',
        'external_company_agents',
        'mcp_protocol',
        'websocket_connections',
        'api_integrations'
      ],
      priority: 'critical',
      automation_level: 'real_time',
      specialization: 'Manages all agent-to-agent communication, both internal and external',
      responsibility: 'Coordinates feedback sharing between internal agents and external company agents, determines what feedback needs to be collected and from whom'
    },
    description: 'Communication hub that manages all agent interactions, feedback sharing, and coordination between internal and external agents'
  },
  {
    name: 'Data Processing & Oversight Agent',
    type: 'product',
    capabilities: [
      'data_quality_assurance',
      'data_cleaning',
      'data_organization',
      'comprehensive_analysis',
      'process_documentation',
      'human_verification_routing',
      'workflow_monitoring',
      'process_improvement_recommendations',
      'audit_trail_management',
      'report_generation'
    ],
    metadata: {
      role: 'data_processor_overseer',
      scope: 'end_to_end_pipeline',
      priority: 'critical',
      automation_level: 'comprehensive',
      responsibilities: [
        'ensure_all_data_replied',
        'clean_and_organize_data',
        'analyze_data_comprehensively',
        'route_to_verification_agents_or_humans',
        'document_entire_process',
        'enable_human_observation',
        'suggest_process_improvements'
      ],
      quality_standards: {
        completeness: 'all_data_processed',
        accuracy: 'verified_and_validated',
        timeliness: 'real_time_processing',
        transparency: 'full_audit_trail'
      },
      human_interaction: {
        verification_routing: true,
        process_documentation: true,
        improvement_suggestions: true,
        dashboard_updates: true
      },
      responsibility: 'Ensures data completeness, quality, analysis, and provides full process oversight with human-readable documentation'
    },
    description: 'End-to-end data processing agent that ensures data quality, completeness, analysis, and provides full process oversight with human transparency'
  }
];

function generateApiKey(): string {
  const randomBytes = crypto.randomBytes(32);
  return `${appConfig.security.apiKeyPrefix}${randomBytes.toString('hex')}`;
}

async function createCompanyAgents() {
  console.log('🏢 Creating Company Agents');
  console.log('=' .repeat(50));

  try {
    // 1. Check current agents
    console.log('\n📋 Current Agents:');
    const currentAgents = await db.listAgents();
    currentAgents.forEach((agent, index) => {
      console.log(`${index + 1}. ${agent.name} (${agent.type}) - ${agent.status}`);
    });

    // 2. Create new agents
    console.log('\n✨ Creating New Company Agents:');
    console.log('-'.repeat(30));

    const createdAgents = [];

    for (const spec of companyAgentSpecs) {
      console.log(`\nCreating: ${spec.name}`);
      
      try {
        // Generate API key
        const apiKey = generateApiKey();
        
        // Create agent in database
        const agent = await db.createAgent({
          name: spec.name,
          type: spec.type,
          capabilities: spec.capabilities,
          metadata: spec.metadata,
          api_key: apiKey,
          status: 'active',
          last_seen: null
        });

        console.log(`✅ Created: ${agent.name}`);
        console.log(`   ID: ${agent.id}`);
        console.log(`   Type: ${agent.type}`);
        console.log(`   API Key: ${apiKey}`);
        console.log(`   Capabilities: ${spec.capabilities.length} capabilities`);
        console.log(`   Role: ${spec.metadata.role}`);
        
        createdAgents.push({
          ...agent,
          api_key: apiKey,
          spec: spec
        });

      } catch (error) {
        console.error(`❌ Failed to create ${spec.name}:`, error);
      }
    }

    // 3. Summary
    console.log('\n📊 Creation Summary:');
    console.log('-'.repeat(30));
    console.log(`Successfully created: ${createdAgents.length}/3 agents`);
    
    if (createdAgents.length > 0) {
      console.log('\n🔑 API Keys (SAVE THESE - They won\'t be shown again):');
      createdAgents.forEach((agent, index) => {
        console.log(`${index + 1}. ${agent.name}: ${agent.api_key}`);
      });

      // 4. Integration guide
      console.log('\n🔗 Integration Guide:');
      console.log('-'.repeat(30));
      
      console.log('\n1. Company Context Agent:');
      console.log('   • Connects to internal systems and external data sources');
      console.log('   • Continuously gathers company intelligence');
      console.log('   • Provides context to other agents');
      console.log('   • WebSocket: ws://localhost:3001/api/v1/ws');
      
      console.log('\n2. Inter-Agent Communication Agent:');
      console.log('   • Hub for all agent-to-agent communication');
      console.log('   • Manages feedback sharing between companies');
      console.log('   • Determines feedback collection priorities');
      console.log('   • Handles MCP protocol communications');
      
      console.log('\n3. Data Processing & Oversight Agent:');
      console.log('   • Ensures all data is processed and verified');
      console.log('   • Provides full process documentation');
      console.log('   • Routes data to humans for verification');
      console.log('   • Generates improvement recommendations');

      // 5. Workflow example
      console.log('\n🔄 Workflow Example:');
      console.log('-'.repeat(30));
      console.log(`
1. Company Context Agent gathers market intelligence
2. Inter-Agent Communication Agent receives context
3. Communication Agent talks to external company agents
4. Feedback is collected and routed to Processing Agent
5. Processing Agent ensures data quality and completeness
6. Processed data is sent to humans for verification
7. Process is documented and improvements suggested
      `);

      // 6. Next steps
      console.log('\n🚀 Next Steps:');
      console.log('-'.repeat(30));
      console.log('1. Save the API keys above');
      console.log('2. Start the server: npm run start:dev');
      console.log('3. Test agent connections via WebSocket');
      console.log('4. Implement your specific business logic');
      console.log('5. Deactivate old agents if needed');
      
      console.log('\n✅ Company agents created successfully!');
    }

  } catch (error) {
    console.error('❌ Error creating company agents:', error);
    logger.error('Company agent creation failed', { error });
  }
}

// Run the creation
createCompanyAgents(); 