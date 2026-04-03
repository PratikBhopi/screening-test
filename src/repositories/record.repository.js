/*
 * Database abstraction layer for FinancialRecord model using Prisma.
 * All Prisma queries for financial records.
 */
const prisma = require('../models');

/**
 * Insert one FinancialRecord row.
 * @param {Object} data - amount, type, categoryId, transactionDate, description, createdById
 * @returns {Object} created record with category name and createdBy username included
 */
async function create(data) {
  return prisma.financialRecord.create({
    data,
    include: {
      category: { select: { name: true } },
      createdBy: { select: { username: true } }
    }
  });
}

/**
 * Finds all records with filters and pagination.
 * @param {Object} filters 
 * @returns {Object} { records, total, page, limit }
 */
async function findAll(filters) {
  const { type, categoryId, startDate, endDate, page = 1, limit = 20 } = filters;
  
  const where = {
    deletedAt: null
  };

  if (type) where.type = type;
  if (categoryId) where.categoryId = categoryId;
  
  if (startDate || endDate) {
    where.transactionDate = {};
    if (startDate) where.transactionDate.gte = startDate;
    if (endDate) where.transactionDate.lte = endDate;
  }

  const skip = (page - 1) * limit;
  const take = limit;

  /*
   * Prisma does not return a total count alongside paginated results.
   * The count query reuses the same where clause to ensure accuracy.
   */
  const [records, total] = await Promise.all([
    prisma.financialRecord.findMany({
      where,
      skip,
      take,
      orderBy: { transactionDate: 'desc' },
      include: {
        category: { select: { name: true } },
        createdBy: { select: { username: true } }
      }
    }),
    prisma.financialRecord.count({ where })
  ]);

  return { records, total, page, limit };
}

/**
 * Find one record by UUID where deletedAt is null.
 * @param {string} id 
 * @returns {Object|null}
 */
async function findById(id) {
  return prisma.financialRecord.findFirst({
    where: { 
      id,
      deletedAt: null
    },
    include: {
      category: { select: { name: true } },
      createdBy: { select: { username: true } }
    }
  });
}

/**
 * Update only the fields present in data.
 * @param {string} id 
 * @param {Object} data 
 * @returns {Object} updated record
 */
async function update(id, data) {
  return prisma.financialRecord.update({
    where: { id },
    data: { ...data },
    include: {
      category: { select: { name: true } },
      createdBy: { select: { username: true } }
    }
  });
}

/**
 * Set deletedAt to new Date(). Do not delete the row.
 * @param {string} id 
 * @returns {Object} updated record
 */
async function softDelete(id) {
  /*
   * Financial records use soft delete, not hard delete, for two reasons —
   * audit trail integrity (audit_logs references entity_id) and
   * regulatory compliance (financial history must be reconstructable).
   */
  return prisma.financialRecord.update({
    where: { id },
    data: { deletedAt: new Date() },
    include: {
      category: { select: { name: true } },
      createdBy: { select: { username: true } }
    }
  });
}

module.exports = {
  create,
  findAll,
  findById,
  update,
  softDelete
};
