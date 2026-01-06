import { useMemo, useState, KeyboardEvent } from 'react';
import useDashboardStore from '../store/useDashboardStore';
import type { ChatMessage } from '../types/panels';
import './ChatPanel.css';

const quickPrompts: { label: string; value: string }[] = [
  { label: 'AI errors summary', value: 'Summarize the latest AI errors and proposed fixes.' },
  { label: 'Neon card back', value: 'Generate a new neon card back concept with cyan + violet accents.' },
  { label: 'Self-healing status', value: 'List pending self-healing tasks and their ETA.' },
];

function renderMessage(msg: ChatMessage) {
  return (
    <div key={msg.id} className={`chat-line role-${msg.role}`}>
      <div className="chat-line-meta">
        <span className="chat-role">{msg.role}</span>
        <span className="chat-time">{new Date(msg.timestamp).toLocaleTimeString()}</span>
      </div>
      <p>{msg.content}</p>
    </div>
  );
}

export default function ChatPanel() {
  const { chat, sendChat, generateCosmetic } = useDashboardStore();
  const [draft, setDraft] = useState('');

  const orderedHistory = useMemo(() => [...chat.history].sort((a, b) => a.timestamp - b.timestamp), [chat.history]);

  const submit = async () => {
    if (!draft.trim()) return;
    await sendChat(draft.trim());
    setDraft('');
  };

  const submitCosmetic = async () => {
    if (!draft.trim()) return;
    await generateCosmetic(draft.trim());
    setDraft('');
  };

  const handleKey = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <section className="side-card chat-panel">
      <header className="side-card-header">
        <div>
          <p className="panel-eyebrow">AI Copilot</p>
          <h2>Chat & Cosmetics</h2>
        </div>
        <span className={`chat-status ${chat.isSending ? 'busy' : 'idle'}`}>
          {chat.isSending ? 'Thinking…' : 'Ready'}
        </span>
      </header>

      <div className="chat-log" aria-live="polite">
        {orderedHistory.length === 0 ? (
          <div className="chat-empty">No messages yet. Ask for a status summary or request a cosmetic design.</div>
        ) : (
          orderedHistory.slice(-20).map(renderMessage)
        )}
      </div>

      <div className="chat-quick-actions">
        {quickPrompts.map((prompt) => (
          <button key={prompt.label} className="ghost-btn" onClick={() => setDraft(prompt.value)}>
            {prompt.label}
          </button>
        ))}
      </div>

      <div className="chat-composer">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask the AI to inspect logs, generate cosmetics, or plan fixes…"
        />
        <div className="chat-buttons">
          <button className="ghost-btn" onClick={submit} disabled={!draft.trim() || chat.isSending}>
            Send
          </button>
          <button className="ghost-btn" onClick={submitCosmetic} disabled={!draft.trim() || chat.isSending}>
            Generate Cosmetic
          </button>
        </div>
      </div>
    </section>
  );
}
