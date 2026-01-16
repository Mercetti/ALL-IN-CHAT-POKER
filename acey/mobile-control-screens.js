/**
 * Acey Mobile Control Screens - JavaScript Version
 * Mobile app control interface components
 */

// Status Screen Component
const StatusScreen = ({ systemStatus, onRefresh }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#4CAF50';
      case 'ready': return '#2196F3';
      case 'stopping': return '#FF9800';
      case 'offline': return '#9E9E9E';
      case 'error': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  return {
    type: 'StatusScreen',
    render: () => ({
      title: 'Acey Status',
      sections: [
        {
          type: 'SystemStatus',
          items: [
            { label: 'LLM', value: systemStatus.llm, color: getStatusColor(systemStatus.llm) },
            { label: 'Tools', value: systemStatus.tools, color: getStatusColor(systemStatus.tools) },
            { label: 'WebSocket', value: systemStatus.websocket, color: getStatusColor(systemStatus.websocket) },
            { label: 'Chat', value: systemStatus.chat, color: getStatusColor(systemStatus.chat) }
          ]
        },
        {
          type: 'PerformanceMetrics',
          items: [
            { label: 'CPU Usage', value: `${systemStatus.cpu || 0}%` },
            { label: 'Memory', value: systemStatus.memory || '0MB' },
            { label: 'Tokens Used', value: systemStatus.tokens || '0' },
            { label: 'Uptime', value: systemStatus.uptime || '0s' }
          ]
        }
      ],
      actions: [
        { type: 'button', label: 'Refresh', action: onRefresh }
      ]
    })
  };
};

// Control Panel Component
const ControlPanel = ({ onStart, onStop, onModeChange, currentMode, systemStatus }) => {
  const modes = [
    { id: 'OFFLINE', name: 'Offline', description: 'No active services' },
    { id: 'LITE', name: 'Lite', description: 'Basic monitoring only' },
    { id: 'LIVE', name: 'Live', description: 'Full functionality' },
    { id: 'BUILD', name: 'Build', description: 'Development mode' },
    { id: 'DEMO', name: 'Demo', description: 'Safe demonstration' }
  ];

  return {
    type: 'ControlPanel',
    render: () => ({
      title: 'Control Panel',
      sections: [
        {
          type: 'SystemControl',
          actions: [
            { type: 'button', label: 'Start Acey', action: onStart, style: 'primary' },
            { type: 'button', label: 'Stop Acey', action: onStop, style: 'danger' }
          ]
        },
        {
          type: 'OperatingMode',
          currentMode,
          modes: modes.map(mode => ({
            id: mode.id,
            name: mode.name,
            description: mode.description,
            action: () => onModeChange(mode.id)
          }))
        }
      ]
    })
  };
};

// Demo Control Component
const DemoControl = ({ onStartDemo, onStopDemo, demoStatus, availableDemos }) => {
  return {
    type: 'DemoControl',
    render: () => ({
      title: 'Demo Control',
      sections: [
        {
          type: 'AvailableDemos',
          demos: availableDemos.map(demo => ({
            id: demo.id,
            name: demo.name,
            description: demo.description,
            duration: demo.duration
          }))
        },
        {
          type: 'DemoStatus',
          status: demoStatus.status || 'Idle',
          progress: demoStatus.progress || '0%',
          currentStep: demoStatus.currentStep || 'None'
        },
        {
          type: 'DemoActions',
          actions: [
            { type: 'button', label: 'Start Demo', action: onStartDemo, style: 'primary' },
            { type: 'button', label: 'Stop Demo', action: onStopDemo, style: 'danger' }
          ]
        }
      ]
    })
  };
};

// Logs Screen Component
const LogsScreen = ({ logs, onRefresh, onClear }) => {
  return {
    type: 'LogsScreen',
    render: () => ({
      title: 'System Logs',
      sections: [
        {
          type: 'LogFilters',
          filters: ['all', 'error', 'warn', 'info', 'debug']
        },
        {
          type: 'LogEntries',
          logs: logs.map(log => ({
            timestamp: log.timestamp,
            level: log.level,
            message: log.message
          }))
        },
        {
          type: 'LogActions',
          actions: [
            { type: 'button', label: 'Refresh', action: onRefresh },
            { type: 'button', label: 'Clear', action: onClear, style: 'danger' }
          ]
        }
      ]
    })
  };
};

// Mobile API Controller
class MobileAPIController {
  constructor() {
    this.endpoints = {
      start: '/api/acey/start',
      stop: '/api/acey/stop',
      status: '/api/acey/status',
      mode: '/api/acey/mode',
      demo: '/api/acey/demo',
      logs: '/api/acey/logs'
    };
  }

  async makeRequest(endpoint, data = {}) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify(data)
      });
      
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: `API request failed: ${error.message}`
      };
    }
  }

  async startSystem() {
    return this.makeRequest(this.endpoints.start);
  }

  async stopSystem() {
    return this.makeRequest(this.endpoints.stop);
  }

  async getStatus() {
    return this.makeRequest(this.endpoints.status);
  }

  async setMode(mode) {
    return this.makeRequest(this.endpoints.mode, { mode });
  }

  async startDemo(demoId) {
    return this.makeRequest(this.endpoints.demo, { action: 'start', demoId });
  }

  async stopDemo() {
    return this.makeRequest(this.endpoints.demo, { action: 'stop' });
  }

  async getLogs(filter = 'all') {
    return this.makeRequest(this.endpoints.logs, { filter });
  }

  getAuthToken() {
    // In real implementation, this would retrieve stored auth token
    return 'demo_token';
  }
}

// Mobile Navigation Structure
const MobileNavigation = {
  tabs: [
    {
      id: 'status',
      name: 'Status',
      icon: 'dashboard',
      component: 'StatusScreen'
    },
    {
      id: 'control',
      name: 'Control',
      icon: 'settings',
      component: 'ControlPanel'
    },
    {
      id: 'demo',
      name: 'Demo',
      icon: 'play-circle',
      component: 'DemoControl'
    },
    {
      id: 'logs',
      name: 'Logs',
      icon: 'document-text',
      component: 'LogsScreen'
    }
  ]
};

module.exports = {
  StatusScreen,
  ControlPanel,
  DemoControl,
  LogsScreen,
  MobileAPIController,
  MobileNavigation
};
