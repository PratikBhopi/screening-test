/*
 * Service layer for Financial Record business logic.
 */
const recordRepository = require('../repositories/record.repository');
const categoryRepository = require('../repositories/category.repository');
const auditService = require('./audit.service');
const AppError = require('../errors/AppError');
const prisma = require('../models');
const { toRecordDto } = require('../dtos/record.dto');

/**
 * Create a financial record.
 * @param {Object} data - record data
 * @param {Object} requestingUser - { userId, role, ipAddress }
 * @returns {Object} 
 */
async function createRecord(data, requestingUser) {
  // 1. Verify the categoryId exists via category repository findById.
  const category = await categoryRepository.findById(data.categoryId);
  if (!category) {
    throw new AppError('Category not found', 404);
  }

  // 2. Attach createdById = requestingUser.userId to data.
  data.createdById = requestingUser.userId;

  // 3. Call record repository create(data).
  const record = await recordRepository.create(data);

  // 4. Fire audit log
  await auditService.log({
    userId: requestingUser.userId,
    action: 'CREATE_RECORD',
    entityType: 'FinancialRecord',
    entityId: record.id,
    oldValue: null,
    newValue: record,
    ipAddress: requestingUser.ipAddress
  });

  // 5. Return created record as DTO
  return toRecordDto(record, requestingUser.role);
}

/**
 * List financial records with shaping.
 * @param {Object} filters 
 * @param {Object} requestingUser 
 * @returns {Object} { records, total, page, limit }
 */
async function getRecords(filters, requestingUser) {
  // 1. Call record repository findAll(filters).
  const result = await recordRepository.findAll(filters);

  // 2. Shape each record based on role before returning
  const shapedRecords = result.records.map(r => toRecordDto(r, requestingUser.role));

  // 3. Return shaped response
  return {
    records: shapedRecords,
    total: result.total,
    page: result.page,
    limit: result.limit
  };
}

/**
 * Get one record, shaped.
 * @param {string} id 
 * @param {Object} requestingUser 
 * @returns {Object}
 */
async function getRecordById(id, requestingUser) {
  // 1. Call repository findById(id). Throw AppError 404 if null.
  const record = await recordRepository.findById(id);
  if (!record) {
    throw new AppError('Record not found', 404);
  }

  // 2. Apply same role-based shaping as getRecords.
  const shapedRecord = toRecordDto(record, requestingUser.role);

  // 3. Return the shaped record.
  return shapedRecord;
}

/**
 * Update a record.
 * @param {string} id 
 * @param {Object} data 
 * @param {Object} requestingUser 
 * @returns {Object}
 */
async function updateRecord(id, data, requestingUser) {
  // 1. Verify the record exists via findById. Throw 404 if not.
  const oldValue = await recordRepository.findById(id);
  if (!oldValue) {
    throw new AppError('Record not found', 404);
  }

  // 2. If data.categoryId is provided, verify that category exists.
  if (data.categoryId) {
    const category = await categoryRepository.findById(data.categoryId);
    if (!category) {
      throw new AppError('Category not found', 404);
    }
  }

  // 3. Call repository update(id, data).
  const updatedRecord = await recordRepository.update(id, data);

  // 4. Fire audit log
  await auditService.log({
    userId: requestingUser.userId,
    action: 'UPDATE_RECORD',
    entityType: 'FinancialRecord',
    entityId: updatedRecord.id,
    oldValue: oldValue,
    newValue: updatedRecord,
    ipAddress: requestingUser.ipAddress
  });

  // 5. Return updated record as DTO.
  return toRecordDto(updatedRecord, requestingUser.role);
}

/**
 * Delete a record (soft delete).
 * @param {string} id 
 * @param {Object} requestingUser 
 * @returns {Object}
 */
async function deleteRecord(id, requestingUser) {
  // Use raw Prisma query to get the record regardless of soft delete state for exact 400 check.
  const rawRecord = await prisma.financialRecord.findUnique({
    where: { id },
    include: {
      category: { select: { name: true } },
      createdBy: { select: { username: true } }
    }
  });

  // 1. Verify the record exists. Throw 404 if not.
  if (!rawRecord) {
    throw new AppError('Record not found', 404);
  }

  // 2. If record.deletedAt is already not null, throw AppError 400
  if (rawRecord.deletedAt !== null) {
    throw new AppError('Record is already deleted', 400);
  }

  // 3. Call repository softDelete(id).
  await recordRepository.softDelete(id);

  // 4. Fire audit log
  await auditService.log({
    userId: requestingUser.userId,
    action: 'DELETE_RECORD',
    entityType: 'FinancialRecord',
    entityId: id,
    oldValue: rawRecord,
    newValue: null,
    ipAddress: requestingUser.ipAddress
  });

  // 5. Return success message.
  return { message: "Record deleted successfully" };
}

module.exports = {
  createRecord,
  getRecords,
  getRecordById,
  updateRecord,
  deleteRecord
};
