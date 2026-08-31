import { useState, useEffect } from 'react';
import { getExpenses, createExpense } from '../api/expenseApi';
import { getCategories } from '../api/categoryApi';

function Dashboard() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [amount, setAmount] = useState('');
  const [shopName, setShopName] = useState('');
  const [categoryId, setCategoryId] = useState('');

  async function loadExpenses() {
    const data = await getExpenses();
    setExpenses(data);
  }

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [expenseData, categoryData] = await Promise.all([
          getExpenses(),
          getCategories(),
        ]);
        setExpenses(expenseData);
        setCategories(categoryData);
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
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="border rounded w-full p-2"
          >
            <option value="">-- None (Miscellaneous) --</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="bg-pink-500 text-white px-4 py-2 rounded hover:bg-pink-600"
        >
          Add Expense
        </button>
      </form>

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