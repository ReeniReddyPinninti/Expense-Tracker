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