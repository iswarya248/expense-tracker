
import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './components/auth/AuthPage';
import Sidebar from './components/common/Sidebar';
import Dashboard from './components/dashboard/Dashboard';
import ExpenseList from './components/expenses/ExpenseList';
import Analytics from './components/analytics/Analytics';
import ChatPage from './components/chat/ChatPage';
import ExpenseModal from './components/expenses/ExpenseModal';
import { expensesAPI } from './utils/api';

const C = { bg: '#0a0e1a', surface: '#111827', border: '#1f2d45', accent: '#00d4aa', text: '#e8edf5' };

function AppContent() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [stats, setStats] = useState({ total: 0, count: 0 });

  const refresh = () => setRefreshTrigger(t => t + 1);

  // Load sidebar stats
  useEffect(() => {
    if (user) {
      expensesAPI.getAll({ limit: 1 }).then(res => {
        const { pagination } = res.data;
        // Get total from all expenses
        expensesAPI.getAll({ limit: 1000 }).then(r => {
          const total = r.data.expenses.reduce((s, e) => s + e.amount, 0);
          setStats({ total, count: pagination.total });
        });
      }).catch(() => {});
    }
  }, [user, refreshTrigger]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>💰</div>
          <div style={{ color: '#00d4aa', fontSize: 16, fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>Loading Expensify AI...</div>
        </div>
      </div>
    );
  }

  if (!user) return <AuthPage />;

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard onAddExpense={() => setShowAddModal(true)} refreshTrigger={refreshTrigger} />;
      case 'expenses': return <ExpenseList refreshTrigger={refreshTrigger} onAdd={() => setShowAddModal(true)} />;
      case 'analytics': return <Analytics refreshTrigger={refreshTrigger} />;
      case 'chat': return <ChatPage onDataChanged={refresh} />;
      default: return null;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: C.bg, overflow: 'hidden' }}>
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalExpenses={stats.total}
        expenseCount={stats.count}
      />
      <main style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
        {renderContent()}
      </main>
      {showAddModal && (
        <ExpenseModal
          expense={null}
          onClose={() => setShowAddModal(false)}
          onSaved={() => { refresh(); setStats(s => ({ ...s, count: s.count + 1 })); }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1a2235', color: '#e8edf5', border: '1px solid #1f2d45', borderRadius: 12, fontSize: 14 },
          success: { iconTheme: { primary: '#00d4aa', secondary: '#0a0e1a' } },
          error: { iconTheme: { primary: '#ff4d6d', secondary: '#0a0e1a' } },
        }}
      />
    </AuthProvider>
  );
}
