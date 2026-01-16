import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance } from 'axios';
import { EventEmitter } from 'events';

// API Configuration
const API_BASE_URL = Platform.OS === 'ios' ? 
  'http://localhost:8080' : 
  'http://10.0.2.2:8080';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('authToken');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Mesh types
export interface AceyInstance {
  id: string;
  name: string;
  endpoint: string;
  status: 'online' | 'offline' | 'syncing';
  lastSync: string;
  capabilities: string[];
  trustScore: number;
  version: string;
  metadata?: any;
}

export interface MeshMessage {
  id: string;
  from: string;
  to: string | 'broadcast';
  type: 'sync' | 'skill_update' | 'security_alert' | 'dataset_share' | 'heartbeat';
  payload: any;
  timestamp: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  encrypted: boolean;
  signature?: string;
}

export interface SyncOperation {
  id: string;
  type: 'full' | 'incremental' | 'skill' | 'dataset' | 'security';
  source: string;
  target: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  startTime: string;
  endTime?: string;
  error?: string;
}

export interface MeshMetrics {
  totalInstances: number;
  onlineInstances: number;
  messagesExchanged: number;
  syncOperations: number;
  averageLatency: number;
  dataTransferred: number;
  lastSyncTime: string;
}

// WebSocket connection for real-time mesh updates
class MeshWebSocket extends EventEmitter {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;

