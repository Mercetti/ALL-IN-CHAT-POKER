import { useEffect, useState } from 'react';
import PanelCard from './components/PanelCard';
import RuntimePanel from './components/RuntimePanel';
import ChatPanel from './components/ChatPanel';
import useDashboardStore from './store/useDashboardStore';
import { controlCenterLogin } from './services/api';
import type { PanelKey } from './types/panels';
import './theme/layout.css';

const panelOrder: PanelKey[] = [
  'errorManager',
  'performanceOptimizer',
  'uxMonitor',
  'audioGenerator',
  'selfHealing',
  'pokerAudio'
];

function App() {
  const { statuses, isLoading, lastSync, fetchAll, authRequired, markAuthenticated, error } = useDashboardStore();
  const [password, setPassword] = useState('');
  const [loginPending, setLoginPending] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 60_000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  useEffect(() => {
    if (!window.aiBridge) return;
    window.aiBridge.getTheme?.().then((theme) => {
      document.body.dataset.theme = theme?.shouldUseDarkColors === false ? 'light' : 'dark';
    });
  }, []);

  const handleLogin = async (evt: React.FormEvent) => {
    evt.preventDefault();
    if (!password.trim()) {
      setLoginError('Password is required');
      return;
    }

    setLoginPending(true);
    setLoginError(null);

    try {
      const resp = await controlCenterLogin(password.trim());
      if (!resp.success) {
        setLoginError('Login failed');
        setLoginPending(false);
        return;
      }

      markAuthenticated();
      setPassword('');
      setLoginPending(false);
      setLoginError(null);
      fetchAll();
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Login failed');
      setLoginPending(false);
    }
  };

  const showAuthPanel = authRequired;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">All-In Chat Poker</p>
          <h1>AI Control Center</h1>
          <p className="subtitle">
            Unified cockpit for every autonomous system — stay informed even if the main site goes down.
          </p>
        </div>
        <div className="header-meta">
          <span className="sync-pill">
            {isLoading ? 'Refreshing…' : lastSync ? `Last sync · ${new Date(lastSync).toLocaleTimeString()}` : 'Sync pending'}
          </span>
          <button className="ghost-btn" onClick={fetchAll} disabled={isLoading}>
            {isLoading ? 'Syncing' : 'Manual Sync'}
          </button>
        </div>
        {showAuthPanel && (
          <div className="auth-panel">
            <h3>Admin Login Required</h3>
            <p>Enter the admin password to unlock live data.</p>
            <form onSubmit={handleLogin} className="auth-form">
              <input
                type="password"
                placeholder="Admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loginPending}
              />
              <button className="primary-btn" type="submit" disabled={loginPending}>
                {loginPending ? 'Authorizing…' : 'Unlock'}
              </button>
            </form>
            {(loginError || error) && <p className="auth-error">{loginError || error}</p>}
          </div>
        )}
      </header>

      <div className="content-layout">
        <main className="panel-grid">
          {panelOrder.map((key) => (
            <PanelCard key={key} status={statuses[key]} onRefresh={fetchAll} />
          ))}
        </main>

        <aside className="side-column">
          <RuntimePanel />
          <ChatPanel />
        </aside>
      </div>
    </div>
  );
}

export default App;
