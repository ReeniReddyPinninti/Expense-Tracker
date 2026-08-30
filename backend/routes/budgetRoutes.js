const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Budget = require('../models/Budget');

// GET budget status — limit vs actual spend, per scope
router.get('/status', async (req, res) => {
  try {
    const Expense = require('../models/Expense');
    const budgets = await Budget.find();

    const results = await Promise.all(budgets.map(async (budget) => {
      const match = budget.scope === 'overall'
        ? {}
        : { category: new mongoose.Types.ObjectId(budget.scope) };

      const spendResult = await Expense.aggregate([
        { $match: match },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);

      const spent = spendResult[0]?.total || 0;

      return {
        scope: budget.scope,
        limit: budget.limit,
        spent,
        percentage: Math.min((spent / budget.limit) * 100, 100),
        isOverBudget: spent > budget.limit,
      };
    }));

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET all budgets
router.get('/', async (req, res) => {
  try {
    const budgets = await Budget.find();
    res.json(budgets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CREATE or UPDATE a budget for a given scope
router.post('/', async (req, res) => {
  try {
    const { scope, limit } = req.body;
    const budget = await Budget.findOneAndUpdate(
      { scope },
      { scope, limit },
      { new: true, upsert: true, runValidators: true }
    );
    res.status(201).json(budget);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE a budget (user removes the limit for a scope)
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Budget.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Budget not found' });
    res.json({ message: 'Budget deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;