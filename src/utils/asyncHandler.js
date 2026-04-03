/**
 * Wraps async functions to handle promise rejections and pass them to Express error handler.
 * Replaces the need for explicit try-catch blocks in every controller.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
