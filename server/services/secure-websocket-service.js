/**
 * Secure WebSocket Service
 * Fixed version with role-based message routing and proper origin validation
 */

const BaseService = require('./base-service');
const { AceyWebSocketEnhanced } = require('../acey-websocket-enhanced');
const Logger = require('../utils/logger');

class SecureWebSocketService extends BaseService {
  constructor(options = {}) {
    super('secure-websocket-service', options);
    
    this.options = {
      ...this.options,
      port: options.port || 8082,
      path: options.path || '/acey-enhanced',
      enableBatching: options.enableBatching !== false,
      enableCompression: options.enableCompression !== false,
      enableMetrics: options.enableMetrics !== false,
      maxConnections: options.maxConnections || 500,
      heartbeatInterval: options.heartbeatInterval || 30000,
      allowedOrigins: options.allowedOrigins || [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://localhost:8080',
        'https://all-in-chat-poker.fly.dev'
      ]
    };
    
    this.wsServer = null;
    this.connectionStats = {
      totalConnections: 0,
      activeConnections: 0,
      totalMessages: 0,
      totalBatches: 0,
      averageMessageSize: 0,
      messageTypes: {},
      errors: []
    };
    
    // Client management with roles
    this.clients = new Map(); // Map<clientId, {ws, role, sessionId, userId, permissions}>
    this.roleBasedGroups = new Map(); // Map<role, Set<clientId>>
    this.sessionClients = new Map(); // Map<sessionId, Set<clientId>>
  }

  /**
   * Start WebSocket service
   */
  async onStart() {
    try {
      // Create WebSocket server
      this.wsServer = new AceyWebSocketEnhanced({
        port: this.options.port,
        path: this.options.path,
        enableBatching: this.options.enableBatching,
        enableCompression: this.options.enableCompression,
        enableMetrics: this.options.enableMetrics,
        maxConnections: this.options.maxConnections,
        heartbeatInterval: this.options.heartbeatInterval
      });
      
      // Set up event listeners
      this.setupWebSocketListeners();
      
      // Start server
      this.wsServer.start();
      
      this.logger.info('Secure WebSocket service started', {
        port: this.options.port,
        path: this.options.path,
        allowedOrigins: this.options.allowedOrigins
      });
      
    } catch (error) {
      this.logger.error('Failed to start secure WebSocket service', { error: error.message });
      throw error;
    }
  }

  /**
   * Stop WebSocket service
   */
  async onStop() {
    try {
      if (this.wsServer) {
        this.wsServer.close();
        this.wsServer = null;
      }
      
      this.logger.info('Secure WebSocket service stopped');
      
    } catch (error) {
      this.logger.error('Failed to stop secure WebSocket service', { error: error.message });
      throw error;
    }
  }

  /**
   * Set up WebSocket event listeners
   */
  setupWebSocketListeners() {
    this.wsServer.on('connection', (clientInfo) => {
      this.handleConnection(clientInfo);
    });
    
    this.wsServer.on('message', ({ client, message }) => {
      this.handleMessage(client, message);
    });
    
    this.wsServer.on('disconnection', ({ client, code, reason }) => {
      this.handleDisconnection(client, code, reason);
    });
    
    this.wsServer.on('error', (error) => {
      this.handleError(error);
    });
  }

  /**
   * Validate origin with strict matching
   */
  validateOrigin(origin) {
    if (!origin) return false;
    
    // Use exact string matching instead of .includes()
    return this.options.allowedOrigins.some(allowed => allowed === origin);
  }

  /**
   * Handle new WebSocket connection with role verification
   */
  handleConnection(clientInfo) {
    // Validate origin
    if (!this.validateOrigin(clientInfo.origin)) {
      this.logger.warn('Connection rejected: invalid origin', {
        origin: clientInfo.origin,
        ip: clientInfo.ip
      });
      clientInfo.ws.close(1008, 'Invalid origin');
      return;
    }

    // Extract role from auth token or query params
    const role = this.extractRoleFromClient(clientInfo);
    const userId = this.extractUserIdFromClient(clientInfo);
    const sessionId = clientInfo.sessionId || 'default';

    // Register client with role
    const clientData = {
      ws: clientInfo.ws,
      role,
      userId,
      sessionId,
      permissions: this.getPermissionsForRole(role),
      connectedAt: Date.now(),
      messageCount: 0
    };

    this.clients.set(clientInfo.id, clientData);
    
    // Add to role-based groups
    if (!this.roleBasedGroups.has(role)) {
      this.roleBasedGroups.set(role, new Set());
    }
    this.roleBasedGroups.get(role).add(clientInfo.id);
    
    // Add to session groups
    if (!this.sessionClients.has(sessionId)) {
      this.sessionClients.set(sessionId, new Set());
    }
    this.sessionClients.get(sessionId).add(clientInfo.id);

    this.connectionStats.totalConnections++;
    this.connectionStats.activeConnections++;
    
    this.logger.info('Secure WebSocket client connected', {
      clientId: clientInfo.id,
      role,
      userId,
      sessionId,
      ip: clientInfo.ip,
      origin: clientInfo.origin
    });
    
    // Send connection confirmation
    this.sendToClient(clientInfo.id, {
      type: 'connected',
      data: { 
        clientId: clientInfo.id,
        role,
        permissions: clientData.permissions
      },
      timestamp: Date.now()
    });
  }

