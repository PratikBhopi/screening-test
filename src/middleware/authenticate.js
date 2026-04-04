const jwt = require('jsonwebtoken');
const AppError = require('../errors/AppError');
const { isBlacklisted } = require('../utils/tokenBlacklist');

// Verifies the JWT and populates req.user. Role checking is handled separately by authorize.js
function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('Authentication token required.', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

    if (decoded.jwt_id && isBlacklisted(decoded.jwt_id)) {
      throw new AppError('Token has been invalidated. Please log in again.', 401);
    }

    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(new AppError('Invalid or expired token.', 401));
    }
    next(err);
  }
}

module.exports = authenticate;