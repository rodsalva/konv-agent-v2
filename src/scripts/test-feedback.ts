/**
 * Test Feedback Script
 * Submits a test feedback and processes it through the pipeline
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';
import { feedbackService } from '../services/feedback';
import { IFeedbackSubmission } from '../types/feedback/feedback.types';
import { ValidationStage } from '../pipeline/stages/validation-stage';
import { EnrichmentStage } from '../pipeline/stages/enrichment-stage';
import { AnalysisStage } from '../pipeline/stages/analysis-stage';
import { DistributionStage } from '../pipeline/stages/distribution-stage';
import { Pipeline } from '../pipeline/pipeline';
import { eventBus } from '../events/event-bus';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config();

async function testFeedbackPipeline() {
  console.log('Test Feedback Pipeline');
  console.log('=====================');
  
  // Create Supabase client
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env file');
    process.exit(1);
  }
  
  const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);
  
  // Fetch agents for testing
  console.log('Fetching agents...');
  
  const { data: agents, error: agentError } = await supabase
    .from('agents')
    .select('*');
  
  if (agentError || !agents || agents.length < 2) {
    console.error('❌ Failed to fetch agents or not enough agents found:', agentError);
    process.exit(1);
  }
  
  // Find a company agent and a customer agent
  const companyAgent = agents.find(a => a.type === 'company');
  const customerAgent = agents.find(a => a.type === 'customer');
  
  if (!companyAgent || !customerAgent) {
    console.error('❌ Could not find required agent types. Need at least one company and one customer agent.');
    process.exit(1);
  }
  
  console.log(`Using company agent: ${companyAgent.name} (${companyAgent.id})`);
  console.log(`Using customer agent: ${customerAgent.name} (${customerAgent.id})`);
  
  // Create test feedback
  const testFeedback: IFeedbackSubmission = {
    customer_agent_id: customerAgent.id,
    company_agent_id: companyAgent.id,
    content: {
      text: "I really like your product, but I'm having an issue with the login page. Sometimes it takes too long to load. Other than that, the user interface is very intuitive and easy to use!",
      rating: 4
    },
    feedback_type: 'review',
    context: {
      source: 'web',
      channel: 'customer_portal',
      sessionId: uuidv4(),
      locale: 'en-US',
      device: 'desktop',
      platform: 'windows',
      timestamp: new Date().toISOString()
    },
    metadata: {
      testRun: true,
      version: '1.0.0'
    }
  };
  
  console.log('\nTest feedback created:');
  console.log('---------------------');
  console.log(JSON.stringify(testFeedback, null, 2));
  
  // Initialize pipeline manually for testing
  console.log('\nInitializing pipeline...');
  
  const pipeline = new Pipeline<IFeedbackSubmission, any>({
    name: 'TestFeedbackPipeline',
    eventBus,
    continueOnError: false,
    publishEvents: true
  });
  
  pipeline
    .addStage(new ValidationStage())
    .addStage(new EnrichmentStage())
    .addStage(new AnalysisStage())
    .addStage(new DistributionStage());
  
  console.log(`Pipeline created with ${pipeline.getStagesCount()} stages`);
  
  // Process the feedback
  console.log('\nProcessing feedback through pipeline...');
  
  const correlationId = `test-${uuidv4()}`;
  const startTime = Date.now();
  
  try {
    const result = await pipeline.process(
      testFeedback, 
      { correlationId, feedbackId: uuidv4() }
    );
    
    const endTime = Date.now();
    
    console.log('\nFeedback processing completed!');
    console.log(`Time taken: ${endTime - startTime}ms`);
    console.log('Success:', result.success);
    
    if (result.success && result.data) {
      console.log('\nProcessing result:');
      console.log('----------------');
      console.log(`Feedback ID: ${result.data.id}`);
      console.log(`Status: ${result.data.status}`);
      console.log(`Sentiment score: ${result.data.sentiment_score}`);
      console.log(`Confidence score: ${result.data.confidence_score}`);
      
      if (result.data.tags && result.data.tags.length > 0) {
        console.log(`Tags: ${result.data.tags.join(', ')}`);
      }
      
      if (result.data.insights && result.data.insights.length > 0) {
        console.log('\nInsights:');
        result.data.insights.forEach((insight, index) => {
          console.log(`${index + 1}. ${insight.title} (${insight.type})`);
          if (insight.description) {
            console.log(`   ${insight.description}`);
          }
        });
      }
      
      console.log('\nProcessed Feedback:');
      console.log(JSON.stringify(result.data.processed_feedback, null, 2));
    } else if (result.error) {
      console.error('\n❌ Processing error:', result.error);
    }
  } catch (error) {
    console.error('\n❌ Unexpected error during processing:', error);
  }
  
  console.log('\nTest completed');
  process.exit(0);
}

// Run the test
testFeedbackPipeline().catch(error => {
  console.error('❌ Test failed with error:', error);
  process.exit(1);
});