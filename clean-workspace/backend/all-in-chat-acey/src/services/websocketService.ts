import { WebSocketServer, WebSocket } from 'ws';
import { Server as HTTPServer } from 'http';
import { Logger } from '../utils/logger';

export interface MeshMessage {
  id: string;
  from: string;
  to: string;
  type: string;
  payload: any;
  priority: 'low' | 'medium' | 'high';
  timestamp: Date;
  encrypted: boolean;
  signature: string;
}

export interface AceyInstance {
  id: string;
  name: string;
  endpoint: string;
  status: string;
  capabilities: any;
  trustScore: number;
  version: string;
  metadata: any;
  lastSync: Date;
  createdAt: Date;
}

export interface WSClient {
  id: string;
  ws: WebSocket;
  userId?: string;
  instanceId?: string;
  lastPing: Date;
  isAuthenticated: boolean;
  role?: 'owner' | 'dev' | 'streamer' | 'user' | 'partner' | 'investor';
}

export interface WSMessage {
  type: 'auth' | 'mesh_message' | 'heartbeat' | 'skill_update' | 'security_alert' | 'system_status';
  data: any;
  timestamp: Date;
  messageId: string;
}

export class WebSocketService {
  private static instance: WebSocketService;
  private wss!: WebSocketServer;
  private clients: Map<string, WSClient> = new Map();
  private logger: Logger;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.logger = new Logger();
  }

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  public initialize(server: HTTPServer): void {
    try {
      this.wss = new WebSocketServer({ 
        server,
        path: '/mesh/ws',
        clientTracking: true,
        verifyClient: this.verifyClient.bind(this),
      });

      this.wss.on('connection', this.handleConnection.bind(this));
      this.wss.on('error', this.handleError.bind(this));
      
      this.startHeartbeat();
      this.logger.log('WebSocket server initialized on /mesh/ws');
    } catch (error) {
      this.logger.error('Failed to initialize WebSocket server:', error);
      throw error;
    }
  }

  private verifyClient(info: {
    origin: string;
    secure: boolean;
    req: any;
  }): boolean {
    // Allow connections from authorized origins
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://acey-control-center.com',
      'https://all-in-chat-poker.fly.dev',
    ];

    const origin = info.origin.toLowerCase();
    const isAllowed = allowedOrigins.some(allowed => origin.includes(allowed));

    if (!isAllowed) {
      this.logger.warn(`WebSocket connection rejected from origin: ${origin}`);
    }

    return isAllowed;
  }

  private async handleConnection(ws: WebSocket, req: any): Promise<void> {
    const clientId = this.generateClientId();
    const client: WSClient = {
      id: clientId,
      ws,
      lastPing: new Date(),
      isAuthenticated: false,
    };

    this.clients.set(clientId, client);
    this.logger.log(`WebSocket client connected: ${clientId}`);

    // Send welcome message
    this.sendToClient(clientId, {
      type: 'system_status',
      data: {
        status: 'connected',
        clientId,
        serverTime: new Date().toISOString(),
      },
      timestamp: new Date(),
      messageId: this.generateMessageId(),
    });

    // Handle messages from this client
    ws.on('message', (data: string) => {
      this.handleMessage(clientId, data);
    });

    // Handle client disconnect
    ws.on('close', (code: number, reason: string) => {
      this.handleDisconnection(clientId, code, reason);
    });

    // Handle ping/pong for connection health
    ws.on('pong', () => {
      client.lastPing = new Date();
    });
  }

  private async handleMessage(clientId: string, data: string): Promise<void> {
    try {
      const message: WSMessage = JSON.parse(data);
      const client = this.clients.get(clientId);

      if (!client) {
        this.logger.error(`Message from unknown client: ${clientId}`);
        return;
      }

      switch (message.type) {
        case 'auth':
          await this.handleAuthentication(client, message.data);
          break;

        case 'mesh_message':
          await this.handleMeshMessage(client, message.data);
          break;

        case 'heartbeat':
          client.lastPing = new Date();
          this.sendToClient(clientId, {
            type: 'heartbeat',
            data: { timestamp: new Date().toISOString() },
            timestamp: new Date(),
            messageId: this.generateMessageId(),
          });
          break;

        default:
          this.logger.warn(`Unknown message type: ${message.type} from client: ${clientId}`);
      }
    } catch (error) {
      this.logger.error(`Failed to handle message from client: ${clientId}`, error);
    }
  }

  private async handleAuthentication(client: WSClient, authData: any): Promise<void> {
    try {
      const { token, userId, role } = authData;

      // Validate token (this would integrate with your auth service)
      const isValidToken = await this.validateToken(token);
      
      if (isValidToken) {
        client.userId = userId;
        client.role = role;
        client.isAuthenticated = true;

        this.sendToClient(client.id, {
          type: 'auth',
          data: { 
            success: true, 
            userId, 
            role,
            permissions: await this.getUserPermissions(userId, role),
          },
          timestamp: new Date(),
          messageId: this.generateMessageId(),
        });

        this.logger.log(`Client authenticated: ${client.id} (User: ${userId}, Role: ${role})`);
      } else {
        this.sendToClient(client.id, {
          type: 'auth',
          data: { success: false, error: 'Invalid token' },
          timestamp: new Date(),
          messageId: this.generateMessageId(),
        });

        this.logger.warn(`Authentication failed for client: ${client.id}`);
      }
    } catch (error) {
      this.logger.error(`Authentication error for client: ${client.id}`, error);
    }
  }

  private async handleMeshMessage(client: WSClient, messageData: any): Promise<void> {
    if (!client.isAuthenticated) {
      this.sendToClient(client.id, {
        type: 'system_status',
        data: { error: 'Authentication required' },
        timestamp: new Date(),
        messageId: this.generateMessageId(),
      });
      return;
    }

    try {
      const meshMessage: MeshMessage = {
        id: this.generateMessageId(),
        from: client.instanceId || client.userId || 'unknown',
        to: messageData.to || 'broadcast',
        type: messageData.type || 'general',
        payload: messageData.payload,
        priority: messageData.priority || 'medium',
        timestamp: new Date(),
        encrypted: false,
        signature: 'client-signature',
      };

      // Broadcast to all authenticated clients
      this.broadcastToAuthenticated({
        type: 'mesh_message',
        data: meshMessage,
        timestamp: new Date(),
        messageId: this.generateMessageId(),
      }, client.id);

      this.logger.log(`Mesh message broadcast from client: ${client.id}`);
    } catch (error) {
      this.logger.error(`Failed to handle mesh message from client: ${client.id}`, error);
    }
  }

  private handleDisconnection(clientId: string, code: number, reason: string): void {
    const client = this.clients.get(clientId);
    this.clients.delete(clientId);
    
    this.logger.log(`WebSocket client disconnected: ${clientId} (${code}: ${reason})`);

    // Notify other clients about disconnection
    this.broadcastToAuthenticated({
      type: 'system_status',
      data: {
        status: 'client_disconnected',
        clientId,
        code,
        reason,
      },
      timestamp: new Date(),
      messageId: this.generateMessageId(),
    });
  }

  private handleError(error: Error): void {
    this.logger.error('WebSocket server error:', error);
  }

  private sendToClient(clientId: string, message: WSMessage): void {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      client.ws.send(JSON.stringify(message));
    } catch (error) {
      this.logger.error(`Failed to send message to client: ${clientId}`, error);
    }
  }

  private broadcastToAuthenticated(message: WSMessage, excludeClientId?: string): void {
    this.clients.forEach((client, clientId) => {
      if (clientId !== excludeClientId && client.isAuthenticated) {
        this.sendToClient(clientId, message);
      }
    });
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = new Date();
      this.clients.forEach((client, clientId) => {
        // Check for stale connections (no pong for 30 seconds)
        if (now.getTime() - client.lastPing.getTime() > 30000) {
          this.logger.warn(`Terminating stale connection: ${clientId}`);
          client.ws.terminate();
          this.clients.delete(clientId);
        }
      });
    }, 10000); // Check every 10 seconds
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async validateToken(token: string): Promise<boolean> {
    // This would integrate with your actual authentication service
    // For now, basic validation
    return Boolean(token && token.length > 10);
  }

  private async getUserPermissions(userId: string, role: string): Promise<string[]> {
    // This would integrate with your actual permission system
    const basePermissions = ['read_notifications'];
    
    switch (role) {
      case 'owner':
        return [...basePermissions, 'write_all', 'admin_all', 'mesh_manage'];
      case 'dev':
        return [...basePermissions, 'write_skills', 'read_logs'];
      case 'streamer':
        return [...basePermissions, 'execute_skills', 'view_analytics'];
      case 'partner':
        return [...basePermissions, 'view_payouts', 'submit_payouts'];
      case 'investor':
        return [...basePermissions, 'view_analytics', 'view_reports'];
      default:
        return basePermissions;
    }
  }

  public getConnectedClients(): WSClient[] {
    return Array.from(this.clients.values());
  }

  public getAuthenticatedClients(): WSClient[] {
    return Array.from(this.clients.values()).filter(client => client.isAuthenticated);
  }

  public getClientStats(): {
    total: number;
    authenticated: number;
    byRole: Record<string, number>;
  } {
    const clients = Array.from(this.clients.values());
    const authenticated = clients.filter(client => client.isAuthenticated);
    const byRole: Record<string, number> = {};

    clients.forEach(client => {
      if (client.role) {
        byRole[client.role] = (byRole[client.role] || 0) + 1;
      }
    });

    return {
      total: clients.length,
      authenticated: authenticated.length,
      byRole,
    };
  }

  public shutdown(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.clients.forEach((client, clientId) => {
      client.ws.close(1000, 'Server shutdown');
    });

    this.wss.close();
    this.logger.log('WebSocket server shutdown completed');
  }
}

export default WebSocketService.getInstance();
