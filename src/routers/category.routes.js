/*
 * Routes for Category management.
 */
const express = require('express');
const categoryController = require('../controllers/category.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

const router = express.Router();

/**
 * - Create Category Route
 * - POST /api/v1/categories
 */
router.post('/', authenticate, authorize(['ADMIN']), categoryController.create);
/**
 * - Get All Categories Route
 * - GET /api/v1/categories
 */
router.get('/', authenticate, authorize(['ADMIN', 'ANALYST', 'VIEWER']), categoryController.getAll);
/**
 * - Update Category Route
 * - PATCH /api/v1/categories/:id
 */
router.patch('/:id', authenticate, authorize(['ADMIN']), categoryController.update);
/**
 * - Remove Category Route
 * - DELETE /api/v1/categories/:id
 */
router.delete('/:id', authenticate, authorize(['ADMIN']), categoryController.remove);

module.exports = router;
