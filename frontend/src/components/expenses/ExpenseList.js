
import React, { useState, useEffect, useCallback } from 'react';
import { expensesAPI } from '../../utils/api';
import { CATEGORIES, CAT_COLORS, CAT_ICONS, fmtAmt, fmtDate } from '../../utils/helpers';
import ExpenseModal from './ExpenseModal';
import toast from 'react-hot-toast';

const C = { bg: '#0a0e1a', card: '#1a2235', border: '#1f2d45', accent: '#00d4aa', text: '#e8edf5', muted: '#6b7a99', danger: '#ff4d6d', surface: '#111827' };

export default function ExpenseList({ refreshTrigger, onAdd }) {
  const [expenses, setExpenses] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [editExpense, setEditExpense] = useState(null);
  const [filters, setFilters] = useState({ category: '', startDate: '', endDate: '', sortBy: 'date', order: 'desc', search: '' });
  const [page, setPage] = useState(1);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15, ...filters };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const res = await expensesAPI.getAll(params);
      setExpenses(res.data.expenses);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [page, filters, refreshTrigger]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await expensesAPI.delete(id);
      toast.success('Expense deleted');
      fetchExpenses();
    } catch { toast.error('Delete failed'); }
  };

  const setF = k => e => setFilters(f => ({ ...f, [k]: e.target.value }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700 }}>Transactions</h2>
          <div style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>{pagination.total} total expenses</div>
        </div>
        <button onClick={onAdd} style={{ background: C.accent, color: '#0a0e1a', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>+ Add Expense</button>
      </div>

      {/* Filters */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px 16px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={filters.search} onChange={setF('search')} placeholder="🔍 Search merchant or description..." style={{ ...fStyle, flex: '1 1 200px', minWidth: 160 }} />
        <select value={filters.category} onChange={setF('category')} style={fStyle}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
        </select>
        <input type="date" value={filters.startDate} onChange={setF('startDate')} style={fStyle} title="Start date" />
        <input type="date" value={filters.endDate} onChange={setF('endDate')} style={fStyle} title="End date" />
        <select value={filters.sortBy} onChange={setF('sortBy')} style={fStyle}>
          <option value="date">Sort: Date</option>
          <option value="amount">Sort: Amount</option>
        </select>
        <select value={filters.order} onChange={setF('order')} style={fStyle}>
          <option value="desc">Newest First</option>
          <option value="asc">Oldest First</option>
        </select>
        <button onClick={() => setFilters({ category: '', startDate: '', endDate: '', sortBy: 'date', order: 'desc', search: '' })} style={{ background: 'none', border: `1px solid ${C.border}`, color: C.muted, borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontSize: 12 }}>Clear</button>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: C.muted }}>Loading expenses...</div>
      ) : expenses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: C.muted }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>💸</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>No expenses found</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Try adjusting your filters or add a new expense</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {expenses.map(e => (
            <ExpenseRow key={e._id} expense={e} onEdit={() => setEditExpense(e)} onDelete={() => handleDelete(e._id)} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 8 }}>
          <button onClick={() => setPage(p => p - 1)} disabled={page === 1} style={pageBtn(page > 1)}>← Prev</button>
          <span style={{ color: C.muted, fontSize: 13, padding: '8px 16px' }}>Page {page} of {pagination.pages}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page === pagination.pages} style={pageBtn(page < pagination.pages)}>Next →</button>
        </div>
      )}

      {editExpense && <ExpenseModal expense={editExpense} onClose={() => setEditExpense(null)} onSaved={fetchExpenses} />}
    </div>
  );
}

function ExpenseRow({ expense, onEdit, onDelete }) {
  const [hover, setHover] = useState(false);
  const color = CAT_COLORS[expense.category] || '#778ca3';
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{ background: hover ? '#1f2d45' : '#1a2235', border: `1px solid ${hover ? '#00d4aa33' : '#1f2d45'}`, borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.15s' }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{CAT_ICONS[expense.category]}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{expense.merchant || expense.description || expense.category}</div>
          <div style={{ fontFamily: 'DM Mono, monospace', fontWeight: 700, color: '#00d4aa', fontSize: 15, flexShrink: 0, marginLeft: 8 }}>{fmtAmt(expense.amount)}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 3, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ background: color + '22', color, fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>{expense.category}</span>
          <span style={{ color: '#6b7a99', fontSize: 11 }}>{fmtDate(expense.date)}</span>
          {expense.payment_method && <span style={{ color: '#6b7a99', fontSize: 11 }}>• {expense.payment_method}</span>}
          {expense.description && <span style={{ color: '#6b7a99', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150 }}>• {expense.description}</span>}
        </div>
      </div>
      {hover && (
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button onClick={onEdit} style={{ background: '#00d4aa22', border: 'none', color: '#00d4aa', cursor: 'pointer', borderRadius: 6, padding: '6px 10px', fontSize: 13 }}>✏️</button>
          <button onClick={onDelete} style={{ background: '#ff4d6d22', border: 'none', color: '#ff4d6d', cursor: 'pointer', borderRadius: 6, padding: '6px 10px', fontSize: 13 }}>🗑️</button>
        </div>
      )}
    </div>
  );
}

const fStyle = { background: '#0a0e1a', border: '1px solid #1f2d45', borderRadius: 8, padding: '8px 10px', color: '#e8edf5', fontSize: 12, outline: 'none', cursor: 'pointer' };
const pageBtn = (active) => ({ background: active ? '#00d4aa22' : '#1a2235', border: '1px solid #1f2d45', color: active ? '#00d4aa' : '#6b7a99', borderRadius: 8, padding: '8px 16px', cursor: active ? 'pointer' : 'not-allowed', fontSize: 13 });
