// export function getHeatmapData(expenses, year) {
//   const spendByDate = {};

//   expenses.forEach((expense) => {
//     const d = new Date(expense.date);
//     if (d.getFullYear() !== year) return;
//     const key = d.toISOString().split('T')[0]; // "2026-08-30"
//     spendByDate[key] = (spendByDate[key] || 0) + expense.amount;
//   });

//   const startDate = new Date(year, 0, 1);
//   const endDate = new Date(year, 11, 31);

//   const days = [];
//   const current = new Date(startDate);

//   while (current <= endDate) {
//     const key = current.toISOString().split('T')[0];
//     days.push({
//       date: key,
//       day: current.getDay(), // 0 = Sunday
//       amount: spendByDate[key] || 0,
//     });
//     current.setDate(current.getDate() + 1);
//   }

//   return days;
// }

// export function getIntensityColor(amount, maxAmount) {
//   if (amount === 0) return '#F3EEEF';
//   const ratio = amount / maxAmount;
//   if (ratio < 0.25) return '#F2D4D7';
//   if (ratio < 0.5) return '#E8B4BC';
//   if (ratio < 0.75) return '#D88C9A';
//   return '#B5828C';
// }

export function getHeatmapData(expenses, year) {
  const spendByDate = {};

  expenses.forEach((expense) => {
    const d = new Date(expense.date);
    if (d.getFullYear() !== year) return;
    const key = d.toISOString().split('T')[0]; // "2026-08-30"
    spendByDate[key] = (spendByDate[key] || 0) + expense.amount;
  });

  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);

  const days = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const key = current.toISOString().split('T')[0];
    days.push({
      date: key,
      day: current.getDay(), // 0 = Sunday
      amount: spendByDate[key] || 0,
    });
    current.setDate(current.getDate() + 1);
  }

  return days;
}

export function getIntensityColor(amount, maxAmount) {
  if (amount === 0) return '#F3EEEF';
  const ratio = amount / maxAmount;
  if (ratio < 0.25) return '#F2D4D7';
  if (ratio < 0.5) return '#E8B4BC';
  if (ratio < 0.75) return '#D88C9A';
  return '#B5828C';
}