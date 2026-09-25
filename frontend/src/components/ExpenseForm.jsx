import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

function ExpenseForm({
  amount, setAmount,
  shopName, setShopName,
  expenseDate, setExpenseDate,
  categoryId, setCategoryId,
  categories,
  isCreatingCategory, setIsCreatingCategory,
  newCategoryName, setNewCategoryName,
  handleCreateCategory,
  isMixed, handleMixedChange,
  notes, setNotes,
  editingId,
  handleSubmit,
  resetForm,
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
      <h2 className="text-lg font-semibold mb-4 text-[#3A3335]">
        {editingId ? 'Edit Expense' : 'Add an Expense'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              placeholder="0.00"
              className="border border-gray-200 rounded-lg w-full p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D88C9A] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Shop Name</label>
            <input
              type="text"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              required
              placeholder="Target, Rent, etc."
              className="border border-gray-200 rounded-lg w-full p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D88C9A] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
            <DatePicker
              selected={expenseDate}
              onChange={(date) => setExpenseDate(date)}
              dateFormat="MMMM d, yyyy"
              maxDate={new Date()}
              className="border border-gray-200 rounded-lg w-full p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D88C9A] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Category (optional)</label>
            {!isCreatingCategory ? (
              <select
                value={categoryId}
                onChange={(e) => {
                  if (e.target.value === '__create_new__') {
                    setIsCreatingCategory(true);
                  } else {
                    setCategoryId(e.target.value);
                  }
                }}
                className="border border-gray-200 rounded-lg w-full p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D88C9A] focus:border-transparent"
              >
                <option value="">None (Miscellaneous)</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
                <option value="__create_new__">+ Create new category</option>
              </select>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="New category name"
                  autoFocus
                  className="border border-gray-200 rounded-lg w-full p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D88C9A]"
                />
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  className="bg-[#D88C9A] text-white px-3 rounded-lg text-sm hover:bg-[#C77B8C] transition-colors"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingCategory(false)}
                  className="border border-gray-200 px-3 rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isMixed"
            checked={isMixed}
            onChange={(e) => handleMixedChange(e.target.checked)}
            className="h-4 w-4 accent-[#D88C9A]"
          />
          <label htmlFor="isMixed" className="text-sm text-gray-500">
            This covers a mix of different products
          </label>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any extra details..."
            rows={2}
            className="border border-gray-200 rounded-lg w-full p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D88C9A] focus:border-transparent resize-none"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            className="bg-[#D88C9A] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#C77B8C] transition-colors"
          >
            {editingId ? 'Update Expense' : 'Add Expense'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="border border-gray-200 px-5 py-2.5 rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default ExpenseForm;