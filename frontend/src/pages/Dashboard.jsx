import { useState, useEffect } from 'react';
import { getExpenses, createExpense } from '../api/expenseApi';
import { getCategories, createCategory } from '../api/categoryApi';
import { getBudgetStatus, setBudget } from '../api/budgetApi';

function Dashboard() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [budgetStatus, setBudgetStatus] = useState([]);
  const [budgetScope, setBudgetScope] = useState('overall');
  const [budgetLimit, setBudgetLimit] = useState('');

  const [amount, setAmount] = useState('');
  const [shopName, setShopName] = useState('');
  const [categoryId, setCategoryId] = useState('');

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

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await createExpense({
        amount: Number(amount),
        shopName,
        category: categoryId || null,
      });
      setAmount('');
      setShopName('');
      setCategoryId('');
      await loadExpenses();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreateCategory() {
    if (!newCategoryName.trim()) return;

    try {
      const newCategory = await createCategory(newCategoryName.trim());
      setCategories((prev) => [...prev, newCategory]); // add it to the dropdown list
      setCategoryId(newCategory._id);                   // auto-select the new category
      setNewCategoryName('');
      setIsCreatingCategory(false);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSetBudget(e) {
    e.preventDefault();
    try {
      await setBudget(budgetScope, Number(budgetLimit));
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

  if (loading) return <p className="p-6">Loading...</p>;
  if (error) return <p className="p-6 text-red-500">Error: {error}</p>;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold text-pink-500 mb-6">Expense Tracker</h1>

      <form onSubmit={handleSubmit} className="space-y-3 mb-8 border rounded p-4">
        <div>
          <label className="block text-sm font-medium">Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className="border rounded w-full p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Shop Name</label>
          <input
            type="text"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            required
            className="border rounded w-full p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Category (optional)</label>

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
              className="border rounded w-full p-2"
            >
              <option value="">-- None (Miscellaneous) --</option>
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
                className="border rounded w-full p-2"
                autoFocus
              />
              <button
                type="button"
                onClick={handleCreateCategory}
                className="bg-pink-500 text-white px-3 rounded hover:bg-pink-600"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setIsCreatingCategory(false)}
                className="border px-3 rounded"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        <button
          type="submit"
          className="bg-pink-500 text-white px-4 py-2 rounded hover:bg-pink-600"
        >
          Add Expense
        </button>
      </form>

      <div className="mb-8 border rounded p-4">
        <h2 className="text-xl font-semibold mb-3">Set a Budget</h2>

        <form onSubmit={handleSetBudget} className="flex gap-2 mb-4">
          <select
            value={budgetScope}
            onChange={(e) => setBudgetScope(e.target.value)}
            className="border rounded p-2"
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
            className="border rounded p-2 w-32"
          />

          <button
            type="submit"
            className="bg-pink-500 text-white px-4 rounded hover:bg-pink-600"
          >
            Save
          </button>
        </form>

        <div className="space-y-2">
          {budgetStatus.map((b) => (
            <div key={b.scope}>
              <div className="flex justify-between text-sm mb-1">
                <span>{getCategoryName(b.scope)}</span>
                <span>${b.spent} / ${b.limit}</span>
              </div>
              <div className="w-full bg-gray-200 rounded h-3">
                <div
                  className={`h-3 rounded ${
                    b.isOverBudget ? 'bg-red-500' : b.percentage > 70 ? 'bg-yellow-400' : 'bg-green-500'
                  }`}
                  style={{ width: `${b.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <ul className="space-y-2">
        {expenses.map((expense) => (
          <li key={expense._id} className="border rounded p-3">
            <span className="font-semibold">{expense.shopName}</span> — ${expense.amount}
            {expense.category && (
              <span className="ml-2 text-sm text-gray-500">({expense.category.name})</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Dashboard;