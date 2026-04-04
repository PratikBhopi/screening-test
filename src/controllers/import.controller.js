const multer = require('multer');
const { parseFile } = require('../utils/fileParser');
const AppError = require('../errors/AppError');
const importJobRepo = require('../repositories/importJob.repository');
const { enqueue } = require('../queue/importQueue');
const { runSyncImport } = require('../services/importJob.service');

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const CSV_MIMES = ['text/csv', 'text/plain'];
const SYNC_MAX_BYTES  = 1 * 1024 * 1024;   // 1MB
const SYNC_MAX_ROWS   = 1000;
const ASYNC_MAX_BYTES = 10 * 1024 * 1024;  // 10MB

const storage = multer.memoryStorage();

// Reject non-CSV/XLSX before the file is fully buffered
function fileFilter(req, file, cb) {
  if (CSV_MIMES.includes(file.mimetype) || file.mimetype === XLSX_MIME) {
    cb(null, true);
  } else {
    cb(new AppError('Only CSV and XLSX files are accepted', 400), false);
  }
}

const syncUpload  = multer({ storage, fileFilter, limits: { fileSize: SYNC_MAX_BYTES } }).single('file');
const asyncUpload = multer({ storage, fileFilter, limits: { fileSize: ASYNC_MAX_BYTES } }).single('file');

// Wraps multer in a promise so we can await it inside async handlers
function runMulter(middleware, req, res) {
  return new Promise((resolve, reject) => {
    middleware(req, res, (err) => {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        reject(new AppError('File too large for sync import (max 1MB). Use POST /api/v1/bulk-records/async', 400));
      } else if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

/**
 * POST /api/v1/bulk-records
 * Processes the file inline and responds with the result.
 * Rejects if the file exceeds 1MB or 1000 rows.
 */
const syncImport = async (req, res, next) => {
  try {
    await runMulter(syncUpload, req, res);

    if (!req.file) throw new AppError('No file uploaded', 400);

    const mode = req.query.mode === 'partial' ? 'partial' : 'atomic';
    const rows = parseFile(req.file.buffer, req.file.mimetype);

    if (rows.length > SYNC_MAX_ROWS) {
      throw new AppError(
        `File has ${rows.length} rows — sync import supports up to 1000. Use POST /api/v1/bulk-records/async`,
        400
      );
    }

    const requestingUser = {
      userId: req.user.userId,
      role: req.user.role,
      ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress
    };

    const result = await runSyncImport(rows, mode, requestingUser, req.file.originalname);

    return res.status(201).json({
      success: true,
      data: {
        totalRows: rows.length,
        savedCount: result.savedCount,
        failedCount: result.failedCount,
        errors: result.errors
      }
    });
  } catch (err) {
    next(err.isOperational ? err : new AppError('Sync import failed', 500));
  }
};

/**
 * POST /api/v1/bulk-records/async
 * Stores the file, creates a PENDING job, and queues it for background processing.
 * Returns 202 immediately with the jobId to poll.
 */
const asyncImport = async (req, res, next) => {
  try {
    await runMulter(asyncUpload, req, res);

    if (!req.file) throw new AppError('No file uploaded', 400);

    const mode = req.query.mode === 'partial' ? 'partial' : 'atomic';

    const job = await importJobRepo.createJob({
      uploadedBy: req.user.userId,
      filename: req.file.originalname,
      fileBuffer: req.file.buffer,
      mimetype: req.file.mimetype,
      mode,
      totalRows: 0
    });

    enqueue(job.id);

    return res.status(202).json({
      success: true,
      data: {
        jobId: job.id,
        status: 'PENDING',
        message: `File queued. Poll GET /api/v1/bulk-records/jobs/${job.id} for status.`
      }
    });
  } catch (err) {
    next(err.isOperational ? err : new AppError('Failed to queue import job', 500));
  }
};

/**
 * GET /api/v1/bulk-records/jobs/:jobId
 * Returns job metadata. 404 if the job doesn't exist or belongs to someone else.
 */
const getJobStatus = async (req, res, next) => {
  try {
    const job = await importJobRepo.findById(req.params.jobId);

    if (!job || job.uploadedBy !== req.user.userId) {
      throw new AppError('Import job not found', 404);
    }

    const { fileBuffer, ...jobData } = job;
    return res.status(200).json({ success: true, data: jobData });
  } catch (err) {
    next(err.isOperational ? err : new AppError('Failed to fetch job status', 500));
  }
};

/**
 * GET /api/v1/bulk-records/jobs
 * Paginated list of jobs for the requesting admin, newest first.
 */
const listJobs = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page  || '1',  10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '20', 10)));

    const result = await importJobRepo.findByUserId(req.user.userId, page, limit);

    return res.status(200).json({
      success: true,
      data: {
        jobs: result.jobs,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit)
      }
    });
  } catch (err) {
    next(err.isOperational ? err : new AppError('Failed to fetch import jobs', 500));
  }
};

module.exports = { syncImport, asyncImport, getJobStatus, listJobs };
