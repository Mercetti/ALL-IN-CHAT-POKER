/**
 * Acey API Service
 * Handles communication with backend API
 */

import { useError } from '../context/ErrorContext';

const API_BASE_URL = 'http://localhost:8080';

class AceyAPIService {
  static async getSystemStatus() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/acey/status`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      return {
        status: 'error',
        message: 'Unable to connect to backend',
        timestamp: new Date().toISOString()
      };
    }
  }

  static async sendCommand(command, data = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/acey/control`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command,
          data,
          timestamp: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: 'Unable to send command to backend',
        command,
        timestamp: new Date().toISOString()
      };
    }
  }

  static async getSystemMetrics() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/acey/metrics`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      return {
        cpu: 0,
        memory: 0,
        tokens: 0,
        uptime: 0,
        status: 'error'
      };
    }
  }

  static async getSystemLogs(limit = 50) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/acey/logs?limit=${limit}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      return [];
    }
  }

  static async getOperatingMode() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/acey/mode`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      return {
        mode: 'unknown',
        status: 'error'
      };
    }
  }

  static async setOperatingMode(mode) {
    return this.sendCommand('set_mode', { mode });
  }

  static async startSystem() {
    return this.sendCommand('start_system');
  }

  static async stopSystem() {
    return this.sendCommand('stop_system');
  }

  static async restartSystem() {
    return this.sendCommand('restart_system');
  }

  static async emergencyStop() {
    return this.sendCommand('emergency_stop');
  }

  static async getWebSocketUrl() {
    const protocol = API_BASE_URL.startsWith('https') ? 'wss' : 'ws';
    const host = API_BASE_URL.replace(/^https?:\/\//, '');
    return `${protocol}://${host}/acey`;
  }
}

// React Hook for API with error handling
export function useAceyAPI() {
  const { actions } = useError();
  
  const wrappedMethods = {
    getSystemStatus: async () => {
      const result = await AceyAPIService.getSystemStatus();
      if (result.status === 'error') {
        actions.addError('api', result.message);
      }
      return result;
    },
    
    sendCommand: async (command, data = {}) => {
      const result = await AceyAPIService.sendCommand(command, data);
      if (!result.success) {
        actions.addError('api', result.error || 'Command failed');
      }
      return result;
    },
    
    getSystemMetrics: async () => {
      const result = await AceyAPIService.getSystemMetrics();
      if (result.status === 'error') {
        actions.addError('api', 'Metrics fetch failed');
      }
      return result;
    },
    
    getSystemLogs: async (limit = 50) => {
      const result = await AceyAPIService.getSystemLogs(limit);
      if (result.length === 0) {
        actions.addError('api', 'No logs available');
      }
      return result;
    },
    
    getOperatingMode: async () => {
      const result = await AceyAPIService.getOperatingMode();
      if (result.status === 'error') {
        actions.addError('api', 'Failed to get operating mode');
      }
      return result;
    },
    
    setOperatingMode: async (mode) => {
      const result = await AceyAPIService.setOperatingMode(mode);
      if (!result.success) {
        actions.addError('api', result.error || 'Failed to set operating mode');
      }
      return result;
    },
    
    startSystem: async () => {
      const result = await AceyAPIService.startSystem();
      if (!result.success) {
        actions.addError('api', result.error || 'Failed to start system');
      }
      return result;
    },
    
    stopSystem: async () => {
      const result = await AceyAPIService.stopSystem();
      if (!result.success) {
        actions.addError('api', result.error || 'Failed to stop system');
      }
      return result;
    },
    
    restartSystem: async () => {
      const result = await AceyAPIService.restartSystem();
      if (!result.success) {
        actions.addError('api', result.error || 'Failed to restart system');
      }
      return result;
    },
    
    emergencyStop: async () => {
      const result = await AceyAPIService.emergencyStop();
      if (!result.success) {
        actions.addError('api', result.error || 'Failed to emergency stop system');
      }
      return result;
    },
    
    getWebSocketUrl: () => {
      return AceyAPIService.getWebSocketUrl();
    }
  };

  return wrappedMethods;
}

export default AceyAPIService;
