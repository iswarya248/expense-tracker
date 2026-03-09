import React, { useState, useEffect, useRef, useCallback } from 'react';
import { chatAPI } from '../../utils/api';

const C = {
  bg: '#0a0e1a', surface: '#111827', card: '#1a2235', border: '#1f2d45',
  accent: '#00d4aa', text: '#e8edf5', muted: '#6b7a99',
  danger: '#ff4d6d', warn: '#ffb347',
};

const ACTION_STYLES = {
  CREATE_EXPENSE: { icon: '✅', color: '#26de81', label: 'Created' },
  UPDATE_EXPENSE: { icon: '✏️', color: '#45b7d1', label: 'Updated' },
  DELETE_EXPENSE: { icon: '🗑️', color: '#ff4d6d', label: 'Deleted' },
  READ_EXPENSE: { icon: '📊', color: '#f7b731', label: 'Analytics' },
  CHAT: { icon: '💬', color: C.muted, label: '' },
};

const QUICK_PROMPTS = [
  'I spent $45 on groceries at Walmart',
  'How much did I spend on food this month?',
  'Show my biggest expenses last week',
  'Add coffee $5, lunch $18, and uber $12',
  'Compare this month vs last month',
  'Delete my last expense',
];

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  const actionStyle = msg.action_type ? ACTION_STYLES[msg.action_type] : null;

  return (
    <div style={{
      display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: 12,
    }}>
      {!isUser && (
        <div style={{
          width: 30, height: 30, borderRadius: '50%', flexShrink: 0, marginRight: 8,
          background: `linear-gradient(135deg, ${C.accent}, #0099ff)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
        }}>🤖</div>
      )}
      <div style={{ maxWidth: '80%' }}>
        <div style={{
          background: isUser ? C.accent : C.card,
          color: isUser ? C.bg : C.text,
          borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          padding: '10px 14px',
          border: !isUser ? `1px solid ${C.border}` : 'none',
          fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap',
        }}>
          {msg.content}
        </div>

        {/* Action badge */}
        {actionStyle && actionStyle.label && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: actionStyle.color + '22', border: `1px solid ${actionStyle.color}44`,
            borderRadius: 20, padding: '3px 10px', marginTop: 6,
            fontSize: 11, color: actionStyle.color, fontWeight: 600,
          }}>
            {actionStyle.icon} {actionStyle.label}
          </div>
        )}

        <div style={{ color: C.muted, fontSize: 10, marginTop: 4, textAlign: isUser ? 'right' : 'left' }}>
          {msg.created_at ? new Date(msg.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'just now'}
        </div>
      </div>
    </div>
  );
}

export default function ChatPanel({ onExpenseChanged }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Load chat history
  useEffect(() => {
    chatAPI.history()
      .then(r => {
        if (r.data.length === 0) {
          setMessages([{
            id: 'welcome', role: 'assistant',
            content: `👋 Hi! I'm your AI financial assistant.\n\nI can help you:\n• Add expenses using natural language\n• Query your spending data\n• Update or delete expenses\n• Analyze your financial patterns\n\nTry saying: "I spent $45 on groceries at Walmart yesterday"`,
          }]);
        } else {
          setMessages(r.data);
        }
      })
      .catch(() => setMessages([{
        id: 'welcome', role: 'assistant',
        content: '👋 Hi! I\'m your AI assistant. How can I help with your expenses today?',
      }]))
      .finally(() => setHistoryLoading(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    setError('');

    // Optimistic user message
    const userMsg = { id: Date.now(), role: 'user', content: msg };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const { data } = await chatAPI.send(msg);
      const assistantMsg = {
        id: Date.now() + 1, role: 'assistant',
        content: data.message,
        action_type: data.action,
      };
      setMessages(prev => [...prev, assistantMsg]);

      // Notify parent to refresh expense list if data changed
      if (['CREATE_EXPENSE', 'UPDATE_EXPENSE', 'DELETE_EXPENSE'].includes(data.action)) {
        onExpenseChanged?.();
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to send message. Check your API key.';
      setError(errMsg);
      setMessages(prev => [...prev, {
        id: Date.now() + 1, role: 'assistant',
        content: `⚠️ ${errMsg}`,
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [input, loading, onExpenseChanged]);

  const clearHistory = async () => {
    await chatAPI.clearHistory();
    setMessages([{
      id: Date.now(), role: 'assistant',
      content: '🧹 Chat history cleared! How can I help you?',
    }]);
  };

  return (
    <div style={{
      width: 380, background: C.surface, borderLeft: `1px solid ${C.border}`,
      display: 'flex', flexDirection: 'column', height: '100%',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px', borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: `linear-gradient(135deg, ${C.accent}, #0099ff)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
        }}>🤖</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: C.text }}>AI Assistant</div>
          <div style={{ fontSize: 11, color: C.accent, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.accent, display: 'inline-block' }} />
            Ready to help
          </div>
        </div>
        <button onClick={clearHistory} title="Clear history"
          style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 16 }}>🗑️</button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 0', scrollbarWidth: 'thin' }}>
        {historyLoading ? (
          <div style={{ color: C.muted, textAlign: 'center', paddingTop: 40 }}>Loading history...</div>
        ) : (
          messages.map(msg => <MessageBubble key={msg.id || msg.created_at} msg={msg} />)
        )}
        {loading && (
          <div style={{ display: 'flex', marginBottom: 12 }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%', marginRight: 8,
              background: `linear-gradient(135deg, ${C.accent}, #0099ff)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
            }}>🤖</div>
            <div style={{
              background: C.card, border: `1px solid ${C.border}`,
              borderRadius: '18px 18px 18px 4px', padding: '12px 16px',
            }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 6, height: 6, borderRadius: '50%', background: C.accent,
                    animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>
              <style>{`@keyframes pulse { 0%,80%,100% { opacity: 0.3; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1); } }`}</style>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      <div style={{ padding: '10px 12px', borderTop: `1px solid ${C.border}` }}>
        <div style={{ color: C.muted, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
          Quick prompts
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {QUICK_PROMPTS.slice(0, 4).map(q => (
            <button key={q} onClick={() => sendMessage(q)}
              style={{
                background: C.card, border: `1px solid ${C.border}`,
                borderRadius: 20, padding: '4px 10px', color: C.muted,
                fontSize: 11, cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.target.style.borderColor = C.accent; e.target.style.color = C.accent; }}
              onMouseLeave={e => { e.target.style.borderColor = C.border; e.target.style.color = C.muted; }}
            >{q.length > 28 ? q.slice(0, 28) + '…' : q}</button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div style={{ padding: '12px 16px 16px', borderTop: `1px solid ${C.border}` }}>
        {error && (
          <div style={{
            background: '#ff4d6d22', border: '1px solid #ff4d6d44', borderRadius: 8,
            padding: '8px 12px', color: C.danger, fontSize: 12, marginBottom: 10,
          }}>⚠️ {error}</div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Ask me anything about your expenses..."
            rows={2}
            style={{
              flex: 1, background: C.card, border: `1px solid ${C.border}`,
              borderRadius: 12, padding: '10px 14px', color: C.text, fontSize: 13,
              outline: 'none', resize: 'none', lineHeight: 1.5,
              fontFamily: "'Segoe UI', system-ui, sans-serif",
            }}
          />
          <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
            style={{
              width: 44, background: loading || !input.trim() ? C.border : C.accent,
              color: C.bg, border: 'none', borderRadius: 12,
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
              alignSelf: 'flex-end', height: 44, flexShrink: 0,
            }}>➤</button>
        </div>
        <div style={{ color: C.muted, fontSize: 10, marginTop: 6, textAlign: 'center' }}>
          Enter to send · Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}
