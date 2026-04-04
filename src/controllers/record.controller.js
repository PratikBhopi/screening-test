const recordService = require('../services/record.service');
const { createRecordSchema, updateRecordSchema, filterRecordSchema } = require('../validations/record.validation');
const { parseRequest } = require('../utils/parseRequest');
const AppError = require('../errors/AppError');

const buildRequestingUser = (req) => ({
  userId: req.user.userId,
  role: req.user.role,
  ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress
});

/**
 * POST /api/v1/records
 */
const create = async (req, res, next) => {
  try {
    const data = parseRequest(createRecordSchema, req.body);
    const record = await recordService.createRecord(data, buildRequestingUser(req));
    return res.status(201).json({ success: true, data: record });
  } catch (err) {
    next(err.isOperational ? err : new AppError('Failed to create record', 500));
  }
};

/**
 * GET /api/v1/records
 * Supports type, category, date range filters and pagination.
 * Response fields vary by role.
 */
const getAll = async (req, res, next) => {
  try {
    const data = parseRequest(filterRecordSchema, req.query);
    const result = await recordService.getRecords(data, buildRequestingUser(req));
    return res.status(200).json({
      success: true,
      data: {
        records: result.records,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit)
      }
    });
  } catch (err) {
    next(err.isOperational ? err : new AppError('Failed to fetch records', 500));
  }
};

/**
 * GET /api/v1/records/:id
 */
const getOne = async (req, res, next) => {
  try {
    const record = await recordService.getRecordById(req.params.id, buildRequestingUser(req));
    return res.status(200).json({ success: true, data: record });
  } catch (err) {
    next(err.isOperational ? err : new AppError('Failed to fetch record', 500));
  }
};

/**
 * PATCH /api/v1/records/:id
 */
const update = async (req, res, next) => {
  try {
    const data = parseRequest(updateRecordSchema, req.body);
    const record = await recordService.updateRecord(req.params.id, data, buildRequestingUser(req));
    return res.status(200).json({ success: true, data: record });
  } catch (err) {
    next(err.isOperational ? err : new AppError('Failed to update record', 500));
  }
};

/**
 * DELETE /api/v1/records/:id
 * Soft delete — sets deletedAt, row stays in DB for audit trail.
 */
const remove = async (req, res, next) => {
  try {
    const result = await recordService.deleteRecord(req.params.id, buildRequestingUser(req));
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err.isOperational ? err : new AppError('Failed to delete record', 500));
  }
};

module.exports = { create, getAll, getOne, update, remove };
