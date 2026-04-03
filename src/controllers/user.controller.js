const userService = require('../services/user.service');
const { updateRoleSchema, updateStatusSchema } = require('../validations/user.validation');
const AppError = require('../errors/AppError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * - Get All Users Controller
 * - GET /api/v1/users
 */
const getAll = asyncHandler(async (req, res, next) => {
  const users = await userService.getAllUsers();
  res.status(200).json({ success: true, data: users });
});

/**
 * - Get User By ID Controller
 * - GET /api/v1/users/:id
 */
const getById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const user = await userService.getUserById(id);
  res.status(200).json({ success: true, data: user });
});

/**
 * - Update User Role Controller
 * - PATCH /api/v1/users/:id/role
 */
const updateRole = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const parseResult = updateRoleSchema.safeParse(req.body);

  if (!parseResult.success) {
    throw new AppError(parseResult.error.issues[0].message, 400);
  }

  const updatedUser = await userService.updateUserRole(id, parseResult.data.role, req.user.userId);
  res.status(200).json({ success: true, data: updatedUser });
});

/**
 * - Update User Status Controller
 * - PATCH /api/v1/users/:id/status
 */
const updateStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const parseResult = updateStatusSchema.safeParse(req.body);

  if (!parseResult.success) {
    throw new AppError(parseResult.error.issues[0].message, 400);
  }

  const updatedUser = await userService.updateUserStatus(id, parseResult.data.status, req.user.userId);
  res.status(200).json({ success: true, data: updatedUser });
});

/**
 * - Get Current User Profile Controller
 * - GET /api/v1/users/me
 */
const getMe = asyncHandler(async (req, res, next) => {
  const user = await userService.getMe(req.user.userId);
  res.status(200).json({ success: true, data: user });
});

module.exports = {
  getAll,
  getById,
  updateRole,
  updateStatus,
  getMe
};