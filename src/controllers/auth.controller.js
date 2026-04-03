const authService = require('../services/auth.service');
const { registerSchema, loginSchema } = require('../validations/user.validation');
const AppError = require('../errors/AppError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * - User Registration Controller
 * - POST /api/v1/auth/register
 */
const register = asyncHandler(async (req, res, next) => {
  const parseResult = registerSchema.safeParse(req.body);

  if (!parseResult.success) {
    throw new AppError(parseResult.error.issues[0].message, 400);
  }

  const newUser = await authService.register(parseResult.data, req.user);

  return res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: newUser
  });
});

/**
 * - User Login Controller
 * - POST /api/v1/auth/login
 */
const login = asyncHandler(async (req, res, next) => {
  const parseResult = loginSchema.safeParse(req.body);

  if (!parseResult.success) {
    throw new AppError(parseResult.error.issues[0].message, 400);
  }

  const { token, user } = await authService.login(parseResult.data.email, parseResult.data.password);

  return res.status(200).json({
    success: true,
    data: { token, user }
  });
});

module.exports = {
  register,
  login
};
