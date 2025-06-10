#!/bin/bash

# Script for deploying the application
# Usage: ./deploy.sh [environment]
# Example: ./deploy.sh staging

set -e  # Exit immediately if a command exits with a non-zero status

# Environment can be 'staging' or 'production'
ENVIRONMENT=${1:-staging}
echo "Deploying to $ENVIRONMENT environment..."

# Load environment variables from appropriate file
if [ -f ".env.$ENVIRONMENT" ]; then
  echo "Loading environment variables from .env.$ENVIRONMENT"
  export $(grep -v '^#' .env.$ENVIRONMENT | xargs)
else
  echo "Environment file .env.$ENVIRONMENT not found!"
  exit 1
fi

# Build the application
echo "Building application..."
npm run build

# Run database migrations if needed
if [ "$RUN_MIGRATIONS" = "true" ]; then
  echo "Running database migrations..."
  npm run db:migrate
fi

# Deploy based on environment
case $ENVIRONMENT in
  staging)
    echo "Deploying to staging server..."
    # Example deployment commands:
    # rsync -avz --exclude 'node_modules' --exclude '.git' ./ user@staging-server:/path/to/app/
    # ssh user@staging-server 'cd /path/to/app && npm ci --production && pm2 restart app'
    ;;
  production)
    echo "Deploying to production server..."
    # Example deployment commands:
    # rsync -avz --exclude 'node_modules' --exclude '.git' ./ user@production-server:/path/to/app/
    # ssh user@production-server 'cd /path/to/app && npm ci --production && pm2 restart app'
    ;;
  *)
    echo "Unknown environment: $ENVIRONMENT"
    exit 1
    ;;
esac

# For demonstration purposes, we'll just echo a success message
echo "Deployment to $ENVIRONMENT completed successfully!"

# In a real deployment, you might want to:
# 1. Tag the release in git
# 2. Notify team members via Slack/Email
# 3. Update documentation
# 4. Run post-deployment tests
# 5. Warm up caches

exit 0