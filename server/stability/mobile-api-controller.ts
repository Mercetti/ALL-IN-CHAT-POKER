/**
 * Mobile API Controller
 * Express API endpoints for mobile app control
 */

import express, { Request, Response } from 'express';
import { AceyStabilityModule } from './acey-stability';

export class MobileAPIController {
  private app: express.Application;
  private acey: AceyStabilityModule;
  private apiKey: string;

  constructor(app: express.Application, acey: AceyStabilityModule) {
    this.app = app;
    this.acey = acey;
    this.apiKey = process.env.ACEY_API_KEY || 'default-key-change-me';
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Authentication middleware
    this.app.use('/api/acey', this.authenticate.bind(this));

    // Core control endpoints
    this.app.post('/api/acey/start', this.handleStart.bind(this));
    this.app.post('/api/acey/stop', this.handleStop.bind(this));
    this.app.get('/api/acey/status', this.handleStatus.bind(this));
    
    // Skill management endpoints
    this.app.post('/api/acey/skill/restart', this.handleSkillRestart.bind(this));
    this.app.get('/api/acey/skills/available', this.handleGetAvailableSkills.bind(this));
    this.app.post('/api/acey/skills/install', this.handleInstallSkill.bind(this));
    this.app.post('/api/acey/skills/remove', this.handleRemoveSkill.bind(this));
    
    // Approval endpoints
    this.app.post('/api/acey/approve', this.handleApproveOutput.bind(this));
    this.app.get('/api/acey/approvals/pending', this.handleGetPendingApprovals.bind(this));
    
    // Device management
    this.app.post('/api/acey/add-device', this.handleAddDevice.bind(this));
    
    // System management
    this.app.get('/api/acey/system/health', this.handleSystemHealth.bind(this));
    this.app.get('/api/acey/system/logs', this.handleGetLogs.bind(this));
    this.app.post('/api/acey/system/rollback', this.handleRollback.bind(this));
    
    console.log('Mobile API routes registered');
  }

  // Authentication middleware
  private authenticate(req: Request, res: Response, next: Function): void {
    const apiKey = req.headers['x-api-key'];
    const deviceId = req.headers['x-device-id'];

    if (!apiKey || apiKey !== this.apiKey) {
      res.status(401).json({ 
        success: false, 
        error: 'Invalid API key' 
      });
      return;
    }

    if (deviceId) {
      // Store device ID for logging
      req.deviceId = deviceId;
    }

    next();
  }