  /**
   * Extract role from client information
   */
  extractRoleFromClient(clientInfo) {
    // Try to extract role from auth token, query params, or default to 'viewer'
    if (clientInfo.auth && clientInfo.auth.role) {
      return clientInfo.auth.role;
    }
    
    if (clientInfo.query && clientInfo.query.role) {
      const validRoles = ['owner', 'admin', 'partner', 'investor', 'developer', 'viewer'];
      return validRoles.includes(clientInfo.query.role) ? clientInfo.query.role : 'viewer';
    }
    
    return 'viewer'; // Default role with minimal permissions
  }

  /**
   * Extract user ID from client information
   */
  extractUserIdFromClient(clientInfo) {
    if (clientInfo.auth && clientInfo.auth.userId) {
      return clientInfo.auth.userId;
    }
    
    if (clientInfo.query && clientInfo.query.userId) {
      return clientInfo.query.userId;
    }
    
    return `anon_${clientInfo.id}`;
  }

  /**
   * Get permissions for role
   */
  getPermissionsForRole(role) {
    const permissions = {
      owner: ['read', 'write', 'admin', 'financial', 'system'],
      admin: ['read', 'write', 'admin'],
      partner: ['read', 'write', 'financial'],
      investor: ['read', 'financial'],
      developer: ['read', 'write', 'system'],
      viewer: ['read']
    };
    
    return permissions[role] || permissions.viewer;
  }

  /**
   * Handle WebSocket message with role-based routing
   */
  handleMessage(clientInfo, message) {
    const clientData = this.clients.get(clientInfo.id);
    if (!clientData) return;

    this.connectionStats.totalMessages++;
    clientData.messageCount++;
    
    // Track message types
    const messageType = message.type || 'unknown';
    this.connectionStats.messageTypes[messageType] = 
      (this.connectionStats.messageTypes[messageType] || 0) + 1;
    
    // Validate permissions for message type
    if (!this.validateMessagePermissions(clientData, message)) {
      this.logger.warn('Message rejected: insufficient permissions', {
        clientId: clientInfo.id,
        role: clientData.role,
        messageType,
        requiredPermissions: this.getRequiredPermissions(messageType)
      });
      
      this.sendToClient(clientInfo.id, {
        type: 'error',
        data: {
          message: 'Insufficient permissions for this message type',
          code: 'PERMISSION_DENIED'
        },
        timestamp: Date.now()
      });
      return;
    }

    // Handle mesh messages with proper routing
    if (message.type === 'mesh' && message.to) {
      this.handleMeshMessage(clientInfo, message);
      return;
    }

    this.logger.debug('WebSocket message received', {
      clientId: clientInfo.id,
      role: clientData.role,
      type: messageType
    });
    
    this.emit('message', { client: clientInfo, message });
  }

  /**
   * Handle mesh messages with role-based routing
   */
  handleMeshMessage(senderClientInfo, message) {
    const { to, from, type, data } = message;
    const senderData = this.clients.get(senderClientInfo.id);

    // Validate sender has permission to send this type of message
    if (!this.validateMeshMessagePermissions(senderData, message)) {
      this.logger.warn('Mesh message rejected: insufficient permissions', {
        senderId: senderClientInfo.id,
        senderRole: senderData.role,
        messageType: type,
        targetRole: to
      });
      return;
    }

    // Route message based on 'to' field
    if (to.startsWith('role:')) {
      // Send to all clients with specific role
      const targetRole = to.replace('role:', '');
      this.sendToRole(targetRole, {
        type,
        data,
        from: senderData.userId,
        timestamp: Date.now()
      });
      
      this.logger.info('Mesh message routed to role', {
        senderId: senderClientInfo.id,
        senderRole: senderData.role,
        targetRole,
        messageType: type
      });
      
    } else if (to.startsWith('user:')) {
      // Send to specific user
      const targetUserId = to.replace('user:', '');
      this.sendToUser(targetUserId, {
        type,
        data,
        from: senderData.userId,
        timestamp: Date.now()
      });
      
      this.logger.info('Mesh message routed to user', {
        senderId: senderClientInfo.id,
        targetUserId,
        messageType: type
      });
      
    } else if (to.startsWith('session:')) {
      // Send to specific session
      const targetSessionId = to.replace('session:', '');
      this.sendToSession(targetSessionId, {
        type,
        data,
        from: senderData.userId,
        timestamp: Date.now()
      });
      
      this.logger.info('Mesh message routed to session', {
        senderId: senderClientInfo.id,
        targetSessionId,
        messageType: type
      });
      
    } else {
      this.logger.warn('Invalid mesh message target', {
        senderId: senderClientInfo.id,
        target: to
      });
    }
  }

