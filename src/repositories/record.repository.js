const prisma = require('../models');

async function create(data) {
  return prisma.financialRecord.create({
    data,
    include: { createdBy: { select: { username: true } } }
  });
}

async function findAll(filters) {
  const { type, category, startDate, endDate, page = 1, limit = 20 } = filters;

  const where = { deletedAt: null };
  if (type) where.type = type;
  if (category) where.category = category;
  if (startDate || endDate) {
    where.transactionDate = {};
    if (startDate) where.transactionDate.gte = startDate;
    if (endDate) where.transactionDate.lte = endDate;
  }

  const skip = (page - 1) * limit;

  // count runs in parallel with the data query — Prisma doesn't bundle them
  const [records, total] = await Promise.all([
    prisma.financialRecord.findMany({
      where,
      skip,
      take: limit,
      orderBy: { transactionDate: 'desc' },
      include: { createdBy: { select: { username: true } } }
    }),
    prisma.financialRecord.count({ where })
  ]);

  return { records, total, page, limit };
}

async function findById(id) {
  return prisma.financialRecord.findFirst({
    where: { id, deletedAt: null },
    include: { createdBy: { select: { username: true } } }
  });
}

async function update(id, data) {
  return prisma.financialRecord.update({
    where: { id },
    data,
    include: { createdBy: { select: { username: true } } }
  });
}

// Sets deletedAt instead of removing the row — keeps the audit trail intact
async function softDelete(id) {
  return prisma.financialRecord.update({
    where: { id },
    data: { deletedAt: new Date() },
    include: { createdBy: { select: { username: true } } }
  });
}

module.exports = { create, findAll, findById, update, softDelete };
