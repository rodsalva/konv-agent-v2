import { db } from '../services/database';
import { logger } from '../utils/logger';

const ORIGINAL_AGENTS_TO_DELETE = [
  '5f825fc7-c8f5-44d3-9079-cbbd2673f3de', // Customer Feedback Agent
  '43f4646a-e78b-49a9-9e13-c88b8ab83730', // Insight Analysis Agent
  '6a012ce2-c5ec-45cc-8174-2c6929a96a57', // Product Team Agent
  '739b40fc-1295-423f-a61a-68c1aa8b617d'  // Company Survey Agent
];

const ORIGINAL_AGENT_NAMES = [
  'Customer Feedback Agent',
  'Insight Analysis Agent', 
  'Product Team Agent',
  'Company Survey Agent'
];

async function deleteOriginalAgents() {
  console.log('Deleting Original Agents');
  console.log('========================');
  
  console.log('\nOriginal agents to be deleted:');
  ORIGINAL_AGENT_NAMES.forEach((name, index) => {
    console.log(`${index + 1}. ${name}`);
  });
  
  console.log('\nStarting deletion process...');
  
  let deletedCount = 0;
  
  for (let i = 0; i < ORIGINAL_AGENTS_TO_DELETE.length; i++) {
    const agentId = ORIGINAL_AGENTS_TO_DELETE[i];
    const agentName = ORIGINAL_AGENT_NAMES[i];
    
    try {
      console.log(`\n${i + 1}. Deleting ${agentName}...`);
      
      await db.updateAgent(agentId, {
        status: 'suspended' as const,
        api_key: null
      });
      
      console.log(`   Successfully deactivated ${agentName}`);
      deletedCount++;
      
    } catch (error) {
      console.error(`   Failed to delete ${agentName}:`, error);
      logger.error(`Failed to delete agent ${agentName}`, { error, agentId: agentId });
    }
  }
  
  console.log(`\nDeletion Summary:`);
  console.log(`Successfully deleted: ${deletedCount}/${ORIGINAL_AGENTS_TO_DELETE.length} agents`);
  
  if (deletedCount === ORIGINAL_AGENTS_TO_DELETE.length) {
    console.log('\nAll original agents deleted successfully!');
    console.log('\nRemaining agents are your new AI-powered agents:');
    console.log('• Company Context Agent (AI)');
    console.log('• Inter-Agent Communication Agent (AI)');
    console.log('• Data Processing & Oversight Agent (AI)');
  } else {
    console.log(`\n${ORIGINAL_AGENTS_TO_DELETE.length - deletedCount} agents failed to delete`);
  }
  
  console.log('\nChecking remaining agents...');
  try {
    const remainingAgents = await db.listAgents(undefined, 'active');
    console.log(`\nActive agents remaining: ${remainingAgents.length}`);
    remainingAgents.forEach((agent, index) => {
      console.log(`${index + 1}. ${agent.name} (${agent.type})`);
    });
  } catch (error) {
    console.error('Failed to list remaining agents:', error);
  }
}

deleteOriginalAgents(); 