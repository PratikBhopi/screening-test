const AppError = require('../errors/AppError');

/**
 * Validates data against a Zod schema.
 * Throws a 400 AppError with field-level errors if validation fails.
 */
function parseRequest(schema, data) {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors = result.error.issues.map(issue => ({
      field: issue.path.join('.') || 'root',
      message: issue.message
    }));
    const err = new AppError('Validation failed', 400);
    err.errors = errors;
    throw err;
  }

  return result.data;
}

module.exports = { parseRequest };
