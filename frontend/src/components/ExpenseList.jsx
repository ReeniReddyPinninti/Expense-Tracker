function ExpenseList({
  filteredExpenses,
  hasAnyExpenses,
  categories,
  searchTerm, setSearchTerm,
  filterCategory, setFilterCategory,
  sortBy, setSortBy,
  startEditing,
  requestDelete,
  requestClearAllExpenses,
  fromDateOnlyString,
  monthLabel,
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[#3A3335]">Recent Expenses</h2>
        {hasAnyExpenses && (
          <button
            onClick={requestClearAllExpenses}
            className="text-xs text-red-400 hover:text-red-500 hover:underline"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by shop name..."
          className="border border-gray-200 rounded-lg p-2.5 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-[#D88C9A]"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D88C9A]"
        >
          <option value="">All categories</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>{cat.name}</option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D88C9A]"
        >
          <option value="date-desc">Newest first</option>
          <option value="date-asc">Oldest first</option>
          <option value="amount-desc">Amount: high to low</option>
          <option value="amount-asc">Amount: low to high</option>
          <option value="shop-asc">Shop name: A–Z</option>
        </select>
      </div>

      {filteredExpenses.length === 0 ? (
        <p className="text-sm text-gray-400 py-8 text-center">
          {hasAnyExpenses ? 'No expenses match your search.' : `No expenses in ${monthLabel} yet.`}
        </p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {filteredExpenses.map((expense) => (
            <li key={expense._id} className="py-3.5 flex justify-between items-center group">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-[#3A3335]">{expense.shopName}</span>
                  <span className="text-[#3A3335]">${expense.amount}</span>
                  {expense.category && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: '#F2D4D7', color: '#9C6B7A' }}
                    >
                      {expense.category.name}
                    </span>
                  )}
                  {expense.isMixed && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                      Mixed
                    </span>
                  )}
                </div>
                {expense.notes && (
                  <p className="text-xs text-gray-400 mt-1 italic">{expense.notes}</p>
                )}
                <p className="text-xs text-gray-400 mt-0.5">
                  {fromDateOnlyString(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>

              <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => startEditing(expense)}
                  className="text-xs text-gray-400 hover:text-[#D88C9A] transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => requestDelete(expense._id)}
                  className="text-xs text-gray-400 hover:text-red-400 transition-colors"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ExpenseList;