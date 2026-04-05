const prisma = require('../models');
const auditService = require('./audit.service');
const importJobRepo = require('../repositories/importJob.repository');
const { parseFile } = require('../utils/fileParser');
const { validateRows } = require('../utils/rowValidator');
const AppError = require('../errors/AppError');

/**
 * @param {Object[]} rows
 * @param {Object} requestingUser - { userId, role, ipAddress }
 * @param {string} filename
 */
async function runSyncImport(rows, requestingUser, filename = 'unknown') {
  const { valid, errors } = validateRows(rows);

  if (errors.length > 0) {
    const err = new AppError(`Import rejected: ${errors.length} row(s) failed validation`, 400);
    err.errors = errors;
    throw err;
  }

  const savedRecords = await saveRecords(valid, requestingUser);

  await generateAuditLogs(savedRecords, requestingUser);
  await generateSummaryAuditLog({
    userId: requestingUser.userId,
    ipAddress: requestingUser.ipAddress,
    savedCount: savedRecords.length,
    failedCount: 0,
    filename
  });

  return {
    savedCount: savedRecords.length,
    errors: []
  };
}

// Called by the queue worker only — not directly from any route
async function processJobById(jobId) {
  const job = await importJobRepo.findById(jobId);

  if (!job) {
    console.error(`[ImportJob] Job ${jobId} not found — skipping`);
    return;
  }

  await importJobRepo.updateStatus(jobId, { status: 'PROCESSING', startedAt: new Date() });

  let savedCount = 0;

  try {
    const fileBuffer = Buffer.isBuffer(job.fileBuffer) ? job.fileBuffer : Buffer.from(job.fileBuffer);

    let rows;
    try {
      rows = parseFile(fileBuffer, job.mimetype);
    } catch (parseErr) {
      await importJobRepo.updateStatus(jobId, {
        status: 'FAILED',
        completedAt: new Date(),
        savedCount: 0,
        failedCount: 0,
        errorLog: [{ row: 0, field: 'file', message: parseErr.message }]
      });
      return;
    }

    await importJobRepo.updateStatus(jobId, { totalRows: rows.length });

    const { valid, errors } = validateRows(rows);

    if (errors.length > 0) {
      await importJobRepo.updateStatus(jobId, {
        status: 'FAILED',
        completedAt: new Date(),
        failedCount: errors.length,
        savedCount: 0,
        errorLog: errors
      });
      return;
    }

    const requestingUser = { userId: job.uploadedBy, role: 'ADMIN', ipAddress: null };
    const savedRecords = await saveRecords(valid, requestingUser);

    savedCount = savedRecords.length;

    await generateAuditLogs(savedRecords, requestingUser);
    await generateSummaryAuditLog({
      userId: job.uploadedBy,
      ipAddress: null,
      savedCount,
      failedCount: 0,
      filename: job.filename,
      jobId
    });

    await importJobRepo.updateStatus(jobId, {
      status: 'COMPLETED',
      completedAt: new Date(),
      savedCount,
      failedCount: 0,
      errorLog: null
    });

  } catch (err) {
    await importJobRepo.updateStatus(jobId, {
      status: 'FAILED',
      completedAt: new Date(),
      savedCount,
      failedCount: 0,
      errorLog: [{ row: 0, field: 'system', message: err.message }]
    });
    throw err;
  }
}

// Inserts in chunks of 100 to avoid hitting MySQL's max_allowed_packet on large imports.
// Individual creates (not createMany) so we get back IDs needed for audit logging.
async function saveRecords(validRows, requestingUser) {
  if (validRows.length === 0) return [];

  const CHUNK_SIZE = 100;
  const allSaved = [];

  for (let i = 0; i < validRows.length; i += CHUNK_SIZE) {
    const chunk = validRows.slice(i, i + CHUNK_SIZE);

    try {
      const saved = await prisma.$transaction(
        chunk.map(row => {
          const { rowNumber, ...data } = row;
          return prisma.financialRecord.create({
            data: { ...data, createdById: requestingUser.userId },
            include: { createdBy: { select: { username: true } } }
          });
        })
      );
      allSaved.push(...saved);
    } catch (err) {
      if (err.code === 'P2003' && err.meta?.constraint?.includes('createdById')) {
        throw new AppError('Authenticated user not found in database. Please log in again.', 401);
      }
      throw err;
    }
  }

  return allSaved;
}

async function generateAuditLogs(records, requestingUser) {
  for (const record of records) {
    await auditService.log({
      userId: requestingUser.userId,
      action: 'BULK_IMPORT_RECORD',
      entityType: 'FinancialRecord',
      entityId: record.id,
      oldValue: null,
      newValue: record,
      ipAddress: requestingUser.ipAddress || null
    });
  }
}

async function generateSummaryAuditLog({ userId, ipAddress, savedCount, failedCount, filename, jobId }) {
  await auditService.log({
    userId,
    action: 'BULK_IMPORT_COMPLETE',
    entityType: 'ImportJob',
    entityId: jobId || 'sync',
    oldValue: null,
    newValue: { savedCount, failedCount, filename },
    ipAddress: ipAddress || null
  });
}

module.exports = { runSyncImport, processJobById };
