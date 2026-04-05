const jwt = require('jsonwebtoken');
const AppError = require('../errors/AppError');
const { isBlacklisted } = require('../utils/tokenBlacklist');
const userRepository = require('../repositories/user.repository');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('Authentication token required.', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.jwt_id && isBlacklisted(decoded.jwt_id)) {
      throw new AppError('Token has been invalidated. Please log in again.', 401);
    }

    const user = await userRepository.findById(decoded.userId);
    if (!user || user.status !== 'ACTIVE') {
      throw new AppError('Account is inactive or suspended. Contact your administrator.', 403);
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