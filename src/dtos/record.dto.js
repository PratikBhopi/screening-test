/**
 * Shapes a FinancialRecord before sending it to the caller.
 * VIEWER gets basic fields only. ADMIN/ANALYST get the full picture.
 *
 * @param {Object} record
 * @param {string} role - ADMIN | ANALYST | VIEWER
 */
const toRecordDto = (record, role = 'VIEWER') => {
  if (!record) return null;

  const dto = {
    id: record.id,
    amount: record.amount,
    type: record.type,
    category: record.category ?? null,
    transactionDate: record.transactionDate
  };

  if (role === 'ADMIN' || role === 'ANALYST') {
    dto.description = record.description ?? null;
    dto.createdBy = record.createdBy ? { username: record.createdBy.username } : null;
    if (record.createdAt) dto.createdAt = record.createdAt;
    if (record.updatedAt) dto.updatedAt = record.updatedAt;
  }

  return dto;
};

module.exports = { toRecordDto };
