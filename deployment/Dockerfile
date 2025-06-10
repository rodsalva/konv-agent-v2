FROM node:18-alpine AS builder

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production image
FROM node:18-alpine

# Set up environment
ENV NODE_ENV=production
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy build artifacts
COPY --from=builder /app/dist ./dist

# Copy required files
COPY .env.example ./
COPY CLAUDE.md ./
COPY README.md ./

# Create necessary directories
RUN mkdir -p logs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start the server
CMD ["node", "dist/index.js"]