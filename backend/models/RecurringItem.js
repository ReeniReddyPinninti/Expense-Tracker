const mongoose = require('mongoose');

const recurringItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
}, { timestamps: true });

module.exports = mongoose.model('RecurringItem', recurringItemSchema);