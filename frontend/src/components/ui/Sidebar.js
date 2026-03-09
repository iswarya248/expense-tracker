import React from 'react';
import { useAuth } from '../../context/AuthContext';

const C = {
  bg: '#0a0e1a', surface: '#111827', card: '#1a2235', border: '#1f2d45',
  accent: '#00d4aa', text: '#e8edf5', muted: '#6b7a99',
};

const NAV = [
  { id: 'dashboard', icon: '📊', label: 'Dashboard' },
  { id: 'expenses', icon: '📋', label: 'Transactions' },
  { id: 'analytics', icon: '📈', label: 'Analytics' },
];

export default function Sidebar({ activeTab, onTabChange, totalSpent }) {
  const { user, logout } = useAuth();

  return (
    <div style={{
      width: 220, background: C.surface, borderRight: `1px solid ${C.border}`,
      display: 'flex', flexDirection: 'column', padding: '0 0 20px',
      height: '100%', flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: `linear-gradient(135deg, ${C.accent}, #0099ff)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
          }}>💰</div>
          <div>
            <div style={{ color: C.accent, fontWeight: 900, fontSize: 16, letterSpacing: -0.5 }}>Expensify</div>
            <div style={{ color: C.muted, fontSize: 10 }}>AI-Powered</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ padding: '16px 12px', flex: 1 }}>
        {NAV.map(item => (
          <button key={item.id} onClick={() => onTabChange(item.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', padding: '11px 14px', borderRadius: 10, border: 'none',
              cursor: 'pointer', fontSize: 13, textAlign: 'left', marginBottom: 4,
              fontWeight: activeTab === item.id ? 700 : 500,
              background: activeTab === item.id ? C.accent + '22' : 'transparent',
              color: activeTab === item.id ? C.accent : C.muted,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { if (activeTab !== item.id) { e.currentTarget.style.background = C.card; e.currentTarget.style.color = C.text; } }}
            onMouseLeave={e => { if (activeTab !== item.id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.muted; } }}
          >
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            {item.label}
            {activeTab === item.id && (
              <div style={{ marginLeft: 'auto', width: 5, height: 5, borderRadius: '50%', background: C.accent }} />
            )}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div style={{ padding: '16px 16px', borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ color: C.muted, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
          Total Tracked
        </div>
        <div style={{ color: C.accent, fontSize: 22, fontWeight: 900, fontFamily: 'monospace' }}>
          ${Number(totalSpent).toFixed(2)}
        </div>
      </div>

      {/* User */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: C.card, borderRadius: 12, padding: '10px 12px', marginBottom: 10,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', background: C.accent + '33',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0,
          }}>{user?.avatar || '👤'}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name}
            </div>
            <div style={{ fontSize: 10, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email}
            </div>
          </div>
        </div>
        <button onClick={logout}
          style={{
            width: '100%', background: 'transparent', border: `1px solid ${C.border}`,
            borderRadius: 10, padding: '9px', color: C.muted, cursor: 'pointer',
            fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.target.style.borderColor = '#ff4d6d44'; e.target.style.color = '#ff4d6d'; }}
          onMouseLeave={e => { e.target.style.borderColor = C.border; e.target.style.color = C.muted; }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
