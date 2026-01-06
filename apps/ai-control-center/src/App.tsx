import { useEffect } from 'react';
import PanelCard from './components/PanelCard';
import RuntimePanel from './components/RuntimePanel';
import ChatPanel from './components/ChatPanel';
import useDashboardStore from './store/useDashboardStore';
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
  const { statuses, isLoading, lastSync, fetchAll } = useDashboardStore();

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
