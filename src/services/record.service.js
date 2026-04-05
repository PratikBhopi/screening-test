const recordRepository = require('../repositories/record.repository');
const auditService = require('./audit.service');
const AppError = require('../errors/AppError');
const prisma = require('../models');
const { toRecordDto } = require('../dtos/record.dto');

/**
 * Create a financial record.
 * @param {Object} data - record data (amount, type, category, transactionDate, description)
 * @param {Object} requestingUser - { userId, role, ipAddress }
 * @returns {Object}
 */
async function createRecord(data, requestingUser) {
  data.createdById = requestingUser.userId;

  let record;
  try {
    record = await recordRepository.create(data);
  } catch (err) {
    // P2002 = unique constraint violation — transactionRef already exists
    if (err.code === 'P2002' && err.meta?.target?.includes('transactionRef')) {
      throw new AppError(`A record with transactionRef '${data.transactionRef}' already exists`, 409);
    }
    throw err;
  }

  await auditService.log({
    userId: requestingUser.userId,
    action: 'CREATE_RECORD',
    entityType: 'FinancialRecord',
    entityId: record.id,
    oldValue: null,
    newValue: record,
    ipAddress: requestingUser.ipAddress
  });

  return toRecordDto(record, requestingUser.role);
}

/**
 * List financial records with filters and role-based shaping.
 * @param {Object} filters
 * @param {Object} requestingUser
 * @returns {Object} { records, total, page, limit }
 */
async function getRecords(filters, requestingUser) {
  const result = await recordRepository.findAll(filters);
  const shapedRecords = result.records.map(r => toRecordDto(r, requestingUser.role));

  return {
    records: shapedRecords,
    total: result.total,
    page: result.page,
    limit: result.limit
  };
}

/**
 * Get one record by ID, shaped by role.
 * @param {string} id
 * @param {Object} requestingUser
 * @returns {Object}
 */
async function getRecordById(id, requestingUser) {
  const record = await recordRepository.findById(id);
  if (!record) {
    throw new AppError('Record not found', 404);
  }
  return toRecordDto(record, requestingUser.role);
}

/**
 * Update a record.
 * @param {string} id
 * @param {Object} data
 * @param {Object} requestingUser
 * @returns {Object}
 */
async function updateRecord(id, data, requestingUser) {
  const oldValue = await recordRepository.findById(id);
  if (!oldValue) {
    throw new AppError('Record not found', 404);
  }

  const updatedRecord = await recordRepository.update(id, data);

  await auditService.log({
    userId: requestingUser.userId,
    action: 'UPDATE_RECORD',
    entityType: 'FinancialRecord',
    entityId: updatedRecord.id,
    oldValue: oldValue,
    newValue: updatedRecord,
    ipAddress: requestingUser.ipAddress
  });

  return toRecordDto(updatedRecord, requestingUser.role);
}

/**
 * Soft delete a record.
 * @param {string} id
 * @param {Object} requestingUser
 * @returns {Object}
 */
async function deleteRecord(id, requestingUser) {
  const rawRecord = await prisma.financialRecord.findUnique({
    where: { id },
    include: {
      createdBy: { select: { username: true } }
    }
  });

  if (!rawRecord) {
    throw new AppError('Record not found', 404);
  }

  if (rawRecord.deletedAt !== null) {
    throw new AppError('Record is already deleted', 400);
  }

  await recordRepository.softDelete(id);

  await auditService.log({
    userId: requestingUser.userId,
    action: 'DELETE_RECORD',
    entityType: 'FinancialRecord',
    entityId: id,
    oldValue: rawRecord,
    newValue: null,
    ipAddress: requestingUser.ipAddress
  });

  return { message: 'Record deleted successfully' };
}

module.exports = {
  createRecord,
  getRecords,
  getRecordById,
  updateRecord,
  deleteRecord
};
