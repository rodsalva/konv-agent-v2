/**
 * Jest global setup file
 * This file runs before each test suite
 */
import { config } from 'dotenv';

// Load environment variables from .env file
config();

// Set test environment
process.env.NODE_ENV = 'test';

// Set a default test port if not defined
process.env.PORT = process.env.TEST_PORT || '3001';

// Disable console.log in tests unless explicitly enabled
// This keeps the test output clean
if (!process.env.DEBUG) {
  global.console.log = jest.fn();
}

// Increase timeout for all tests
jest.setTimeout(10000);

// Mock event timers if needed for some tests
// jest.useFakeTimers();