  connect(endpoint: string): void {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;
    console.log('Connecting to mesh WebSocket:', endpoint);

    try {
      this.ws = new WebSocket(endpoint);

      this.ws.onopen = () => {
        console.log('Mesh WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.emit('connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.emit('message', message);
        } catch (error) {
          console.error('Failed to parse mesh message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('Mesh WebSocket disconnected');
        this.ws = null;
        this.emit('disconnected');
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('Mesh WebSocket error:', error);
        this.emit('error', error);
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.isConnecting = false;
      this.attemptReconnect();
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, message not sent');
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      const wsUrl = this.ws?.url || 'ws://localhost:8080/mesh/ws';
      this.connect(wsUrl);
    }, delay);
  }
}

// Multi-Instance Mesh Service
class MultiInstanceMeshService extends EventEmitter {
  private static instance: MultiInstanceMeshService;
  private ws: MeshWebSocket;
  private instances: Map<string, AceyInstance> = new Map();
  private messages: MeshMessage[] = [];
  private syncOperations: Map<string, SyncOperation> = new Map();
  private isCoordinator = false;
  private coordinatorId?: string;
  private heartbeatInterval?: NodeJS.Timeout;

  static getInstance(): MultiInstanceMeshService {
    if (!MultiInstanceMeshService.instance) {
      MultiInstanceMeshService.instance = new MultiInstanceMeshService();
    }
    return MultiInstanceMeshService.instance;
  }

  constructor() {
    super();
    this.ws = new MeshWebSocket();
    this.setupWebSocketHandlers();
  }

  // Initialize the mesh service
  async initialize(): Promise<void> {
    try {
      // Check if this instance is a coordinator
      const userId = await AsyncStorage.getItem('userId');
      const userRole = await AsyncStorage.getItem('userRole');
      
      this.isCoordinator = userRole === 'owner';
      
      if (this.isCoordinator) {
        this.coordinatorId = userId || undefined;
        await this.startCoordinatorServices();
      }

      // Connect to mesh WebSocket
      const wsEndpoint = `${API_BASE_URL.replace('http', 'ws')}/mesh/ws`;
      this.ws.connect(wsEndpoint);

      // Load existing instances
      await this.loadInstances();

      console.log('Multi-instance mesh service initialized');
    } catch (error) {
      console.error('Failed to initialize mesh service:', error);
      throw error;
    }
  }

  // Setup WebSocket event handlers
  private setupWebSocketHandlers(): void {
    this.ws.on('connected', () => {
      console.log('Connected to mesh network');
      this.emit('connected');
    });

    this.ws.on('disconnected', () => {
      console.log('Disconnected from mesh network');
      this.emit('disconnected');
    });

    this.ws.on('message', (message: MeshMessage) => {
      this.handleMeshMessage(message);
    });

    this.ws.on('error', (error: any) => {
      console.error('Mesh WebSocket error:', error);
      this.emit('error', error);
    });
  }

  // Handle incoming mesh messages
  private handleMeshMessage(message: MeshMessage): void {
    console.log('Received mesh message:', message.type);

    switch (message.type) {
      case 'heartbeat':
        this.handleHeartbeat(message);
        break;
      case 'sync':
        this.handleSyncMessage(message);
        break;
      case 'skill_update':
        this.handleSkillUpdate(message);
        break;
      case 'security_alert':
        this.handleSecurityAlert(message);
        break;
      case 'dataset_share':
        this.handleDatasetShare(message);
        break;
      default:
        console.log('Unknown mesh message type:', message.type);
    }

    this.emit('message', message);
  }

  // Handle heartbeat messages
  private handleHeartbeat(message: MeshMessage): void {
    const instance = message.payload.instance;
    if (instance) {
      this.instances.set(instance.id, {
        ...instance,
        lastSync: new Date().toISOString(),
        status: 'online'
      });
    }
  }

  // Handle sync messages
  private handleSyncMessage(message: MeshMessage): void {
    const { action, instanceId } = message.payload;
    
    switch (action) {
      case 'instance_removed':
        const instance = this.instances.get(instanceId);
        if (instance) {
          instance.status = 'offline';
        }
        break;
      default:
        console.log('Unknown sync action:', action);
    }
  }

  // Handle skill update messages
  private handleSkillUpdate(message: MeshMessage): void {
    console.log('Skill update received:', message.payload);
    this.emit('skill_update', message.payload);
  }

  // Handle security alert messages
  private handleSecurityAlert(message: MeshMessage): void {
    console.log('Security alert received:', message.payload);
    this.emit('security_alert', message.payload);
  }

  // Handle dataset share messages
  private handleDatasetShare(message: MeshMessage): void {
    console.log('Dataset share received:', message.payload);
    this.emit('dataset_share', message.payload);
  }

  // Register a new instance
  async registerInstance(instance: Omit<AceyInstance, 'lastSync'>): Promise<void> {
    try {
      const response = await api.post<{ success: boolean; instance: AceyInstance }>('/api/mesh/register', instance);
      
      if (response.data.success) {
        this.instances.set(response.data.instance.id, response.data.instance);
        console.log('Instance registered:', response.data.instance.name);
      }
    } catch (error) {
      console.error('Failed to register instance:', error);
      throw error;
    }
  }

  // Remove an instance
  async removeInstance(instanceId: string): Promise<void> {
    try {
      await api.delete(`/api/mesh/instances/${instanceId}`);
      
      const instance = this.instances.get(instanceId);
      if (instance) {
        instance.status = 'offline';
        console.log('Instance removed:', instance.name);
      }
    } catch (error) {
      console.error('Failed to remove instance:', error);
      throw error;
    }
  }

  // Send message to mesh
  async sendMessage(message: Omit<MeshMessage, 'id' | 'timestamp' | 'encrypted' | 'signature'>): Promise<void> {
    try {
      const fullMessage: MeshMessage = {
        ...message,
        id: this.generateMessageId(),
        timestamp: new Date().toISOString(),
        encrypted: true,
        signature: this.signMessage(message)
      };

      await api.post('/api/mesh/message', fullMessage);
      this.messages.push(fullMessage);

      console.log('Message sent:', message.type);
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  // Initiate sync operation
  async initiateSync(targetInstanceId: string, syncType: SyncOperation['type']): Promise<string> {
    try {
      const response = await api.post<{ success: boolean; syncId: string }>('/api/mesh/sync', {
        targetInstanceId,
        syncType,
        source: this.coordinatorId || 'self'
      });

      if (response.data.success) {
        const syncOperation: SyncOperation = {
          id: response.data.syncId,
          type: syncType,
          source: this.coordinatorId || 'self',
          target: targetInstanceId,
          status: 'pending',
          progress: 0,
          startTime: new Date().toISOString()
        };

        this.syncOperations.set(response.data.syncId, syncOperation);
        console.log('Sync initiated:', response.data.syncId);
        
        return response.data.syncId;
      }

      throw new Error('Sync initiation failed');
    } catch (error) {
      console.error('Failed to initiate sync:', error);
      throw error;
    }
  }

  // Share dataset with mesh
  async shareDataset(datasetEntries: any[], targetInstanceId?: string): Promise<void> {
    try {
      await this.sendMessage({
        from: this.coordinatorId || 'self',
        to: targetInstanceId || 'broadcast',
        type: 'dataset_share',
        payload: {
          datasetEntries,
          version: Date.now(),
          checksum: this.calculateChecksum(datasetEntries)
        },
        priority: 'medium'
      });

      console.log('Dataset shared:', datasetEntries.length, 'entries');
    } catch (error) {
      console.error('Failed to share dataset:', error);
      throw error;
    }
  }

  // Broadcast security alert
  async broadcastSecurityAlert(alert: any): Promise<void> {
    try {
      await this.sendMessage({
        from: this.coordinatorId || 'self',
        to: 'broadcast',
        type: 'security_alert',
        payload: alert,
        priority: 'critical'
      });

      console.log('Security alert broadcasted:', alert.type);
    } catch (error) {
      console.error('Failed to broadcast security alert:', error);
      throw error;
    }
  }

  // Get mesh metrics
  async getMeshMetrics(): Promise<MeshMetrics> {
    try {
      const response = await api.get<{ success: boolean; metrics: MeshMetrics }>('/api/mesh/metrics');
      return response.data.metrics;
    } catch (error) {
      console.error('Failed to get mesh metrics:', error);
      throw error;
    }
  }

  // Get all instances
  getInstances(): AceyInstance[] {
    return Array.from(this.instances.values());
  }

  // Get active sync operations
  getActiveSyncs(): SyncOperation[] {
    return Array.from(this.syncOperations.values()).filter(s => 
      s.status === 'pending' || s.status === 'in_progress'
    );
  }

  // Start coordinator services
  private async startCoordinatorServices(): Promise<void> {
    if (!this.isCoordinator) return;

    // Start heartbeat monitoring
    this.heartbeatInterval = setInterval(() => {
      this.checkInstanceHealth();
    }, 30000); // Every 30 seconds

    console.log('Coordinator services started');
  }

  // Check instance health
  private checkInstanceHealth(): void {
    const now = Date.now();
    const timeout = 60000; // 1 minute timeout

    for (const [id, instance] of this.instances.entries()) {
      const lastSyncTime = new Date(instance.lastSync).getTime();
      
      if (now - lastSyncTime > timeout) {
        instance.status = 'offline';
        console.warn('Instance health check failed:', instance.name);
        this.emit('instance_offline', instance);
      }
    }
  }

  // Load existing instances
  private async loadInstances(): Promise<void> {
    try {
      const response = await api.get<{ success: boolean; instances: AceyInstance[] }>('/api/mesh/instances');
      
      if (response.data.success) {
        response.data.instances.forEach(instance => {
          this.instances.set(instance.id, instance);
        });
        
        console.log('Loaded', response.data.instances.length, 'instances');
      }
    } catch (error) {
      console.error('Failed to load instances:', error);
    }
  }

  // Helper methods
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private signMessage(message: any): string {
    // Simplified signature implementation
    return `sig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateChecksum(data: any): string {
    // Simple checksum implementation
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  // Cleanup
  destroy(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    this.ws.disconnect();
    this.instances.clear();
    this.messages = [];
    this.syncOperations.clear();
    
    console.log('Multi-instance mesh service destroyed');
  }
}

// Export the singleton instance
export default MultiInstanceMeshService.getInstance();
