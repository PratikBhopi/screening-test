/*
 * Routes for Financial Record management.
 * Access matrix:
 * Write operations (POST, PATCH, DELETE) are ADMIN only.
 * Read operations (GET) serve all roles, but the service shapes the response differently based on role.
 */
const express = require('express');
const recordController = require('../controllers/record.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

const router = express.Router();

/**
 * - Create Financial Record Route
 * - POST /api/v1/records
 */
router.post('/', authenticate, authorize(['ADMIN']), recordController.create);

/**
 * - Get All Financial Records Route
 * - GET /api/v1/records
 */
router.get('/', authenticate, authorize(['ADMIN', 'ANALYST', 'VIEWER']), recordController.getAll);

/**
 * - Get Financial Record By ID Route
 * - GET /api/v1/records/:id
 */
router.get('/:id', authenticate, authorize(['ADMIN', 'ANALYST', 'VIEWER']), recordController.getOne);

/**
 * - Update Financial Record Route
 * - PATCH /api/v1/records/:id
 */
router.patch('/:id', authenticate, authorize(['ADMIN']), recordController.update);

/**
 * - Remove Financial Record Route
 * - DELETE /api/v1/records/:id
 */
router.delete('/:id', authenticate, authorize(['ADMIN']), recordController.remove);

module.exports = router;
