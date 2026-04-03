/*
 * Authentication routes.
 * Login is intentionally public — no middleware.
 * Register is Admin-only because in this system, users do not self-signup.
 * Only an Admin provisions new accounts.
 */
const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');



/**
 * - User Registration Route
 * - POST /api/v1/auth/register
 */
router.post('/register', [authenticate, authorize(['ADMIN'])], authController.register);

/**
 * - User Login Route
 * - POST /api/v1/auth/login
 */
router.post('/login', authController.login);

module.exports = router;
