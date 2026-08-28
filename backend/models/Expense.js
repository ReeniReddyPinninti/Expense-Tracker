const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
  },
  shopName: {
    type: String,
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null, // null means "not set" — we'll resolve this to Miscellaneous at query/display time
  },
  isMixed: {
    type: Boolean,
    default: false,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  notes: {
    type: String,
  },
}, { timestamps: true }); // adds createdAt/updatedAt automatically

module.exports = mongoose.model('Expense', expenseSchema);