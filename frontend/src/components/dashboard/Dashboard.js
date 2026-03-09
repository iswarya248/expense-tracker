
import React, { useState, useEffect } from 'react';
import { analyticsAPI, expensesAPI } from '../../utils/api';
import { CAT_COLORS, CAT_ICONS, CATEGORIES, fmtAmt, fmtDate } from '../../utils/helpers';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import toast from 'react-hot-toast';

const C = { bg: '#0a0e1a', card: '#1a2235', border: '#1f2d45', accent: '#00d4aa', text: '#e8edf5', muted: '#6b7a99', warn: '#ffb347', surface: '#111827' };

export default function Dashboard({ onAddExpense, refreshTrigger }) {
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([analyticsAPI.summary(), analyticsAPI.trend(6)])
      .then(([s, t]) => { setSummary(s.data); setTrend(t.data); })
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, [refreshTrigger]);

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: C.muted, fontSize: 16 }}>⏳ Loading dashboard...</div>;

  const monthChange = summary?.lastMonth?.total > 0 ? ((summary.thisMonth.total - summary.lastMonth.total) / summary.lastMonth.total * 100).toFixed(1) : null;

  const pieData = (summary?.categoryBreakdown || []).map(d => ({
    name: d._id, value: Number(d.total.toFixed(2)), color: CAT_COLORS[d._id] || '#778ca3',
  }));

  const lineData = (trend?.monthlyTrend || []).map(d => ({
    name: new Date(d._id.year, d._id.month - 1).toLocaleDateString('en-US', { month: 'short' }),
    amount: Number(d.total.toFixed(2)),
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800 }}>Dashboard</h2>
          <div style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div>
        </div>
        <button onClick={onAddExpense} style={{ background: C.accent, color: '#0a0e1a', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}>+ Add Expense</button>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <StatCard label="This Month" value={fmtAmt(summary?.thisMonth?.total)} sub={`${summary?.thisMonth?.count || 0} transactions`} change={monthChange} />
        <StatCard label="Last Month" value={fmtAmt(summary?.lastMonth?.total)} sub="previous month" color={C.muted} />
        <StatCard label="This Week" value={fmtAmt(summary?.thisWeek?.total)} sub="last 7 days" color="#ffb347" />
        <StatCard label="Daily Avg" value={`$${summary?.avgPerDay || '0.00'}`} sub="this month" color="#45b7d1" />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 16 }}>
        {/* Pie Chart */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px 16px' }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Category Breakdown</div>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => fmtAmt(v)} contentStyle={{ background: '#1a2235', border: '1px solid #1f2d45', borderRadius: 8, color: '#e8edf5' }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                {pieData.map(d => (
                  <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color }} />
                      <span style={{ fontSize: 12 }}>{d.name}</span>
                    </div>
                    <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: d.color }}>{fmtAmt(d.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <div style={{ color: C.muted, textAlign: 'center', padding: 40 }}>No data this month</div>}
        </div>

        {/* Line Chart */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Spending Trend (6 Months)</div>
          {lineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2d45" />
                <XAxis dataKey="name" stroke="#6b7a99" tick={{ fontSize: 11 }} />
                <YAxis stroke="#6b7a99" tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                <Tooltip formatter={(v) => fmtAmt(v)} contentStyle={{ background: '#1a2235', border: '1px solid #1f2d45', borderRadius: 8, color: '#e8edf5' }} />
                <Line type="monotone" dataKey="amount" stroke="#00d4aa" strokeWidth={2.5} dot={{ fill: '#00d4aa', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <div style={{ color: C.muted, textAlign: 'center', padding: 40 }}>No trend data yet</div>}
        </div>
      </div>

      {/* Recent Expenses */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Recent Transactions</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(summary?.recentExpenses || []).map(e => (
            <div key={e._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#111827', borderRadius: 10 }}>
              <span style={{ fontSize: 18 }}>{CAT_ICONS[e.category]}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{e.merchant || e.description || e.category}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{e.category} • {fmtDate(e.date)}</div>
              </div>
              <div style={{ fontFamily: 'DM Mono, monospace', fontWeight: 700, color: '#00d4aa', fontSize: 14 }}>{fmtAmt(e.amount)}</div>
            </div>
          ))}
          {!summary?.recentExpenses?.length && <div style={{ color: C.muted, textAlign: 'center', padding: 20 }}>No recent expenses</div>}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, change, color = '#00d4aa' }) {
  return (
    <div style={{ background: '#1a2235', border: '1px solid #1f2d45', borderRadius: 14, padding: '16px 18px' }}>
      <div style={{ color: '#6b7a99', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
      <div style={{ fontFamily: 'DM Mono, monospace', color, fontSize: 22, fontWeight: 800, marginTop: 6 }}>{value}</div>
      <div style={{ display: 'flex', gap: 6, marginTop: 4, alignItems: 'center' }}>
        <span style={{ color: '#6b7a99', fontSize: 11 }}>{sub}</span>
        {change !== null && change !== undefined && (
          <span style={{ fontSize: 11, fontWeight: 700, color: change > 0 ? '#ff4d6d' : '#26de81' }}>
            {change > 0 ? '▲' : '▼'} {Math.abs(change)}%
          </span>
        )}
      </div>
    </div>
  );
}
