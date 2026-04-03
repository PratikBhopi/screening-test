/*
 * User routes for managing users, statuses, and fetching profiles.
 * 
 * CRITICAL: `/me` must be registered BEFORE `/:id`. Express matches routes top-to-bottom. 
 * If `/:id` appears first, the string "me" is treated as a UUID parameter and the DB query fails.
 */
const express = require('express');
const router = express.Router();

const userController = require('../controllers/user.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

// All endpoints require authentication
router.use(authenticate);

/**
 * - Get All Users Route
 * - GET /api/v1/users
 */
router.get('/', authorize(['ADMIN']), userController.getAll);

/**
 * - Get Current User Profile Route
 * - GET /api/v1/users/me
 */
router.get('/me', userController.getMe);

/**
 * - Get User By ID Route
 * - GET /api/v1/users/:id
 */
router.get('/:id', authorize(['ADMIN']), userController.getById);

/**
 * - Update User Role Route
 * - PATCH /api/v1/users/:id/role
 */
router.patch('/:id/role', authorize(['ADMIN']), userController.updateRole);

/**
 * - Update User Status Route
 * - PATCH /api/v1/users/:id/status
 */
router.patch('/:id/status', authorize(['ADMIN']), userController.updateStatus);

module.exports = router;