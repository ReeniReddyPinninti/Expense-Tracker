import { useState, useEffect } from 'react';

function App() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5050/api/expenses')
      .then((res) => res.json())
      .then((data) => {
        setExpenses(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="p-6">Loading expenses...</p>;
  if (error) return <p className="p-6 text-red-500">Error: {error}</p>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-pink-500 mb-4">Expense Tracker</h1>
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

export default App;