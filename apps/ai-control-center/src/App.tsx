import { useEffect, useState } from 'react';
import PanelCard from './components/PanelCard';
import RuntimePanel from './components/RuntimePanel';
import ChatPanel from './components/ChatPanel';
import ServiceManagementPanel from './components/ServiceManagementPanel';
import AIPerformancePanel from './components/AIPerformancePanel';
import CreationReviewPanel from './components/CreationReviewPanel';
import DeduplicationPanel from './components/DeduplicationPanel';
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
  const { statuses, isLoading, lastSync, fetchAll, authRequired, markAuthenticated, setAuthRequired, error } = useDashboardStore();
  const [password, setPassword] = useState('');
  const [loginPending, setLoginPending] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'performance' | 'creation' | 'deduplication'>('overview');

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
        <div className="header-top">
          <h1 className="app-title">AI Control Center</h1>
          <div className="header-actions">
            <span className="sync-pill">
              {isLoading ? 'Refreshing…' : lastSync ? `Last sync · ${new Date(lastSync).toLocaleTimeString()}` : 'Sync pending'}
            </span>
            <button className="ghost-btn" onClick={fetchAll} disabled={isLoading}>
              {isLoading ? 'Syncing' : 'Manual Sync'}
            </button>
            {/* Debug button to force login */}
            <button className="ghost-btn" onClick={() => setAuthRequired(true)}>Force Login</button>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="nav-tabs">
          <button 
            className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`nav-tab ${activeTab === 'services' ? 'active' : ''}`}
            onClick={() => setActiveTab('services')}
          >
            Service Management
          </button>
          <button 
            className={`nav-tab ${activeTab === 'performance' ? 'active' : ''}`}
            onClick={() => setActiveTab('performance')}
          >
            AI Performance
          </button>
          <button 
            className={`nav-tab ${activeTab === 'creation' ? 'active' : ''}`}
            onClick={() => setActiveTab('creation')}
          >
            🎨 Creation Studio
          </button>
          <button 
            className={`nav-tab ${activeTab === 'deduplication' ? 'active' : ''}`}
            onClick={() => setActiveTab('deduplication')}
          >
            🔄 Deduplication
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
        {activeTab === 'overview' ? (
          <>
            <section className="rail left-rail">
              <RuntimePanel />
            </section>

            <main className="panel-grid">
              {panelOrder.map((key) => (
                <PanelCard key={key} status={statuses[key]} onRefresh={fetchAll} />
              ))}
            </main>

            <section className="rail right-rail">
              <ChatPanel />
            </section>
          </>
        ) : activeTab === 'services' ? (
          <ServiceManagementPanel />
        ) : null}

        {activeTab === 'performance' && (
          <AIPerformancePanel />
        )}

        {activeTab === 'creation' && (
          <CreationReviewPanel />
        )}

        {activeTab === 'deduplication' && (
          <DeduplicationPanel />
        )}
      </div>
    </div>
  );
}

export default App;
