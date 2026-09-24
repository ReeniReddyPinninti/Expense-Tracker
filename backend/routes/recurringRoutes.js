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

module.exports = router;