import React, { useEffect, useState, useCallback } from 'react';
import { expensesAPI } from '../../utils/api';

const C = {
  bg: '#0a0e1a', surface: '#111827', card: '#1a2235', border: '#1f2d45',
  accent: '#00d4aa', text: '#e8edf5', muted: '#6b7a99', danger: '#ff4d6d',
  colors: {
    Food: '#ff6b6b', Transport: '#4ecdc4', Entertainment: '#45b7d1',
    Bills: '#f7b731', Shopping: '#a55eea', Healthcare: '#26de81', Other: '#778ca3',
  },
  icons: { Food: '🍔', Transport: '🚗', Entertainment: '🎬', Bills: '⚡', Shopping: '🛍️', Healthcare: '💊', Other: '📦' },
};

const CATEGORIES = ['Food', 'Transport', 'Entertainment', 'Bills', 'Shopping', 'Healthcare', 'Other'];
const fmt = (n) => `$${Number(n).toFixed(2)}`;

function FilterBar({ filters, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
      <input type="text" placeholder="🔍 Search merchant, description..."
        value={filters.search} onChange={e => onChange({ ...filters, search: e.target.value })}
        style={{
          background: C.card, border: `1px solid ${C.border}`, borderRadius: 10,
          padding: '9px 14px', color: C.text, fontSize: 13, outline: 'none', minWidth: 220,
        }} />
      <select value={filters.category} onChange={e => onChange({ ...filters, category: e.target.value })}
        style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '9px 12px', color: C.text, fontSize: 13, cursor: 'pointer' }}>
        <option value="">All Categories</option>
        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <input type="date" value={filters.startDate} onChange={e => onChange({ ...filters, startDate: e.target.value })}
        style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '9px 12px', color: C.text, fontSize: 13 }} />
      <span style={{ color: C.muted }}>to</span>
      <input type="date" value={filters.endDate} onChange={e => onChange({ ...filters, endDate: e.target.value })}
        style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '9px 12px', color: C.text, fontSize: 13 }} />
      <select value={filters.sortBy} onChange={e => onChange({ ...filters, sortBy: e.target.value })}
        style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '9px 12px', color: C.text, fontSize: 13, cursor: 'pointer' }}>
        <option value="date">Sort: Date</option>
        <option value="amount">Sort: Amount</option>
        <option value="category">Sort: Category</option>
      </select>
      <button onClick={() => onChange({ search: '', category: '', startDate: '', endDate: '', sortBy: 'date' })}
        style={{ background: C.border, border: 'none', borderRadius: 10, padding: '9px 16px', color: C.muted, fontSize: 13, cursor: 'pointer' }}>
        Clear
      </button>
    </div>
  );
}

export default function ExpensesList({ onEdit, refreshKey }) {
  const [expenses, setExpenses] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', category: '', startDate: '', endDate: '', sortBy: 'date' });
  const [page, setPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15, sortBy: filters.sortBy, sortOrder: 'desc' };
      if (filters.search) params.search = filters.search;
      if (filters.category) params.category = filters.category;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const { data } = await expensesAPI.list(params);
      setExpenses(data.expenses);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Failed to fetch expenses:', err);
    } finally {
      setLoading(false);
    }
  }, [page, filters, refreshKey]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);
  useEffect(() => { setPage(1); }, [filters]);

  const handleDelete = async (id) => {
    try {
      await expensesAPI.delete(id);
      fetchExpenses();
    } catch (err) {
      console.error('Delete failed:', err);
    }
    setDeleteConfirm(null);
  };

  const totalAmount = expenses.reduce((s, e) => s + parseFloat(e.amount), 0);

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ color: C.text, margin: 0, fontSize: 20, fontWeight: 800 }}>Transactions</h2>
          <p style={{ color: C.muted, margin: '4px 0 0', fontSize: 13 }}>
            {pagination.total} total · {fmt(totalAmount)} shown
          </p>
        </div>
      </div>

      <FilterBar filters={filters} onChange={setFilters} />

      {/* Category pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {['', ...CATEGORIES].map(cat => (
          <button key={cat} onClick={() => setFilters(f => ({ ...f, category: cat }))}
            style={{
              padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
              background: filters.category === cat ? (C.colors[cat] || C.accent) + '33' : C.card,
              color: filters.category === cat ? (C.colors[cat] || C.accent) : C.muted,
            }}>
            {cat ? `${C.icons[cat]} ${cat}` : 'All'}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ color: C.muted, textAlign: 'center', padding: 60 }}>Loading...</div>
      ) : expenses.length === 0 ? (
        <div style={{ color: C.muted, textAlign: 'center', padding: 80, background: C.card, borderRadius: 16, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: C.text }}>No expenses found</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Try adjusting your filters</div>
        </div>
      ) : (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '40px 1fr 140px 100px 100px 120px 80px',
            padding: '12px 20px', borderBottom: `1px solid ${C.border}`,
            color: C.muted, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            <div></div><div>Expense</div><div>Category</div>
            <div>Amount</div><div>Date</div><div>Payment</div><div>Actions</div>
          </div>

          {expenses.map((exp, i) => (
            <div key={exp.id} style={{
              display: 'grid', gridTemplateColumns: '40px 1fr 140px 100px 100px 120px 80px',
              padding: '14px 20px', alignItems: 'center',
              borderBottom: i < expenses.length - 1 ? `1px solid ${C.border}` : 'none',
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = C.surface}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: C.colors[exp.category] + '22',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
              }}>{C.icons[exp.category]}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{exp.merchant || '—'}</div>
                {exp.description && <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{exp.description}</div>}
              </div>
              <div>
                <span style={{
                  background: C.colors[exp.category] + '22', color: C.colors[exp.category],
                  padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                }}>{exp.category}</span>
              </div>
              <div style={{ fontFamily: 'monospace', fontWeight: 700, color: C.accent, fontSize: 14 }}>
                {fmt(exp.amount)}
              </div>
              <div style={{ color: C.muted, fontSize: 12 }}>
                {new Date(exp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
              <div style={{ color: C.muted, fontSize: 11 }}>{exp.payment_method || '—'}</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => onEdit(exp)} style={{
                  background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6,
                  padding: '4px 8px', cursor: 'pointer', fontSize: 12, color: C.accent,
                }}>✏️</button>
                {deleteConfirm === exp.id ? (
                  <button onClick={() => handleDelete(exp.id)} style={{
                    background: C.danger + '22', border: `1px solid ${C.danger}44`,
                    borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 11, color: C.danger,
                  }}>Sure?</button>
                ) : (
                  <button onClick={() => setDeleteConfirm(exp.id)} style={{
                    background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6,
                    padding: '4px 8px', cursor: 'pointer', fontSize: 12, color: C.danger,
                  }}>🗑️</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 16px', color: page === 1 ? C.border : C.text, cursor: page === 1 ? 'not-allowed' : 'pointer' }}>
            ← Prev
          </button>
          {Array.from({ length: Math.min(pagination.pages, 7) }, (_, i) => {
            const p = i + 1;
            return (
              <button key={p} onClick={() => setPage(p)}
                style={{
                  background: page === p ? C.accent : C.card,
                  border: `1px solid ${page === p ? C.accent : C.border}`,
                  borderRadius: 8, padding: '8px 14px', color: page === p ? C.bg : C.text,
                  cursor: 'pointer', fontWeight: page === p ? 700 : 400,
                }}>{p}</button>
            );
          })}
          <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}
            style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 16px', color: page === pagination.pages ? C.border : C.text, cursor: page === pagination.pages ? 'not-allowed' : 'pointer' }}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
