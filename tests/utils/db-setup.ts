/**
 * Database setup for tests
 */
import { db } from '@/services/database';

/**
 * Database setup helper for tests
 */
export async function setupTestDatabase() {
  try {
    // Create a stored procedure for cleaning up test data
    // This will be used to reset the database between tests
    await db.supabase.rpc('create_cleanup_procedure', {}, { count: 'none' }).catch(() => {
      // Ignore error if the procedure already exists
    });

    // Execute cleanup before starting tests
    await db.supabase.rpc('cleanup_test_data', {}, { count: 'none' });

    console.log('Test database setup complete');
  } catch (error) {
    console.error('Error setting up test database:', error);
    throw error;
  }
}

/**
 * SQL function to create the cleanup procedure
 * Note: This should be executed once before running tests
 */
export async function createCleanupProcedure() {
  const { error } = await db.supabase.rpc('create_cleanup_procedure', {}, { count: 'none' });

  if (error) {
    console.error('Error creating cleanup procedure:', error);
    throw error;
  }
}

/**
 * The SQL function that will be created:
 * 
 * CREATE OR REPLACE FUNCTION create_cleanup_procedure()
 * RETURNS void
 * LANGUAGE plpgsql
 * AS $$
 * BEGIN
 *   -- Create the cleanup procedure if it doesn't exist
 *   CREATE OR REPLACE FUNCTION cleanup_test_data()
 *   RETURNS void
 *   LANGUAGE plpgsql
 *   AS $func$
 *   BEGIN
 *     -- Delete test data from tables in reverse dependency order
 *     DELETE FROM sentiment_alerts WHERE id LIKE 'test_%';
 *     DELETE FROM sentiment_insights WHERE id LIKE 'test_%';
 *     DELETE FROM sentiment_trends WHERE id LIKE 'test_%';
 *     DELETE FROM sentiment_analyses WHERE id LIKE 'test_%' OR feedback_id LIKE 'test_%';
 *     
 *     DELETE FROM benchmark_reports WHERE benchmark_id LIKE 'test_%';
 *     DELETE FROM feature_comparisons WHERE feature_id LIKE 'test_%';
 *     DELETE FROM competitors WHERE competitor_id LIKE 'test_%';
 *     
 *     DELETE FROM insights WHERE id LIKE 'test_%';
 *     DELETE FROM feedback_data WHERE id LIKE 'test_%';
 *     DELETE FROM agent_messages WHERE id LIKE 'test_%';
 *     DELETE FROM agent_capabilities WHERE id LIKE 'test_%';
 *     DELETE FROM agents WHERE id LIKE 'test_%' OR name LIKE 'Test%';
 *     
 *     -- Add any other test data cleanup as needed
 *   END;
 *   $func$;
 * END;
 * $$;
 */