/**
 * Swagger annotations for competitor routes
 * 
 * This file contains only JSDoc annotations for OpenAPI documentation
 * of the competitor routes. It's not meant to be imported anywhere.
 */

/**
 * @swagger
 * tags:
 *   name: Competitors
 *   description: Competitor benchmarking operations
 */

/**
 * @swagger
 * /competitors:
 *   get:
 *     summary: List all competitors
 *     description: Retrieves a list of all competitors
 *     tags: [Competitors]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: A list of competitors
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
 *                     $ref: '#/components/schemas/Competitor'
 *                 total:
 *                   type: integer
 *                   example: 5
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   post:
 *     summary: Create a new competitor
 *     description: Creates a new competitor with the provided information
 *     tags: [Competitors]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - url
 *               - primary_market
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Amazon"
 *               url:
 *                 type: string
 *                 format: uri
 *                 example: "https://www.amazon.com"
 *               logo_url:
 *                 type: string
 *                 format: uri
 *                 example: "https://example.com/logo.png"
 *               description:
 *                 type: string
 *                 example: "Global e-commerce marketplace"
 *               primary_market:
 *                 type: string
 *                 example: "Global"
 *               secondary_markets:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["North America", "Europe", "Asia"]
 *               company_size:
 *                 type: string
 *                 enum: [small, medium, large, enterprise]
 *                 example: "enterprise"
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["marketplace", "global", "tech-giant"]
 *     responses:
 *       201:
 *         description: Competitor created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Competitor'
 *                 message:
 *                   type: string
 *                   example: "Competitor added successfully"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /competitors/{id}:
 *   get:
 *     summary: Get a single competitor
 *     description: Retrieves a single competitor by ID
 *     tags: [Competitors]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the competitor to retrieve
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: A single competitor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Competitor'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   put:
 *     summary: Update a competitor
 *     description: Updates a competitor with the provided information
 *     tags: [Competitors]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the competitor to update
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Amazon"
 *               url:
 *                 type: string
 *                 format: uri
 *                 example: "https://www.amazon.com"
 *               logo_url:
 *                 type: string
 *                 format: uri
 *                 example: "https://example.com/logo.png"
 *               description:
 *                 type: string
 *                 example: "Global e-commerce marketplace"
 *               primary_market:
 *                 type: string
 *                 example: "Global"
 *               secondary_markets:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["North America", "Europe", "Asia"]
 *               company_size:
 *                 type: string
 *                 enum: [small, medium, large, enterprise]
 *                 example: "enterprise"
 *               is_active:
 *                 type: boolean
 *                 example: true
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["marketplace", "global", "tech-giant"]
 *     responses:
 *       200:
 *         description: Competitor updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Competitor'
 *                 message:
 *                   type: string
 *                   example: "Competitor updated successfully"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /competitors/{id}/overview:
 *   get:
 *     summary: Get competitor overview
 *     description: Retrieves an overview of a competitor with analysis
 *     tags: [Competitors]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the competitor to retrieve overview for
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Competitor overview
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
 *                     competitor:
 *                       $ref: '#/components/schemas/Competitor'
 *                     feature_count:
 *                       type: integer
 *                       example: 25
 *                     average_ratings:
 *                       type: object
 *                       properties:
 *                         competitor:
 *                           type: number
 *                           example: 7.5
 *                         mercadolivre:
 *                           type: number
 *                           example: 8.2
 *                         gap:
 *                           type: number
 *                           example: 0.7
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /competitors/benchmark:
 *   post:
 *     summary: Generate benchmark report
 *     description: Generates a benchmark report for specified competitors
 *     tags: [Competitors]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - competitors
 *             properties:
 *               competitors:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["comp_1", "comp_2"]
 *                 minItems: 1
 *               categories:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [product_discovery, search, navigation, product_detail, pricing, checkout, payment, shipping, returns, customer_service, mobile_experience, personalization, security, promotions, social_integration, loyalty, other]
 *                 example: ["product_discovery", "search", "navigation"]
 *               departments:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["product", "engineering", "marketing"]
 *               title:
 *                 type: string
 *                 example: "E-commerce Competitors Benchmark Q1 2023"
 *     responses:
 *       201:
 *         description: Benchmark report generated successfully
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
 *                     benchmark_id:
 *                       type: string
 *                       example: "benchmark_550e8400-e29b-41d4-a716-446655440000"
 *                     title:
 *                       type: string
 *                       example: "E-commerce Competitors Benchmark Q1 2023"
 *                     status:
 *                       type: string
 *                       enum: [draft, review, published, archived]
 *                       example: "published"
 *                 message:
 *                   type: string
 *                   example: "Benchmark report generated successfully"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */