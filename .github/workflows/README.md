# GitHub Actions Workflows

This directory contains GitHub Actions workflows for continuous integration and deployment of the MCP Agent Backend.

## Workflows Overview

### CI Workflow (`ci.yml`)

The Continuous Integration workflow runs on every push to `main` and `dev` branches, as well as pull requests to these branches. It consists of the following jobs:

1. **Lint and Type Check**: Ensures code quality by running ESLint and TypeScript type checking
2. **Unit Tests**: Runs unit tests to verify the functionality of individual components
3. **Build**: Builds the application to ensure it compiles correctly

### CD Workflow (`cd.yml`)

The Continuous Deployment workflow runs when code is pushed to the `main` branch or when a new tag is created. It manages deployments to different environments:

1. **Deploy to Staging**: Automatically deploys the `main` branch to the staging environment
2. **Deploy to Production**: Deploys tagged releases (e.g., `v1.0.0`) to the production environment

### Integration Tests Workflow (`integration-test.yml`)

This workflow runs integration tests that verify the system works correctly with a database. It:

1. Sets up a PostgreSQL database container
2. Initializes the database schema
3. Runs integration tests against this database

### Code Quality Workflow (`code-quality.yml`)

This workflow performs advanced code quality checks, including:

1. ESLint with detailed reporting
2. Code duplication detection
3. Code coverage analysis
4. (Optional) SonarCloud integration

### Dependency Check Workflow (`dependency-check.yml`)

This workflow checks for security vulnerabilities in dependencies:

1. Runs `npm audit` to detect vulnerabilities
2. (Optional) Integrates with Snyk for more thorough security analysis
3. Fails the build if critical vulnerabilities are found

## Configuration

### Required Secrets

To use these workflows, you need to set up the following secrets in your GitHub repository:

- `DEPLOY_TOKEN`: Token for accessing deployment environments
- `STAGING_DB_URL`: Database connection string for the staging environment
- `PRODUCTION_DB_URL`: Database connection string for the production environment
- `SONAR_TOKEN`: Token for SonarCloud integration (optional)
- `SNYK_TOKEN`: Token for Snyk integration (optional)

### Environment Variables

The workflows use environment variables defined in the workflow files. You can customize these variables by editing the workflow files.

## Custom Workflow Triggers

Besides the automatic triggers defined in each workflow, you can manually trigger some workflows:

1. **Integration Tests**: Can be triggered manually using the "workflow_dispatch" event
2. **Code Quality**: Runs on a schedule (every Monday at midnight) in addition to pushes and pull requests
3. **Dependency Check**: Runs on a schedule (every Wednesday at midnight) to regularly check for new vulnerabilities

## Adding New Workflows

To add a new workflow:

1. Create a new YAML file in the `.github/workflows` directory
2. Define the workflow using the GitHub Actions syntax
3. Commit and push the file to the repository

## Best Practices

When working with these workflows:

1. **Keep Workflows Focused**: Each workflow should have a specific purpose
2. **Reuse Steps**: Use composite actions or shared steps for common operations
3. **Optimize for Speed**: Minimize build times by using caching and parallel jobs
4. **Secure Secrets**: Never hardcode sensitive information in workflow files
5. **Test Workflows**: Verify that workflows work correctly before merging them to `main`

## Troubleshooting

If a workflow fails:

1. Check the workflow run logs in the GitHub Actions tab
2. Verify that all required secrets and environment variables are correctly set
3. Check if the failure is related to the code or the workflow configuration
4. For deployment failures, check the deployment logs on the target environment

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax Reference](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions)
- [GitHub Actions Marketplace](https://github.com/marketplace?type=actions)