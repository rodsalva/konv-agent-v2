# Deployment Guide

This guide explains how to deploy the MCP Agent Backend system to different environments.

## Deployment Options

The system can be deployed in several ways:

1. **Docker Deployment**: Using Docker and docker-compose
2. **Manual Deployment**: Traditional deployment to a server
3. **CI/CD Pipeline**: Automated deployment via GitHub Actions

## Prerequisites

- Node.js 18 or later
- PostgreSQL 14 or later
- Docker and docker-compose (for Docker deployment)
- Access to deployment environment (SSH keys, credentials)
- Environment variables configured

## Environment Variables

Create appropriate `.env` files for your environments:

- `.env.staging` - For staging environment
- `.env.production` - For production environment

Example environment variables:

```
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Application Configuration
NODE_ENV=production
PORT=3000
API_VERSION=v1

# MCP Protocol Configuration
MCP_SERVER_NAME=feedback-intelligence-backend
MCP_SERVER_VERSION=1.0.0
MCP_TRANSPORT=stdio

# Security Configuration
JWT_SECRET=your_jwt_secret
API_KEY_PREFIX=mcp_agent_
CORS_ORIGIN=https://your-frontend-domain.com

# Database Configuration (for docker-compose)
DB_USER=postgres
DB_PASSWORD=your_secure_password
DB_NAME=konv_agent
DB_PORT=5432
```

## Docker Deployment

1. Navigate to the deployment directory:
   ```bash
   cd deployment
   ```

2. Create a `.env` file with the appropriate environment variables

3. Build and start the containers:
   ```bash
   docker-compose up -d
   ```

4. Verify the deployment:
   ```bash
   curl http://localhost:3000/health
   ```

## Manual Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Copy the build files and dependencies to your server:
   ```bash
   rsync -avz --exclude 'node_modules' --exclude '.git' ./ user@your-server:/path/to/app/
   ```

3. Install production dependencies on the server:
   ```bash
   ssh user@your-server 'cd /path/to/app && npm ci --production'
   ```

4. Set up environment variables on the server

5. Start the application:
   ```bash
   ssh user@your-server 'cd /path/to/app && pm2 start dist/index.js --name mcp-agent-backend'
   ```

## CI/CD Deployment

The repository includes GitHub Actions workflows for continuous integration and deployment:

1. **CI Workflow**: Runs on every push and pull request to `main` and `dev` branches
   - Linting and type checking
   - Unit tests
   - Building the application

2. **CD Workflow**: Runs when code is pushed to `main` or a new tag is created
   - Deploys to staging from `main` branch
   - Deploys to production from version tags (e.g., `v1.0.0`)

3. **Integration Test Workflow**: Verifies the application works with a test database

To deploy using GitHub Actions:

1. Set up the required secrets in your GitHub repository:
   - `DEPLOY_TOKEN`: Token for accessing deployment environment
   - `STAGING_DB_URL`: Database connection string for staging
   - `PRODUCTION_DB_URL`: Database connection string for production

2. For staging deployment, push to the `main` branch

3. For production deployment, create and push a new tag:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

## Database Migrations

Before deploying, ensure your database schema is up to date:

1. For manual deployment, run:
   ```bash
   npm run db:migrate
   ```

2. For docker deployment, database migrations are applied automatically using the SQL files mounted in the container

## Deployment Script

A deployment script is provided for convenience:

```bash
# Deploy to staging
./deployment/deploy.sh staging

# Deploy to production
./deployment/deploy.sh production
```

## Post-Deployment Verification

After deployment, verify that the system is running correctly:

1. Check the health endpoint:
   ```bash
   curl https://your-server.com/health
   ```

2. Verify that the API endpoints are accessible:
   ```bash
   curl https://your-server.com/api/v1/agents
   ```

3. Monitor logs for any errors:
   ```bash
   # For PM2
   pm2 logs mcp-agent-backend
   
   # For Docker
   docker-compose logs -f app
   ```

## Rollback Procedure

If the deployment fails or causes issues:

1. For manual deployment, revert to the previous version:
   ```bash
   ssh user@your-server 'cd /path/to/app && git checkout previous-tag && npm ci --production && pm2 restart mcp-agent-backend'
   ```

2. For Docker deployment, revert to the previous image:
   ```bash
   docker-compose down
   # Edit docker-compose.yml to use the previous image
   docker-compose up -d
   ```

3. For CI/CD deployment, re-run the workflow with the previous tag