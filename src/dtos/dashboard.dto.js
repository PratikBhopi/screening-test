// Shapes raw repository data into the response format for each dashboard endpoint

const toSummaryDto = (raw) => ({
  totalIncome: Number(raw.totalIncome).toFixed(2),
  totalExpenses: Number(raw.totalExpenses).toFixed(2),
  netBalance: (Number(raw.totalIncome) - Number(raw.totalExpenses)).toFixed(2),
  transactionCount: Number(raw.transactionCount),
  period: { from: raw.from, to: raw.to }
});

const toCategoryDto = (raw, grandTotal) => {
  const total = Number(raw.total);
  return {
    category: raw.category,
    total: total.toFixed(2),
    transactionCount: raw.transactionCount,
    percentageOfTotal: grandTotal > 0 ? ((total / grandTotal) * 100).toFixed(1) : '0.0'
  };
};

const toRecentActivityRecordDto = (r) => ({
  id: r.id,
  amount: Number(r.amount).toFixed(2),
  type: r.type,
  category: r.category,
  description: r.description,
  createdBy: r.createdBy.username,
  transactionDate: r.transactionDate.toISOString().split('T')[0],
  createdAt: r.createdAt.toISOString()
});

// Classifies a category row as profit, loss, or break-even and builds a one-line summary
const toCategoryInsightDto = (row) => {
  const { income, expense } = row;
  const net = income - expense;

  let result, summary;

  if (income > 0 && expense === 0) {
    result = 'profit';
    summary = `${row.category} generated ${income.toFixed(2)} in income with no expenses.`;
  } else if (expense > 0 && income === 0) {
    result = 'loss';
    summary = `${row.category} had ${expense.toFixed(2)} in expenses with no income.`;
  } else if (net > 0) {
    result = 'profit';
    summary = `${row.category} was profitable: ${income.toFixed(2)} income vs ${expense.toFixed(2)} expenses, net +${net.toFixed(2)}.`;
  } else if (net < 0) {
    result = 'loss';
    summary = `${row.category} ran at a loss: ${expense.toFixed(2)} expenses vs ${income.toFixed(2)} income, net ${net.toFixed(2)}.`;
  } else {
    result = 'break-even';
    summary = `${row.category} broke even at ${income.toFixed(2)}.`;
  }

  return {
    category: row.category,
    totalIncome: income.toFixed(2),
    totalExpenses: expense.toFixed(2),
    net: net.toFixed(2),
    result,
    transactionCount: row.transactionCount,
    summary
  };
};

const toPeriodDto = (totals, from, to, label) => ({
  label,
  from: from.toISOString().split('T')[0],
  to: to.toISOString().split('T')[0],
  totalIncome: Number(totals.totalIncome).toFixed(2),
  totalExpenses: Number(totals.totalExpenses).toFixed(2),
  netBalance: (Number(totals.totalIncome) - Number(totals.totalExpenses)).toFixed(2),
  transactionCount: totals.transactionCount
});

module.exports = {
  toSummaryDto,
  toCategoryDto,
  toRecentActivityRecordDto,
  toCategoryInsightDto,
  toPeriodDto
};
