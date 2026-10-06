const mongoose = require('mongoose');

const recurringItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  monthlyOverrides: { type: Map, of: Number, default: {} },
}, { timestamps: true, toJSON: { flattenMaps: true } });


module.exports = mongoose.model('RecurringItem', recurringItemSchema);