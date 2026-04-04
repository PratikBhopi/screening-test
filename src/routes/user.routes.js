const express = require('express');
const router = express.Router();

const userController = require('../controllers/user.controller');
const authorize = require('../middleware/authorize');

// /me must come before /:id or Express will treat "me" as a UUID param
router.get('/me', userController.getMe);

/**
 * GET /api/v1/users
 * @access ADMIN
 */
router.get('/', authorize(['ADMIN']), userController.getAll);

/**
 * GET /api/v1/users/:id
 * @access ADMIN
 */
router.get('/:id', authorize(['ADMIN']), userController.getById);

/**
 * PATCH /api/v1/users/:id/role
 * @access ADMIN
 */
router.patch('/:id/role', authorize(['ADMIN']), userController.updateRole);

/**
 * PATCH /api/v1/users/:id/status
 * @access ADMIN
 */
router.patch('/:id/status', authorize(['ADMIN']), userController.updateStatus);

module.exports = router;