  // Start Acey Engine
  private async handleStart(req: Request, res: Response): Promise<void> {
    try {
      await this.acey.start();
      
      const status = this.acey.getStatus();
      res.json({
        success: true,
        message: 'Acey Engine started successfully',
        status: {
          active: status.active,
          uptime: status.uptime,
          skillsActive: status.skills.length,
          llmConnections: status.llmConnections
        }
      });
      
    } catch (error: any) {
      console.error('Mobile API: Start failed:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Stop Acey Engine
  private async handleStop(req: Request, res: Response): Promise<void> {
    try {
      await this.acey.stop();
      
      res.json({
        success: true,
        message: 'Acey Engine stopped successfully',
        status: {
          active: false,
          uptime: 0,
          skillsStopped: this.acey.getStatus().skills.length,
          logsSaved: true
        }
      });
      
    } catch (error: any) {
      console.error('Mobile API: Stop failed:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Get current status
  private async handleStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = this.acey.getStatus();
      
      res.json({
        success: true,
        status: status
      });
      
    } catch (error: any) {
      console.error('Mobile API: Status failed:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Restart specific skill
  private async handleSkillRestart(req: Request, res: Response): Promise<void> {
    const { skillName } = req.body;
    
    if (!skillName) {
      res.status(400).json({ 
        success: false, 
        error: 'Skill name required' 
      });
      return;
    }

    try {
      await this.acey.restartSkill(skillName);
      
      res.json({
        success: true,
        message: `Skill ${skillName} restarted successfully`
      });
      
    } catch (error: any) {
      console.error('Mobile API: Skill restart failed:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Get available skills
  private async handleGetAvailableSkills(req: Request, res: Response): Promise<void> {
    try {
      const skills = this.acey.getAvailableSkills();
      
      res.json({
        success: true,
        skills: skills
      });
      
    } catch (error: any) {
      console.error('Mobile API: Get available skills failed:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Install skill
  private async handleInstallSkill(req: Request, res: Response): Promise<void> {
    const { skillName } = req.body;
    
    if (!skillName) {
      res.status(400).json({ 
        success: false, 
        error: 'Skill name required' 
      });
      return;
    }

    try {
      await this.acey.installSkill(skillName);
      
      res.json({
        success: true,
        message: `Skill ${skillName} installed successfully`
      });
      
    } catch (error: any) {
      console.error('Mobile API: Install skill failed:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Remove skill
  private async handleRemoveSkill(req: Request, res: Response): Promise<void> {
    const { skillName } = req.body;
    
    if (!skillName) {
      res.status(400).json({ 
        success: false, 
        error: 'Skill name required' 
      });
      return;
    }

    try {
      await this.acey.removeSkill(skillName);
      
      res.json({
        success: true,
        message: `Skill ${skillName} removed successfully`
      });
      
    } catch (error: any) {
      console.error('Mobile API: Remove skill failed:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Approve output
  private async handleApproveOutput(req: Request, res: Response): Promise<void> {
    const { skillName, outputId } = req.body;
    
    if (!skillName || !outputId) {
      res.status(400).json({ 
        success: false, 
        error: 'Skill name and output ID required' 
      });
      return;
    }

    try {
      await this.acey.approveOutput(skillName, outputId);
      
      res.json({
        success: true,
        message: `Output ${outputId} approved for learning`
      });
      
    } catch (error: any) {
      console.error('Mobile API: Approve output failed:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Get pending approvals
  private async handleGetPendingApprovals(req: Request, res: Response): Promise<void> {
    try {
      const approvals = this.acey.getPendingApprovals();
      
      res.json({
        success: true,
        approvals: approvals
      });
      
    } catch (error: any) {
      console.error('Mobile API: Get pending approvals failed:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Add trusted device
  private async handleAddDevice(req: Request, res: Response): Promise<void> {
    const { deviceId, deviceName } = req.body;
    
    if (!deviceId) {
      res.status(400).json({ 
        success: false, 
        error: 'Device ID required' 
      });
      return;
    }

    try {
      // In real implementation, this would store device in database
      console.log(`Device added: ${deviceName || deviceId} (${deviceId})`);
      
      res.json({
        success: true,
        message: 'Device authorized successfully',
        deviceId: deviceId
      });
      
    } catch (error: any) {
      console.error('Mobile API: Add device failed:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // System health check
  private async handleSystemHealth(req: Request, res: Response): Promise<void> {
    try {
      const isHealthy = this.acey.isSystemHealthy();
      const status = this.acey.getStatus();
      
      res.json({
        success: true,
        healthy: isHealthy,
        status: status
      });
      
    } catch (error: any) {
      console.error('Mobile API: System health check failed:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Get system logs
  private async handleGetLogs(req: Request, res: Response): Promise<void> {
    try {
      const logger = this.acey.getLogger();
      const logs = logger.getRecentLogs(100);
      
      res.json({
        success: true,
        logs: logs
      });
      
    } catch (error: any) {
      console.error('Mobile API: Get logs failed:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Rollback system
  private async handleRollback(req: Request, res: Response): Promise<void> {
    const { snapshotId } = req.body;
    
    try {
      let success = false;
      let message = '';
      
      if (snapshotId) {
        success = await this.acey.rollbackToSnapshot(snapshotId);
        message = success ? `Rolled back to snapshot ${snapshotId}` : `Rollback to ${snapshotId} failed`;
      } else {
        success = await this.acey.rollbackToLast();
        message = success ? 'Rolled back to last snapshot' : 'Rollback to last snapshot failed';
      }
      
      res.json({
        success,
        message
      });
      
    } catch (error: any) {
      console.error('Mobile API: Rollback failed:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
}
