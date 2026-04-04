const express = require('express');
const router = express.Router();

const dashboardController = require('../controllers/dashboard.controller');
const authorize = require('../middleware/authorize');
const authenticate = require('../middleware/authenticate');
const requirePasswordChange = require('../middleware/requirePasswordChange');

router.use(authenticate);
router.use(requirePasswordChange);

/**
 * GET /api/v1/dashboard/summary
 * @access ADMIN | ANALYST | VIEWER
 */
router.get('/summary', authorize(['ADMIN', 'ANALYST', 'VIEWER']), dashboardController.getSummary);

/**
 * GET /api/v1/dashboard/categories
 * @access ADMIN | ANALYST
 */
router.get('/categories', authorize(['ADMIN', 'ANALYST']), dashboardController.getCategories);

/**
 * GET /api/v1/dashboard/categories/trends
 * @access ADMIN | ANALYST
 */
router.get('/categories/trends', authorize(['ADMIN', 'ANALYST']), dashboardController.getCategoryTrends);

/**
 * GET /api/v1/dashboard/insights
 * @access ADMIN | ANALYST
 */
router.get('/insights', authorize(['ADMIN', 'ANALYST']), dashboardController.getInsights);

/**
 * GET /api/v1/dashboard/compare
 * @access ADMIN | ANALYST
 */
router.get('/compare', authorize(['ADMIN', 'ANALYST']), dashboardController.getComparison);

/**
 * GET /api/v1/dashboard
 * Full dashboard — VIEWER gets summary only, ADMIN/ANALYST get all blocks.
 * @access ADMIN | ANALYST | VIEWER
 */
router.get('/', authorize(['ADMIN', 'ANALYST', 'VIEWER']), dashboardController.getFullDashboard);

module.exports = router;
