/**
 * AI Monitor Module
 * AI system monitoring and management
 */

window.AdminModules = window.AdminModules || {};

window.AdminModules['ai-monitor'] = {
  name: 'AI Monitor',
  version: '1.0.0',
  
  state: {
    aiServices: {
      chatBot: { status: 'offline', metrics: {} },
      errorManager: { status: 'offline', metrics: {} },
      performance: { status: 'offline', metrics: {} },
      uxMonitor: { status: 'offline', metrics: {} },
      selfHealing: { status: 'offline', metrics: {} }
    },
    logs: [],
    alerts: []
  },

  async loadContent() {
    return `
      <div class="ai-monitor-section">
        <div class="section-header">
          <h2>AI Services Monitor</h2>
          <div class="header-actions">
            <button class="btn btn-primary" onclick="AdminModules['ai-monitor'].refreshAll()">
              <i class="icon-refresh"></i> Refresh All
            </button>
            <button class="btn btn-secondary" onclick="AdminModules['ai-monitor'].toggleAutoRefresh()">
              <i class="icon-clock"></i> Auto Refresh
            </button>
          </div>
        </div>

        <div class="ai-services-grid">
          ${this.renderServiceCards()}
        </div>

        <div class="ai-logs-section">
          <h3>AI System Logs</h3>
          <div class="logs-container" id="ai-logs">
            ${this.renderLogs()}
          </div>
        </div>

        <div class="ai-controls-section">
          <h3>AI Controls</h3>
          <div class="control-groups">
            ${this.renderControls()}
          </div>
        </div>
      </div>
    `;
  },

  init() {
    this.setupEventListeners();
    this.startAutoRefresh();
    this.loadInitialData();
  },

  renderServiceCards() {
    return Object.entries(this.state.aiServices).map(([service, data]) => `
      <div class="service-card service-${data.status}" data-service="${service}">
        <div class="service-header">
          <h4>${this.formatServiceName(service)}</h4>
          <span class="status-indicator status-${data.status}"></span>
        </div>
        <div class="service-metrics">
          ${this.renderServiceMetrics(service, data.metrics)}
        </div>
        <div class="service-actions">
          <button class="btn btn-sm" onclick="AdminModules['ai-monitor'].restartService('${service}')">
            Restart
          </button>
          <button class="btn btn-sm" onclick="AdminModules['ai-monitor'].viewServiceDetails('${service}')">
            Details
          </button>
        </div>
      </div>
    `).join('');
  },

  renderServiceMetrics(service, metrics) {
    if (!metrics || Object.keys(metrics).length === 0) {
      return '<div class="metric-placeholder">No metrics available</div>';
    }

    return Object.entries(metrics).map(([key, value]) => `
      <div class="metric">
        <span class="metric-label">${this.formatMetricName(key)}</span>
        <span class="metric-value">${this.formatMetricValue(key, value)}</span>
      </div>
    `).join('');
  },

  renderLogs() {
    if (this.state.logs.length === 0) {
      return '<div class="no-logs">No logs available</div>';
    }

    return this.state.logs.slice(-50).map(log => `
      <div class="log-entry log-${log.level}">
        <span class="log-time">${new Date(log.timestamp).toLocaleTimeString()}</span>
        <span class="log-service">${log.service}</span>
        <span class="log-message">${log.message}</span>
      </div>
    `).join('');
  },

  renderControls() {
    return `
      <div class="control-group">
        <h4>Global Controls</h4>
        <div class="control-buttons">
          <button class="btn btn-success" onclick="AdminModules['ai-monitor'].startAllServices()">
            Start All Services
          </button>
          <button class="btn btn-warning" onclick="AdminModules['ai-monitor'].stopAllServices()">
            Stop All Services
          </button>
          <button class="btn btn-danger" onclick="AdminModules['ai-monitor'].restartAllServices()">
            Restart All Services
          </button>
        </div>
      </div>

      <div class="control-group">
        <h4>Configuration</h4>
        <div class="config-form">
          <label>
            <input type="checkbox" id="auto-healing" ${this.getAutoHealingStatus()}>
            Enable Auto-Healing
          </label>
          <label>
            <input type="checkbox" id="performance-monitoring" ${this.getPerformanceMonitoringStatus()}>
            Enable Performance Monitoring
          </label>
          <label>
            Log Level:
            <select id="log-level">
              <option value="debug">Debug</option>
              <option value="info">Info</option>
              <option value="warn">Warning</option>
              <option value="error">Error</option>
            </select>
          </label>
        </div>
      </div>
    `;
  },

  formatServiceName(service) {
    return service.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  },

  formatMetricName(metric) {
    return metric.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  },

  formatMetricValue(key, value) {
    if (typeof value === 'number') {
      if (key.includes('Time') || key.includes('Latency')) {
        return `${value}ms`;
      }
      if (key.includes('Rate') || key.includes('Percent')) {
        return `${value}%`;
      }
      if (key.includes('Memory') || key.includes('Size')) {
        return this.formatBytes(value);
      }
    }
    return value;
  },

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  setupEventListeners() {
    // Listen for AI service updates
    window.addEventListener('aiServiceUpdate', (e) => {
      this.handleServiceUpdate(e.detail);
    });

    // Listen for log updates
    window.addEventListener('aiLogUpdate', (e) => {
      this.handleLogUpdate(e.detail);
    });
  },

  async loadInitialData() {
    try {
      const response = await fetch('/api/admin/ai/status');
      const data = await response.json();
      
      this.state.aiServices = data.services;
      this.state.logs = data.logs || [];
      
      this.updateUI();
    } catch (error) {
      console.error('Failed to load AI data:', error);
    }
  },

  async refreshAll() {
    try {
      const response = await fetch('/api/admin/ai/refresh', { method: 'POST' });
      const data = await response.json();
      
      this.state.aiServices = data.services;
      this.state.logs = data.logs || [];
      
      this.updateUI();
      this.showNotification('AI services refreshed', 'success');
    } catch (error) {
      console.error('Failed to refresh AI services:', error);
      this.showNotification('Failed to refresh AI services', 'error');
    }
  },

  async restartService(service) {
    try {
      const response = await fetch(`/api/admin/ai/restart/${service}`, { method: 'POST' });
      const data = await response.json();
      
      if (data.success) {
        this.showNotification(`${service} service restarted`, 'success');
        await this.refreshAll();
      } else {
        this.showNotification(`Failed to restart ${service}`, 'error');
      }
    } catch (error) {
      console.error(`Failed to restart ${service}:`, error);
      this.showNotification(`Failed to restart ${service}`, 'error');
    }
  },

  async startAllServices() {
    try {
      const response = await fetch('/api/admin/ai/start-all', { method: 'POST' });
      const data = await response.json();
      
      if (data.success) {
        this.showNotification('All AI services started', 'success');
        await this.refreshAll();
      } else {
        this.showNotification('Failed to start all services', 'error');
      }
    } catch (error) {
      console.error('Failed to start all services:', error);
      this.showNotification('Failed to start all services', 'error');
    }
  },

  async stopAllServices() {
    try {
      const response = await fetch('/api/admin/ai/stop-all', { method: 'POST' });
      const data = await response.json();
      
      if (data.success) {
        this.showNotification('All AI services stopped', 'success');
        await this.refreshAll();
      } else {
        this.showNotification('Failed to stop all services', 'error');
      }
    } catch (error) {
      console.error('Failed to stop all services:', error);
      this.showNotification('Failed to stop all services', 'error');
    }
  },

  async restartAllServices() {
    try {
      const response = await fetch('/api/admin/ai/restart-all', { method: 'POST' });
      const data = await response.json();
      
      if (data.success) {
        this.showNotification('All AI services restarted', 'success');
        await this.refreshAll();
      } else {
        this.showNotification('Failed to restart all services', 'error');
      }
    } catch (error) {
      console.error('Failed to restart all services:', error);
      this.showNotification('Failed to restart all services', 'error');
    }
  },

  viewServiceDetails(service) {
    // Open service details modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>${this.formatServiceName(service)} Details</h3>
          <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
        </div>
        <div class="modal-body">
          <div class="service-details">
            <h4>Status</h4>
            <p>${this.state.aiServices[service].status}</p>
            
            <h4>Metrics</h4>
            <div class="detailed-metrics">
              ${this.renderServiceMetrics(service, this.state.aiServices[service].metrics)}
            </div>
            
            <h4>Recent Logs</h4>
            <div class="service-logs">
              ${this.state.logs
                .filter(log => log.service === service)
                .slice(-10)
                .map(log => `
                  <div class="log-entry log-${log.level}">
                    <span class="log-time">${new Date(log.timestamp).toLocaleTimeString()}</span>
                    <span class="log-message">${log.message}</span>
                  </div>
                `).join('') || '<div class="no-logs">No logs for this service</div>'}
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  },

  handleServiceUpdate(data) {
    const { service, status, metrics } = data;
    
    if (this.state.aiServices[service]) {
      this.state.aiServices[service] = {
        ...this.state.aiServices[service],
        status,
        metrics
      };
      
      this.updateServiceCard(service);
    }
  },

  handleLogUpdate(data) {
    this.state.logs.push(data);
    
    // Keep only last 1000 logs
    if (this.state.logs.length > 1000) {
      this.state.logs = this.state.logs.slice(-1000);
    }
    
    this.updateLogsDisplay();
  },

  updateUI() {
    this.updateServiceCards();
    this.updateLogsDisplay();
  },

  updateServiceCards() {
    const container = document.querySelector('.ai-services-grid');
    if (container) {
      container.innerHTML = this.renderServiceCards();
    }
  },

  updateServiceCard(service) {
    const card = document.querySelector(`[data-service="${service}"]`);
    if (card) {
      const serviceData = this.state.aiServices[service];
      card.className = `service-card service-${serviceData.status}`;
      
      // Update status indicator
      const indicator = card.querySelector('.status-indicator');
      if (indicator) {
        indicator.className = `status-indicator status-${serviceData.status}`;
      }
      
      // Update metrics
      const metricsContainer = card.querySelector('.service-metrics');
      if (metricsContainer) {
        metricsContainer.innerHTML = this.renderServiceMetrics(service, serviceData.metrics);
      }
    }
  },

  updateLogsDisplay() {
    const logsContainer = document.getElementById('ai-logs');
    if (logsContainer) {
      logsContainer.innerHTML = this.renderLogs();
      logsContainer.scrollTop = logsContainer.scrollHeight;
    }
  },

  startAutoRefresh() {
    this.autoRefreshInterval = setInterval(() => {
      this.refreshAll();
    }, 30000); // Refresh every 30 seconds
  },

  toggleAutoRefresh() {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
      this.autoRefreshInterval = null;
      this.showNotification('Auto-refresh disabled', 'info');
    } else {
      this.startAutoRefresh();
      this.showNotification('Auto-refresh enabled', 'info');
    }
  },

  getAutoHealingStatus() {
    // This would come from actual configuration
    return 'checked';
  },

  getPerformanceMonitoringStatus() {
    // This would come from actual configuration
    return 'checked';
  },

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  },

  destroy() {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
    }
  }
};
