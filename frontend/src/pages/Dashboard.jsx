import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { getCategorySpendData, getSpendOverTimeData } from '../utils/chartHelpers';
import SpendHeatmap from '../components/SpendHeatmap';
import { getExpenses, createExpense, updateExpense, deleteExpense } from '../api/expenseApi';
import { getCategories, createCategory } from '../api/categoryApi';
import { getBudgetStatus, setBudget } from '../api/budgetApi';
import Toast from '../components/Toast';

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
  const [budgetStatus, setBudgetStatus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [amount, setAmount] = useState('');
  const [shopName, setShopName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date());
  const [isMixed, setIsMixed] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [budgetScope, setBudgetScope] = useState('overall');
  const [budgetLimit, setBudgetLimit] = useState('');

  const [toast, setToast] = useState(null);

  async function loadExpenses() {
    const data = await getExpenses();
    setExpenses(data);
  }

  async function loadBudgetStatus() {
    const data = await getBudgetStatus();
    setBudgetStatus(data);
  }

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [expenseData, categoryData, budgetData] = await Promise.all([
          getExpenses(),
          getCategories(),
          getBudgetStatus(),
        ]);
        setExpenses(expenseData);
        setCategories(categoryData);
        setBudgetStatus(budgetData);
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

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const expenseData = {
        amount: Number(amount),
        shopName,
        category: categoryId || null,
        date: toDateOnlyString(expenseDate),
        isMixed,
      };
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

  function startEditing(expense) {
    setEditingId(expense._id);
    setAmount(expense.amount);
    setShopName(expense.shopName);
    setCategoryId(expense.category?._id || '');
    setExpenseDate(fromDateOnlyString(expense.date));   // ← changed
    setIsMixed(expense.isMixed || false);
  }

  async function handleDelete(id) {
    try {
      await deleteExpense(id);
      showToast('Expense deleted', 'error');
      await loadExpenses();
    } catch (err) {
      setError(err.message);
    }
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
      await loadBudgetStatus();
    } catch (err) {
      setError(err.message);
    }
  }

  function getCategoryName(scope) {
    if (scope === 'overall') return 'Overall';
    const match = categories.find((cat) => cat._id === scope);
    return match ? match.name : 'Unknown category';
  }

  const categoryData = getCategorySpendData(expenses);
  const timeData = getSpendOverTimeData(expenses);
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const overallBudget = budgetStatus.find((b) => b.scope === 'overall');

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
        </header>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Total Spent</p>
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
            <p className="text-2xl font-semibold text-[#3A3335]">{expenses.length}</p>
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
          <h2 className="text-lg font-semibold mb-4 text-[#3A3335]">Budgets</h2>

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
                    <span className="text-gray-400">${b.spent} / ${b.limit}</span>
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
          <h2 className="text-lg font-semibold mb-4 text-[#3A3335]">Recent Expenses</h2>

          {expenses.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No expenses yet — add your first one above.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {expenses.map((expense) => (
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
                      onClick={() => handleDelete(expense._id)}
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
    </div>
  );
}

export default Dashboard;