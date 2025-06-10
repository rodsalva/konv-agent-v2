/**
 * Database Check Script
 * Verifies Supabase connection and checks if required tables exist
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { Database } from '../types/database.types';

// Load environment variables
dotenv.config();

async function checkDatabase() {
  console.log('Database Check Script');
  console.log('=====================');
  
  // Check environment variables
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env file');
    process.exit(1);
  }
  
  console.log('✅ Supabase credentials found in .env file');
  
  // Create Supabase client
  const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);
  
  // Check connection
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Successfully connected to Supabase');
  } catch (error) {
    console.error('❌ Failed to connect to Supabase:', error);
    process.exit(1);
  }
  
  // Check required tables
  const requiredTables = [
    'agents',
    'agent_messages',
    'feedback_data',
    'insights',
    'audit_logs',
    'agent_capabilities'
  ];
  
  const missingTables: string[] = [];
  
  for (const table of requiredTables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        missingTables.push(table);
        console.error(`❌ Table '${table}' check failed:`, error.message);
      } else {
        console.log(`✅ Table '${table}' exists with ${count} records`);
      }
    } catch (error) {
      missingTables.push(table);
      console.error(`❌ Table '${table}' check failed:`, error);
    }
  }
  
  // Check if schema needs to be created
  if (missingTables.length > 0) {
    console.log('\n❌ Some tables are missing. You need to create the database schema.');
    console.log('Run the following command to apply the schema:');
    console.log('\nnpx supabase db push');
    console.log('\nOr manually run the SQL script in supabase_schema.sql using the Supabase SQL editor.');
  } else {
    console.log('\n✅ All required tables exist in the database');
  }
}

// Run the check
checkDatabase().catch(console.error);