/**
 * AI Control Center Integration Server
 * Clean, scalable architecture with clear separation of concerns
 * Acey asks → Control Center decides → Actions executed
 */

import express from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import cors from 'cors';
import { AIControlCenter } from './ai-control-center';
import type { AceyOutput, OperatorCommand } from './acey-intents';

// ===== INTEGRATION SERVER =====
export class AIControlCenterServer {
  private app: express.Application;
  private server: any;
  private io: SocketIOServer;
  private controlCenter: AIControlCenter;
  private port: number;

  constructor(port: number = 3001) {
    this.port = port;
    this.app = express();
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    this.controlCenter = new AIControlCenter();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
    this.setupControlCenterEvents();
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: Date.now(),
        controlCenter: this.controlCenter.getState().active
      });

    // ===== MEMORY MANAGER ENDPOINTS =====
    
    // POST /memory/proposal - Receive memory proposal from Acey
    this.app.post('/memory/proposal', async (req, res) => {
      try {
        const intent: AceyOutput = req.body;
        const result = await this.controlCenter.processAceyIntent(intent, 'acey');
        
        res.json({
          success: true,
          intentId: result.intentId,
          status: result.status,
          message: result.message
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // POST /memory/approve - Approve memory proposal
    this.app.post('/memory/approve', async (req, res) => {
      try {
        const { intentId } = req.body;
        const result = await this.controlCenter.approveIntent(intentId, 'operator');
        
        res.json({
          success: true,
          ...result
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // POST /memory/reject - Reject memory proposal
    this.app.post('/memory/reject', async (req, res) => {
      try {
        const { intentId, reason } = req.body;
        const result = await this.controlCenter.rejectIntent(intentId, reason, 'operator');
        
        res.json({
          success: true,
          ...result
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // GET /memory/queue - Get pending memory proposals
    this.app.get('/memory/queue', (req, res) => {
      const memoryModule = this.controlCenter.getModule('memory');
      const dashboardData = this.controlCenter.getDashboardData();
      
      res.json({
        success: true,
        pendingProposals: dashboardData.pendingIntents.filter(p => 
          p.data.intents.some(i => i.type === 'memory_proposal')
        ),
        moduleData: memoryModule?.getModuleData()
      });

    // ===== TRUST & SAFETY ENDPOINTS =====

    // GET /trust/scores - Get trust scores (aggregate only)
    this.app.get('/trust/scores', (req, res) => {
      const trustModule = this.controlCenter.getModule('trust');
      const moduleData = trustModule?.getModuleData();
      
      // Return only aggregate data, no user-specific info
      res.json({
        success: true,
        averageTrust: moduleData?.averageTrust || 0,
        totalUsers: moduleData?.totalTrustScores || 0,
        recentActivity: moduleData?.moderationLog?.slice(-10) || []
      });

    // GET /trust/suggestions - Get moderation suggestions
    this.app.get('/trust/suggestions', (req, res) => {
      const trustModule = this.controlCenter.getModule('trust');
      const moduleData = trustModule?.getModuleData();
      
      res.json({
        success: true,
        suggestions: moduleData?.moderationLog?.filter(log => 
          log.type === 'shadow_ban_suggestion'
        ) || []
      });

    // POST /trust/apply - Apply trust signal
    this.app.post('/trust/apply', async (req, res) => {
      try {
        const { intentId } = req.body;
        const result = await this.controlCenter.approveIntent(intentId, 'operator');
        
        res.json({
          success: true,
          ...result
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // ===== PERSONA GUARD ENDPOINTS =====

    // GET /persona/current - Get current persona (read-only)
    this.app.get('/persona/current', (req, res) => {
      const personaModule = this.controlCenter.getModule('persona');
      const moduleData = personaModule?.getModuleData();
      
      res.json({
        success: true,
        currentPersona: moduleData?.currentPersona || 'neutral',
        locked: this.controlCenter.getConfig().personaLocked,
        history: moduleData?.personaHistory?.slice(-10) || []
      });

    // POST /persona/lock - Lock/unlock persona system
    this.app.post('/persona/lock', (req, res) => {
      const { locked } = req.body;
      this.controlCenter.updateConfig({ personaLocked: locked });
      
      res.json({
        success: true,
        locked: this.controlCenter.getConfig().personaLocked
      });

    // POST /persona/approve - Approve persona change
    this.app.post('/persona/approve', async (req, res) => {
      try {
        const { intentId } = req.body;
        const result = await this.controlCenter.approveIntent(intentId, 'operator');
        
        res.json({
          success: true,
          ...result
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // ===== SIMULATION & REPLAY ENDPOINTS =====

    // POST /simulation/start - Start simulation session
    this.app.post('/simulation/start', (req, res) => {
      const { mode = 'dry_run' } = req.body;
      const simModule = this.controlCenter.getModule('simulation') as any;
      
      if (!simModule) {
        return res.status(500).json({
          success: false,
          error: 'Simulation module not available'
        });
      }

      const sessionId = simModule.createSimulation(mode);
      
      res.json({
        success: true,
        sessionId,
        mode
      });

    // POST /simulation/process - Process intent in simulation
    this.app.post('/simulation/process', async (req, res) => {
      try {
        const intent: AceyOutput = req.body;
        const result = await this.controlCenter.processAceyIntent(intent, 'simulation');
        
        res.json({
          success: true,
          ...result
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // GET /simulation/history - Get simulation history
    this.app.get('/simulation/history', (req, res) => {
      const simModule = this.controlCenter.getModule('simulation');
      const moduleData = simModule?.getModuleData();
      
      res.json({
        success: true,
        simulations: moduleData?.recentSimulations || []
      });

    // ===== ENGAGEMENT & MOOD ENDPOINTS =====

    // GET /engagement/metrics - Get engagement metrics
    this.app.get('/engagement/metrics', (req, res) => {
      const engagementModule = this.controlCenter.getModule('engagement');
      const moduleData = engagementModule?.getModuleData();
      
      res.json({
        success: true,
        metrics: moduleData || {
          chatVelocity: 0,
          hypeIndex: 0,
          engagementLevel: 0,
          moodAxes: {
            energy: 0,
            chaos: 0,
            tension: 0,
            engagement: 0
          }
        }
      });

    // POST /engagement/event - Process game event
    this.app.post('/engagement/event', async (req, res) => {
      try {
        const intent: AceyOutput = req.body;
        const result = await this.controlCenter.processAceyIntent(intent, 'acey');
        
        res.json({
          success: true,
          ...result
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // ===== AUDIT & EXPORT ENDPOINTS =====

    // GET /audit/log - Get audit log
    this.app.get('/audit/log', (req, res) => {
      const { limit = 50, category } = req.query;
      const state = this.controlCenter.getState();
      
      let auditLog = state.auditLog;
      
      if (category) {
        auditLog = auditLog.filter(entry => entry.category === category);
      }
      
      auditLog = auditLog.slice(-Number(limit));
      
      res.json({
        success: true,
        auditLog,
        total: state.auditLog.length
      });

    // GET /audit/export - Export audit data
    this.app.get('/audit/export', (req, res) => {
      const { format = 'json' } = req.query;
      const auditModule = this.controlCenter.getModule('audit') as any;
      
      if (!auditModule) {
        return res.status(500).json({
          success: false,
          error: 'Audit module not available'
        });
      }

      try {
        const data = auditModule.exportData(format as 'json' | 'csv');
        
        if (format === 'json') {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Content-Disposition', 'attachment; filename="audit-export.json"');
        } else {
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', 'attachment; filename="audit-export.csv"');
        }
        
        res.send(data);
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // ===== OPERATOR COMMAND ENDPOINTS =====

    // POST /operator/command - Handle operator commands
    this.app.post('/operator/command', async (req, res) => {
      try {
        const command: OperatorCommand = req.body;
        
        switch (command.type) {
          case 'approve_intent':
            const approveResult = await this.controlCenter.approveIntent(command.intentId!, 'operator');
            res.json({ success: true, ...approveResult });
            break;
            
          case 'reject_intent':
            const rejectResult = await this.controlCenter.rejectIntent(
              command.intentId!, 
              command.reason || 'Operator rejected'
            );
            res.json({ success: true, ...rejectResult });
            break;
            
          case 'lock_memory':
            this.controlCenter.updateConfig({ memoryLocked: true });
            res.json({ success: true, memoryLocked: true });
            break;
            
          case 'unlock_memory':
            this.controlCenter.updateConfig({ memoryLocked: false });
            res.json({ success: true, memoryLocked: false });
            break;
            
          case 'start_simulation':
            this.controlCenter.updateConfig({ simulationMode: true });
            res.json({ success: true, simulationMode: true });
            break;
            
          case 'end_simulation':
            this.controlCenter.updateConfig({ simulationMode: false });
            res.json({ success: true, simulationMode: false });
            break;
            
          default:
            res.status(400).json({
              success: false,
              error: 'Unknown command type'
            });
        }
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // ===== DASHBOARD ENDPOINTS =====

    // GET /dashboard - Get complete dashboard data
    this.app.get('/dashboard', (req, res) => {
      const dashboardData = this.controlCenter.getDashboardData();
      const config = this.controlCenter.getConfig();
      const state = this.controlCenter.getState();
      
      res.json({
        success: true,
        dashboard: dashboardData,
        config,
        state: {
          active: state.active,
          mode: state.mode,
          operatorConnected: state.operatorConnected,
          pendingApprovals: state.systemStats.pending
        }
      });

    // GET /dashboard/stats - Get system statistics
    this.app.get('/dashboard/stats', (req, res) => {
      const stats = this.controlCenter.getState().systemStats;
      
      res.json({
        success: true,
        stats
      });

    // ===== CONFIGURATION ENDPOINTS =====

    // GET /config - Get current configuration
    this.app.get('/config', (req, res) => {
      res.json({
        success: true,
        config: this.controlCenter.getConfig()
      });

    // POST /config - Update configuration
    this.app.post('/config', (req, res) => {
      try {
        const newConfig = req.body;
        this.controlCenter.updateConfig(newConfig);
        
        res.json({
          success: true,
          config: this.controlCenter.getConfig()
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
  }

  /**
   * Setup WebSocket handlers
   */
  private setupWebSocket(): void {
    this.io.on('connection', (socket) => {
      console.log(`🔗 Operator connected: ${socket.id}`);
      
      // Update connection status
      const state = this.controlCenter.getState();
      state.operatorConnected = true;

      // Send initial dashboard data
      socket.emit('dashboard_update', this.controlCenter.getDashboardData());

      // Handle operator commands
      socket.on('operator_command', async (command: OperatorCommand) => {
        try {
          switch (command.type) {
            case 'approve_intent':
              const approveResult = await this.controlCenter.approveIntent(command.intentId!, 'operator');
              socket.emit('command_result', { success: true, ...approveResult });
              break;
              
            case 'reject_intent':
              const rejectResult = await this.controlCenter.rejectIntent(
                command.intentId!, 
                command.reason || 'Operator rejected'
              );
              socket.emit('command_result', { success: true, ...rejectResult });
              break;
              
            default:
              socket.emit('command_result', { 
                success: false, 
                error: 'Unknown command type' 
              });
          }
        } catch (error) {
          socket.emit('command_result', {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      });

      // Handle dashboard requests
      socket.on('get_dashboard', () => {
        socket.emit('dashboard_update', this.controlCenter.getDashboardData());

      // Handle configuration updates
      socket.on('update_config', (newConfig) => {
        try {
          this.controlCenter.updateConfig(newConfig);
          socket.emit('config_updated', this.controlCenter.getConfig());
        } catch (error) {
          socket.emit('config_error', {
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`🔌 Operator disconnected: ${socket.id}`);
        const state = this.controlCenter.getState();
        state.operatorConnected = false;
      });
  }

  /**
   * Setup Control Center event handlers
   */
  private setupControlCenterEvents(): void {
    // Emit dashboard updates on intent events
    this.controlCenter.on('intent_received', (intent) => {
      this.io.emit('intent_received', intent);
      this.io.emit('dashboard_update', this.controlCenter.getDashboardData());

    this.controlCenter.on('intent_approved', (approved) => {
      this.io.emit('intent_approved', approved);
      this.io.emit('dashboard_update', this.controlCenter.getDashboardData());

    this.controlCenter.on('intent_rejected', (rejected) => {
      this.io.emit('intent_rejected', rejected);
      this.io.emit('dashboard_update', this.controlCenter.getDashboardData());

    this.controlCenter.on('intent_executed', (result) => {
      this.io.emit('intent_executed', result);
      this.io.emit('dashboard_update', this.controlCenter.getDashboardData());

    this.controlCenter.on('audit_logged', (entry) => {
      this.io.emit('audit_logged', entry);

    this.controlCenter.on('config_updated', (config) => {
      this.io.emit('config_updated', config);
  }

  /**
   * Start the server
   */
  start(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(this.port, () => {
        console.log(`🧠 AI Control Center Server running on port ${this.port}`);
        console.log(`📊 Dashboard available at http://localhost:${this.port}/dashboard`);
        console.log(`🔌 WebSocket connection ready`);
        resolve();
    });
  }

  /**
   * Stop the server
   */
  stop(): Promise<void> {
    return new Promise((resolve) => {
      this.server.close(() => {
        console.log('🛑 AI Control Center Server stopped');
        this.controlCenter.destroy();
        resolve();
    });
  }

  /**
   * Get Control Center instance
   */
  getControlCenter(): AIControlCenter {
    return this.controlCenter;
  }

  /**
   * Get Express app instance
   */
  getApp(): express.Application {
    return this.app;
  }

  /**
   * Get Socket.IO instance
   */
  getIO(): SocketIOServer {
    return this.io;
  }
}

// ===== STARTUP FUNCTION =====
export async function startControlCenterServer(port: number = 3001): Promise<AIControlCenterServer> {
  const server = new AIControlCenterServer(port);
  await server.start();
  return server;
}

// ===== CLI STARTUP =====
if (require.main === module) {
  const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;
  
  startControlCenterServer(port)
    .then(() => {
      console.log('✅ AI Control Center Server started successfully');
    })
    .catch((error) => {
      console.error('❌ Failed to start AI Control Center Server:', error);
      process.exit(1);
}
