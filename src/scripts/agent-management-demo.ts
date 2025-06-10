#!/usr/bin/env tsx

// Agent Management Demo Script
// This script demonstrates all the ways to get agents within the platform

import { db } from '../services/database';
import { logger } from '../utils/logger';

interface AgentCreationData {
  name: string;
  type: 'company' | 'customer' | 'insight' | 'product' | 'support' | 'sales';
  capabilities: string[];
  metadata?: Record<string, unknown>;
}

async function demonstrateAgentManagement() {
  console.log('🤖 Agent Management Demo');
  console.log('=' .repeat(50));

  try {
    // 1. LIST EXISTING AGENTS
    console.log('\n📋 1. Current Agents in Platform:');
    console.log('-'.repeat(30));
    
    const allAgents = await db.listAgents();
    if (allAgents.length > 0) {
      allAgents.forEach((agent, index) => {
        console.log(`${index + 1}. ${agent.name}`);
        console.log(`   Type: ${agent.type}`);
        console.log(`   Status: ${agent.status}`);
        console.log(`   Capabilities: ${JSON.stringify(agent.capabilities)}`);
        console.log(`   API Key: ****${agent.api_key?.slice(-8) || 'N/A'}`);
        console.log(`   Created: ${new Date(agent.created_at).toLocaleDateString()}`);
        console.log('');
      });
    } else {
      console.log('No agents found in the database.');
    }

    // 2. FILTER AGENTS BY TYPE
    console.log('\n🔍 2. Filter Agents by Type:');
    console.log('-'.repeat(30));
    
    const agentTypes: Array<'company' | 'customer' | 'insight' | 'product'> = ['company', 'customer', 'insight', 'product'];
    
    for (const type of agentTypes) {
      const typeAgents = await db.listAgents(type);
      console.log(`${type.toUpperCase()} agents: ${typeAgents.length}`);
      if (typeAgents.length > 0) {
        typeAgents.forEach(agent => {
          console.log(`  - ${agent.name} (${agent.status})`);
        });
      }
    }

    // 3. DISCOVER AGENTS BY CAPABILITIES
    console.log('\n🔎 3. Discover Agents by Capabilities:');
    console.log('-'.repeat(30));
    
    const capabilities = ['feedback_collection', 'data_analysis', 'feedback_response'];
    
    for (const capability of capabilities) {
      const capableAgents = allAgents.filter(agent => 
        agent.capabilities.includes(capability)
      );
      console.log(`Agents with "${capability}": ${capableAgents.length}`);
      capableAgents.forEach(agent => {
        console.log(`  - ${agent.name} (${agent.type})`);
      });
    }

    // 4. CREATE A NEW AGENT EXAMPLE
    console.log('\n✨ 4. How to Create New Agents:');
    console.log('-'.repeat(30));
    
    const newAgentExamples: AgentCreationData[] = [
      {
        name: 'Support Ticket Agent',
        type: 'support',
        capabilities: ['ticket_processing', 'customer_communication', 'escalation_handling'],
        metadata: {
          department: 'customer_support',
          priority_level: 'high',
          languages: ['en', 'es', 'fr']
        }
      },
      {
        name: 'Sales Analytics Agent',
        type: 'sales',
        capabilities: ['sales_data_analysis', 'lead_scoring', 'conversion_tracking'],
        metadata: {
          region: 'north_america',
          focus: 'b2b_sales'
        }
      }
    ];

    console.log('Example agents you could create:');
    newAgentExamples.forEach((agent, index) => {
      console.log(`\n${index + 1}. ${agent.name}`);
      console.log(`   Type: ${agent.type}`);
      console.log(`   Capabilities: ${JSON.stringify(agent.capabilities)}`);
      console.log(`   Metadata: ${JSON.stringify(agent.metadata)}`);
    });

    // 5. SHOW AGENT CONNECTIONS (if any)
    console.log('\n🔗 5. Agent Connection Methods:');
    console.log('-'.repeat(30));
    
    console.log('Agents can connect to the platform via:');
    console.log('• REST API with API key authentication');
    console.log('• WebSocket connection for real-time communication');
    console.log('• MCP Protocol for standardized agent-to-agent messaging');
    
    console.log('\nConnection endpoints:');
    console.log('• HTTP API: http://localhost:3001/api/v1/');
    console.log('• WebSocket: ws://localhost:3001/api/v1/ws');
    console.log('• Health check: http://localhost:3001/health');

    // 6. AGENT STATISTICS
    console.log('\n📊 6. Agent Statistics:');
    console.log('-'.repeat(30));
    
    const stats = {
      total: allAgents.length,
      active: allAgents.filter(a => a.status === 'active').length,
      inactive: allAgents.filter(a => a.status === 'inactive').length,
      suspended: allAgents.filter(a => a.status === 'suspended').length,
      byType: {} as Record<string, number>
    };
    
    agentTypes.forEach(type => {
      stats.byType[type] = allAgents.filter(a => a.type === type).length;
    });
    
    console.log(`Total agents: ${stats.total}`);
    console.log(`Active: ${stats.active}, Inactive: ${stats.inactive}, Suspended: ${stats.suspended}`);
    console.log('By type:', stats.byType);

    // 7. HOW TO INTEGRATE NEW AGENTS
    console.log('\n🔧 7. Integration Guide:');
    console.log('-'.repeat(30));
    
    console.log('To integrate a new agent into the platform:');
    console.log('');
    console.log('Step 1: Create agent via API');
    console.log('  POST /api/v1/agents');
    console.log('  Body: { "name": "My Agent", "type": "customer", "capabilities": ["feedback_response"] }');
    console.log('');
    console.log('Step 2: Save the returned API key');
    console.log('  The API key is only shown once during creation');
    console.log('');
    console.log('Step 3: Connect via WebSocket');
    console.log('  Connect to ws://localhost:3001/api/v1/ws');
    console.log('  Send authentication message with API key');
    console.log('');
    console.log('Step 4: Start processing MCP messages');
    console.log('  Send/receive JSON-RPC 2.0 messages');
    console.log('  Process feedback and send responses');

    console.log('\n✅ Demo completed successfully!');

  } catch (error) {
    console.error('❌ Error during agent management demo:', error);
    logger.error('Agent management demo failed', { error });
  }
}

// Run the demo
demonstrateAgentManagement(); 