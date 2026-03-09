export const CATEGORIES = ['Food', 'Transport', 'Entertainment', 'Bills', 'Shopping', 'Healthcare', 'Other'];
export const PAYMENT_METHODS = ['Cash', 'Credit Card', 'Debit Card', 'Apple Pay', 'Google Pay', 'Bank Transfer', 'Other'];

export const CAT_COLORS = {
  Food: '#ff6b6b',
  Transport: '#4ecdc4',
  Entertainment: '#45b7d1',
  Bills: '#f7b731',
  Shopping: '#a55eea',
  Healthcare: '#26de81',
  Other: '#778ca3',
};

export const CAT_ICONS = {
  Food: '🍔', Transport: '🚗', Entertainment: '🎬',
  Bills: '⚡', Shopping: '🛍️', Healthcare: '💊', Other: '📦',
};

export const fmtAmt = (n) => `$${Number(n || 0).toFixed(2)}`;

export const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export const fmtDateInput = (d) =>
  new Date(d).toISOString().slice(0, 10);

export const pctChange = (current, previous) => {
  if (!previous || previous === 0) return null;
  return ((current - previous) / previous * 100).toFixed(1);
};

export const getInitials = (name) =>
  name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
