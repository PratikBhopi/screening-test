const userService = require('../services/user.service');
const { updateRoleSchema, updateStatusSchema } = require('../validations/user.validation');
const { parseRequest } = require('../utils/parseRequest');
const AppError = require('../errors/AppError');

/**
 * GET /api/v1/users
 */
const getAll = async (req, res, next) => {
  try {
    const users = await userService.getAllUsers();
    res.status(200).json({ success: true, data: users });
  } catch (err) {
    next(err.isOperational ? err : new AppError('Failed to fetch users', 500));
  }
};

/**
 * GET /api/v1/users/:id
 */
const getById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err.isOperational ? err : new AppError('Failed to fetch user', 500));
  }
};

/**
 * PATCH /api/v1/users/:id/role
 * Admin cannot change their own role.
 */
const updateRole = async (req, res, next) => {
  try {
    const data = parseRequest(updateRoleSchema, req.body);
    const updatedUser = await userService.updateUserRole(req.params.id, data.role, req.user.userId);
    res.status(200).json({ success: true, data: updatedUser });
  } catch (err) {
    next(err.isOperational ? err : new AppError('Failed to update role', 500));
  }
};

/**
 * PATCH /api/v1/users/:id/status
 * Admin cannot change their own status.
 */
const updateStatus = async (req, res, next) => {
  try {
    const data = parseRequest(updateStatusSchema, req.body);
    const updatedUser = await userService.updateUserStatus(req.params.id, data.status, req.user.userId);
    res.status(200).json({ success: true, data: updatedUser });
  } catch (err) {
    next(err.isOperational ? err : new AppError('Failed to update status', 500));
  }
};

/**
 * GET /api/v1/users/me
 */
const getMe = async (req, res, next) => {
  try {
    const user = await userService.getMe(req.user.userId);
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err.isOperational ? err : new AppError('Failed to fetch profile', 500));
  }
};

module.exports = { getAll, getById, updateRole, updateStatus, getMe };
