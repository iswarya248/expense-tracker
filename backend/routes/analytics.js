const express = require('express');
const Expense = require('../models/Expense');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// ── GET /api/analytics/summary ────────────────────────────────────────────────
router.get('/summary', async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - 7);

    const [
      totalAll,
      thisMonth,
      lastMonth,
      thisWeek,
      categoryBreakdown,
      recentExpenses,
    ] = await Promise.all([
      // Total all time
      Expense.aggregate([
        { $match: { user: userId } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      // This month
      Expense.aggregate([
        { $match: { user: userId, date: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      // Last month
      Expense.aggregate([
        { $match: { user: userId, date: { $gte: lastMonthStart, $lte: lastMonthEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      // This week
      Expense.aggregate([
        { $match: { user: userId, date: { $gte: weekStart } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      // Category breakdown this month
      Expense.aggregate([
        { $match: { user: userId, date: { $gte: monthStart } } },
        { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),
      // Recent 5
      Expense.find({ user: userId }).sort({ date: -1 }).limit(5),
    ]);

    res.json({
      totalAll: totalAll[0] || { total: 0, count: 0 },
      thisMonth: thisMonth[0] || { total: 0, count: 0 },
      lastMonth: lastMonth[0] || { total: 0, count: 0 },
      thisWeek: thisWeek[0] || { total: 0, count: 0 },
      categoryBreakdown,
      recentExpenses,
      avgPerDay: thisMonth[0] ? (thisMonth[0].total / now.getDate()).toFixed(2) : 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/analytics/trend ──────────────────────────────────────────────────
router.get('/trend', async (req, res) => {
  try {
    const userId = req.user._id;
    const months = parseInt(req.query.months) || 6;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months + 1);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const trend = await Expense.aggregate([
      { $match: { user: userId, date: { $gte: startDate } } },
      {
        $group: {
          _id: { year: { $year: '$date' }, month: { $month: '$date' } },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Daily trend last 30 days
    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    const dailyTrend = await Expense.aggregate([
      { $match: { user: userId, date: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({ monthlyTrend: trend, dailyTrend });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/analytics/top-expenses ──────────────────────────────────────────
router.get('/top-expenses', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const period = req.query.period || 'all'; // all, month, week

    const filter = { user: req.user._id };
    const now = new Date();
    if (period === 'month') {
      filter.date = { $gte: new Date(now.getFullYear(), now.getMonth(), 1) };
    } else if (period === 'week') {
      const w = new Date(); w.setDate(w.getDate() - 7);
      filter.date = { $gte: w };
    }

    const expenses = await Expense.find(filter).sort({ amount: -1 }).limit(limit);
    res.json({ expenses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/analytics/category-detail ───────────────────────────────────────
router.get('/category-detail', async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [thisMonth, lastMonth] = await Promise.all([
      Expense.aggregate([
        { $match: { user: userId, date: { $gte: monthStart } } },
        { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Expense.aggregate([
        { $match: { user: userId, date: { $gte: lastMonthStart, $lte: lastMonthEnd } } },
        { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
    ]);

    // Merge into comparison
    const categories = ['Food', 'Transport', 'Entertainment', 'Bills', 'Shopping', 'Healthcare', 'Other'];
    const comparison = categories.map(cat => {
      const tm = thisMonth.find(x => x._id === cat) || { total: 0, count: 0 };
      const lm = lastMonth.find(x => x._id === cat) || { total: 0, count: 0 };
      const change = lm.total > 0 ? ((tm.total - lm.total) / lm.total * 100).toFixed(1) : null;
      return { category: cat, thisMonth: tm.total, lastMonth: lm.total, change, count: tm.count };
    });

    res.json({ comparison });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
