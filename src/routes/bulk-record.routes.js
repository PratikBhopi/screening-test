const express = require('express');
const router = express.Router();

const importController = require('../controllers/import.controller');
const authorize = require('../middleware/authorize');

/**
 * POST /api/v1/bulk-records?mode=atomic|partial
 * Sync import — files up to 1MB / 1000 rows. Responds immediately.
 * @access ADMIN
 */
router.post('/', authorize(['ADMIN']), importController.syncImport);

/**
 * POST /api/v1/bulk-records/async?mode=atomic|partial
 * Async import — files up to 10MB. Returns a jobId, processed in background.
 * @access ADMIN
 */
router.post('/async', authorize(['ADMIN']), importController.asyncImport);

/**
 * GET /api/v1/bulk-records/jobs
 * Paginated list of import jobs for the requesting admin.
 * @access ADMIN
 */
router.get('/jobs', authorize(['ADMIN']), importController.listJobs);

/**
 * GET /api/v1/bulk-records/jobs/:jobId
 * Status and result of a single import job.
 * Returns 404 if the job belongs to a different user.
 * @access ADMIN
 */
router.get('/jobs/:jobId', authorize(['ADMIN']), importController.getJobStatus);

module.exports = router;
