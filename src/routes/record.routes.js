const express = require('express');
const router = express.Router();

const recordController = require('../controllers/record.controller');
const authorize = require('../middleware/authorize');

/**
 * POST /api/v1/records
 * @access ADMIN
 */
router.post('/', authorize(['ADMIN']), recordController.create);

/**
 * GET /api/v1/records
 * Supports filtering by type, category, date range, and pagination.
 * Response shape varies by role — VIEWER gets fewer fields.
 * @access ADMIN | ANALYST | VIEWER
 */
router.get('/', authorize(['ADMIN', 'ANALYST', 'VIEWER']), recordController.getAll);

/**
 * GET /api/v1/records/:id
 * @access ADMIN | ANALYST | VIEWER
 */
router.get('/:id', authorize(['ADMIN', 'ANALYST', 'VIEWER']), recordController.getOne);

/**
 * PATCH /api/v1/records/:id
 * @access ADMIN
 */
router.patch('/:id', authorize(['ADMIN']), recordController.update);

/**
 * DELETE /api/v1/records/:id
 * Soft delete — sets deletedAt, does not remove the row.
 * @access ADMIN
 */
router.delete('/:id', authorize(['ADMIN']), recordController.remove);

module.exports = router;
