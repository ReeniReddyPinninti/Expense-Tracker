import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { getCategorySpendData, getSpendOverTimeData } from '../utils/chartHelpers';
import SpendHeatmap from '../components/SpendHeatmap';
import { getCategories, createCategory } from '../api/categoryApi';
import Toast from '../components/Toast';
import { getExpenses, createExpense, updateExpense, deleteExpense, deleteAllExpenses, deleteExpensesByCategory } from '../api/expenseApi';
import { getBudgets, setBudget, deleteAllBudgets, deleteBudgetByScope } from '../api/budgetApi';
import { getMonthKey, getCurrentMonthKey, getAvailableMonths, formatMonthLabel, isToday, isThisWeek, getAlertedThresholds, saveAlertedThreshold } from '../utils/monthHelpers';
import { getRecurringItems, createRecurringItem, deleteRecurringItem } from '../api/recurringApi';
import ConfirmModal from '../components/ConfirmModal';
import SummaryCards from '../components/SummaryCards';
import ExpenseForm from '../components/ExpenseForm';
import ExpenseList from '../components/ExpenseList';
import BudgetPanel from '../components/BudgetPanel';
import RecurringPanel from '../components/RecurringPanel';

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

  const [recurringItems, setRecurringItems] = useState([]);
  const [showAddRecurring, setShowAddRecurring] = useState(false);
  const [newRecurringName, setNewRecurringName] = useState('');
  const [newRecurringAmount, setNewRecurringAmount] = useState('');
  const [newRecurringCategoryId, setNewRecurringCategoryId] = useState('');

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
        const [expenseData, categoryData, budgetData, recurringData] = await Promise.all([
          getExpenses(),
          getCategories(),
          getBudgets(),
          getRecurringItems(),
        ]);
        setExpenses(expenseData);
        setCategories(categoryData);
        setBudgets(budgetData);
        setRecurringItems(recurringData);
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

  function isLoggedThisMonth(item) {
    return monthExpenses.some(
      (e) => e.shopName.trim().toLowerCase() === item.name.trim().toLowerCase()
    );
  }

  function quickLogRecurring(item) {
    setShopName(item.name);
    setAmount(item.amount);
    setCategoryId(item.category?._id || '');
    setExpenseDate(new Date());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleAddRecurring(e) {
    e.preventDefault();
    try {
      const newItem = await createRecurringItem({
        name: newRecurringName,
        amount: Number(newRecurringAmount),
        category: newRecurringCategoryId || null,
      });
      setRecurringItems((prev) => [...prev, newItem]);
      setNewRecurringName('');
      setNewRecurringAmount('');
      setNewRecurringCategoryId('');
      setShowAddRecurring(false);
      showToast('Recurring item added');
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteRecurring(id) {
    try {
      await deleteRecurringItem(id);
      setRecurringItems((prev) => prev.filter((item) => item._id !== id));
      showToast('Recurring item removed', 'error');
    } catch (err) {
      setError(err.message);
    }
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

  useEffect(() => {
    if (budgetStatus.length === 0) return;

    const alerted = getAlertedThresholds(selectedMonth);
    const thresholds = [100, 90, 75]; // check highest first, so we don't double-alert 75 then 90 in one pass

    budgetStatus.forEach((b) => {
      const actualPercentage = (b.spent / b.limit) * 100; // uncapped, unlike the display percentage
      const alreadyAlertedAt = alerted[b.scope] || 0;

      for (const threshold of thresholds) {
        if (actualPercentage >= threshold && alreadyAlertedAt < threshold) {
          const label = getCategoryName(b.scope);
          if (threshold >= 100) {
            showToast(`${label} budget exceeded — $${b.spent.toFixed(2)} of $${b.limit}`, 'error');
          } else {
            showToast(`${label} budget at ${threshold}% ($${b.spent.toFixed(2)} of $${b.limit})`);
          }
          saveAlertedThreshold(selectedMonth, b.scope, threshold);
          break; // only fire the highest newly-crossed threshold per budget per check
        }
      }
    });
  }, [budgetStatus, selectedMonth]);

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
        <SummaryCards
          todaySpent={todaySpent}
          weekSpent={weekSpent}
          totalSpent={totalSpent}
          monthLabel={formatMonthLabel(selectedMonth)}
          overallBudget={overallBudget}
          expenseCount={monthExpenses.length}
        />

        {/* Add / Edit expense form */}
        <ExpenseForm
          amount={amount} setAmount={setAmount}
          shopName={shopName} setShopName={setShopName}
          expenseDate={expenseDate} setExpenseDate={setExpenseDate}
          categoryId={categoryId} setCategoryId={setCategoryId}
          categories={categories}
          isCreatingCategory={isCreatingCategory} setIsCreatingCategory={setIsCreatingCategory}
          newCategoryName={newCategoryName} setNewCategoryName={setNewCategoryName}
          handleCreateCategory={handleCreateCategory}
          isMixed={isMixed} handleMixedChange={handleMixedChange}
          notes={notes} setNotes={setNotes}
          editingId={editingId}
          handleSubmit={handleSubmit}
          resetForm={resetForm}
        />

        {/* Budgets */}
        <BudgetPanel
          budgetScope={budgetScope} setBudgetScope={setBudgetScope}
          budgetLimit={budgetLimit} setBudgetLimit={setBudgetLimit}
          categories={categories}
          handleSetBudget={handleSetBudget}
          budgetStatus={budgetStatus}
          getCategoryName={getCategoryName}
          requestClearAllBudgets={requestClearAllBudgets}
          requestClearBudget={requestClearBudget}
        />

        {/* Recurring items */}
        <RecurringPanel
          recurringItems={recurringItems}
          showAddRecurring={showAddRecurring} setShowAddRecurring={setShowAddRecurring}
          newRecurringName={newRecurringName} setNewRecurringName={setNewRecurringName}
          newRecurringAmount={newRecurringAmount} setNewRecurringAmount={setNewRecurringAmount}
          newRecurringCategoryId={newRecurringCategoryId} setNewRecurringCategoryId={setNewRecurringCategoryId}
          categories={categories}
          handleAddRecurring={handleAddRecurring}
          isLoggedThisMonth={isLoggedThisMonth}
          quickLogRecurring={quickLogRecurring}
          handleDeleteRecurring={handleDeleteRecurring}
        />

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
        <ExpenseList
          filteredExpenses={filteredExpenses}
          hasAnyExpenses={monthExpenses.length > 0}
          categories={categories}
          searchTerm={searchTerm} setSearchTerm={setSearchTerm}
          filterCategory={filterCategory} setFilterCategory={setFilterCategory}
          sortBy={sortBy} setSortBy={setSortBy}
          startEditing={startEditing}
          requestDelete={requestDelete}
          requestClearAllExpenses={requestClearAllExpenses}
          fromDateOnlyString={fromDateOnlyString}
          monthLabel={formatMonthLabel(selectedMonth)}
        />

      </div>
      {toast && (
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(null)}
      />
    )}
    
    {confirmDeleteId && (
      <ConfirmModal
        title="Delete this expense?"
        message="This can't be undone."
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    )}

    {pendingUpdate && (
      <ConfirmModal
        title="Save these changes?"
        message={`${pendingUpdate.shopName} — $${pendingUpdate.amount}`}
        confirmLabel="Save"
        confirmColor="pink"
        onConfirm={confirmUpdate}
        onCancel={cancelUpdate}
      />
    )}

    {confirmClear && (
      <ConfirmModal
        title="Are you sure?"
        message={confirmClear.label}
        onConfirm={confirmClearAction}
        onCancel={cancelClear}
      />
    )}

    </div>
  );
}

export default Dashboard;