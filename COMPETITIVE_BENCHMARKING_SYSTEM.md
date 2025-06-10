# Competitive Benchmarking System

## Overview

The Competitive Benchmarking System enables MercadoLivre to analyze and compare its platform against competitors across various feature categories. This system helps identify competitive advantages, gaps, and opportunities for improvement through data-driven analysis.

## Key Features

1. **Competitor Management**: Track and manage information about competitors, including their market presence, specialization, and general details.

2. **Feature Comparison**: Record detailed comparisons between MercadoLivre and competitors for specific features across categories such as product discovery, search, checkout, mobile experience, etc.

3. **Benchmark Reports**: Generate comprehensive benchmark reports that analyze MercadoLivre's position relative to competitors, highlighting strengths, weaknesses, opportunities, and threats.

4. **Competitive Position Analysis**: Aggregate data across competitors to understand MercadoLivre's overall market position, key advantages, and areas for improvement.

5. **Department-specific Recommendations**: Provide actionable recommendations for different departments based on competitive analysis.

6. **Visual Dashboard**: Access a visual representation of competitive analysis through an interactive HTML dashboard.

## Components

### 1. Types and Schemas

- Located in `/src/types/competitor.types.ts`
- Defines TypeScript types and Zod validation schemas for all entities in the system
- Implements branded types for type safety (CompetitorID, BenchmarkID)
- Defines enums for feature categories and other standardized values

### 2. Service Implementation

- Located in `/src/services/competitor-benchmark.ts`
- Provides methods for all core functionality:
  - Competitor management (add, update, delete, list)
  - Feature comparison tracking
  - Benchmark report generation
  - Competitive position analysis
- Implements event emitting for real-time updates
- Includes WebSocket integration for notifications

### 3. Events

- Located in `/src/events/competitor-events.ts`
- Defines event types for all competitor-related operations
- Provides helper functions for creating standardized events
- Supports the event-driven architecture of the system

### 4. API Routes

- Located in `/src/routes/competitor.routes.ts`
- Exposes RESTful endpoints for all functionality:
  - `/api/v1/competitors` - CRUD operations for competitors
  - `/api/v1/competitors/:id/features` - Feature comparison management
  - `/api/v1/competitors/benchmark` - Benchmark report generation
  - `/api/v1/competitors/analysis/position` - Competitive position analysis
  - `/api/v1/competitors/benchmark/visualization` - HTML visualization

### 5. Database Schema

- Located in `/competitor_schema.sql`
- Defines the database tables, indexes, and relationships:
  - `competitors` - Stores competitor information
  - `feature_comparisons` - Records feature-level comparisons
  - `benchmark_reports` - Stores generated benchmark reports
  - `competitive_persona_analyses` - Links personas to competitors
  - `competitive_category_ratings` - Tracks category-level ratings

## Usage

### Starting the System

The Competitive Benchmarking System is automatically initialized when the main application starts. The service is integrated with the WebSocket service for real-time updates.

### Running the Test Script

To test the functionality of the system, run:

```bash
npm run competitors:test
```

This script:
1. Creates sample competitors (if they don't exist)
2. Adds feature comparisons for the competitors
3. Generates a benchmark report
4. Performs a competitive position analysis

### Accessing the Visualization

After starting the server, you can access the competitive benchmarking visualization at:

```
http://localhost:3000/competitors
```

## Integration Points

The Competitive Benchmarking System integrates with other parts of the application:

1. **Persona System**: Competitors can be analyzed from the perspective of different personas
2. **Department Insights**: Competitive analysis generates department-specific recommendations
3. **WebSocket Service**: Real-time notifications are sent when competitor data changes
4. **Event Bus**: Events are published for all significant actions

## Future Enhancements

Potential enhancements for the system:

1. **AI-driven Analysis**: Incorporate AI to automatically identify patterns and generate insights
2. **Automated Competitor Monitoring**: Set up scheduled checks of competitor websites
3. **Trend Analysis**: Track changes in competitive position over time
4. **Feature Impact Assessment**: Evaluate the business impact of closing feature gaps
5. **Integration with Product Roadmap**: Connect competitive insights directly to product planning