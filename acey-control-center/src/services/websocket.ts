import { getStoredToken } from './api';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
}

export interface WebSocketConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export class WebSocketService {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private reconnectAttempts = 0;
  private maxReconnectAttempts: number;
  private reconnectInterval: number;
  private isConnecting = false;
  private messageHandlers: Map<string, ((data: any) => void)[]> = new Map();
  private connectionHandlers: ((connected: boolean) => void)[] = [];

  constructor(config: WebSocketConfig) {
    this.config = config;
    this.reconnectInterval = config.reconnectInterval || 5000;
    this.maxReconnectAttempts = config.maxReconnectAttempts || 10;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        reject(new Error('Connection already in progress'));
        return;
      }

      this.isConnecting = true;

      try {
        const token = getStoredToken();
        const wsUrl = `${this.config.url}?token=${token}`;
        
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.notifyConnectionHandlers(true);
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('WebSocket message parse error:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.isConnecting = false;
          this.notifyConnectionHandlers(false);
          
          if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnecting = false;
          reject(error);
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnection
  }

  send(message: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, message not sent:', message);
    }
  }

  onMessage(type: string, handler: (data: any) => void): void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)!.push(handler);
  }

  offMessage(type: string, handler: (data: any) => void): void {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  onConnection(handler: (connected: boolean) => void): void {
    this.connectionHandlers.push(handler);
  }

  offConnection(handler: (connected: boolean) => void): void {
    const index = this.connectionHandlers.indexOf(handler);
    if (index > -1) {
      this.connectionHandlers.splice(index, 1);
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  private handleMessage(message: WebSocketMessage): void {
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message.data);
        } catch (error) {
          console.error('Message handler error:', error);
        }
      });
    }
  }

  private notifyConnectionHandlers(connected: boolean): void {
    this.connectionHandlers.forEach(handler => {
      try {
        handler(connected);
      } catch (error) {
        console.error('Connection handler error:', error);
      }
    });
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    
    if (this.reconnectAttempts <= this.maxReconnectAttempts) {
      console.log(`Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      
      setTimeout(() => {
        this.connect().catch(error => {
          console.error('Reconnect failed:', error);
        });
      }, this.reconnectInterval);
    } else {
      console.error('Max reconnect attempts reached');
    }
  }
}

// Singleton instance
let wsService: WebSocketService | null = null;

export function getWebSocketService(config?: WebSocketConfig): WebSocketService {
  if (!wsService) {
    if (!config) {
      throw new Error('WebSocket config required for first initialization');
    }
    wsService = new WebSocketService(config);
  }
  return wsService;
}

export default {
  WebSocketService,
  getWebSocketService,
};
