/*
 * RBAC Authorization Middleware.
 * Factory pattern: It accepts an array of allowed roles so a single route can 
 * permit multiple roles: `authorize(['ADMIN', 'ANALYST'])`. 
 * This makes the route definition self-documenting.
 */

const AppError = require('../errors/AppError');

function authorize(allowedRoles = []) {
  return function (req, res, next) {
    try {
      if (!req.user || !req.user.role) {
        throw new AppError('You do not have permission to perform this action.', 403);
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw new AppError('You do not have permission to perform this action.', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = authorize;
