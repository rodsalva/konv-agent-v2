/**
 * Swagger annotations for sentiment routes
 * 
 * This file contains only JSDoc annotations for OpenAPI documentation
 * of the sentiment routes. It's not meant to be imported anywhere.
 */

/**
 * @swagger
 * tags:
 *   name: Sentiment
 *   description: Sentiment analysis operations
 */

/**
 * @swagger
 * /sentiment/analyze:
 *   post:
 *     summary: Analyze sentiment
 *     description: Analyze sentiment for feedback text
 *     tags: [Sentiment]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - feedback_id
 *               - feedback_text
 *               - feedback_source
 *             properties:
 *               feedback_id:
 *                 type: string
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *               feedback_text:
 *                 type: string
 *                 example: "Great product, but shipping was slow"
 *               feedback_source:
 *                 type: string
 *                 enum: [product_review, customer_support, survey, app_review, social_media, chat, email, other]
 *                 example: "product_review"
 *               language:
 *                 type: string
 *                 enum: [pt, es, en, unknown]
 *                 example: "en"
 *               metadata:
 *                 type: object
 *                 example: { "channel": "web", "product_id": "123" }
 *     responses:
 *       201:
 *         description: Sentiment analysis result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SentimentAnalysis'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /sentiment/trends:
 *   post:
 *     summary: Generate sentiment trend
 *     description: Generate sentiment trend for a period
 *     tags: [Sentiment]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - period_start
 *               - period_end
 *             properties:
 *               period_start:
 *                 type: string
 *                 format: date-time
 *                 example: "2023-01-01T00:00:00Z"
 *               period_end:
 *                 type: string
 *                 format: date-time
 *                 example: "2023-01-31T23:59:59Z"
 *               feedback_sources:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [product_review, customer_support, survey, app_review, social_media, chat, email, other]
 *                 example: ["product_review", "survey"]
 *               categories:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [overall, product_quality, shipping, price, customer_service, return_process, user_experience, checkout_process, product_selection, payment_options]
 *                 example: ["product_quality", "shipping", "price"]
 *     responses:
 *       201:
 *         description: Sentiment trend result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "trend_550e8400-e29b-41d4-a716-446655440000"
 *                     period_start:
 *                       type: string
 *                       format: date-time
 *                       example: "2023-01-01T00:00:00Z"
 *                     period_end:
 *                       type: string
 *                       format: date-time
 *                       example: "2023-01-31T23:59:59Z"
 *                     total_feedback_count:
 *                       type: integer
 *                       example: 100
 *                     average_sentiment:
 *                       type: number
 *                       example: 0.65
 *                     sentiment_distribution:
 *                       type: object
 *                       properties:
 *                         very_negative:
 *                           type: integer
 *                           example: 5
 *                         negative:
 *                           type: integer
 *                           example: 10
 *                         neutral:
 *                           type: integer
 *                           example: 20
 *                         positive:
 *                           type: integer
 *                           example: 50
 *                         very_positive:
 *                           type: integer
 *                           example: 15
 *                     category_sentiment:
 *                       type: object
 *                       additionalProperties:
 *                         type: number
 *                       example:
 *                         overall: 0.65
 *                         product_quality: 0.8
 *                         shipping: -0.2
 *                         price: 0.5
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /sentiment/insights:
 *   get:
 *     summary: Get sentiment insights
 *     description: Get sentiment insights with optional filtering
 *     tags: [Sentiment]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *         description: Filter by priority
 *       - in: query
 *         name: categories
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [overall, product_quality, shipping, price, customer_service, return_process, user_experience, checkout_process, product_selection, payment_options]
 *         description: Filter by categories
 *         style: form
 *         explode: true
 *       - in: query
 *         name: insight_type
 *         schema:
 *           type: string
 *           enum: [trend_change, emerging_issue, improvement_opportunity, competitive_advantage]
 *         description: Filter by insight type
 *       - in: query
 *         name: period_start
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by period start
 *       - in: query
 *         name: period_end
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by period end
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Maximum number of results to return
 *     responses:
 *       200:
 *         description: List of sentiment insights
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "insight_550e8400-e29b-41d4-a716-446655440000"
 *                       title:
 *                         type: string
 *                         example: "Negative sentiment in shipping requires attention"
 *                       description:
 *                         type: string
 *                         example: "Customer feedback shows increasing negative sentiment regarding shipping times and package conditions."
 *                       insight_type:
 *                         type: string
 *                         enum: [trend_change, emerging_issue, improvement_opportunity, competitive_advantage]
 *                         example: "emerging_issue"
 *                       priority:
 *                         type: string
 *                         enum: [low, medium, high, critical]
 *                         example: "high"
 *                 total:
 *                   type: integer
 *                   example: 5
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /sentiment/dashboard:
 *   get:
 *     summary: Get sentiment dashboard data
 *     description: Get sentiment dashboard data for visualization
 *     tags: [Sentiment]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: period_days
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 365
 *           default: 30
 *         description: Number of days to include in the dashboard
 *     responses:
 *       200:
 *         description: Sentiment dashboard data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     overall_sentiment:
 *                       type: number
 *                       example: 0.65
 *                     feedback_count:
 *                       type: integer
 *                       example: 250
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */