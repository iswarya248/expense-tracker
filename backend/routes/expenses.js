const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Expense = require('../models/Expense');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

const CATEGORIES = ['Food', 'Transport', 'Entertainment', 'Bills', 'Shopping', 'Healthcare', 'Other'];
const PAYMENT_METHODS = ['Cash', 'Credit Card', 'Debit Card', 'Apple Pay', 'Google Pay', 'Bank Transfer', 'Other', ''];

// ── GET /api/expenses ─────────────────────────────────────────────────────────
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('category').optional().isIn(CATEGORIES),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('sortBy').optional().isIn(['date', 'amount', 'category', 'createdAt']),
  query('order').optional().isIn(['asc', 'desc']),
  query('minAmount').optional().isFloat({ min: 0 }),
  query('maxAmount').optional().isFloat({ min: 0 }),
], async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = { user: req.user._id };

    if (req.query.category) filter.category = req.query.category;
    if (req.query.startDate || req.query.endDate) {
      filter.date = {};
      if (req.query.startDate) filter.date.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.date.$lte = new Date(req.query.endDate + 'T23:59:59');
    }
    if (req.query.minAmount || req.query.maxAmount) {
      filter.amount = {};
      if (req.query.minAmount) filter.amount.$gte = parseFloat(req.query.minAmount);
      if (req.query.maxAmount) filter.amount.$lte = parseFloat(req.query.maxAmount);
    }
    if (req.query.search) {
      filter.$or = [
        { merchant: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const sortField = req.query.sortBy || 'date';
    const sortOrder = req.query.order === 'asc' ? 1 : -1;

    const [expenses, total] = await Promise.all([
      Expense.find(filter).sort({ [sortField]: sortOrder }).skip(skip).limit(limit),
      Expense.countDocuments(filter),
    ]);

    res.json({
      expenses,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/expenses/:id ─────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, user: req.user._id });
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    res.json({ expense });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/expenses ────────────────────────────────────────────────────────
router.post('/', [
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('category').isIn(CATEGORIES).withMessage('Invalid category'),
  body('date').optional().isISO8601().withMessage('Invalid date format'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { amount, category, merchant, description, payment_method, date } = req.body;

    const expense = await Expense.create({
      user: req.user._id,
      amount: parseFloat(amount),
      category,
      merchant: merchant || '',
      description: description || '',
      payment_method: payment_method || '',
      date: date ? new Date(date) : new Date(),
    });

    res.status(201).json({ expense, message: `Added $${amount} for ${category}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/expenses/:id ─────────────────────────────────────────────────────
router.put('/:id', [
  body('amount').optional().isFloat({ min: 0 }),
  body('category').optional().isIn(CATEGORIES),
  body('date').optional().isISO8601(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const updates = {};
    const allowed = ['amount', 'category', 'merchant', 'description', 'payment_method', 'date'];
    allowed.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = field === 'amount' ? parseFloat(req.body[field])
          : field === 'date' ? new Date(req.body[field])
          : req.body[field];
      }
    });
    updates.updatedAt = new Date();

    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updates,
      { new: true, runValidators: true }
    );

    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    res.json({ expense, message: 'Expense updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/expenses/:id ──────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    res.json({ message: `Deleted $${expense.amount} ${expense.category} expense`, expense });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/expenses (bulk) ───────────────────────────────────────────────
router.delete('/', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) return res.status(400).json({ error: 'Provide array of ids' });

    const result = await Expense.deleteMany({ _id: { $in: ids }, user: req.user._id });
    res.json({ message: `Deleted ${result.deletedCount} expenses` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/expenses/last/one ────────────────────────────────────────────────
router.get('/last/one', async (req, res) => {
  try {
    const expense = await Expense.findOne({ user: req.user._id }).sort({ createdAt: -1 });
    if (!expense) return res.status(404).json({ error: 'No expenses found' });
    res.json({ expense });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
