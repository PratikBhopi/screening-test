/**
 * @swagger
 * /bulk-records:
 *   post:
 *     summary: Synchronous bulk import (max 1MB/1000 rows)
 *     tags: [Bulk Records]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: mode
 *         schema: { type: string, enum: [atomic, partial], default: atomic }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Import completed
 *       400:
 *         description: File too large or invalid rows
 */

/**
 * @swagger
 * /bulk-records/async:
 *   post:
 *     summary: Asynchronous bulk import (max 10MB)
 *     tags: [Bulk Records]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: mode
 *         schema: { type: string, enum: [atomic, partial], default: atomic }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string, format: binary }
 *     responses:
 *       202:
 *         description: File accepted and queued
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     jobId: { type: string, format: uuid }
 *                     status: { type: string, example: 'PENDING' }
 *                     message: { type: string }
 */

/**
 * @swagger
 * /bulk-records/jobs/{jobId}:
 *   get:
 *     summary: Get import job status
 *     tags: [Bulk Records]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Job status details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/ImportJob' }
 *       404:
 *         description: Job not found
 */

/**
 * @swagger
 * /bulk-records/jobs:
 *   get:
 *     summary: List all my import jobs
 *     tags: [Bulk Records]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: List of import jobs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     jobs: { type: array, items: { $ref: '#/components/schemas/ImportJob' } }
 *                     total: { type: integer }
 *                     page: { type: integer }
 *                     limit: { type: integer }
 *                     totalPages: { type: integer }
 */
