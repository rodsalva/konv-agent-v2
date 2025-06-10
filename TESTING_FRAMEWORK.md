# Automated Testing Framework

## Overview

The Automated Testing Framework provides a comprehensive solution for testing the MCP Agent Backend system. It includes unit tests, integration tests, and utilities for mocking dependencies and setting up test environments.

## TypeScript Configuration Update

To resolve TypeScript configuration issues with the test files not being under the `rootDir`, we've implemented a dual configuration approach:

1. **Main Configuration** (`tsconfig.json`): Used for the source code with `rootDir` set to `./src`
2. **Test Configuration** (`tsconfig.test.json`): Used for tests with `rootDir` set to the project root

This approach allows the tests to import source files while maintaining proper separation between source and test code.

## Key Features

1. **Comprehensive Test Coverage**: Tests for services, routes, events, and integration points.

2. **Isolated Unit Testing**: Mocking of dependencies to ensure true unit testing of components.

3. **Integration Testing**: End-to-end tests that verify the system works as a whole.

4. **Test Utilities**: Helper functions for common testing tasks.

5. **Database Testing**: Utilities for testing database operations with cleanup procedures.

6. **Continuous Integration Ready**: Configured for easy integration with CI/CD pipelines.

## Components

### 1. Test Configuration

- **Jest Configuration** (`jest.config.js`): Configures the Jest testing framework with TypeScript support, coverage thresholds, and test timeouts.

- **Test Setup** (`tests/setup.ts`): Global setup file that runs before each test suite, configuring the environment.

### 2. Test Utilities

- **Test Utilities** (`tests/utils/test-utils.ts`): Common utilities for testing, including data generation, database helpers, and authentication utilities.

- **Database Setup** (`tests/utils/db-setup.ts`): Utilities for setting up the test database, including creating cleanup procedures.

- **Mocks** (`tests/utils/mocks.ts`): Factory functions for creating mock objects used in tests.

### 3. Unit Tests

- **Service Tests**: Tests for core services like database, feedback, and sentiment analysis.

- **Event Tests**: Tests for the event bus and event definitions.

- **Route Tests**: Tests for API routes with mocked dependencies.

### 4. Integration Tests

- **API Tests** (`tests/integration/api.test.ts`): End-to-end tests for API endpoints that interact with the actual database.

### 5. Database Utilities

- **Test Procedures** (`create_test_procedures.sql`): SQL script to create test data management procedures.

## Usage

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (useful during development)
npm run test:watch

# Generate test coverage report
npm run test:coverage

# Run only unit tests (excluding integration tests)
npm run test:unit

# Run only integration tests
npm run test:integration

# Run TypeScript type checking for tests
npm run typecheck:test
```

### Setting Up the Test Database

Before running integration tests, you need to set up the test database:

1. Create a test database or schema separate from your development/production database.

2. Configure the test database connection in your environment:

   ```
   # .env.test
   SUPABASE_URL=your_test_supabase_url
   SUPABASE_ANON_KEY=your_test_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_test_service_role_key
   NODE_ENV=test
   TEST_MODE=integration
   ```

3. Run the SQL script to create test procedures:

   ```bash
   psql -d your_test_database < create_test_procedures.sql
   ```

### Writing New Tests

#### Unit Test Example

```typescript
import { someService } from '@/services/some-service';
import { mockDependency } from '../utils/mocks';

// Mock dependencies
jest.mock('@/services/dependency', () => ({
  dependency: mockDependency,
}));

describe('Some Service', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  it('should perform some action', async () => {
    // Arrange
    const testData = { id: '123', value: 'test' };
    mockDependency.someMethod.mockResolvedValue(true);

    // Act
    const result = await someService.someAction(testData);

    // Assert
    expect(result).toBe(true);
    expect(mockDependency.someMethod).toHaveBeenCalledWith(testData);
  });
});
```

#### Integration Test Example

```typescript
import { testAgent } from '../utils/test-utils';

describe('API Integration', () => {
  it('should create and retrieve a resource', async () => {
    // Create resource
    const createResponse = await testAgent
      .post('/api/resource')
      .send({ name: 'Test Resource' });

    expect(createResponse.status).toBe(201);
    const resourceId = createResponse.body.id;

    // Retrieve resource
    const getResponse = await testAgent.get(`/api/resource/${resourceId}`);
    
    expect(getResponse.status).toBe(200);
    expect(getResponse.body.name).toBe('Test Resource');
  });
});
```

## Best Practices

1. **Test Isolation**: Each test should be independent and not rely on the state created by other tests.

2. **Use Mocks Appropriately**: Mock external dependencies in unit tests, but use real implementations in integration tests.

3. **Clean Up Test Data**: Always clean up test data after tests to avoid polluting the test database.

4. **Test Edge Cases**: Include tests for error conditions and edge cases, not just the happy path.

5. **Keep Tests Fast**: Tests should run quickly to encourage frequent testing during development.

6. **Descriptive Test Names**: Use descriptive test names that explain what is being tested and what the expected outcome is.

7. **CI Integration**: Configure tests to run automatically in your CI/CD pipeline.

## Extending the Framework

To extend the testing framework with new capabilities:

1. Add new utility functions to `tests/utils/test-utils.ts`.

2. Create new mock objects in `tests/utils/mocks.ts`.

3. Update the database cleanup procedure in `create_test_procedures.sql` to handle new tables.

4. Add new test files following the established patterns.

## Troubleshooting

- **Test Failures Due to Data Conflicts**: Ensure that the cleanup procedure is working correctly and that tests aren't interfering with each other.

- **Mocking Issues**: Verify that all dependencies are properly mocked in unit tests.

- **Integration Test Failures**: Check that the test database is properly configured and that the environment variables are set correctly.

- **Timeout Errors**: Increase the test timeout in `jest.config.js` if tests are timing out.

- **TypeScript Configuration Errors**: If you encounter TypeScript errors related to files not being under `rootDir`, make sure you're using the correct TypeScript configuration for tests:
  - For type checking tests: `npm run typecheck:test` (uses `tsconfig.test.json`)
  - For running tests: Jest is configured to use `tsconfig.test.json` automatically
  - For development: `npm run typecheck` (uses `tsconfig.json` for source files only)