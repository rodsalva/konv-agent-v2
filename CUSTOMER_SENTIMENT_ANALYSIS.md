# Customer Sentiment Analysis System

## Overview

The Customer Sentiment Analysis System enables MercadoLivre to analyze customer feedback across various channels, extract sentiment, identify trends, and generate actionable insights. This system helps improve customer experience by identifying areas of satisfaction and dissatisfaction.

## Key Features

1. **Sentiment Analysis**: Analyzes text feedback to determine sentiment (positive, negative, or neutral) with confidence scores.

2. **Multi-Language Support**: Handles feedback in Portuguese, Spanish, and English - the primary languages of MercadoLivre's customer base.

3. **Category-Based Analysis**: Breaks down sentiment across different aspects of the customer experience (product quality, shipping, customer service, etc.).

4. **Aspect Extraction**: Identifies specific aspects mentioned in feedback and their associated sentiment.

5. **Trend Analysis**: Tracks sentiment changes over time to identify improving or declining areas.

6. **Insight Generation**: Automatically creates actionable insights from sentiment data, prioritized by business impact.

7. **Real-Time Alerts**: Monitors sentiment thresholds and triggers alerts when metrics fall below acceptable levels.

8. **Visual Dashboard**: Provides a comprehensive visualization of sentiment data for easy interpretation.

## Components

### 1. Types and Schemas

- Located in `/src/types/sentiment.types.ts`
- Defines TypeScript types and Zod validation schemas for all entities
- Implements branded types for type safety (SentimentAnalysisID, SentimentTrendID)
- Defines enums for sentiment categories, feedback sources, and languages

### 2. Event Definitions

- Located in `/src/events/sentiment-events.ts`
- Defines event types for sentiment-related operations
- Provides helper functions for creating standardized events
- Supports the event-driven architecture of the system

### 3. Service Implementation

- Located in `/src/services/sentiment-analysis.ts`
- Implements core sentiment analysis functionality:
  - Text analysis to extract sentiment scores
  - Language detection
  - Categorization of sentiment by aspect
  - Trend analysis over time periods
  - Insight generation from sentiment data
- Integrates with event bus for notifications
- Connects with WebSocket service for real-time updates

### 4. API Routes

- Located in `/src/routes/sentiment.routes.ts`
- Exposes RESTful endpoints for all functionality:
  - `/api/v1/sentiment/analyze` - Analyze sentiment for feedback
  - `/api/v1/sentiment/trends` - Generate sentiment trend for a period
  - `/api/v1/sentiment/insights` - Get sentiment insights with filtering
  - `/api/v1/sentiment/dashboard` - Get sentiment dashboard data
  - `/api/v1/sentiment/dashboard/view` - HTML visualization dashboard

### 5. Database Schema

- Located in `/sentiment_schema.sql`
- Defines the database tables, indexes, and relationships:
  - `sentiment_analyses` - Stores individual sentiment analysis results
  - `sentiment_trends` - Stores trend analysis data
  - `sentiment_insights` - Stores generated insights
  - `sentiment_thresholds` - Configurable thresholds for alerts
  - `sentiment_alerts` - Records of threshold violations

## Usage

### Starting the System

The Customer Sentiment Analysis System is automatically initialized when the main application starts. The service is integrated with the WebSocket service for real-time updates and with the event bus for asynchronous processing.

### Running the Test Script

To test the functionality of the system, run:

```bash
npm run sentiment:test
```

This script:
1. Analyzes sentiment for sample feedback in multiple languages
2. Generates a sentiment trend for the past week
3. Retrieves sentiment insights
4. Gets dashboard data for visualization

### Accessing the Dashboard

After starting the server, you can access the sentiment analysis dashboard at:

```
http://localhost:3000/sentiment
```

## Integration Points

The Customer Sentiment Analysis System integrates with other parts of the application:

1. **Feedback System**: Processes feedback data for sentiment analysis
2. **Department Insights**: Provides sentiment-based recommendations for different departments
3. **WebSocket Service**: Sends real-time notifications of sentiment changes
4. **Event Bus**: Publishes events for all significant sentiment activities

## Technical Implementation

### Sentiment Scoring

Sentiment is scored on a scale from -1.0 (very negative) to 1.0 (very positive):
- -1.0 to -0.6: Very Negative
- -0.6 to -0.2: Negative
- -0.2 to 0.2:  Neutral
- 0.2 to 0.6:   Positive
- 0.6 to 1.0:   Very Positive

### Language Detection

The system automatically detects the language of feedback using natural language processing techniques, supporting:
- Portuguese (pt)
- Spanish (es)
- English (en)

### Category Analysis

Sentiment is analyzed across multiple categories:
- Overall
- Product Quality
- Shipping
- Price
- Customer Service
- Return Process
- User Experience
- Checkout Process
- Product Selection
- Payment Options

### Threshold Monitoring

The system continuously monitors sentiment scores against configurable thresholds. When scores fall below acceptable levels, alerts are triggered for immediate attention.

## Future Enhancements

Potential enhancements for the system:

1. **Advanced NLP**: Integrate with more sophisticated NLP services for deeper semantic analysis
2. **Automated Response Generation**: Suggest responses to negative feedback
3. **Competitor Sentiment Comparison**: Compare sentiment against competitor platforms
4. **Voice Sentiment Analysis**: Analyze sentiment from voice interactions
5. **Image Sentiment Analysis**: Detect sentiment in customer-uploaded images
6. **Predictive Analytics**: Forecast sentiment trends based on historical data