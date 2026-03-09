import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const C = {
  bg: '#0a0e1a', surface: '#111827', card: '#1a2235', border: '#1f2d45',
  accent: '#00d4aa', text: '#e8edf5', muted: '#6b7a99', danger: '#ff4d6d',
};

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.email || !form.password) return toast.error('Please fill all fields');
    if (mode === 'signup' && !form.name) return toast.error('Name is required');

    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
        toast.success('Welcome back! 👋');
      } else {
        await signup(form.name, form.email, form.password);
        toast.success('Account created! 🎉');
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Something went wrong';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 20,
      backgroundImage: 'radial-gradient(ellipse at 20% 50%, #00d4aa0d 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, #0066ff0d 0%, transparent 50%)',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>💰</div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 800, color: C.accent, letterSpacing: -1 }}>
            Expensify AI
          </h1>
          <p style={{ color: C.muted, fontSize: 14, marginTop: 4 }}>AI-Powered Expense Tracking</p>
        </div>

        {/* Card */}
        <div style={{
          background: C.card, border: `1px solid ${C.border}`, borderRadius: 20,
          padding: 32, boxShadow: '0 25px 60px #0008',
        }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 24 }}>
            {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
          </h2>

          {mode === 'signup' && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', color: C.muted, fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Full Name</label>
              <input
                value={form.name} onChange={set('name')} placeholder="John Doe"
                style={inputStyle}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', color: C.muted, fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Email</label>
            <input
              type="email" value={form.email} onChange={set('email')} placeholder="you@example.com"
              style={inputStyle}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', color: C.muted, fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Password</label>
            <input
              type="password" value={form.password} onChange={set('password')} placeholder="••••••••"
              style={inputStyle}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          <button
            onClick={handleSubmit} disabled={loading}
            style={{
              width: '100%', padding: '14px', background: loading ? C.muted : C.accent,
              color: '#0a0e1a', border: 'none', borderRadius: 12, fontWeight: 700,
              fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: "'Syne', sans-serif", letterSpacing: 0.5,
              transition: 'all 0.2s',
            }}>
            {loading ? '⏳ Processing...' : mode === 'login' ? 'Sign In →' : 'Create Account →'}
          </button>

          <div style={{ textAlign: 'center', marginTop: 20, color: C.muted, fontSize: 14 }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <span
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              style={{ color: C.accent, cursor: 'pointer', fontWeight: 600 }}>
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </span>
          </div>
        </div>

        {/* Demo hint */}
        <div style={{ textAlign: 'center', marginTop: 16, color: C.muted, fontSize: 12 }}>
          💡 Try: <span style={{ color: C.accent }}>demo@example.com</span> / <span style={{ color: C.accent }}>demo123</span>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%', background: '#0a0e1a', border: '1px solid #1f2d45',
  borderRadius: 10, padding: '12px 14px', color: '#e8edf5', fontSize: 14,
  outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
};
