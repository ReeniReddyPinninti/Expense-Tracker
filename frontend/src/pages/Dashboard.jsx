import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { getCategorySpendData, getSpendOverTimeData } from '../utils/chartHelpers';
import SpendHeatmap from '../components/SpendHeatmap';
import { getCategories, createCategory } from '../api/categoryApi';
import Toast from '../components/Toast';
import { getExpenses, createExpense, updateExpense, deleteExpense, deleteAllExpenses, deleteExpensesByCategory } from '../api/expenseApi';
import { getBudgets, setBudget, deleteAllBudgets, deleteBudgetByScope } from '../api/budgetApi';
import { getMonthKey, getCurrentMonthKey, getAvailableMonths, formatMonthLabel, isToday, isThisWeek } from '../utils/monthHelpers';

const CATEGORY_COLORS = ['#D88C9A', '#C77B8C', '#E8B4BC', '#B5828C', '#F2D4D7', '#9C6B7A', '#EFC3CB'];

function toDateOnlyString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`; // e.g. "2026-09-07", built from LOCAL date parts
}

function fromDateOnlyString(dateStr) {
  // Take only the date portion, whether it's "2026-09-07" or "2026-09-07T18:30:00.000Z"
  const datePart = String(dateStr).split('T')[0];
  const [year, month, day] = datePart.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function Dashboard() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [amount, setAmount] = useState('');
  const [shopName, setShopName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date());
  const [isMixed, setIsMixed] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [notes, setNotes] = useState('');

  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [budgetScope, setBudgetScope] = useState('overall');
  const [budgetLimit, setBudgetLimit] = useState('');

  const [toast, setToast] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [pendingUpdate, setPendingUpdate] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');

  const [confirmClear, setConfirmClear] = useState(null);

  async function loadExpenses() {
    const data = await getExpenses();
    setExpenses(data);
  }

  async function loadBudgets() {
    const data = await getBudgets();
    setBudgets(data);
  }

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [expenseData, categoryData, budgetData] = await Promise.all([
          getExpenses(),
          getCategories(),
          getBudgets(),
        ]);
        setExpenses(expenseData);
        setCategories(categoryData);
        setBudgets(budgetData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  function resetForm() {
    setAmount('');
    setShopName('');
    setCategoryId('');
    setExpenseDate(new Date());
    setIsMixed(false);
    setEditingId(null);
    setNotes('');
  }

  function handleMixedChange(checked) {
    setIsMixed(checked);
    if (checked) {
      const misc = categories.find((cat) => cat.name === 'Miscellaneous');
      if (misc) setCategoryId(misc._id);
    }
  }

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  function handleSubmit(e) {
    e.preventDefault();

    const expenseData = {
      amount: Number(amount),
      shopName,
      category: categoryId || null,
      date: toDateOnlyString(expenseDate),
      isMixed,
      notes,
    };

    if (editingId) {
      // don't save yet — ask for confirmation first
      setPendingUpdate(expenseData);
    } else {
      // creating a new expense doesn't need confirmation
      submitExpense(expenseData);
    }
  }

  async function submitExpense(expenseData) {
    try {
      if (editingId) {
        await updateExpense(editingId, expenseData);
        showToast('Expense updated');
      } else {
        await createExpense(expenseData);
        showToast('Expense added');
      }
      resetForm();
      await loadExpenses();
    } catch (err) {
      setError(err.message);
    }
  }

  async function confirmUpdate() {
    await submitExpense(pendingUpdate);
    setPendingUpdate(null);
  }

  function cancelUpdate() {
    setPendingUpdate(null);
  }

  function startEditing(expense) {
    setEditingId(expense._id);
    setAmount(expense.amount);
    setShopName(expense.shopName);
    setCategoryId(expense.category?._id || '');
    setExpenseDate(fromDateOnlyString(expense.date));
    setIsMixed(expense.isMixed || false);
    setNotes(expense.notes || '');
  }

  function requestDelete(id) {
    setConfirmDeleteId(id);
  }

  async function confirmDelete() {
    try {
      await deleteExpense(confirmDeleteId);
      showToast('Expense deleted', 'error');
      setConfirmDeleteId(null);
      await loadExpenses();
    } catch (err) {
      setError(err.message);
    }
  }

  function cancelDelete() {
    setConfirmDeleteId(null);
  }

  async function handleCreateCategory() {
    if (!newCategoryName.trim()) return;
    try {
      const newCategory = await createCategory(newCategoryName.trim());
      setCategories((prev) => [...prev, newCategory]);
      setCategoryId(newCategory._id);
      setNewCategoryName('');
      setIsCreatingCategory(false);
      showToast('Category created');
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSetBudget(e) {
    e.preventDefault();
    try {
      await setBudget(budgetScope, Number(budgetLimit));
      showToast('Budget updated');
      setBudgetLimit('');
      await loadBudgets();
    } catch (err) {
      setError(err.message);
    }
  }

  function getCategoryName(scope) {
    if (scope === 'overall') return 'Overall';
    const match = categories.find((cat) => cat._id === scope);
    return match ? match.name : 'Unknown category';
  }

  const monthExpenses = expenses.filter((e) => getMonthKey(e.date) === selectedMonth);

  const categoryData = getCategorySpendData(monthExpenses);
  const timeData = getSpendOverTimeData(monthExpenses);
  const totalSpent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

  const budgetStatus = budgets.map((b) => {
    const spent = monthExpenses
      .filter((e) => b.scope === 'overall' || e.category?._id === b.scope)
      .reduce((sum, e) => sum + e.amount, 0);
    return {
      scope: b.scope,
      limit: b.limit,
      spent,
      percentage: Math.min((spent / b.limit) * 100, 100),
      isOverBudget: spent > b.limit,
    };
  });

  const overallBudget = budgetStatus.find((b) => b.scope === 'overall');
  const availableMonths = getAvailableMonths(expenses);

  const filteredExpenses = monthExpenses
  .filter((expense) => {
    const matchesSearch = expense.shopName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || expense.category?._id === filterCategory;
    return matchesSearch && matchesCategory;
  })
  .sort((a, b) => {
    switch (sortBy) {
      case 'date-desc':
        return new Date(b.date) - new Date(a.date);
      case 'date-asc':
        return new Date(a.date) - new Date(b.date);
      case 'amount-desc':
        return b.amount - a.amount;
      case 'amount-asc':
        return a.amount - b.amount;
      case 'shop-asc':
        return a.shopName.localeCompare(b.shopName);
      default:
        return 0;
    }
  });
  const todayExpenses = expenses.filter((e) => isToday(e.date));
  const weekExpenses = expenses.filter((e) => isThisWeek(e.date));
  const todaySpent = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
  const weekSpent = weekExpenses.reduce((sum, e) => sum + e.amount, 0);

  function requestClearAllExpenses() {
    setConfirmClear({ type: 'all-expenses', label: 'Delete ALL expenses? This cannot be undone.' });
  }

  function requestClearCategoryExpenses(categoryId, categoryName) {
    setConfirmClear({
      type: 'category-expenses',
      label: `Delete all expenses in "${categoryName}"? This cannot be undone.`,
      payload: categoryId,
    });
  }

  function requestClearAllBudgets() {
    setConfirmClear({ type: 'all-budgets', label: 'Delete ALL budgets? This cannot be undone.' });
  }

  function requestClearBudget(scope, label) {
    setConfirmClear({ type: 'budget-scope', label: `Remove the budget for "${label}"?`, payload: scope });
  }

  async function confirmClearAction() {
    try {
      switch (confirmClear.type) {
        case 'all-expenses':
          await deleteAllExpenses();
          showToast('All expenses cleared', 'error');
          await loadExpenses();
          break;
        case 'category-expenses':
          await deleteExpensesByCategory(confirmClear.payload);
          showToast('Category expenses cleared', 'error');
          await loadExpenses();
          break;
        case 'all-budgets':
          await deleteAllBudgets();
          showToast('All budgets cleared', 'error');
          await loadBudgetStatus();
          break;
        case 'budget-scope':
          await deleteBudgetByScope(confirmClear.payload);
          showToast('Budget removed', 'error');
          await loadBudgetStatus();
          break;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setConfirmClear(null);
    }
  }

  function cancelClear() {
    setConfirmClear(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Loading your expenses...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-10 md:px-12">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-semibold text-[#3A3335]">Expense Tracker</h1>
          <p className="text-sm text-gray-400 mt-1">Track spending, set budgets, stay on top of it.</p>
          <div className="mt-3">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border border-gray-200 rounded-lg text-sm p-2 focus:outline-none focus:ring-2 focus:ring-[#D88C9A]"
            >
              {availableMonths.map((m) => (
                <option key={m} value={m}>{formatMonthLabel(m)}</option>
              ))}
            </select>
          </div>
        </header>

        {/* Summary cards */}
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
            <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">{formatMonthLabel(selectedMonth)}</p>
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
            <p className="text-2xl font-semibold text-[#3A3335]">{monthExpenses.length}</p>
          </div>
        </div>

        {/* Add / Edit expense form */}
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

        {/* Budgets */}
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

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-2 text-[#3A3335]">Spend by Category</h2>
            {categoryData.length === 0 ? (
              <p className="text-sm text-gray-400 py-16 text-center">No expenses yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={entry.name} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-2 text-[#3A3335]">Spend Over Time</h2>
            {timeData.length === 0 ? (
              <p className="text-sm text-gray-400 py-16 text-center">No expenses yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={timeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                  <Tooltip />
                  <Bar dataKey="amount" fill="#D88C9A" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <SpendHeatmap expenses={expenses} />
        </div>

        {/* Expense list */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#3A3335]">Recent Expenses</h2>
            {expenses.length > 0 && (
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
              {monthExpenses.length === 0
                ? `No expenses in ${formatMonthLabel(selectedMonth)} yet.`
                : 'No expenses match your search.'}
            </p>
          ) :(
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

      </div>
      {toast && (
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(null)}
      />
    )}
    {confirmDeleteId && (
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-lg p-6 max-w-sm w-full mx-4">
          <h3 className="text-lg font-semibold text-[#3A3335] mb-2">Delete this expense?</h3>
          <p className="text-sm text-gray-500 mb-5">This can't be undone.</p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={cancelDelete}
              className="border border-gray-200 px-4 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="bg-red-400 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-500 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    )}

    {pendingUpdate && (
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-lg p-6 max-w-sm w-full mx-4">
          <h3 className="text-lg font-semibold text-[#3A3335] mb-2">Save these changes?</h3>
          <p className="text-sm text-gray-500 mb-5">
            {pendingUpdate.shopName} — ${pendingUpdate.amount}
          </p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={cancelUpdate}
              className="border border-gray-200 px-4 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmUpdate}
              className="bg-[#D88C9A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#C77B8C] transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    )}

    {confirmClear && (
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-lg p-6 max-w-sm w-full mx-4">
          <h3 className="text-lg font-semibold text-[#3A3335] mb-2">Are you sure?</h3>
          <p className="text-sm text-gray-500 mb-5">{confirmClear.label}</p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={cancelClear}
              className="border border-gray-200 px-4 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmClearAction}
              className="bg-red-400 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-500 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    )}


    </div>
  );
}

export default Dashboard;