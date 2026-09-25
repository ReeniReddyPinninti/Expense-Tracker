function BudgetPanel({
  budgetScope, setBudgetScope,
  budgetLimit, setBudgetLimit,
  categories,
  handleSetBudget,
  budgetStatus,
  getCategoryName,
  requestClearAllBudgets,
  requestClearBudget,
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[#3A3335]">Budgets</h2>
        {budgetStatus.length > 0 && (
          <button
            onClick={requestClearAllBudgets}
            className="text-xs text-red-400 hover:text-red-500 hover:underline"
          >
            Clear All
          </button>
        )}
      </div>

      <form onSubmit={handleSetBudget} className="flex flex-wrap gap-2 mb-5">
        <select
          value={budgetScope}
          onChange={(e) => setBudgetScope(e.target.value)}
          className="border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D88C9A]"
        >
          <option value="overall">Overall</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>{cat.name}</option>
          ))}
        </select>
        <input
          type="number"
          value={budgetLimit}
          onChange={(e) => setBudgetLimit(e.target.value)}
          placeholder="Limit"
          required
          className="border border-gray-200 rounded-lg p-2.5 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-[#D88C9A]"
        />
        <button
          type="submit"
          className="bg-[#D88C9A] text-white px-4 rounded-lg text-sm font-medium hover:bg-[#C77B8C] transition-colors"
        >
          Save Budget
        </button>
      </form>

      {budgetStatus.length === 0 ? (
        <p className="text-sm text-gray-400">No budgets set yet.</p>
      ) : (
        <div className="space-y-4">
          {budgetStatus.map((b) => (
            <div key={b.scope}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="font-medium text-[#3A3335]">{getCategoryName(b.scope)}</span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">${b.spent} / ${b.limit}</span>
                  <button
                    onClick={() => requestClearBudget(b.scope, getCategoryName(b.scope))}
                    className="text-xs text-gray-300 hover:text-red-400"
                    title="Remove this budget"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full transition-all duration-500 ${
                    b.isOverBudget ? 'bg-red-400' : b.percentage > 70 ? 'bg-yellow-400' : 'bg-green-400'
                  }`}
                  style={{ width: `${b.percentage}%` }}
                />
              </div>
              {b.isOverBudget && (
                <p className="text-xs text-red-400 mt-1">
                  +${(b.spent - b.limit).toFixed(2)} over budget
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default BudgetPanel;