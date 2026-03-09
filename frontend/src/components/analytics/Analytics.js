
import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../../utils/api';
import { CAT_COLORS, CAT_ICONS, CATEGORIES, fmtAmt } from '../../utils/helpers';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import toast from 'react-hot-toast';

const C = { bg: '#0a0e1a', card: '#1a2235', border: '#1f2d45', accent: '#00d4aa', text: '#e8edf5', muted: '#6b7a99' };

export default function Analytics({ refreshTrigger }) {
  const [data, setData] = useState(null);
  const [topExpenses, setTopExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [topPeriod, setTopPeriod] = useState('month');

  useEffect(() => {
    Promise.all([analyticsAPI.categoryDetail(), analyticsAPI.topExpenses({ period: topPeriod, limit: 8 })])
      .then(([cd, top]) => { setData(cd.data); setTopExpenses(top.data.expenses); })
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, [refreshTrigger, topPeriod]);

  if (loading) return <div style={{ color: C.muted, textAlign: 'center', padding: 60 }}>⏳ Loading analytics...</div>;

  const barData = (data?.comparison || []).map(d => ({
    name: d.category.slice(0, 5),
    'This Month': Number(d.thisMonth?.toFixed(2) || 0),
    'Last Month': Number(d.lastMonth?.toFixed(2) || 0),
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800 }}>Analytics</h2>

      {/* Month-over-month bar chart */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, marginBottom: 20 }}>Month-over-Month by Category</div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={barData} barSize={12}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2d45" />
            <XAxis dataKey="name" stroke="#6b7a99" tick={{ fontSize: 11 }} />
            <YAxis stroke="#6b7a99" tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
            <Tooltip formatter={(v) => fmtAmt(v)} contentStyle={{ background: '#1a2235', border: '1px solid #1f2d45', borderRadius: 8, color: '#e8edf5' }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="This Month" fill="#00d4aa" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Last Month" fill="#1f2d45" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Category Detail */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Category Detail</div>
          {(data?.comparison || []).map(d => {
            const color = CAT_COLORS[d.category] || '#778ca3';
            const maxVal = Math.max(...(data?.comparison || []).map(x => x.thisMonth), 1);
            if (d.thisMonth === 0 && d.lastMonth === 0) return null;
            return (
              <div key={d.category} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{CAT_ICONS[d.category]}</span>
                    <span style={{ fontSize: 13 }}>{d.category}</span>
                    <span style={{ fontSize: 10, color: C.muted }}>({d.count} txns)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, color }}>{fmtAmt(d.thisMonth)}</span>
                    {d.change !== null && <span style={{ fontSize: 11, color: d.change > 0 ? '#ff4d6d' : '#26de81', fontWeight: 700 }}>{d.change > 0 ? '▲' : '▼'}{Math.abs(d.change)}%</span>}
                  </div>
                </div>
                <div style={{ background: '#111827', borderRadius: 4, height: 6 }}>
                  <div style={{ width: `${(d.thisMonth / maxVal) * 100}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.6s' }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Top Expenses */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15 }}>Top Expenses</div>
            <select value={topPeriod} onChange={e => setTopPeriod(e.target.value)} style={{ background: '#111827', border: '1px solid #1f2d45', borderRadius: 8, padding: '5px 10px', color: '#e8edf5', fontSize: 12, cursor: 'pointer' }}>
              <option value="all">All Time</option>
              <option value="month">This Month</option>
              <option value="week">This Week</option>
            </select>
          </div>
          {topExpenses.map((e, i) => (
            <div key={e._id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: CAT_COLORS[e.category] + '33', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: CAT_COLORS[e.category], flexShrink: 0 }}>{i + 1}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.merchant || e.description || e.category}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{e.category}</div>
              </div>
              <div style={{ fontFamily: 'DM Mono, monospace', fontWeight: 700, color: '#00d4aa', fontSize: 14, flexShrink: 0 }}>{fmtAmt(e.amount)}</div>
            </div>
          ))}
          {!topExpenses.length && <div style={{ color: C.muted, textAlign: 'center', padding: 20 }}>No expenses found</div>}
        </div>
      </div>
    </div>
  );
}
