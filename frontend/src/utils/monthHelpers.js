export function getMonthKey(dateStr) {
  return String(dateStr).split('T')[0].slice(0, 7); // "2026-09"
}

export function getCurrentMonthKey() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${now.getFullYear()}-${month}`;
}

export function getAvailableMonths(expenses) {
  const months = new Set(expenses.map((e) => getMonthKey(e.date)));
  months.add(getCurrentMonthKey()); // always include the current month, even with no data yet
  return Array.from(months).sort().reverse(); // newest first
}

export function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}