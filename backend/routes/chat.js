const express = require('express');
const Expense = require('../models/Expense');
const { protect } = require('../middleware/auth');
const { processMessage } = require('../services/aiService');

const router = express.Router();
router.use(protect);

// In-memory conversation store (per user, last 10 turns)
// In production: use Redis or DB
const conversationStore = new Map();

const getHistory = (userId) => conversationStore.get(userId.toString()) || [];
const setHistory = (userId, history) => {
  // Keep last 10 messages (5 exchanges)
  const trimmed = history.slice(-10);
  conversationStore.set(userId.toString(), trimmed);
};

// ── POST /api/chat ────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: 'Message is required' });

    const userId = req.user._id;

    // Get recent expenses for context
    const recentExpenses = await Expense.find({ user: userId })
      .sort({ createdAt: -1 }).limit(20);

    // Build conversation history
    const history = getHistory(userId);
    history.push({ role: 'user', content: message });

    // Process with AI
    const result = await processMessage(history, recentExpenses);

    // Execute the action
    let actionResult = null;
    let responseMessage = result.message;

    if (result.action === 'CREATE_EXPENSE') {
      if (result.data?.expenses) {
        // Multiple expenses
        const created = await Promise.all(
          result.data.expenses.map(e =>
            Expense.create({
              user: userId,
              amount: parseFloat(e.amount),
              category: e.category || 'Other',
              merchant: e.merchant || '',
              description: e.description || '',
              payment_method: e.payment_method || '',
              date: e.date ? new Date(e.date) : new Date(),
            })
          )
        );
        actionResult = { created };
        const total = created.reduce((s, e) => s + e.amount, 0);
        responseMessage = result.message || `✅ Added ${created.length} expenses totaling $${total.toFixed(2)}`;
      } else if (result.data) {
        const expense = await Expense.create({
          user: userId,
          amount: parseFloat(result.data.amount),
          category: result.data.category || 'Other',
          merchant: result.data.merchant || '',
          description: result.data.description || '',
          payment_method: result.data.payment_method || '',
          date: result.data.date ? new Date(result.data.date) : new Date(),
        });
        actionResult = { expense };
        responseMessage = result.message || `✅ Added $${expense.amount} for ${expense.category}`;
      }
    } else if (result.action === 'UPDATE_EXPENSE') {
      let expense;
      if (result.data?.expense_id === 'last' || result.data?.target === 'last_expense') {
        expense = await Expense.findOne({ user: userId }).sort({ createdAt: -1 });
      } else if (result.data?.expense_id) {
        expense = await Expense.findOne({ _id: result.data.expense_id, user: userId });
      }

      if (expense) {
        const updates = {};
        if (result.data.amount !== undefined) updates.amount = parseFloat(result.data.amount);
        if (result.data.category) updates.category = result.data.category;
        if (result.data.merchant !== undefined) updates.merchant = result.data.merchant;
        if (result.data.description !== undefined) updates.description = result.data.description;
        if (result.data.payment_method !== undefined) updates.payment_method = result.data.payment_method;
        if (result.data.date) updates.date = new Date(result.data.date);
        updates.updatedAt = new Date();

        const updated = await Expense.findByIdAndUpdate(expense._id, updates, { new: true });
        actionResult = { expense: updated };
        responseMessage = result.message || `✅ Updated expense successfully`;
      } else {
        responseMessage = "⚠️ Couldn't find the expense to update.";
      }
    } else if (result.action === 'DELETE_EXPENSE') {
      let expense;
      if (result.data?.target === 'last_expense' || result.data?.expense_id === 'last') {
        expense = await Expense.findOne({ user: userId }).sort({ createdAt: -1 });
      } else if (result.data?.expense_id) {
        expense = await Expense.findOne({ _id: result.data.expense_id, user: userId });
      }

      if (expense) {
        await Expense.findByIdAndDelete(expense._id);
        actionResult = { deleted: expense };
        responseMessage = result.message || `🗑️ Deleted $${expense.amount} ${expense.category} expense`;
      } else {
        responseMessage = "⚠️ Couldn't find the expense to delete.";
      }
    } else if (result.action === 'READ_EXPENSE') {
      // Build query and return analytics data
      const filter = { user: userId };
      const now = new Date();
      const dr = result.data?.date_range;

      if (dr === 'this_month') filter.date = { $gte: new Date(now.getFullYear(), now.getMonth(), 1) };
      else if (dr === 'last_month') {
        filter.date = {
          $gte: new Date(now.getFullYear(), now.getMonth() - 1, 1),
          $lte: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59),
        };
      } else if (dr === 'this_week') {
        const w = new Date(); w.setDate(w.getDate() - 7);
        filter.date = { $gte: w };
      } else if (dr === 'today') {
        const t = new Date(); t.setHours(0, 0, 0, 0);
        filter.date = { $gte: t };
      }

      if (result.data?.category) filter.category = result.data.category;

      const expenses = await Expense.find(filter).sort({ date: -1 });
      const total = expenses.reduce((s, e) => s + e.amount, 0);

      // Build category breakdown
      const byCategory = {};
      expenses.forEach(e => {
        if (!byCategory[e.category]) byCategory[e.category] = 0;
        byCategory[e.category] += e.amount;
      });

      actionResult = { expenses, total, count: expenses.length, byCategory };
      responseMessage = result.message || `Found ${expenses.length} expenses totaling $${total.toFixed(2)}`;
    }

    // Save assistant response to history
    history.push({ role: 'assistant', content: responseMessage });
    setHistory(userId, history);

    res.json({
      action: result.action,
      message: responseMessage,
      data: actionResult,
    });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'AI processing failed: ' + err.message });
  }
});

// ── DELETE /api/chat/history ──────────────────────────────────────────────────
router.delete('/history', (req, res) => {
  conversationStore.delete(req.user._id.toString());
  res.json({ message: 'Conversation history cleared' });
});

module.exports = router;
