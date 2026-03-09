
import React, { useState, useEffect, useRef } from 'react';
import { chatAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const C = { bg: '#0a0e1a', card: '#1a2235', border: '#1f2d45', accent: '#00d4aa', text: '#e8edf5', muted: '#6b7a99', surface: '#111827', accentDim: '#00d4aa15' };

const QUICK_ACTIONS = [
  'I spent $45 on groceries at Walmart',
  'How much did I spend this month?',
  'Show my top expenses',
  'Compare this month vs last month',
  'Delete my last expense',
];

export default function ChatPage({ onDataChanged }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `👋 Hi! I'm your AI financial assistant powered by Claude.\n\nHere's what I can do:\n• **Add expenses**: "I spent $45 on groceries at Walmart"\n• **Multiple at once**: "Add coffee $5, lunch $18, and uber $12"\n• **Query data**: "How much did I spend on food this month?"\n• **Analytics**: "Compare this month vs last month"\n• **Update**: "Change my last expense to $50"\n• **Delete**: "Delete my last expense"\n\nTry asking me anything! 🚀`, timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');

    setMessages(prev => [...prev, { role: 'user', content: msg, timestamp: new Date() }]);
    setLoading(true);

    try {
      const res = await chatAPI.send(msg);
      const { action, message, data } = res.data;

      let displayMsg = message;

      // Append structured data info if useful
      if (action === 'READ_EXPENSE' && data) {
        if (data.byCategory && Object.keys(data.byCategory).length > 0) {
          displayMsg += '\n\n**By Category:**\n' + Object.entries(data.byCategory).map(([k, v]) => `• ${k}: $${Number(v).toFixed(2)}`).join('\n');
        }
      }

      setMessages(prev => [...prev, { role: 'assistant', content: displayMsg, action, timestamp: new Date() }]);

      // Notify parent to refresh data if expense was modified
      if (['CREATE_EXPENSE', 'UPDATE_EXPENSE', 'DELETE_EXPENSE'].includes(action)) {
        onDataChanged?.();
        toast.success(action === 'CREATE_EXPENSE' ? '✅ Expense added!' : action === 'UPDATE_EXPENSE' ? '✅ Expense updated!' : '🗑️ Expense deleted!');
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to process your request. Please try again.';
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${errMsg}`, timestamp: new Date() }]);
      toast.error('AI request failed');
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const clearHistory = async () => {
    await chatAPI.clearHistory();
    setMessages([{ role: 'assistant', content: '🔄 Conversation history cleared. How can I help you?', timestamp: new Date() }]);
    toast.success('History cleared');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: 'calc(100vh - 80px)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800 }}>AI Assistant</h2>
          <div style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>Powered by Claude • Natural language expense management</div>
        </div>
        <button onClick={clearHistory} style={{ background: 'none', border: `1px solid ${C.border}`, color: C.muted, borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 12 }}>Clear History</button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingRight: 4, marginBottom: 12 }}>
        {messages.map((m, i) => (
          <Message key={i} message={m} />
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #00d4aa, #0066ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>🤖</div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px 16px 16px 4px', padding: '12px 16px' }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: C.accent, animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite` }} />)}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        {QUICK_ACTIONS.map(q => (
          <button key={q} onClick={() => sendMessage(q)} disabled={loading} style={{ background: C.accentDim, border: `1px solid ${C.accent}33`, color: C.accent, borderRadius: 20, padding: '5px 12px', fontSize: 11, cursor: 'pointer', fontWeight: 500, transition: 'all 0.2s' }}>
            {q.length > 30 ? q.slice(0, 30) + '...' : q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: 10, background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '8px 8px 8px 16px' }}>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="Ask me to add, update, delete, or analyze your expenses..."
          style={{ flex: 1, background: 'none', border: 'none', color: C.text, fontSize: 14, outline: 'none' }}
          disabled={loading}
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          style={{ background: !input.trim() || loading ? '#1f2d45' : C.accent, color: !input.trim() || loading ? C.muted : '#0a0e1a', border: 'none', borderRadius: 10, width: 42, height: 42, cursor: !input.trim() || loading ? 'not-allowed' : 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0 }}>
          ➤
        </button>
      </div>
    </div>
  );
}

function Message({ message }) {
  const isUser = message.role === 'user';
  const actionBadge = {
    CREATE_EXPENSE: { label: 'Added', color: '#26de81' },
    UPDATE_EXPENSE: { label: 'Updated', color: '#ffb347' },
    DELETE_EXPENSE: { label: 'Deleted', color: '#ff4d6d' },
    READ_EXPENSE: { label: 'Query', color: '#45b7d1' },
  }[message.action];

  // Simple markdown-ish rendering
  const renderContent = (text) => {
    return text.split('\n').map((line, i) => {
      const bold = line.replace(/\*\*(.*?)\*\*/g, (_, t) => `<strong>${t}</strong>`);
      return <div key={i} style={{ minHeight: line ? 'auto' : 8 }} dangerouslySetInnerHTML={{ __html: bold || '&nbsp;' }} />;
    });
  };

  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', gap: 10, alignItems: 'flex-start', animation: 'fadeIn 0.3s ease' }}>
      {!isUser && (
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #00d4aa, #0066ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>🤖</div>
      )}
      <div style={{ maxWidth: '78%' }}>
        {actionBadge && (
          <div style={{ marginBottom: 4 }}>
            <span style={{ background: actionBadge.color + '22', color: actionBadge.color, fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>{actionBadge.label}</span>
          </div>
        )}
        <div style={{
          background: isUser ? '#00d4aa' : '#1a2235',
          color: isUser ? '#0a0e1a' : '#e8edf5',
          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          padding: '12px 16px', fontSize: 14, lineHeight: 1.6,
          border: isUser ? 'none' : '1px solid #1f2d45',
        }}>
          {renderContent(message.content)}
        </div>
        <div style={{ fontSize: 10, color: '#6b7a99', marginTop: 4, paddingLeft: 4 }}>
          {message.timestamp?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
      {isUser && (
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#1f2d45', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2, fontSize: 16 }}>👤</div>
      )}
    </div>
  );
}
