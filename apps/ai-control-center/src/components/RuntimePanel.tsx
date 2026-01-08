import { useEffect } from 'react';
import useRuntimeStore from '../store/useRuntimeStore';
import './RuntimePanel.css';

function RuntimePanel() {
  const {
    status,
    logs,
    isStarting,
    isStopping,
    refreshStatus,
    startRuntime,
    stopRuntime,
    subscribeToLogs,
  } = useRuntimeStore();

  useEffect(() => {
    refreshStatus();
    subscribeToLogs();
  }, [refreshStatus, subscribeToLogs]);

  const running = Boolean(status.running);
  const lastMessage = status.lastLog?.message || 'No activity yet';

  return (
    <section className="side-card">
      <header className="side-card-header">
        <div>
          <p className="panel-eyebrow">Local Runtime</p>
          <h2>AI Engine</h2>
        </div>
        <span className={`runtime-status ${running ? 'online' : 'offline'}`}>
          {running ? 'Running' : 'Stopped'}
        </span>
      </header>

      <div className="runtime-actions">
        <button className="ghost-btn" onClick={startRuntime} disabled={running || isStarting}>
          {isStarting ? 'Starting…' : 'Start'}
        </button>
        <button className="ghost-btn" onClick={stopRuntime} disabled={!running || isStopping}>
          {isStopping ? 'Stopping…' : 'Stop'}
        </button>
        <button className="ghost-btn" onClick={refreshStatus}>
          Refresh
        </button>
      </div>

      <div className="runtime-meta">
        <p className="runtime-label">PID</p>
        <p className="runtime-value">{status.pid ?? '–'}</p>
      </div>

      <div className="runtime-meta">
        <p className="runtime-label">Last event</p>
        <p className="runtime-value" title={lastMessage}>
          {lastMessage}
        </p>
      </div>

      <div className="runtime-log">
        <p className="runtime-label">Recent logs</p>
        <div className="log-window">
          {logs.length === 0 ? (
            <div className="log-empty">Logs will appear here once the runtime starts producing output.</div>
          ) : (
            logs.slice(-12).map((log, idx) => {
              const safeId = log.id || `${log.timestamp}-${idx}`;
              return (
                <div key={`${safeId}-${idx}`} className={`log-line level-${log.level}`}>
                  <span className="log-time">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  <span>{log.message}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}

export default RuntimePanel;
