const { createRecordSchema } = require('../validations/record.validation');

// I reuse the same schema as the single-record API so bulk import and manual entry
// have identical validation rules — no inconsistencies between the two paths.
// I collect all errors across every row before returning, so the admin sees everything
// that needs fixing in one shot rather than fixing one row at a time.
function validateRows(rows) {
  const valid = [];
  const errors = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 1; 


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
