import { useMemo, useState, useRef, useCallback, useEffect, KeyboardEvent, DragEvent, ChangeEvent } from 'react';
import useDashboardStore from '../store/useDashboardStore';
import type { ChatAttachment, ChatMessage } from '../types/panels';
import './ChatPanel.css';

const quickPrompts: { label: string; value: string }[] = [
  { label: 'AI errors summary', value: 'Summarize the latest AI errors and proposed fixes.' },
  { label: 'Self-healing status', value: 'List pending self-healing tasks and their ETA.' },
  { label: 'Audio vibe check', value: 'How are our AI-generated music beds performing today?' },
  { label: 'Cosmetic QA', value: 'Review the latest card back cosmetics for consistency issues.' },
];

const MAX_ATTACHMENTS = 5;

const getAttachmentType = (attachment: Pick<ChatAttachment, 'type' | 'mimeType'>) => {
  if (attachment.type) return attachment.type;
  if (attachment.mimeType?.startsWith('image/')) return 'image';
  if (attachment.mimeType?.startsWith('audio/')) return 'audio';
  return 'file';
};

const formatBytes = (bytes?: number) => {
  if (!bytes || Number.isNaN(bytes)) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

function MessageAttachments({ attachments }: { attachments?: ChatAttachment[] }) {
  if (!attachments?.length) return null;

  const handleOpen = (attachment: ChatAttachment) => {
    if (attachment.localPath && window.aiBridge?.chat?.openAttachment) {
      window.aiBridge.chat
        .openAttachment(attachment.localPath)
        .catch((err: unknown) => console.warn('Failed to open attachment', err));
      return;
    }

    const target = attachment.previewUrl || attachment.remoteUrl;
    if (target) {
      window.open(target, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="chat-message-attachments">
      {attachments.map((attachment) => {
        const type = getAttachmentType(attachment);
        const source = attachment.previewUrl || attachment.remoteUrl;

        return (
          <div key={attachment.id} className={`chat-attachment chat-attachment-${type}`}>
            {type === 'image' && source ? (
              <img src={source} alt={attachment.name} loading="lazy" />
            ) : type === 'audio' && source ? (
              <audio controls src={source} preload="metadata">
                <track kind="captions" />
              </audio>
            ) : (
              <div className="chat-attachment-file">
                <span className="chat-attachment-name">{attachment.name}</span>
                <span className="chat-attachment-meta">{attachment.mimeType || 'file'}</span>
              </div>
            )}
            <div className="chat-attachment-footer">
              <span>{formatBytes(attachment.size)}</span>
              <button type="button" className="ghost-btn ghost-btn-sm" onClick={() => handleOpen(attachment)}>
                Open
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function renderMessage(msg: ChatMessage) {
  return (
    <div key={msg.id} className={`chat-line role-${msg.role}`}>
      <div className="chat-line-meta">
        <span className="chat-role">{msg.role}</span>
        <span className="chat-time">{new Date(msg.timestamp).toLocaleTimeString()}</span>
      </div>
      <p>{msg.content}</p>
      <MessageAttachments attachments={msg.attachments} />
    </div>
  );
}

async function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] || '';
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ChatPanel() {
  const { chat, sendChat, generateCosmetic, hydrateChatHistory } = useDashboardStore();
  const [draft, setDraft] = useState('');
  const [localAttachments, setLocalAttachments] = useState<ChatAttachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    hydrateChatHistory();
  }, [hydrateChatHistory]);

  const orderedHistory = useMemo(() => [...chat.history].sort((a, b) => a.timestamp - b.timestamp), [chat.history]);
  const sessionPreview = useMemo(
    () =>
      orderedHistory.slice(-25).map((message) => ({
        id: message.id,
        role: message.role,
        preview: message.content.slice(0, 80),
        timestamp: message.timestamp,
      })),
    [orderedHistory],
  );

  const processFiles = useCallback(async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    const remainingSlots = MAX_ATTACHMENTS - localAttachments.length;
    if (remainingSlots <= 0) return;

    const files = Array.from(fileList).slice(0, remainingSlots);
    const nextAttachments: ChatAttachment[] = [];

    for (const file of files) {
      try {
        const base64 = await readFileAsBase64(file);
        if (window.aiBridge?.chat?.saveAttachment) {
          const saved = await window.aiBridge.chat.saveAttachment({
            name: file.name,
            mimeType: file.type,
            data: base64,
          });

          if (saved?.success && saved.attachment) {
            nextAttachments.push({
              ...saved.attachment,
              name: saved.attachment.name || file.name,
              mimeType: saved.attachment.mimeType || file.type,
            });
            continue;
          }
        }

        const dataUrl = `data:${file.type || 'application/octet-stream'};base64,${base64}`;
        nextAttachments.push({
          id: crypto.randomUUID(),
          name: file.name,
          mimeType: file.type,
          size: file.size,
          previewUrl: dataUrl,
          type: getAttachmentType({ mimeType: file.type }),
        });
      } catch (error) {
        console.warn('Failed to process attachment', error);
      }
    }

    if (nextAttachments.length) {
      setLocalAttachments((prev) => [...prev, ...nextAttachments].slice(-MAX_ATTACHMENTS));
    }
  }, [localAttachments.length]);

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      await processFiles(event.target.files);
      // Reset input so the same file can be selected again
      event.target.value = '';
    },
    [processFiles],
  );

  const handleDrop = useCallback(
    async (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
      await processFiles(event.dataTransfer.files);
    },
    [processFiles],
  );

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!isDragging) setIsDragging(true);
  }, [isDragging]);

  const handleDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  const removeAttachment = (id: string) => {
    setLocalAttachments((prev) => prev.filter((attachment) => attachment.id !== id));
  };

  const submit = async () => {
    if (!draft.trim() && localAttachments.length === 0) return;
    await sendChat(draft, localAttachments);
    setDraft('');
    setLocalAttachments([]);
  };

  const submitCosmetic = async () => {
    if (!draft.trim()) return;
    await generateCosmetic(draft.trim());
    setDraft('');
    setLocalAttachments([]);
  };

  const handleKey = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <section className="side-card chat-panel">
      <header className="side-card-header chat-panel-header">
        <div>
          <p className="panel-eyebrow">AI Control</p>
          <h2>Detailed Chat Workspace</h2>
          <p className="chat-panel-subtitle">Persistent history, cosmetic generation, audio reviews, and training notes.</p>
        </div>
        <span className={`chat-status ${chat.isSending ? 'busy' : 'idle'}`}>
          {chat.isSending ? 'Thinking…' : 'Ready'}
        </span>
      </header>

      <div className="chat-body">
        <aside className="chat-history-rail">
          <div className="chat-history-header">
            <h3>Conversation Log</h3>
            <p>{orderedHistory.length} messages stored locally on this PC.</p>
          </div>
          <div className="chat-history-list">
            {sessionPreview.length === 0 ? (
              <p className="chat-history-empty">No saved history yet.</p>
            ) : (
              sessionPreview.map((session) => (
                <div key={session.id} className={`chat-history-pill role-${session.role}`}>
                  <div>
                    <p className="chat-history-pill-title">{session.role}</p>
                    <p className="chat-history-pill-preview">{session.preview}</p>
                  </div>
                  <span className="chat-history-pill-time">
                    {new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
          <div className="chat-history-meta">
            <p>Drag in reference files (max {MAX_ATTACHMENTS}) to teach Acey with concrete examples.</p>
            <button type="button" className="ghost-btn ghost-btn-sm" onClick={() => fileInputRef.current?.click()}>
              Upload Reference
            </button>
          </div>
        </aside>

        <div className="chat-main" aria-live="polite">
          <div className="chat-log">
            {orderedHistory.length === 0 ? (
              <div className="chat-empty">
                No messages yet. Ask for a status summary, drop in cosmetic drafts, or request fresh audio cues.
              </div>
            ) : (
              orderedHistory.slice(-100).map(renderMessage)
            )}
          </div>

          <div
            className={`chat-composer-dropzone ${isDragging ? 'drag-active' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="chat-composer-toolbar">
              <div className="chat-quick-actions">
                {quickPrompts.map((prompt) => (
                  <button key={prompt.label} className="ghost-btn ghost-btn-sm" onClick={() => setDraft(prompt.value)}>
                    {prompt.label}
                  </button>
                ))}
              </div>
              <div className="chat-attachment-actions">
                <button className="ghost-btn ghost-btn-sm" type="button" onClick={() => fileInputRef.current?.click()}>
                  Attach Files
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  hidden
                  multiple
                  onChange={handleFileChange}
                />
                <p>Drag & drop images/audio or click “Attach” to add reference files.</p>
              </div>
            </div>

            {localAttachments.length > 0 && (
              <div className="chat-attachment-pills">
                {localAttachments.map((attachment) => (
                  <span key={attachment.id} className="attachment-pill">
                    <span>{attachment.name}</span>
                    <button type="button" className="attachment-remove" onClick={() => removeAttachment(attachment.id)}>
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="chat-composer">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask Acey to inspect logs, generate cosmetics, craft audio cues, or learn from your references…"
              />
              <div className="chat-buttons">
                <button
                  className="ghost-btn"
                  onClick={submit}
                  disabled={(chat.isSending && localAttachments.length === 0) || (!draft.trim() && localAttachments.length === 0)}
                >
                  Send to Acey
                </button>
                <button
                  className="ghost-btn"
                  onClick={submitCosmetic}
                  disabled={!draft.trim() || chat.isSending}
                >
                  Generate Cosmetic
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
