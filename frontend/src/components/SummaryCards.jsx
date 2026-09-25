function SummaryCards({ todaySpent, weekSpent, totalSpent, monthLabel, overallBudget, expenseCount }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Today</p>
        <p className="text-2xl font-semibold text-[#3A3335]">${todaySpent.toFixed(2)}</p>
      </div>
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">This Week</p>
        <p className="text-2xl font-semibold text-[#3A3335]">${weekSpent.toFixed(2)}</p>
      </div>
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">{monthLabel}</p>
        <p className="text-2xl font-semibold text-[#3A3335]">${totalSpent.toFixed(2)}</p>
      </div>
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Overall Budget</p>
        <p className="text-2xl font-semibold text-[#3A3335]">
          {overallBudget ? `$${overallBudget.limit}` : '— not set'}
        </p>
      </div>
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Expenses Logged</p>
        <p className="text-2xl font-semibold text-[#3A3335]">{expenseCount}</p>
      </div>
    </div>
  );
}

export default SummaryCards;