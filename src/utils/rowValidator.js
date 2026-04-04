/*
 * rowValidator.js
 *
 * Validates an array of raw parsed rows against the financial record schema.
 * Reuses createRecordSchema from record.validation.js — same rules as the
 * single-record POST /api/v1/records endpoint. This guarantees consistency:
 * a row that passes bulk import validation would also pass the single-record API.
 *
 * Returns two arrays:
 *   valid  — rows that passed, already coerced by Zod (amount as number, date as Date)
 *   errors — row-level failures with row number, field name, and message
 *
 * Row numbers are 1-based and exclude the header row, matching what a user
 * would see if they opened the file in a spreadsheet application.
 */

const { createRecordSchema } = require('../validations/record.validation');

/**
 * @typedef {Object} RowError
 * @property {number} row     - 1-based row number (header not counted)
 * @property {string} field   - Field name that failed, or 'root' for cross-field errors
 * @property {string} message - Human-readable error message from Zod
 */

/**
 * Validates an array of raw row objects from the file parser.
 *
 * Each row is run through createRecordSchema.safeParse independently.
 * All errors are collected — validation does not stop at the first failure.
 * This gives the caller a complete picture of what needs fixing in the file.
 *
 * @param {Object[]} rows - Raw row objects from fileParser
 * @returns {{ valid: Object[], errors: RowError[] }}
 */
function validateRows(rows) {
  const valid = [];
  const errors = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 1; // 1-based, header excluded by fileParser

    /*
     * amount comes from the file as a string — coerce it to a number before
     * passing to Zod. createRecordSchema uses z.number() not z.coerce.number(),
     * so we handle the coercion here at the boundary between file parsing and
     * schema validation.
     */
    const normalized = {
      ...row,
      amount: row.amount !== '' && row.amount !== undefined ? Number(row.amount) : row.amount
    };

    const result = createRecordSchema.safeParse(normalized);

    if (result.success) {
      valid.push({ ...result.data, rowNumber });
    } else {
      result.error.issues.forEach(issue => {
        errors.push({
          row: rowNumber,
          field: issue.path.join('.') || 'root',
          message: issue.message
        });
      });
    }
  });

  return { valid, errors };
}

module.exports = { validateRows };
