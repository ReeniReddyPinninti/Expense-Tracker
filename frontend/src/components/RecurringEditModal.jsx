function RecurringEditModal({ item, amount, setAmount, scope, setScope, monthLabel, onSave, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <form
        onSubmit={onSave}
        className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6"
      >
        <h3 className="text-lg font-semibold text-[#3A3335] mb-4">Edit {item.name}</h3>

        <label className="text-xs text-gray-400">Amount</label>
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          autoFocus
          className="w-full border border-gray-200 rounded-lg p-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-[#D88C9A]"
        />

        <div className="space-y-2 mb-5 text-sm text-[#3A3335]">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="scope"
              checked={scope === 'month'}
              onChange={() => setScope('month')}
            />
            Only for {monthLabel}
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="scope"
              checked={scope === 'forever'}
              onChange={() => setScope('forever')}
            />
            From now on (every month)
          </label>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-[#D88C9A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#C77B8C]"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

export default RecurringEditModal;