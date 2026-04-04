const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const authenticate = require('../middleware/authenticate');

/**
 * POST /api/v1/auth/login
 * @access public
 */
router.post('/login', authController.login);

/**
 * POST /api/v1/auth/register
 * @access public
 */
router.post('/register', authController.register);

/**
 * POST /api/v1/auth/logout
 * @access authenticated
 */
router.post('/logout', authenticate, authController.logout);

/**
 * PATCH /api/v1/auth/change-password
 * @access authenticated
 *
 * Only uses `authenticate` — not `requirePasswordChange`.
 * This is the escape route for users blocked by mustChangePassword.
 */
router.patch('/change-password', authenticate, authController.changePassword);

module.exports = router;
