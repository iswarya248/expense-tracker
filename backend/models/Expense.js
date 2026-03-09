const mongoose = require('mongoose');


const expenseSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  amount: { type: Number, required: true, min: 0 },
  category: {
    type: String,
    required: true,
    enum: ['Food', 'Transport', 'Entertainment', 'Bills', 'Shopping', 'Healthcare', 'Other'],
    default: 'Other',
  },
  merchant: { type: String, trim: true, default: '' },
  description: { type: String, trim: true, default: '' },
  payment_method: {
    type: String,
    enum: ['Cash', 'Credit Card', 'Debit Card', 'Apple Pay', 'Google Pay', 'Bank Transfer', 'Other', ''],
    default: '',
  },
  date: { type: Date, required: true, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

expenseSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Index for common queries
expenseSchema.index({ user: 1, date: -1 });
expenseSchema.index({ user: 1, category: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
