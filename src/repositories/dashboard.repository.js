const prisma = require('../models');

async function getSummaryTotals(filters = {}) {
  const { startDate, endDate } = filters;

  const [incomeResult, expenseResult] = await Promise.all([
    prisma.financialRecord.aggregate({
      _sum: { amount: true },
      _count: { id: true },
      where: {
        deletedAt: null,
        type: 'INCOME',
        ...(startDate && { transactionDate: { gte: startDate } }),
        ...(endDate && { transactionDate: { lte: endDate } })
      }
    }),
    prisma.financialRecord.aggregate({
      _sum: { amount: true },
      _count: { id: true },
      where: {
        deletedAt: null,
        type: 'EXPENSE',
        ...(startDate && { transactionDate: { gte: startDate } }),
        ...(endDate && { transactionDate: { lte: endDate } })
      }
    })
  ]);

  return {
    totalIncome: incomeResult._sum.amount ?? 0,
    totalExpenses: expenseResult._sum.amount ?? 0,
    transactionCount: incomeResult._count.id + expenseResult._count.id,
    from: startDate ?? null,
    to: endDate ?? null
  };
}

async function getCategoryTotals(filters = {}) {
  const { startDate, endDate, type } = filters;

  const groups = await prisma.financialRecord.groupBy({
    by: ['category'],
    _sum: { amount: true },
    _count: { id: true },
    where: {
      deletedAt: null,
      ...(type && { type }),
      ...(startDate && { transactionDate: { gte: startDate } }),
      ...(endDate && { transactionDate: { lte: endDate } })
    },
    orderBy: { _sum: { amount: 'desc' } }
  });

  return groups.map(g => ({
    category: g.category,
    total: g._sum.amount ?? 0,
    transactionCount: g._count.id
  }));
}

// Prisma groupBy can't do conditional SUM per type in one query,
// so we pull the full window and aggregate income/expense per bucket in JS
async function getTrends(period, count) {
  const now = new Date();
  const startDate = period === 'monthly'
    ? new Date(now.getFullYear(), now.getMonth() - count, 1)
    : new Date(now.getTime() - count * 7 * 24 * 60 * 60 * 1000);

  const records = await prisma.financialRecord.findMany({
    where: { deletedAt: null, transactionDate: { gte: startDate } },
    select: { amount: true, type: true, transactionDate: true }
  });

  const buckets = {};

  records.forEach(record => {
    const d = new Date(record.transactionDate);
    let label;

    if (period === 'monthly') {
      label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    } else {
      // ISO week: shift to Thursday of the week, then compute week number
      const weekDate = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      weekDate.setUTCDate(weekDate.getUTCDate() + 4 - (weekDate.getUTCDay() || 7));
      const yearStart = new Date(Date.UTC(weekDate.getUTCFullYear(), 0, 1));
      const weekNo = Math.ceil(((weekDate - yearStart) / 86400000 + 1) / 7);
      label = `${weekDate.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
    }

    if (!buckets[label]) buckets[label] = { label, income: 0, expense: 0 };
    const val = Number(record.amount);
    if (record.type === 'INCOME') buckets[label].income += val;
    else buckets[label].expense += val;
  });

  return Object.values(buckets).sort((a, b) => a.label.localeCompare(b.label));
}

async function getRecentActivity(limit) {
  return prisma.financialRecord.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { createdBy: { select: { username: true } } }
  });
}

async function getPeriodTotals(from, to) {
  const [incomeResult, expenseResult] = await Promise.all([
    prisma.financialRecord.aggregate({
      _sum: { amount: true },
      _count: { id: true },
      where: { deletedAt: null, type: 'INCOME', transactionDate: { gte: from, lte: to } }
    }),
    prisma.financialRecord.aggregate({
      _sum: { amount: true },
      _count: { id: true },
      where: { deletedAt: null, type: 'EXPENSE', transactionDate: { gte: from, lte: to } }
    })
  ]);

  return {
    totalIncome: incomeResult._sum.amount ?? 0,
    totalExpenses: expenseResult._sum.amount ?? 0,
    transactionCount: incomeResult._count.id + expenseResult._count.id
  };
}

async function getTopCategoryForPeriod(from, to) {
  const groups = await prisma.financialRecord.groupBy({
    by: ['category'],
    _sum: { amount: true },
    where: { deletedAt: null, type: 'EXPENSE', transactionDate: { gte: from, lte: to } },
    orderBy: { _sum: { amount: 'desc' } },
    take: 1
  });

  if (groups.length === 0) return null;
  return { categoryName: groups[0].category, total: groups[0]._sum.amount ?? 0 };
}

async function getCategoryInsights(from, to) {
  const records = await prisma.financialRecord.findMany({
    where: { deletedAt: null, transactionDate: { gte: from, lte: to } },
    select: { category: true, type: true, amount: true }
  });

  const map = {};
  for (const r of records) {
    if (!map[r.category]) map[r.category] = { category: r.category, income: 0, expense: 0, transactionCount: 0 };
    const val = Number(r.amount);
    if (r.type === 'INCOME') map[r.category].income += val;
    else map[r.category].expense += val;
    map[r.category].transactionCount++;
  }

  return Object.values(map).sort((a, b) => (b.income + b.expense) - (a.income + a.expense));
}

async function getCategoryTrends(from, to, groupBy) {
  const records = await prisma.financialRecord.findMany({
    where: { deletedAt: null, transactionDate: { gte: from, lte: to } },
    select: { category: true, type: true, amount: true, transactionDate: true }
  });

  // Converts a date to a period label — same logic used for every category
  // so all series share an identical label array (needed for chart alignment)
  const labelOf = (date) => {
    const d = new Date(date);
    if (groupBy === 'weekly') {
      const utc = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      utc.setUTCDate(utc.getUTCDate() + 4 - (utc.getUTCDay() || 7));
      const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
      const week = Math.ceil(((utc - yearStart) / 86400000 + 1) / 7);
      return `${utc.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
    }
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const map = {};
  const labelSet = new Set();

  for (const r of records) {
    const label = labelOf(r.transactionDate);
    labelSet.add(label);
    if (!map[r.category]) map[r.category] = {};
    if (!map[r.category][label]) map[r.category][label] = { income: 0, expense: 0 };
    const val = Number(r.amount);
    if (r.type === 'INCOME') map[r.category][label].income += val;
    else map[r.category][label].expense += val;
  }

  const labels = [...labelSet].sort();
  const categories = Object.entries(map).map(([category, buckets]) => ({
    category,
    income: labels.map(l => Number((buckets[l]?.income ?? 0).toFixed(2))),
    expense: labels.map(l => Number((buckets[l]?.expense ?? 0).toFixed(2)))
  }));

  return { labels, categories };
}

module.exports = {
  getSummaryTotals,
  getCategoryTotals,
  getTrends,
  getRecentActivity,
  getPeriodTotals,
  getTopCategoryForPeriod,
  getCategoryInsights,
  getCategoryTrends
};