  /**
   * Validate message permissions
   */
  validateMessagePermissions(clientData, message) {
    const requiredPermissions = this.getRequiredPermissions(message.type);
    return requiredPermissions.some(perm => clientData.permissions.includes(perm));
  }

  /**
   * Validate mesh message permissions
   */
  validateMeshMessagePermissions(senderData, message) {
    // Partners can only send financial messages to owners/admins
    if (senderData.role === 'partner' && message.type === 'payout_status') {
      return ['owner', 'admin'].includes(message.to.replace('role:', ''));
    }
    
    // Investors can only view financial data, not send it
    if (senderData.role === 'investor' && ['payout_status', 'financial_data'].includes(message.type)) {
      return false;
    }
    
    return true;
  }

  /**
   * Get required permissions for message type
   */
  getRequiredPermissions(messageType) {
    const permissions = {
      'system': ['admin', 'system'],
      'financial_data': ['owner', 'admin', 'partner', 'investor'],
      'payout_status': ['owner', 'admin', 'partner'],
      'admin_action': ['owner', 'admin'],
      'game_event': ['read', 'write'],
      'chat': ['read', 'write'],
      'mesh': ['read', 'write']
    };
    
    return permissions[messageType] || ['read'];
  }

  /**
   * Send message to specific client
   */
  async sendToClient(clientId, message) {
    return this.executeWithMetrics(async () => {
      if (!this.wsServer) {
        throw new Error('WebSocket server is not running');
      }
      
      const clientData = this.clients.get(clientId);
      if (!clientData || clientData.ws.readyState !== 1) { // WebSocket.OPEN = 1
        return false;
      }
      
      try {
        clientData.ws.send(JSON.stringify(message));
        return true;
      } catch (error) {
        this.logger.error('Failed to send message to client', {
          clientId,
          error: error.message
        });
        return false;
      }
    }, 'sendToClient');
  }

  /**
   * Send message to all clients with specific role
   */
  async sendToRole(role, message) {
    const targetClients = this.roleBasedGroups.get(role);
    if (!targetClients) return;

    const promises = Array.from(targetClients).map(clientId => 
      this.sendToClient(clientId, message)
    );

    return Promise.allSettled(promises);
  }

  /**
   * Send message to specific user
   */
  async sendToUser(userId, message) {
    for (const [clientId, clientData] of this.clients) {
      if (clientData.userId === userId) {
        return this.sendToClient(clientId, message);
      }
    }
    return false;
  }

  /**
   * Send message to session
   */
  async sendToSession(sessionId, message) {
    const sessionClients = this.sessionClients.get(sessionId);
    if (!sessionClients) return;

    const promises = Array.from(sessionClients).map(clientId => 
      this.sendToClient(clientId, message)
    );

    return Promise.allSettled(promises);
  }

  /**
   * Handle WebSocket disconnection
   */
  handleDisconnection(clientInfo, code, reason) {
    const clientData = this.clients.get(clientInfo.id);
    if (!clientData) return;

    // Remove from all tracking structures
    this.clients.delete(clientInfo.id);
    
    const roleGroup = this.roleBasedGroups.get(clientData.role);
    if (roleGroup) {
      roleGroup.delete(clientInfo.id);
      if (roleGroup.size === 0) {
        this.roleBasedGroups.delete(clientData.role);
      }
    }

    const sessionGroup = this.sessionClients.get(clientData.sessionId);
    if (sessionGroup) {
      sessionGroup.delete(clientInfo.id);
      if (sessionGroup.size === 0) {
        this.sessionClients.delete(clientData.sessionId);
      }
    }

    this.connectionStats.activeConnections--;
    
    this.logger.info('Secure WebSocket client disconnected', {
      clientId: clientInfo.id,
      role: clientData.role,
      userId: clientData.userId,
      code,
      reason,
      connectionDuration: Date.now() - clientData.connectedAt,
      messageCount: clientData.messageCount
    });
    
    this.emit('clientDisconnected', { client: clientInfo, code, reason });
  }

