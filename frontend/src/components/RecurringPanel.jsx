function RecurringPanel({
  recurringItems,
  showAddRecurring, setShowAddRecurring,
  newRecurringName, setNewRecurringName,
  newRecurringAmount, setNewRecurringAmount,
  newRecurringCategoryId, setNewRecurringCategoryId,
  categories,
  handleAddRecurring,
  isLoggedThisMonth,
  quickLogRecurring,
  handleDeleteRecurring,
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[#3A3335]">Recurring</h2>
        <button
          onClick={() => setShowAddRecurring(!showAddRecurring)}
          className="text-xs text-[#D88C9A] hover:underline"
        >
          {showAddRecurring ? 'Cancel' : '+ Add recurring item'}
        </button>
      </div>

      {showAddRecurring && (
        <form onSubmit={handleAddRecurring} className="flex flex-wrap gap-2 mb-5">
          <input
            type="text"
            value={newRecurringName}
            onChange={(e) => setNewRecurringName(e.target.value)}
            placeholder="Rent, Netflix, etc."
            required
            className="border border-gray-200 rounded-lg p-2.5 text-sm flex-1 min-w-[140px] focus:outline-none focus:ring-2 focus:ring-[#D88C9A]"
          />
          <input
            type="number"
            value={newRecurringAmount}
            onChange={(e) => setNewRecurringAmount(e.target.value)}
            placeholder="Amount"
            required
            className="border border-gray-200 rounded-lg p-2.5 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-[#D88C9A]"
          />
          <select
            value={newRecurringCategoryId}
            onChange={(e) => setNewRecurringCategoryId(e.target.value)}
            className="border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D88C9A]"
          >
            <option value="">No category</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>
          <button
            type="submit"
            className="bg-[#D88C9A] text-white px-4 rounded-lg text-sm font-medium hover:bg-[#C77B8C] transition-colors"
          >
            Save
          </button>
        </form>
      )}

      {recurringItems.length === 0 ? (
        <p className="text-sm text-gray-400">No recurring items yet — add rent, subscriptions, anything monthly.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {recurringItems.map((item) => {
            const logged = isLoggedThisMonth(item);
            return (
              <li key={item._id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={logged ? 'text-gray-400 line-through' : 'text-[#3A3335] font-medium'}>
                    {item.name}
                  </span>
                  <span className="text-sm text-gray-400">${item.amount}</span>
                </div>
                <div className="flex items-center gap-3">
                  {logged ? (
                    <span className="text-xs text-green-500">Logged ✓</span>
                  ) : (
                    <button
                      onClick={() => quickLogRecurring(item)}
                      className="text-xs text-[#D88C9A] hover:underline"
                    >
                      Log now
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteRecurring(item._id)}
                    className="text-xs text-gray-300 hover:text-red-400"
                  >
                    ✕
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default RecurringPanel;