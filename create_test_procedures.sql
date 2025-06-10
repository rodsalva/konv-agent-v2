-- SQL script to create test procedures for the testing framework
-- This script should be run once to set up the test database

-- Create a function to set up cleanup procedure
CREATE OR REPLACE FUNCTION create_cleanup_procedure()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Create the cleanup procedure if it doesn't exist
  CREATE OR REPLACE FUNCTION cleanup_test_data()
  RETURNS void
  LANGUAGE plpgsql
  AS $func$
  BEGIN
    -- Delete test data from tables in reverse dependency order
    DELETE FROM sentiment_alerts WHERE id LIKE 'test_%' OR id LIKE '%test%';
    DELETE FROM sentiment_insights WHERE id LIKE 'test_%' OR id LIKE '%test%';
    DELETE FROM sentiment_trends WHERE id LIKE 'test_%' OR id LIKE '%test%';
    DELETE FROM sentiment_analyses WHERE id LIKE 'test_%' OR id LIKE '%test%' OR feedback_id LIKE 'test_%' OR feedback_id LIKE '%test%';
    
    DELETE FROM benchmark_reports WHERE benchmark_id LIKE 'test_%' OR benchmark_id LIKE '%test%';
    DELETE FROM feature_comparisons WHERE feature_id LIKE 'test_%' OR feature_id LIKE '%test%';
    DELETE FROM competitors WHERE competitor_id LIKE 'test_%' OR competitor_id LIKE '%test%' OR name LIKE 'Test%';
    
    DELETE FROM insights WHERE id LIKE 'test_%' OR id LIKE '%test%';
    DELETE FROM feedback_data WHERE id LIKE 'test_%' OR id LIKE '%test%';
    DELETE FROM agent_messages WHERE id LIKE 'test_%' OR id LIKE '%test%';
    DELETE FROM agent_capabilities WHERE id LIKE 'test_%' OR id LIKE '%test%';
    
    -- Delete test agents - note the patterns to match test data
    DELETE FROM agents 
    WHERE id LIKE 'test_%' 
       OR id LIKE '%test%' 
       OR name LIKE 'Test%' 
       OR api_key LIKE 'test_key_%';
    
    -- Add any other test data cleanup as needed
    RAISE NOTICE 'Test data cleanup complete';
  END;
  $func$;
  
  -- Execute the cleanup procedure
  PERFORM cleanup_test_data();
  
  RAISE NOTICE 'Cleanup procedure created and executed successfully';
END;
$$;

-- Execute the function to create the cleanup procedure
SELECT create_cleanup_procedure();

-- Create a function to create test data (optional)
CREATE OR REPLACE FUNCTION create_test_data()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Create test agents
  INSERT INTO agents (id, name, type, status, capabilities, api_key)
  VALUES 
    ('test_agent_' || gen_random_uuid(), 'Test Agent 1', 'company', 'active', '["feedback_collection"]', 'test_key_' || gen_random_uuid()),
    ('test_agent_' || gen_random_uuid(), 'Test Agent 2', 'customer', 'active', '["feedback_response"]', 'test_key_' || gen_random_uuid())
  ON CONFLICT DO NOTHING;
  
  -- Add more test data as needed
  
  RAISE NOTICE 'Test data created successfully';
END;
$$;

-- Comment out the following line to prevent automatic test data creation
-- SELECT create_test_data();