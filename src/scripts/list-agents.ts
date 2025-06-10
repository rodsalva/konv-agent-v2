/**
 * List Agents Script
 * Fetches and displays all agents in the database
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { Database } from '../types/database.types';

// Load environment variables
dotenv.config();

async function listAgents() {
  console.log('List Agents Script');
  console.log('=================');
  
  // Check environment variables
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env file');
    process.exit(1);
  }
  
  // Create Supabase client
  const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);
  
  // Fetch agents
  try {
    const { data, error } = await supabase
      .from('agents')
      .select('*');
    
    if (error) {
      throw error;
    }
    
    console.log(`Found ${data.length} agents:`);
    console.log('-----------------------');
    
    data.forEach(agent => {
      console.log(`ID: ${agent.id}`);
      console.log(`Name: ${agent.name}`);
      console.log(`Type: ${agent.type}`);
      console.log(`Status: ${agent.status}`);
      console.log(`Capabilities: ${JSON.stringify(agent.capabilities)}`);
      console.log(`API Key: ${agent.api_key ? '****' + agent.api_key.substring(agent.api_key.length - 8) : 'None'}`);
      console.log(`Created: ${new Date(agent.created_at).toLocaleString()}`);
      console.log('-----------------------');
    });
  } catch (error) {
    console.error('❌ Failed to fetch agents:', error);
    process.exit(1);
  }
}

// Run the script
listAgents().catch(console.error);