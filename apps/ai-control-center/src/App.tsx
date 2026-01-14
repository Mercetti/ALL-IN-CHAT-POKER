import { useEffect, useState, useRef } from 'react';
import PanelCard from './components/PanelCard';
import RuntimePanel from './components/RuntimePanel';
import ChatPanel from './components/ChatPanel';
import AIServicesPerformancePanel from './components/AIServicesPerformancePanel';
import CreationReviewPanel from './components/CreationReviewPanel';
import DeduplicationPanel from './components/DeduplicationPanel';
import UpdatesPage from './components/UpdatesPage';
import AceyDevHelper from './components/AceyDevHelper';
import AceyFeedbackAnalyzer from './components/AceyFeedbackAnalyzer';
import AceyTester from './components/AceyTester';
import ThemeToggle from './components/ui/ThemeToggle';
import ErrorBoundary from './components/ui/ErrorBoundary';
import { useKeyboardNavigation, useFocusTrap } from './hooks/useKeyboardNavigation';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'services-performance' | 'creation' | 'deduplication' | 'updates' | 'dev-helper' | 'feedback-analyzer' | 'acey-tester'>('overview');
  const authFormRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation for tabs
  const tabs = [
    'overview' as const,
    'services-performance' as const,
    'creation' as const,
    'deduplication' as const,
    'updates' as const,
    'dev-helper' as const,
    'feedback-analyzer' as const,
    'acey-tester' as const,
  ];

  const currentTabIndex = tabs.indexOf(activeTab);
  const showAuthPanel = authRequired;

  useKeyboardNavigation({
    onTab: (direction) => {
      if (showAuthPanel) return;
      
      const newIndex = direction === 'next' 
        ? (currentTabIndex + 1) % tabs.length
        : (currentTabIndex - 1 + tabs.length) % tabs.length;
      setActiveTab(tabs[newIndex]);
    },
    onArrow: (direction) => {
      if (showAuthPanel) return;
      
      if (direction === 'left' && currentTabIndex > 0) {
        setActiveTab(tabs[currentTabIndex - 1]);
      } else if (direction === 'right' && currentTabIndex < tabs.length - 1) {
        setActiveTab(tabs[currentTabIndex + 1]);
      }
    },
    enabled: !showAuthPanel,
  });

  // Focus trap for auth form
  useFocusTrap(authFormRef, {
    enabled: showAuthPanel,
    onEscape: () => setAuthRequired(false),
  });

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

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('App error boundary caught:', error, errorInfo);
      }}
      showRetry={true}
      showDetails={process.env.NODE_ENV === 'development'}
    >
      <div className={`app-shell ${activeTab === 'overview' || activeTab === 'services-performance' || activeTab === 'creation' || activeTab === 'deduplication' || activeTab === 'updates' || activeTab === 'dev-helper' || activeTab === 'feedback-analyzer' || activeTab === 'acey-tester' ? 'full-width' : ''}`}>
        <header className="app-header">
          <div className="header-top">
            <h1 className="app-title">AI Control Center</h1>
            <div className="header-actions">
              <ThemeToggle showLabel={false} size="small" />
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
              className={`nav-tab ${activeTab === 'services-performance' ? 'active' : ''}`}
              onClick={() => setActiveTab('services-performance')}
            >
              🤖 AI Services & Performance
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
            <button 
              className={`nav-tab ${activeTab === 'updates' ? 'active' : ''}`}
              onClick={() => setActiveTab('updates')}
            >
              📰 Updates
            </button>
            <button 
              className={`nav-tab ${activeTab === 'dev-helper' ? 'active' : ''}`}
              onClick={() => setActiveTab('dev-helper')}
            >
              🤖 Acey Dev
            </button>
            <button 
              className={`nav-tab ${activeTab === 'feedback-analyzer' ? 'active' : ''}`}
              onClick={() => setActiveTab('feedback-analyzer')}
            >
              💬 Feedback
            </button>
            <button 
              className={`nav-tab ${activeTab === 'acey-tester' ? 'active' : ''}`}
              onClick={() => setActiveTab('acey-tester')}
            >
              🧪 Test Acey
            </button>
          </div>
          
          {showAuthPanel && (
            <div ref={authFormRef} className="auth-panel">
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

        <div className={`content-layout ${activeTab === 'overview' || activeTab === 'services-performance' || activeTab === 'creation' || activeTab === 'deduplication' || activeTab === 'updates' || activeTab === 'dev-helper' || activeTab === 'feedback-analyzer' || activeTab === 'acey-tester' ? 'full-width' : ''}`}>
          {activeTab === 'overview' ? (
            <div className="overview-grid">
              <div className="overview-section">
                <RuntimePanel />
              </div>
              <main className="overview-main">
                <div className="panel-grid">
                  {panelOrder.map((key) => (
                    <PanelCard key={key} status={statuses[key]} onRefresh={fetchAll} />
                  ))}
                </div>
              </main>
              <div className="overview-section">
                <ChatPanel />
              </div>
            </div>
          ) : activeTab === 'services-performance' ? (
            <AIServicesPerformancePanel />
          ) : null}

          {activeTab === 'creation' && (
            <CreationReviewPanel />
          )}

          {activeTab === 'deduplication' && (
            <DeduplicationPanel />
          )}

          {activeTab === 'updates' && (
            <UpdatesPage />
          )}

          {activeTab === 'dev-helper' && (
            <AceyDevHelper />
          )}

          {activeTab === 'feedback-analyzer' && (
            <AceyFeedbackAnalyzer />
          )}

          {activeTab === 'acey-tester' && (
            <AceyTester />
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;