  /**
   * Handle WebSocket error
   */
  handleError(error) {
    this.connectionStats.errors.push({
      timestamp: Date.now(),
      error: error.message,
      stack: error.stack
    });
    
    // Keep only last 50 errors
    if (this.connectionStats.errors.length > 50) {
      this.connectionStats.errors = this.connectionStats.errors.slice(-50);
    }
    
    this.logger.error('Secure WebSocket error', { error: error.message });
    this.emit('error', error);
  }

  /**
   * Get client information
   */
  getClientInfo(clientId) {
    const clientData = this.clients.get(clientId);
    if (!clientData) return null;

    return {
      id: clientId,
      role: clientData.role,
      userId: clientData.userId,
      sessionId: clientData.sessionId,
      permissions: clientData.permissions,
      connectedAt: clientData.connectedAt,
      messageCount: clientData.messageCount
    };
  }

  /**
   * Get all connected clients by role
   */
  getClientsByRole(role) {
    const roleClients = this.roleBasedGroups.get(role);
    if (!roleClients) return [];

    return Array.from(roleClients).map(clientId => this.getClientInfo(clientId));
  }

  /**
   * Get health checks
   */
  async getHealthChecks() {
    const checks = await super.getHealthChecks();
    
    try {
      if (this.wsServer) {
        const wsHealth = await this.wsServer.healthCheck();
        
        checks.websocket = {
          status: wsHealth.status,
          message: wsHealth.status === 'healthy' ? 'Secure WebSocket server healthy' : 'WebSocket server unhealthy',
          details: wsHealth
        };
      } else {
        checks.websocket = {
          status: 'unhealthy',
          message: 'Secure WebSocket server is not running'
        };
      }
      
      // Check connection metrics
      checks.connections = {
        status: this.connectionStats.activeConnections >= 0 ? 'healthy' : 'unhealthy',
        message: `${this.connectionStats.activeConnections} active connections`,
        details: {
          totalConnections: this.connectionStats.totalConnections,
          activeConnections: this.connectionStats.activeConnections,
          totalMessages: this.connectionStats.totalMessages,
          clientsByRole: Object.fromEntries(
            Array.from(this.roleBasedGroups.entries()).map(([role, clients]) => [role, clients.size])
          )
        }
      };
      
      // Check error rate
      const errorRate = this.connectionStats.totalMessages > 0 
        ? (this.connectionStats.errors.length / this.connectionStats.totalMessages * 100)
        : 0;
      
      checks.errors = {
        status: errorRate < 5 ? 'healthy' : errorRate < 10 ? 'degraded' : 'unhealthy',
        message: `${errorRate.toFixed(2)}% error rate`,
        details: {
          errorCount: this.connectionStats.errors.length,
          errorRate: errorRate.toFixed(2)
        }
      };
      
    } catch (error) {
      checks.websocket = {
        status: 'unhealthy',
        message: error.message
      };
    }
    
    return checks;
  }

  /**
   * Get WebSocket statistics
   */
  getWebSocketStats() {
    const wsStats = this.wsServer ? this.wsServer.getStats() : null;
    
    return {
      connectionStats: this.connectionStats,
      serverStats: wsStats,
      clientStats: {
        totalClients: this.clients.size,
        clientsByRole: Object.fromEntries(
          Array.from(this.roleBasedGroups.entries()).map(([role, clients]) => [role, clients.size])
        ),
        activeSessions: this.sessionClients.size
      }
    };
  }

  /**
   * Get service metrics
   */
  getMetrics() {
    const baseMetrics = super.getMetrics();
    
    return {
      ...baseMetrics,
      websocket: this.getWebSocketStats()
    };
  }

  /**
   * Validate configuration
   */
  validateConfig(config) {
    const errors = super.validateConfig(config);
    
    if (config.allowedOrigins && !Array.isArray(config.allowedOrigins)) {
      errors.push('Allowed origins must be an array');
    }
    
    if (config.allowedOrigins) {
      for (const origin of config.allowedOrigins) {
        if (typeof origin !== 'string' || !origin.startsWith('http')) {
          errors.push(`Invalid origin format: ${origin}`);
        }
      }
    }
    
    return errors;
  }
}

module.exports = SecureWebSocketService;
