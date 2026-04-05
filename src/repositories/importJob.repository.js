const prisma = require('../models');

// I never return fileBuffer in selects except in findById — the worker needs it, but API responses don't
const JOB_SELECT = {
  id: true, uploadedBy: true, filename: true, mimetype: true,
  status: true, totalRows: true, savedCount: true, failedCount: true,
  errorLog: true, startedAt: true, completedAt: true, createdAt: true
};

async function createJob({ uploadedBy, filename, fileBuffer, mimetype, totalRows = 0 }) {
  return prisma.importJob.create({
    data: { uploadedBy, filename, fileBuffer, mimetype, totalRows },
    select: JOB_SELECT
  });
}

// Returns the full row including fileBuffer — the queue worker needs it to process the file
async function findById(id) {
  return prisma.importJob.findUnique({ where: { id } });
}

async function findByUserId(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [jobs, total] = await Promise.all([
    prisma.importJob.findMany({
      where: { uploadedBy: userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: JOB_SELECT
    }),
    prisma.importJob.count({ where: { uploadedBy: userId } })
  ]);

  return { jobs, total, page, limit };
}

// Used by the queue worker to transition job state — status, counts, errorLog, timestamps
async function updateStatus(id, patch) {
  return prisma.importJob.update({
    where: { id },
    data: patch,
    select: JOB_SELECT
  });
}

module.exports = { createJob, findById, findByUserId, updateStatus };
