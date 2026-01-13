/**
 * Admin Dashboard Core
 * Core functionality and state management for admin dashboard
 */

class AdminDashboardCore {
  constructor() {
    this.state = {
      currentSection: 'overview',
      aiStatus: {
        chatBot: false,
        errorManager: false,
        performance: false,
        uxMonitor: false,
        selfHealing: false
      },
      metrics: {
        health: 0,
        activeUsers: 0,
        aiResponseTime: 0,
        errorRate: 0,
        cpuUsage: 0,
        memoryUsage: 0
      },
      alerts: [],
      recentActivity: [],
      sessionStartTime: Date.now(),
      adminUsers: [],
      adminAudit: [],
      selectedAdmin: null,
      adminFilters: {
        status: ''
      },
      adminAuditFilters: {
        actor: '',
        target: '',
        action: ''
      },
      adminLoading: false,
      adminAuditLoading: false
    };
    
    this.updateInterval = null;
    this.chatHistory = [];
    this.modules = new Map();
    
    this.init();
  }

  init() {
    console.log('🚀 Admin Dashboard Core initializing...');
    this.loadModules();
    this.setupEventListeners();
    this.startMetricsCollection();
    this.initializeUI();
  }

  /**
   * Load dashboard modules dynamically
   */
  async loadModules() {
    const modules = [
      'ai-monitor',
      'user-management', 
      'game-management',
      'system-settings',
      'performance-monitor',
      'audit-log'
    ];

    for (const moduleName of modules) {
      try {
        const module = await this.loadModule(moduleName);
        this.modules.set(moduleName, module);
        console.log(`✅ Loaded module: ${moduleName}`);
      } catch (error) {
        console.error(`❌ Failed to load module: ${moduleName}`, error);
      }
    }
  }

