
import React, { useState, useEffect } from 'react';
import { expensesAPI } from '../../utils/api';
import { CATEGORIES, PAYMENT_METHODS, fmtDateInput, CAT_ICONS } from '../../utils/helpers';
import toast from 'react-hot-toast';

const C = { card: '#1a2235', border: '#1f2d45', accent: '#00d4aa', text: '#e8edf5', muted: '#6b7a99', bg: '#0a0e1a' };

export default function ExpenseModal({ expense, onClose, onSaved }) {
  const editing = !!expense?._id;
  const [form, setForm] = useState({
    amount: '', category: 'Food', merchant: '', description: '',
    payment_method: '', date: fmtDateInput(new Date()),
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (expense) setForm({ ...expense, amount: String(expense.amount), date: fmtDateInput(expense.date) });
  }, [expense]);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.amount || isNaN(form.amount) || parseFloat(form.amount) <= 0) return toast.error('Valid amount required');
    setLoading(true);
    try {
      if (editing) {
        await expensesAPI.update(expense._id, { ...form, amount: parseFloat(form.amount) });
        toast.success('Expense updated!');
      } else {
        await expensesAPI.create({ ...form, amount: parseFloat(form.amount) });
        toast.success('Expense added!');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0009', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 28, width: '90%', maxWidth: 460, boxShadow: '0 25px 60px #000a' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700 }}>{editing ? 'Edit Expense' : 'Add Expense'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 20 }}>×</button>
        </div>

        <Field label="Amount ($)">
          <input type="number" value={form.amount} onChange={set('amount')} placeholder="0.00" step="0.01" style={inputStyle} />
        </Field>

        <Field label="Category">
          <select value={form.category} onChange={set('category')} style={inputStyle}>
            {CATEGORIES.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
          </select>
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Merchant">
            <input value={form.merchant} onChange={set('merchant')} placeholder="e.g. Walmart" style={inputStyle} />
          </Field>
          <Field label="Date">
            <input type="date" value={form.date} onChange={set('date')} style={inputStyle} />
          </Field>
        </div>

        <Field label="Description">
          <input value={form.description} onChange={set('description')} placeholder="What did you buy?" style={inputStyle} />
        </Field>

        <Field label="Payment Method">
          <select value={form.payment_method} onChange={set('payment_method')} style={inputStyle}>
            <option value="">Select method...</option>
            {PAYMENT_METHODS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>

        <button onClick={handleSubmit} disabled={loading} style={{ width: '100%', background: loading ? C.muted : C.accent, color: '#0a0e1a', border: 'none', borderRadius: 12, padding: 14, fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 8, fontFamily: 'Syne, sans-serif' }}>
          {loading ? '⏳ Saving...' : editing ? 'Save Changes' : 'Add Expense'}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', color: '#6b7a99', fontSize: 11, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = { width: '100%', background: '#0a0e1a', border: '1px solid #1f2d45', borderRadius: 10, padding: '11px 13px', color: '#e8edf5', fontSize: 14, outline: 'none', boxSizing: 'border-box' };
