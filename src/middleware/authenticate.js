/*
 * Authentication Middleware.
 * This middleware only verifies that the token is valid and populates req.user.
 * It does NOT check roles. Role checking is the job of the authorize middleware. 
 * These two concerns are always kept separate.
 */
const jwt = require('jsonwebtoken');
const AppError = require('../errors/AppError');

function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication token required.', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      next(new AppError('Invalid or expired token.', 401));
    } else {
      next(error);
    }
  }
}

module.exports = authenticate;
