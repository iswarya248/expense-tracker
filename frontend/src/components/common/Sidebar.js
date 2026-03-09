import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../utils/helpers';

const C = { surface: '#111827', border: '#1f2d45', accent: '#00d4aa', text: '#e8edf5', muted: '#6b7a99', accentDim: '#00d4aa15' };
const NAV_ITEMS = [
  { id: 'dashboard', icon: '📊', label: 'Dashboard' },
  { id: 'expenses', icon: '📋', label: 'Expenses' },
  { id: 'analytics', icon: '📈', label: 'Analytics' },
  { id: 'chat', icon: '🤖', label: 'AI Assistant' },
];

export default function Sidebar({ activeTab, setActiveTab, totalExpenses, expenseCount }) {
  const { user, logout } = useAuth();
  return (
    <div style={{ width: 220, background: C.surface, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", padding: "0 12px", flexShrink: 0 }}>
      <div style={{ padding: "24px 4px 20px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontFamily: "Syne, sans-serif", fontSize: 22, fontWeight: 800, color: C.accent }}>💰 Expensify</div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>AI-Powered Finance</div>
      </div>
      <nav style={{ flex: 1, paddingTop: 16, display: "flex", flexDirection: "column", gap: 4 }}>
        {NAV_ITEMS.map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 13, textAlign: "left", fontWeight: activeTab === item.id ? 700 : 500, background: activeTab === item.id ? C.accentDim : "transparent", color: activeTab === item.id ? C.accent : C.muted, transition: "all 0.2s" }}>
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            {item.label}
            {item.id === "chat" && <span style={{ marginLeft: "auto", background: C.accent, color: "#0a0e1a", borderRadius: 20, fontSize: 9, padding: "2px 6px", fontWeight: 700 }}>AI</span>}
          </button>
        ))}
      </nav>
      <div style={{ borderTop: `1px solid ${C.border}`, padding: "16px 4px" }}>
        <div style={{ color: C.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Total Tracked</div>
        <div style={{ fontFamily: "DM Mono, monospace", fontSize: 20, fontWeight: 700, color: C.accent }}>${Number(totalExpenses || 0).toFixed(2)}</div>
        <div style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>{expenseCount || 0} transactions</div>
      </div>
      <div style={{ borderTop: `1px solid ${C.border}`, padding: "12px 4px 16px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg, #00d4aa, #0066ff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{getInitials(user?.name)}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.name}</div>
          <div style={{ fontSize: 10, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email}</div>
        </div>
        <button onClick={logout} title="Logout" style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 14, padding: 4 }}>⇤</button>
      </div>
    </div>
  );
}
