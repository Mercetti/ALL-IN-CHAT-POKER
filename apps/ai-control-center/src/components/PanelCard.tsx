import type { PanelStatus } from '../store/useDashboardStore';
import './PanelCard.css';

type Props = {
  status: PanelStatus;
  onRefresh: () => Promise<void> | void;
};

const statusColorMap: Record<PanelStatus['state'], string> = {
  healthy: 'status-pill healthy',
  warning: 'status-pill warning',
  critical: 'status-pill critical',
  offline: 'status-pill offline',
};

export default function PanelCard({ status, onRefresh }: Props) {
  if (!status) return null;
  const { title, description, state, metrics } = status;
  const badgeClass = statusColorMap[state] || 'status-pill healthy';

  return (
    <section className="panel-card">
      <header className="panel-header">
        <div>
          <p className="panel-eyebrow">{status.category}</p>
          <h2>{title}</h2>
          <p className="panel-description">{description}</p>
        </div>
        <div className="panel-meta">
          <span className={badgeClass}>{state}</span>
          <button className="ghost-btn" onClick={() => onRefresh()}>
            Refresh
          </button>
        </div>
      </header>

      <div className="panel-body">
        {metrics?.map((metric) => (
          <div key={metric.label} className="metric-pill">
            <span className="metric-label">{metric.label}</span>
            <span className="metric-value">{metric.value}</span>
          </div>
        ))}
      </div>

      {status.alerts?.length ? (
        <ul className="alert-list">
          {status.alerts.map((alert) => (
            <li key={alert.id} className={`alert ${alert.severity}`}>
              <div>
                <strong>{alert.title}</strong>
                <p>{alert.message}</p>
              </div>
              <time>{new Date(alert.timestamp).toLocaleTimeString()}</time>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
