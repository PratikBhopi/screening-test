const toRecordDto = (record, role = 'VIEWER') => {
  if (!record) return null;
  
  // Basic record data for everyone including view-only
  const dto = {
    id: record.id,
    amount: record.amount,
    type: record.type,
    category: record.category ? { 
      id: record.category.id, 
      name: record.category.name 
    } : null,
    transactionDate: record.transactionDate,
  };

  // Give Analysts and Admins full visibility including operational details
  if (role === 'ADMIN' || role === 'ANALYST') {
    dto.description = record.description;
    if (record.createdBy) {
      dto.createdBy = { 
        id: record.createdBy.id, 
        username: record.createdBy.username 
      };
    }
    // Also include timestamps if they exist
    if (record.createdAt) dto.createdAt = record.createdAt;
    if (record.updatedAt) dto.updatedAt = record.updatedAt;
  }
  
  return dto;
};

module.exports = { toRecordDto };
