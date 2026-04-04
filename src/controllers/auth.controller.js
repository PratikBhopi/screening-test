const authService = require('../services/auth.service');
const { registerSchema, loginSchema, changePasswordSchema } = require('../validations/user.validation');
const { parseRequest } = require('../utils/parseRequest');
const AppError = require('../errors/AppError');

/**
 * POST /api/v1/auth/register
 * Admin creates a user. Password is system-generated and shown once in the response.
 */
const register = async (req, res, next) => {
  try {
    const data = parseRequest(registerSchema, req.body);
    const result = await authService.register(data);
    return res.status(201).json({
      success: true,
      data: {
        user: result.user,
        temporaryPassword: result.temporaryPassword,
        note: 'This password is shown once. In production it would be sent via email only.'
      }
    });
  } catch (err) {
    next(err.isOperational ? err : new AppError('Failed to register user', 500));
  }
};

/**
 * POST /api/v1/auth/login
 */
const login = async (req, res, next) => {
  try {
    const data = parseRequest(loginSchema, req.body);
    const { token, user } = await authService.login(data.email, data.password);
    return res.status(200).json({ success: true, data: { token, user } });
  } catch (err) {
    next(err.isOperational ? err : new AppError('Login failed', 500));
  }
};

/**
 * PATCH /api/v1/auth/change-password
 * Handles both first-login temp password changes and regular updates.
 */
const changePassword = async (req, res, next) => {
  try {
    const data = parseRequest(changePasswordSchema, req.body);
    const result = await authService.changePassword(req.user.userId, data.currentPassword, data.newPassword);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err.isOperational ? err : new AppError('Failed to change password', 500));
  }
};

/**
 * POST /api/v1/auth/logout
 * Blacklists the token's jti so it can't be reused before expiry.
 */
const logout = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const result = await authService.logout(req.user.jwt_id, token);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err.isOperational ? err : new AppError('Logout failed', 500));
  }
};

module.exports = { register, login, changePassword, logout };
