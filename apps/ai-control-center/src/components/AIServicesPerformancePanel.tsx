import { useState, useEffect } from 'react';
import PanelCard from './PanelCard';
import ServiceManagementPanel from './ServiceManagementPanel';
import AIPerformancePanel from './AIPerformancePanel';
import useDashboardStore from '../store/useDashboardStore';
import './AIServicesPerformancePanel.css';

interface Service {
  name: string;
  status: 'running' | 'stopped' | 'error';
  pid?: number;
  port?: number;
  url?: string;
  lastCheck?: string;
}

interface Model {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'inactive';
  provider: string;
  capabilities: string[];
  performance: {
    avg_response_time: string;
    success_rate: number;
    requests_per_minute: number;
  };
}

const AIServicesPerformancePanel: React.FC = () => {
  const { statuses, isLoading, lastSync, fetchAll } = useDashboardStore();
  const [activeView, setActiveView] = useState<'services' | 'performance' | 'combined'>('combined');
  const [services, setServices] = useState<Service[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [performance, setPerformance] = useState({
    overall: {
      cpu_usage: '45%',
      memory_usage: '62%',
      disk_usage: '38%',
      network_io: '125 MB/s',
      uptime: '99.9%'
    },
    models: {} as Record<string, any>,
    cache: {
      hit_rate: 0.87,
      size: '100MB',
      evictions: 12,
      ttl: 3600
    },
    errors: {
      total_errors: 63,
      error_rate: 0.05,
      last_error: null,
      critical_errors: 0
    },
    optimizations: {
      auto_scaling_enabled: true,
      query_optimization: true,
      cache_optimization: true,
      model_quantization: false
    }
  });

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30_000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  useEffect(() => {
    // Mock services data
    setServices([
      {
        name: 'ollama',
        status: 'running',
        pid: 1234,
        port: 11434,
        lastCheck: new Date().toISOString()
      },
      {
        name: 'tunnel',
        status: 'running',
        pid: 5678,
        url: 'https://tunnel.all-in-chat-poker.fly.dev',
        lastCheck: new Date().toISOString()
      }
    ]);

    // Mock models data (update to reflect three active models)
    setModels([
      {
        id: 'deepseek-coder:1.3b',
        name: 'Deepseek Coder 1.3B',
        type: 'code-generation',
        status: 'active',
        provider: 'ollama',
        capabilities: ['code-generation', 'text-generation', 'debugging'],
        performance: {
          avg_response_time: '220ms',
          success_rate: 0.98,
          requests_per_minute: 45
        }
      },
      {
        id: 'llama3.2:1b',
        name: 'Llama 3.2 1B',
        type: 'text-generation',
        status: 'active',
        provider: 'ollama',
        capabilities: ['text-generation', 'conversation', 'analysis'],
        performance: {
          avg_response_time: '180ms',
          success_rate: 0.96,
          requests_per_minute: 38
        }
      },
      {
        id: 'qwen:0.5b',
        name: 'Qwen 0.5B',
        type: 'creative-assistant',
        status: 'active',
        provider: 'ollama',
        capabilities: ['audio', 'creative-writing', 'persona'],
        performance: {
          avg_response_time: '210ms',
          success_rate: 0.94,
          requests_per_minute: 32
        }
      }
    ]);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
      case 'active':
        return '#4CAF50';
      case 'stopped':
      case 'inactive':
        return '#9E9E9E';
      case 'error':
        return '#F44336';
      default:
        return '#FF9800';
    }
  };

  const CombinedView = () => (
    <div className="combined-view">
      <div className="services-section">
        <h3>🔧 AI Services</h3>
        <div className="services-grid">
          {services.map((service) => (
            <div key={service.name} className="service-card">
              <div className="service-header">
                <h4>{service.name}</h4>
                <span className="status-indicator" style={{ backgroundColor: getStatusColor(service.status) }} />
              </div>
              <div className="service-details">
                <div className="detail-row">
                  <span>Status:</span>
                  <span>{service.status}</span>
                </div>
                {service.pid && (
                  <div className="detail-row">
                    <span>PID:</span>
                    <span>{service.pid}</span>
                  </div>
                )}
                {service.port && (
                  <div className="detail-row">
                    <span>Port:</span>
                    <span>{service.port}</span>
                  </div>
                )}
                {service.url && (
                  <div className="detail-row">
                    <span>URL:</span>
                    <span className="url">{service.url}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="performance-section">
        <h3>📊 Performance Metrics</h3>
        <div className="performance-overview">
          <div className="metric-cards">
            <div className="metric-card">
              <div className="metric-label">CPU Usage</div>
              <div className="metric-value">{performance.overall.cpu_usage}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Memory Usage</div>
              <div className="metric-value">{performance.overall.memory_usage}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Cache Hit Rate</div>
              <div className="metric-value">{(performance.cache.hit_rate * 100).toFixed(1)}%</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Error Rate</div>
              <div className="metric-value">{(performance.errors.error_rate * 100).toFixed(2)}%</div>
            </div>
          </div>
        </div>

        <div className="models-performance">
          <h4>Model Performance</h4>
          <div className="models-grid">
            {models.map((model) => (
              <div key={model.id} className="model-card">
                <div className="model-header">
                  <h5>{model.name}</h5>
                  <span className="status-indicator" style={{ backgroundColor: getStatusColor(model.status) }} />
                </div>
                <div className="model-metrics">
                  <div className="metric-row">
                    <span>Response Time:</span>
                    <span>{model.performance.avg_response_time}</span>
                  </div>
                  <div className="metric-row">
                    <span>Success Rate:</span>
                    <span>{(model.performance.success_rate * 100).toFixed(1)}%</span>
                  </div>
                  <div className="metric-row">
                    <span>Requests/min:</span>
                    <span>{model.performance.requests_per_minute}</span>
                  </div>
                </div>
                <div className="model-capabilities">
                  {model.capabilities.map((cap) => (
                    <span key={cap} className="capability-tag">{cap}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="ai-services-performance-panel">
      <div className="panel-header">
        <h2>🤖 AI Services & Performance</h2>
        <div className="view-controls">
          <button
            className={`view-btn ${activeView === 'combined' ? 'active' : ''}`}
            onClick={() => setActiveView('combined')}
          >
            📊 Combined
          </button>
          <button
            className={`view-btn ${activeView === 'services' ? 'active' : ''}`}
            onClick={() => setActiveView('services')}
          >
            🔧 Services
          </button>
          <button
            className={`view-btn ${activeView === 'performance' ? 'active' : ''}`}
            onClick={() => setActiveView('performance')}
          >
            📈 Performance
          </button>
        </div>
      </div>

      <div className="panel-content">
        {activeView === 'combined' && <CombinedView />}
        {activeView === 'services' && <ServiceManagementPanel />}
        {activeView === 'performance' && <AIPerformancePanel />}
      </div>
    </div>
  );
};

export default AIServicesPerformancePanel;
