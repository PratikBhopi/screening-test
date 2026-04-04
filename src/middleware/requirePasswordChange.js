const AppError = require('../errors/AppError');

function requirePasswordChange(req, res, next) {
  if (req.user?.mustChangePassword) {
    return next(new AppError(
      'You must change your temporary password before continuing. Use PATCH /api/v1/auth/change-password.',
      403
    ));
  }
  next();
}

module.exports = requirePasswordChange;
