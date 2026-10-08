const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');

// CREATE - add a new expense
router.post('/', async (req, res) => {
  try {
    const expense = new Expense(req.body);
    const savedExpense = await expense.save();
    res.status(201).json(savedExpense);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// READ - get all expenses
router.get('/', async (req, res) => {
  try {
    const expenses = await Expense.find()
      .populate('category')
      .sort({ date: -1 }); // newest first
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Monthly statement: expenses for one month, grouped by category
router.get('/summary/:month', async (req, res) => {
  try {
    const { month } = req.params;
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ message: 'month must look like YYYY-MM' });
    }

    // Works whether date is stored as a "YYYY-MM-DD" string or a full timestamp
    const toDay = (d) => (d instanceof Date ? d.toISOString() : String(d)).split('T')[0];

    const all = await Expense.find().populate('category');
    const monthExpenses = all
      .filter((e) => toDay(e.date).slice(0, 7) === month)
      .sort((a, b) => toDay(a.date).localeCompare(toDay(b.date)));

    const groups = {};
    for (const e of monthExpenses) {
      const name = e.category?.name || 'Miscellaneous';
      if (!groups[name]) groups[name] = { name, total: 0, count: 0, expenses: [] };
      groups[name].total += e.amount;
      groups[name].count += 1;
      groups[name].expenses.push({
        _id: e._id,
        date: toDay(e.date),
        shopName: e.shopName,
        amount: e.amount,
        notes: e.notes || '',
        isMixed: e.isMixed || false,
      });
    }

    const round = (n) => Math.round(n * 100) / 100;
    const categories = Object.values(groups)
      .map((g) => ({ ...g, total: round(g.total) }))
      .sort((a, b) => b.total - a.total);

    res.json({
      month,
      totalSpent: round(categories.reduce((sum, g) => sum + g.total, 0)),
      expenseCount: monthExpenses.length,
      categories,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// READ - get a single expense by id
router.get('/:id', async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id).populate('category');
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE - edit an expense
router.put('/:id', async (req, res) => {
  try {
    const updatedExpense = await Expense.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('category');
    if (!updatedExpense) return res.status(404).json({ message: 'Expense not found' });
    res.json(updatedExpense);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});


// DELETE - remove ALL expenses
router.delete('/all', async (req, res) => {
  try {
    const result = await Expense.deleteMany({});
    res.json({ message: `Deleted ${result.deletedCount} expenses` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE - remove all expenses in a specific category
router.delete('/category/:categoryId', async (req, res) => {
  try {
    const result = await Expense.deleteMany({ category: req.params.categoryId });
    res.json({ message: `Deleted ${result.deletedCount} expenses` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE - remove an expense
router.delete('/:id', async (req, res) => {
  try {
    const deletedExpense = await Expense.findByIdAndDelete(req.params.id);
    if (!deletedExpense) return res.status(404).json({ message: 'Expense not found' });
    res.json({ message: 'Expense deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;