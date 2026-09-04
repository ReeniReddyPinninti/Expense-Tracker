export function getCategorySpendData(expenses) {
  const totals = {};

  expenses.forEach((expense) => {
    const categoryName = expense.category?.name || 'Miscellaneous';
    totals[categoryName] = (totals[categoryName] || 0) + expense.amount;
  });

  return Object.entries(totals).map(([name, value]) => ({ name, value }));
}

export function getSpendOverTimeData(expenses) {
  const totals = {};

  expenses.forEach((expense) => {
    const dateKey = new Date(expense.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    totals[dateKey] = (totals[dateKey] || 0) + expense.amount;
  });

  // sort chronologically, not alphabetically, since date strings don't sort correctly as text
  return Object.entries(totals)
    .map(([date, amount]) => ({ date, amount, sortKey: new Date(date + ', 2026') }))
    .sort((a, b) => a.sortKey - b.sortKey)
    .map(({ date, amount }) => ({ date, amount }));
}