const express = require('express');
const router = express.Router();
const RecurringItem = require('../models/RecurringItem');

router.get('/', async (req, res) => {
  try {
    const items = await RecurringItem.find().populate('category').sort({ name: 1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const item = new RecurringItem(req.body);
    const saved = await item.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await RecurringItem.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Recurring item not found' });
    res.json({ message: 'Recurring item deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a recurring item's amount, either for one month or from now on
router.put('/:id', async (req, res) => {
  try {
    const { amount, scope, month } = req.body;

    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ message: 'amount must be a positive number' });
    }
    if (!['forever', 'month'].includes(scope)) {
      return res.status(400).json({ message: "scope must be 'forever' or 'month'" });
    }
    if (scope === 'month' && !/^\d{4}-\d{2}$/.test(month || '')) {
      return res.status(400).json({ message: 'month must look like YYYY-MM' });
    }

    const update =
      scope === 'forever'
        ? { $set: { amount } }
        : { $set: { [`monthlyOverrides.${month}`]: amount } };

    const item = await RecurringItem.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    }).populate('category');

    if (!item) return res.status(404).json({ message: 'Recurring item not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Remove a month's override so it falls back to the base amount
router.delete('/:id/override/:month', async (req, res) => {
  try {
    const item = await RecurringItem.findByIdAndUpdate(
      req.params.id,
      { $unset: { [`monthlyOverrides.${req.params.month}`]: '' } },
      { new: true }
    ).populate('category');

    if (!item) return res.status(404).json({ message: 'Recurring item not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;