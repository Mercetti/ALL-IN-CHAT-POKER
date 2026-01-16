/**
 * Acey Mobile Service Control
 * Mobile app service for controlling Acey background service
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance } from 'axios';

// Service configuration
const SERVICE_CONFIG = {
  // Local network configuration
  localIP: '192.168.1.100', // Default - user should configure
  port: 8080,
  apiKey: 'default-key-change-me',
  
  // timeouts
  timeout: 10000,
  retryAttempts: 3,
  
  // storage keys
  STORAGE_KEYS: {
    SERVICE_IP: 'acey_service_ip',
    API_KEY: 'acey_api_key',
    DEVICE_ID: 'acey_device_id',
    LAST_STATUS: 'acey_last_status'
  }
};

export interface AceyServiceStatus {
  active: boolean;
  uptime: number;
  resources: {
    cpu: number;
    memory: number;
    memoryUsed: number;
    memoryTotal: number;
    nodeMemory: number;
  };
  skills: {
    active: number;
    list: string[];
  };
  llmConnections: {
    active: number;
    list: string[];
  };
  lastActivity?: string;
  autoPauseEnabled: boolean;
}

export interface ServiceResponse {
  status: string;
  message: string;
  uptime?: number;
  skillsActive?: number;
  llmConnections?: number;
  skillsStopped?: number;
  logsSaved?: boolean;
  error?: string;
}

class AceyServiceService {
  private api!: AxiosInstance;
  private deviceId: string;
  private isConfigured: boolean = false;

  constructor() {
    this.deviceId = this.generateDeviceId();
    this.initializeApi();
    this.loadConfiguration();
  }

  // Generate unique device ID
  private generateDeviceId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    return `device-${timestamp}-${random}`;
  }

  // Initialize API client
  private initializeApi() {
    this.api = axios.create({
      timeout: SERVICE_CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json',
        'x-device-id': this.deviceId
      }
    });

    // Request interceptor to add API key
    this.api.interceptors.request.use(async (config) => {
      const apiKey = await this.getApiKey();
      if (apiKey) {
        config.headers['x-api-key'] = apiKey;
      }
      return config;
    });
  }

  // Load configuration from storage
  private async loadConfiguration() {
    try {
      const serviceIP = await AsyncStorage.getItem(SERVICE_CONFIG.STORAGE_KEYS.SERVICE_IP);
      const apiKey = await AsyncStorage.getItem(SERVICE_CONFIG.STORAGE_KEYS.API_KEY);

      if (serviceIP && apiKey) {
        this.api.defaults.baseURL = `http://${serviceIP}:${SERVICE_CONFIG.port}`;
        this.isConfigured = true;
        console.log('✅ Acey Service configuration loaded');
      } else {
        console.log('⚠️ Acey Service not configured');
      }
    } catch (error) {
      console.error('❌ Failed to load configuration:', error);
    }
  }

  // Get API key from storage
  private async getApiKey(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(SERVICE_CONFIG.STORAGE_KEYS.API_KEY);
    } catch (error) {
      console.error('❌ Failed to get API key:', error);
      return null;
    }
  }

  // Configure service connection
  async configureService(serviceIP: string, apiKey: string): Promise<boolean> {
    try {
      // Test connection
      const testUrl = `http://${serviceIP}:${SERVICE_CONFIG.port}/api/acey/status`;
      const response = await axios.get(testUrl, {
        headers: {
          'x-api-key': apiKey,
          'x-device-id': this.deviceId
        },
        timeout: 5000
      });

      if (response.status === 200) {
        // Save configuration
        await AsyncStorage.setItem(SERVICE_CONFIG.STORAGE_KEYS.SERVICE_IP, serviceIP);
        await AsyncStorage.setItem(SERVICE_CONFIG.STORAGE_KEYS.API_KEY, apiKey);
        await AsyncStorage.setItem(SERVICE_CONFIG.STORAGE_KEYS.DEVICE_ID, this.deviceId);

        // Update API client
        this.api.defaults.baseURL = `http://${serviceIP}:${SERVICE_CONFIG.port}`;
        this.isConfigured = true;

        console.log('✅ Acey Service configured successfully');
        return true;
      } else {
        throw new Error('Invalid response from service');
      }
    } catch (error) {
      console.error('❌ Failed to configure service:', error);
      return false;
    }
  }

  // Start Acey service
  async startAcey(): Promise<ServiceResponse> {
    if (!this.isConfigured) {
      throw new Error('Service not configured. Please configure service connection first.');
    }

    try {
      const response = await this.api.post<ServiceResponse>('/api/acey/start');
      
      // Cache status
      await AsyncStorage.setItem(SERVICE_CONFIG.STORAGE_KEYS.LAST_STATUS, JSON.stringify({
        active: true,
        timestamp: Date.now()
      }));

      console.log('✅ Acey service started');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to start Acey:', error);
      throw this.handleError(error);
    }
  }

  // Stop Acey service
  async stopAcey(): Promise<ServiceResponse> {
    if (!this.isConfigured) {
      throw new Error('Service not configured. Please configure service connection first.');
    }

    try {
      const response = await this.api.post<ServiceResponse>('/api/acey/stop');
      
      // Cache status
      await AsyncStorage.setItem(SERVICE_CONFIG.STORAGE_KEYS.LAST_STATUS, JSON.stringify({
        active: false,
        timestamp: Date.now()
      }));

      console.log('✅ Acey service stopped');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to stop Acey:', error);
      throw this.handleError(error);
    }
  }

  // Get service status
  async getStatus(): Promise<AceyServiceStatus> {
    if (!this.isConfigured) {
      throw new Error('Service not configured. Please configure service connection first.');
    }

    try {
      const response = await this.api.get<AceyServiceStatus>('/api/acey/status');
      
      // Cache status
      await AsyncStorage.setItem(SERVICE_CONFIG.STORAGE_KEYS.LAST_STATUS, JSON.stringify({
        active: response.data.active,
        timestamp: Date.now()
      }));

      return response.data;
    } catch (error) {
      console.error('❌ Failed to get status:', error);
      throw this.handleError(error);
    }
  }

  // Get cached status (for offline mode)
  async getCachedStatus(): Promise<AceyServiceStatus | null> {
    try {
      const cached = await AsyncStorage.getItem(SERVICE_CONFIG.STORAGE_KEYS.LAST_STATUS);
      if (cached) {
        const parsed = JSON.parse(cached);
        return {
          active: parsed.active || false,
          uptime: 0,
          resources: {
            cpu: 0,
            memory: 0,
            memoryUsed: 0,
            memoryTotal: 0,
            nodeMemory: 0
          },
          skills: {
            active: 0,
            list: []
          },
          llmConnections: {
            active: 0,
            list: []
          },
          lastActivity: parsed.timestamp ? new Date(parsed.timestamp).toISOString() : undefined,
          autoPauseEnabled: false
        };
      }
      return null;
    } catch (error) {
      console.error('❌ Failed to get cached status:', error);
      return null;
    }
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    if (!this.isConfigured) {
      return false;
    }

    try {
      const response = await this.api.get('/api/acey/status', { timeout: 3000 });
      return response.status === 200;
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      return false;
    }
  }

  // Toggle Acey service
  async toggleAcey(): Promise<ServiceResponse> {
    const status = await this.getStatus();
    
    if (status.active) {
      return await this.stopAcey();
    } else {
      return await this.startAcey();
    }
  }

  // Add this device as trusted
  async authorizeDevice(deviceName?: string): Promise<boolean> {
    if (!this.isConfigured) {
      throw new Error('Service not configured. Please configure service connection first.');
    }

    try {
      const response = await this.api.post('/api/acey/add-device', {
        deviceId: this.deviceId,
        deviceName: deviceName || `Mobile Device (${this.deviceId})`
      });

      return response.data.status === 'added';
    } catch (error) {
      console.error('❌ Failed to authorize device:', error);
      throw this.handleError(error);
    }
  }

  // Handle API errors
  private handleError(error: any): Error {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const message = error.response.data?.message || error.response.data?.error || 'Unknown error';
      
      switch (status) {
        case 401:
          return new Error('Invalid API key. Please check your configuration.');
        case 403:
          return new Error('Device not authorized. Please authorize this device first.');
        case 404:
          return new Error('Service endpoint not found. Is the service running?');
        case 500:
          return new Error('Service error: ' + message);
        default:
          return new Error(`Service error (${status}): ${message}`);
      }
    } else if (error.request) {
      // Network error
      return new Error('Network error. Please check your connection and service IP.');
    } else {
      // Other error
      return new Error('Unexpected error: ' + error.message);
    }
  }

  // Get configuration status
  isServiceConfigured(): boolean {
    return this.isConfigured;
  }

  // Get device ID
  getDeviceId(): string {
    return this.deviceId;
  }

  // Format uptime for display
  static formatUptime(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${minutes}m ${secs}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  }

  // Format memory usage
  static formatMemory(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes}B`;
    } else if (bytes < 1024 * 1024) {
      return `${Math.round(bytes / 1024)}KB`;
    } else {
      return `${Math.round(bytes / 1024 / 1024)}MB`;
    }
  }
}

// Export class and instance
export { AceyServiceService };
export default new AceyServiceService();
