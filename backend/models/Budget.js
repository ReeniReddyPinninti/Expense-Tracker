const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  scope: {
    type: String,
    required: true,
    // either a Category's ObjectId as a string, or the literal string 'overall'
  },
  limit: {
    type: Number,
    required: true,
  },
}, { timestamps: true });

budgetSchema.index({ scope: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);