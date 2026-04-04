const prisma = require('../models');

/**
 * Creates a new ImportJob with status PENDING.
 *
 * @param {Object} data
 * @param {string} data.uploadedBy  - User UUID of the admin who uploaded
 * @param {string} data.filename    - Original filename from the upload
 * @param {Buffer} data.fileBuffer  - Raw file buffer for async processing
 * @param {string} data.mimetype    - MIME type of the uploaded file
 * @param {string} data.mode        - 'atomic' | 'partial'
 * @param {number} data.totalRows   - Row count determined after parsing
 * @returns {Object} Created ImportJob (without fileBuffer)
 */
async function createJob({ uploadedBy, filename, fileBuffer, mimetype, mode, totalRows = 0 }) {
  return prisma.importJob.create({
    data: { uploadedBy, filename, fileBuffer, mimetype, mode, totalRows },
    select: {
      id: true, uploadedBy: true, filename: true, mimetype: true,
      status: true, mode: true, totalRows: true,
      savedCount: true, failedCount: true, errorLog: true,
      startedAt: true, completedAt: true, createdAt: true
    }
  });
}

/**
 * Returns a single ImportJob by ID including the fileBuffer.
 * Used by the async worker to retrieve the file for processing.
 *
 * @param {string} id
 * @returns {Object|null}
 */
async function findById(id) {
  return prisma.importJob.findUnique({ where: { id } });
}

/**
 * Returns a paginated list of ImportJobs for a specific user.
 * fileBuffer is excluded — callers only need status and metadata.
 *
 * @param {string} userId
 * @param {number} page
 * @param {number} limit
 * @returns {{ jobs: Object[], total: number, page: number, limit: number }}
 */
async function findByUserId(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [jobs, total] = await Promise.all([
    prisma.importJob.findMany({
      where: { uploadedBy: userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true, uploadedBy: true, filename: true, mimetype: true,
        status: true, mode: true, totalRows: true,
        savedCount: true, failedCount: true, errorLog: true,
        startedAt: true, completedAt: true, createdAt: true
      }
    }),
    prisma.importJob.count({ where: { uploadedBy: userId } })
  ]);

  return { jobs, total, page, limit };
}

/**
 * Updates mutable fields on an ImportJob.
 * Used by the queue worker to transition status and record counts.
 *
 * @param {string} id
 * @param {Object} patch - Any subset of: status, startedAt, completedAt,
 *                         savedCount, failedCount, errorLog, totalRows
 * @returns {Object} Updated job (without fileBuffer)
 */
async function updateStatus(id, patch) {
  return prisma.importJob.update({
    where: { id },
    data: patch,
    select: {
      id: true, uploadedBy: true, filename: true, mimetype: true,
      status: true, mode: true, totalRows: true,
      savedCount: true, failedCount: true, errorLog: true,
      startedAt: true, completedAt: true, createdAt: true
    }
  });
}

module.exports = { createJob, findById, findByUserId, updateStatus };
