const repository = require('../repositories/dashboard.repository');
const {
  toSummaryDto,
  toCategoryDto,
  toRecentActivityRecordDto,
  toCategoryInsightDto,
  toPeriodDto
} = require('../dtos/dashboard.dto');

async function getSummary(filters) {
  const result = await repository.getSummaryTotals(filters);
  return toSummaryDto(result);
}

async function getCategoryBreakdown(filters) {
  const categories = await repository.getCategoryTotals(filters);
  const grandTotal = categories.reduce((sum, c) => sum + Number(c.total), 0);
  return categories.map(c => toCategoryDto(c, grandTotal));
}

async function getCategoryTrends(from, to, groupBy) {
  const result = await repository.getCategoryTrends(from, to, groupBy);
  return {
    groupBy,
    period: {
      from: new Date(from).toISOString().split('T')[0],
      to: new Date(to).toISOString().split('T')[0]
    },
    labels: result.labels,
    categories: result.categories
  };
}

async function getRecentActivity(limit) {
  const records = await repository.getRecentActivity(limit);
  return {
    records: records.map(toRecentActivityRecordDto),
    limit
  };
}

async function getInsights(startDate, endDate) {
  const from = new Date(startDate);
  const to = new Date(endDate);

  const [periodTotals, categoryRows] = await Promise.all([
    repository.getPeriodTotals(from, to),
    repository.getCategoryInsights(from, to)
  ]);

  const totalIncome = Number(periodTotals.totalIncome);
  const totalExpenses = Number(periodTotals.totalExpenses);
  const totalNet = totalIncome - totalExpenses;
  const fromStr = from.toISOString().split('T')[0];
  const toStr = to.toISOString().split('T')[0];

  let overallResult, overallSummary;
  if (totalNet > 0) {
    overallResult = 'profit';
    overallSummary = `${fromStr} to ${toStr}: income ${totalIncome.toFixed(2)}, expenses ${totalExpenses.toFixed(2)}, net profit ${totalNet.toFixed(2)}.`;
  } else if (totalNet < 0) {
    overallResult = 'loss';
    overallSummary = `${fromStr} to ${toStr}: expenses ${totalExpenses.toFixed(2)} exceeded income ${totalIncome.toFixed(2)}, net loss ${Math.abs(totalNet).toFixed(2)}.`;
  } else {
    overallResult = 'break-even';
    overallSummary = `${fromStr} to ${toStr}: income and expenses both at ${totalIncome.toFixed(2)}.`;
  }

  return {
    period: { from: fromStr, to: toStr },
    overall: {
      totalIncome: totalIncome.toFixed(2),
      totalExpenses: totalExpenses.toFixed(2),
      net: totalNet.toFixed(2),
      result: overallResult,
      transactionCount: periodTotals.transactionCount,
      summary: overallSummary
    },
    categories: categoryRows.map(toCategoryInsightDto),
    generatedAt: new Date().toISOString()
  };
}

function formatPeriodLabel(date, period) {
  if (period === 'weekly') return `Week of ${date.toISOString().split('T')[0]}`;
  if (period === 'quarterly') {
    const q = Math.floor(date.getMonth() / 3) + 1;
    return `Q${q} ${date.getFullYear()}`;
  }
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
}

// Computes percentage change between two values. Returns null if previous is 0 to avoid division by zero.
function computeChange(current, previous) {
  if (previous === 0) return null;
  return (((current - previous) / Math.abs(previous)) * 100).toFixed(1);
}

function getDirection(changeStr) {
  if (changeStr === null) return 'neutral';
  const val = Number(changeStr);
  return val > 0 ? 'up' : val < 0 ? 'down' : 'neutral';
}

// Derives start/end dates for current and previous period based on the period type
async function getComparison(period, referenceDate) {
  const ref = referenceDate ? new Date(referenceDate) : new Date();
  let currentFrom, currentTo, prevFrom, prevTo;

  if (period === 'monthly') {
    currentFrom = new Date(ref.getFullYear(), ref.getMonth(), 1);
    currentTo = ref;
    prevFrom = new Date(ref.getFullYear(), ref.getMonth() - 1, 1);
    prevTo = new Date(ref.getFullYear(), ref.getMonth(), 0);
  } else if (period === 'weekly') {
    const diff = ref.getDate() - ref.getDay() + (ref.getDay() === 0 ? -6 : 1);
    currentFrom = new Date(ref.getFullYear(), ref.getMonth(), diff);
    currentTo = ref;
    prevFrom = new Date(currentFrom.getTime() - 7 * 24 * 60 * 60 * 1000);
    prevTo = new Date(currentFrom.getTime() - 1);
  } else {
    const quarter = Math.floor(ref.getMonth() / 3);
    currentFrom = new Date(ref.getFullYear(), quarter * 3, 1);
    currentTo = ref;
    prevFrom = new Date(ref.getFullYear(), (quarter - 1) * 3, 1);
    prevTo = new Date(ref.getFullYear(), quarter * 3, 0);
  }

  const [current, previous] = await Promise.all([
    repository.getPeriodTotals(currentFrom, currentTo),
    repository.getPeriodTotals(prevFrom, prevTo)
  ]);

  const currInc = Number(current.totalIncome);
  const currExp = Number(current.totalExpenses);
  const prevInc = Number(previous.totalIncome);
  const prevExp = Number(previous.totalExpenses);
  const currNet = currInc - currExp;
  const prevNet = prevInc - prevExp;

  const incomeChange = computeChange(currInc, prevInc);
  const expenseChange = computeChange(currExp, prevExp);
  const netChange = computeChange(currNet, prevNet);

  return {
    currentPeriod: toPeriodDto(current, currentFrom, currentTo, formatPeriodLabel(currentFrom, period)),
    previousPeriod: toPeriodDto(previous, prevFrom, prevTo, formatPeriodLabel(prevFrom, period)),
    changes: {
      incomeChange,
      expenseChange,
      netChange,
      incomeDirection: getDirection(incomeChange),
      expenseDirection: getDirection(expenseChange),
      netDirection: getDirection(netChange)
    }
  };
}

// VIEWER gets summary only — the other blocks aren't computed at all for that role
async function getFullDashboard(params, requestingUser) {
  if (requestingUser.role === 'VIEWER') {
    const summary = await getSummary({ startDate: params.startDate, endDate: params.endDate });
    return { summary };
  }

  const [summary, categoryTotals, categoryTrends, recentActivity, insights] = await Promise.all([
    getSummary({ startDate: params.startDate, endDate: params.endDate }),
    getCategoryBreakdown({ startDate: params.startDate, endDate: params.endDate, type: params.type }),
    getCategoryTrends(
      params.startDate || new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1),
      params.endDate || new Date(),
      params.groupBy || 'monthly'
    ),
    getRecentActivity(params.recentLimit || 10),
    getInsights(params.startDate, params.endDate)
  ]);

  return { summary, categoryTotals, categoryTrends, recentActivity, insights };
}

module.exports = {
  getSummary,
  getCategoryBreakdown,
  getCategoryTrends,
  getRecentActivity,
  getInsights,
  getComparison,
  getFullDashboard
};
