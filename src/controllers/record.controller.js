/*
 * Controller for financial record routes.
 */
const recordService = require('../services/record.service');
const { createRecordSchema, updateRecordSchema, filterRecordSchema } = require('../validations/record.validation');
const AppError = require('../errors/AppError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * - Create Financial Record Controller
 * - POST /api/v1/records
 */
const create = asyncHandler(async (req, res, next) => {
  const parseResult = createRecordSchema.safeParse(req.body);
  if (!parseResult.success) {
    throw new AppError(parseResult.error.issues[0].message, 400);
  }

  const requestingUser = {
    userId: req.user.userId,
    role: req.user.role,
    ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress
  };

  const record = await recordService.createRecord(parseResult.data, requestingUser);
  return res.status(201).json({
    success: true,
    data: record
  });
});

/**
 * - Get All Financial Records Controller
 * - GET /api/v1/records
 */
const getAll = asyncHandler(async (req, res, next) => {
  const parseResult = filterRecordSchema.safeParse(req.query);
  if (!parseResult.success) {
    throw new AppError(parseResult.error.issues[0].message, 400);
  }

  const requestingUser = {
    userId: req.user.userId,
    role: req.user.role,
    ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress
  };

  const result = await recordService.getRecords(parseResult.data, requestingUser);

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
});

/**
 * - Get Financial Record By ID Controller
 * - GET /api/v1/records/:id
 */
const getOne = asyncHandler(async (req, res, next) => {
  const requestingUser = {
    userId: req.user.userId,
    role: req.user.role,
    ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress
  };

  const record = await recordService.getRecordById(req.params.id, requestingUser);
  return res.status(200).json({
    success: true,
    data: record
  });
});

/**
 * - Update Financial Record Controller
 * - PATCH /api/v1/records/:id
 */
const update = asyncHandler(async (req, res, next) => {
  const parseResult = updateRecordSchema.safeParse(req.body);
  if (!parseResult.success) {
    throw new AppError(parseResult.error.issues[0].message, 400);
  }

  const requestingUser = {
    userId: req.user.userId,
    role: req.user.role,
    ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress
  };

  const record = await recordService.updateRecord(req.params.id, parseResult.data, requestingUser);
  return res.status(200).json({
    success: true,
    data: record
  });
});

/**
 * - Remove Financial Record Controller
 * - DELETE /api/v1/records/:id
 */
const remove = asyncHandler(async (req, res, next) => {
  const requestingUser = {
    userId: req.user.userId,
    role: req.user.role,
    ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress
  };

  const result = await recordService.deleteRecord(req.params.id, requestingUser);
  return res.status(200).json({
    success: true,
    data: result
  });
});

module.exports = {
  create,
  getAll,
  getOne,
  update,
  remove
};