  /**
   * Load individual module
   */
  async loadModule(moduleName) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `/js/admin/modules/${moduleName}.js`;
      script.onload = () => {
        if (window.AdminModules && window.AdminModules[moduleName]) {
          resolve(window.AdminModules[moduleName]);
        } else {
          reject(new Error(`Module ${moduleName} not found in window.AdminModules`));
        }
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Navigation
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-nav]')) {
        e.preventDefault();
        this.navigateToSection(e.target.dataset.nav);
      }
    });

    // Module communication
    window.addEventListener('adminModuleEvent', (e) => {
      this.handleModuleEvent(e.detail);
    });

    // Window resize for responsive behavior
    window.addEventListener('resize', this.debounce(() => {
      this.handleResize();
    }, 250));
  }

  /**
   * Navigate to section
   */
  navigateToSection(section) {
    this.state.currentSection = section;
    
    // Update navigation
    document.querySelectorAll('[data-nav]').forEach(link => {
      link.classList.toggle('active', link.dataset.nav === section);
    });

    // Update content area
    this.loadSectionContent(section);
    
    // Update URL
    history.pushState({ section }, '', `/admin/${section}`);
  }

  /**
   * Load section content
   */
  async loadSectionContent(section) {
    const contentArea = document.getElementById('admin-content');
    if (!contentArea) return;

    // Show loading
    contentArea.innerHTML = '<div class="loading-spinner"></div>';

    try {
      // Load section-specific module
      const module = this.modules.get(section);
      if (module && module.loadContent) {
        const content = await module.loadContent();
        contentArea.innerHTML = content;
        module.init && module.init();
      } else {
        // Fallback to server-side content
        const response = await fetch(`/admin/sections/${section}`);
        const html = await response.text();
        contentArea.innerHTML = html;
      }
    } catch (error) {
      console.error(`Failed to load section ${section}:`, error);
      contentArea.innerHTML = '<div class="error-message">Failed to load content</div>';
    }
  }

  /**
   * Start metrics collection
   */
  startMetricsCollection() {
    this.updateInterval = setInterval(() => {
      this.collectMetrics();
    }, 5000); // Update every 5 seconds

    // Initial collection
    this.collectMetrics();
  }

  /**
   * Collect system metrics
   */
  async collectMetrics() {
    try {
      const response = await fetch('/api/admin/metrics');
      const metrics = await response.json();
      
      this.state.metrics = { ...this.state.metrics, ...metrics };
      this.updateMetricsDisplay();
      
      // Check for alerts
      this.checkAlerts(metrics);
      
    } catch (error) {
      console.error('Failed to collect metrics:', error);
    }
  }

  /**
   * Update metrics display
   */
  updateMetricsDisplay() {
    const elements = {
      'health-metric': this.state.metrics.health,
      'active-users': this.state.metrics.activeUsers,
      'ai-response-time': this.state.metrics.aiResponseTime,
      'error-rate': this.state.metrics.errorRate,
      'cpu-usage': this.state.metrics.cpuUsage,
      'memory-usage': this.state.metrics.memoryUsage
    };

    Object.entries(elements).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = this.formatMetricValue(id, value);
        element.className = this.getMetricClass(id, value);
      }
    });
  }

  /**
   * Format metric values
   */
  formatMetricValue(type, value) {
    switch (type) {
      case 'health':
        return `${value}%`;
      case 'ai-response-time':
        return `${value}ms`;
      case 'error-rate':
        return `${(value * 100).toFixed(2)}%`;
      case 'cpu-usage':
      case 'memory-usage':
        return `${value}%`;
      default:
        return value.toString();
    }
  }

  /**
   * Get metric CSS class
   */
  getMetricClass(type, value) {
    let className = 'metric-value';
    
    if (type === 'health') {
      if (value >= 90) className += ' excellent';
      else if (value >= 70) className += ' good';
      else if (value >= 50) className += ' warning';
      else className += ' critical';
    } else {
      // For other metrics, lower is better
      if (value <= 20) className += ' excellent';
      else if (value <= 50) className += ' good';
      else if (value <= 80) className += ' warning';
      else className += ' critical';
    }
    
    return className;
  }

  /**
   * Check for alerts
   */
  checkAlerts(metrics) {
    const alerts = [];

    if (metrics.health < 50) {
      alerts.push({
        type: 'critical',
        message: 'System health is critical',
        timestamp: Date.now()
      });
    }

    if (metrics.errorRate > 0.1) {
      alerts.push({
        type: 'warning',
        message: 'High error rate detected',
        timestamp: Date.now()
      });
    }

    if (metrics.cpuUsage > 80) {
      alerts.push({
        type: 'warning',
        message: 'High CPU usage',
        timestamp: Date.now()
      });
    }

    if (metrics.memoryUsage > 85) {
      alerts.push({
        type: 'critical',
        message: 'High memory usage',
        timestamp: Date.now()
      });
    }

    // Update alerts display
    this.state.alerts = [...this.state.alerts, ...alerts];
    this.updateAlertsDisplay();
  }

  /**
   * Update alerts display
   */
  updateAlertsDisplay() {
    const alertsContainer = document.getElementById('alerts-container');
    if (!alertsContainer) return;

    const recentAlerts = this.state.alerts.slice(-5); // Show last 5 alerts
    
    alertsContainer.innerHTML = recentAlerts.map(alert => `
      <div class="alert alert-${alert.type}">
        <span class="alert-message">${alert.message}</span>
        <span class="alert-time">${new Date(alert.timestamp).toLocaleTimeString()}</span>
      </div>
    `).join('');
  }

  /**
   * Handle module events
   */
  handleModuleEvent(eventData) {
    const { type, data, source } = eventData;
    
    switch (type) {
      case 'metricsUpdate':
        this.state.metrics = { ...this.state.metrics, ...data };
        this.updateMetricsDisplay();
        break;
        
      case 'alert':
        this.state.alerts.push(data);
        this.updateAlertsDisplay();
        break;
        
      case 'navigation':
        this.navigateToSection(data.section);
        break;
        
      default:
        console.log('Unknown module event:', eventData);
    }
  }

  /**
   * Initialize UI
   */
  initializeUI() {
    // Set initial section from URL
    const pathParts = window.location.pathname.split('/');
    const section = pathParts[pathParts.length - 1] || 'overview';
    
    if (section !== 'admin') {
      this.navigateToSection(section);
    }

    // Setup responsive sidebar
    this.setupResponsiveSidebar();
  }

  /**
   * Setup responsive sidebar
   */
  setupResponsiveSidebar() {
    const sidebar = document.querySelector('.admin-sidebar');
    const toggle = document.querySelector('.sidebar-toggle');
    
    if (toggle) {
      toggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
      });
    }
  }

  /**
   * Handle window resize
   */
  handleResize() {
    const isMobile = window.innerWidth < 768;
    const sidebar = document.querySelector('.admin-sidebar');
    
    if (sidebar) {
      if (isMobile) {
        sidebar.classList.add('mobile');
      } else {
        sidebar.classList.remove('mobile');
      }
    }
  }

  /**
   * Debounce utility
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Emit module event
   */
  emitModuleEvent(type, data) {
    const event = new CustomEvent('adminModuleEvent', {
      detail: { type, data, source: 'core' }
    });
    window.dispatchEvent(event);
  }

  /**
   * Get module instance
   */
  getModule(name) {
    return this.modules.get(name);
  }

  /**
   * Update state
   */
  updateState(updates) {
    this.state = { ...this.state, ...updates };
    this.emitModuleEvent('stateUpdate', this.state);
  }

  /**
   * Get state
   */
  getState() {
    return this.state;
  }

  /**
   * Destroy dashboard
   */
  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    // Cleanup modules
    this.modules.forEach(module => {
      if (module.destroy) {
        module.destroy();
      }
    });
    
    this.modules.clear();
  }
}

// Export for module loading
window.AdminDashboardCore = AdminDashboardCore;
