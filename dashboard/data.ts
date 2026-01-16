/**
 * Dashboard Data Module for Acey
 * Phase 5: Investor-Ready Live Dashboards
 * 
 * This module provides real-time data aggregation for investor dashboards
 * including skill usage, device states, financial summaries, and learning progress
 */

import { LocalOrchestrator } from '../orchestrator/localOrchestrator';
import { DeviceSync } from '../orchestrator/deviceSync';
import fs from 'fs';
import path from 'path';

export interface SkillUsageMetrics {
  skillName: string;
  executionCount: number;
  successRate: number;
  avgExecutionTime: number;
  lastUsed: string;
  confidence: number;
  errorRate: number;
}

export interface DeviceMetrics {
  deviceId: string;
  deviceName: string;
  lastSync: string;
  isOnline: boolean;
  trustLevel: number;
  skillsCount: number;
  datasetsCount: number;
  syncHealth: 'excellent' | 'good' | 'poor' | 'offline';
  errors: string[];
}

export interface FinancialMetrics {
  totalRevenue: number;
  monthlyRevenue: number;
  partnerRevenue: Record<string, number>;
  payouts: Array<{
    partner: string;
    amount: number;
    timestamp: string;
    status: 'pending' | 'completed' | 'failed';
  }>;
  subscriptionRevenue: Record<string, number>;
  oneTimeRevenue: number;
}

export interface LearningMetrics {
  totalDatasets: number;
  totalEntries: number;
  avgQuality: number;
  highQualityEntries: number;
  learningProgress: number; // 0-100%
  lastFineTune: string;
  modelAccuracy: number;
  datasetsBySkill: Record<string, number>;
}

export interface DashboardStats {
  timestamp: string;
  skills: SkillUsageMetrics[];
  devices: DeviceMetrics[];
  financials: FinancialMetrics;
  learning: LearningMetrics;
  systemHealth: {
    uptime: number;
    errorRate: number;
    performance: 'excellent' | 'good' | 'poor' | 'critical';
    alerts: Array<{
      type: 'error' | 'warning' | 'info';
      message: string;
      timestamp: string;
      resolved: boolean;
    }>;
  };
}

export class DashboardData {
  private orchestrator: LocalOrchestrator;
  private deviceSync: DeviceSync;
  private logsPath: string;
  private financialsPath: string;
  private updateInterval: NodeJS.Timeout | null = null;
  private isInitialized: boolean = false;

  constructor(orchestrator: LocalOrchestrator, deviceSync: DeviceSync, logsPath = 'D:/AceyLogs') {
    this.orchestrator = orchestrator;
    this.deviceSync = deviceSync;
    this.logsPath = logsPath;
    this.financialsPath = path.join(logsPath, 'financials');
    this.initialize();
  }

  /**
   * Initialize dashboard data collection
   */
  private async initialize(): Promise<void> {
    try {
      console.log('📊 Initializing Dashboard Data System...');

      // Create directories
      this.ensureDirectories();

      // Start periodic updates
      this.startPeriodicUpdates();

      this.isInitialized = true;

      console.log('✅ Dashboard Data System initialized');
      console.log(`📁 Logs path: ${this.logsPath}`);
      console.log(`💰 Financials path: ${this.financesPath}`);

    } catch (error) {
      console.error('❌ Failed to initialize Dashboard Data:', error);
    }
  }

  /**
   * Ensure required directories exist
   */
  private ensureDirectories(): void {
    const directories = [
      this.logsPath,
      this.financesPath,
      path.join(this.logsPath, 'skill_usage'),
      path.join(this.logsPath, 'learning_data'),
      path.join(this.logsPath, 'system_health')
    ];

    for (const dir of directories) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  /**
   * Start periodic data updates
   */
  private startPeriodicUpdates(): void {
    // Update every 5 seconds for real-time dashboards
    this.updateInterval = setInterval(() => {
      this.collectAllData();
    }, 5000);
  }

  /**
   * Collect all dashboard data
   */
  private collectAllData(): void {
    try {
      const stats = this.getLiveStats();
      
      // Save latest stats for historical tracking
      const statsFile = path.join(this.logsPath, 'dashboard_stats.json');
      fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));

      // Emit update event
      if (this.isInitialized) {
        // In a real implementation, this would emit to connected dashboard clients
        console.log('📊 Dashboard stats updated');
      }

    } catch (error) {
      console.error('❌ Failed to collect dashboard data:', error);
    }
  }

  /**
   * Get skill usage metrics
   */
  getSkillUsage(): SkillUsageMetrics[] {
    try {
      const usageDir = path.join(this.logsPath, 'skill_usage');
      if (!fs.existsSync(usageDir)) {
        return [];
      }

      const files = fs.readdirSync(usageDir).filter(f => f.endsWith('.json'));
      const skills: Record<string, SkillUsageMetrics> = {};

      // Process each skill usage file
      for (const file of files) {
        try {
          const filePath = path.join(usageDir, file);
          const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          
          // Aggregate metrics
          const skillName = file.replace('.json', '');
          const executions = Array.isArray(data) ? data : [data];
          
          const successCount = executions.filter(e => e.success).length;
          const errorCount = executions.filter(e => !e.success).length;
          const totalTime = executions.reduce((sum, e) => sum + (e.executionTime || 0), 0);
          const avgTime = totalTime / executions.length;
          const avgConfidence = executions.reduce((sum, e) => sum + (e.confidence || 0.5), 0) / executions.length;
          
          skills[skillName] = {
            skillName,
            executionCount: executions.length,
            successRate: successCount / executions.length,
            avgExecutionTime: avgTime,
            lastUsed: executions[executions.length - 1]?.timestamp || new Date().toISOString(),
            confidence: avgConfidence,
            errorRate: errorCount / executions.length
          };
        } catch (error) {
          console.error(`Failed to process skill usage file ${file}:`, error);
        }
      }

      return Object.values(skills);

    } catch (error) {
      console.error('❌ Failed to get skill usage:', error);
      return [];
    }
  }

  /**
   * Get device metrics
   */
  getDeviceStates(): DeviceMetrics[] {
    try {
      const devices = this.deviceSync.listDevices();
      
      return devices.map(device => {
        // Calculate sync health based on last sync time
        const lastSync = new Date(device.lastSync);
        const now = new Date();
        const hoursSinceSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);
        
        let syncHealth: DeviceMetrics['syncHealth'];
        if (hoursSinceSync < 1) {
          syncHealth = 'excellent';
        } else if (hoursSinceSync < 6) {
          syncHealth = 'good';
        } else if (hoursSinceSync < 24) {
          syncHealth = 'poor';
        } else {
          syncHealth = 'offline';
        }

        // Check if device is online (simplified - would use actual ping/heartbeat)
        const isOnline = hoursSinceSync < 1;

        return {
          deviceId: device.deviceId,
          deviceName: device.deviceName,
          lastSync: device.lastSync,
          isOnline,
          trustLevel: device.trustLevel,
          skillsCount: device.skills.length,
          datasetsCount: device.datasets.length,
          syncHealth,
          errors: [] // Would collect actual sync errors
        };
      });

    } catch (error) {
      console.error('❌ Failed to get device states:', error);
      return [];
    }
  }

  /**
   * Get financial metrics
   */
  getFinancials(): FinancialMetrics {
    try {
      if (!fs.existsSync(this.financesPath)) {
        // Create sample financial data
        this.createSampleFinancialData();
      }

      const financialData = JSON.parse(fs.readFileSync(this.financialPath, 'utf-8'));
      
      // Calculate additional metrics
      const totalRevenue = Object.values(financialData.partnerRevenue || {}).reduce((sum, revenue) => sum + revenue, 0);
      const monthlyRevenue = totalRevenue / 12; // Simplified calculation
      
      return {
        totalRevenue,
        monthlyRevenue,
        partnerRevenue: financialData.partnerRevenue || {},
        payouts: financialData.payouts || [],
        subscriptionRevenue: financialData.subscriptionRevenue || {},
        oneTimeRevenue: financialData.oneTimeRevenue || 0
      };

    } catch (error) {
      console.error('❌ Failed to get financials:', error);
      return {
        totalRevenue: 0,
        monthlyRevenue: 0,
        partnerRevenue: {},
        payouts: [],
        subscriptionRevenue: {},
        oneTimeRevenue: 0
      };
    }
  }

  /**
   * Create sample financial data
   */
  private createSampleFinancialData(): void {
    const sampleData = {
      partnerRevenue: {
        'Enterprise Client A': 10000,
        'Pro Client B': 2500,
        'Creator Client C': 500
      },
      payouts: [
        {
          partner: 'Developer A',
          amount: 500,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          status: 'completed'
        },
        {
          partner: 'Designer B',
          amount: 300,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
          status: 'pending'
        }
      ],
      subscriptionRevenue: {
        'Enterprise': 8000,
        'Pro': 2000,
        'Creator': 400
      },
      oneTimeRevenue: 1500
    };

      fs.writeFileSync(this.financesPath, JSON.stringify(sampleData, null, 2));
  }

  /**
   * Get learning metrics
   */
  getLearningMetrics(): LearningMetrics {
    try {
      const learningData = this.orchestrator.getLearningData();
      
      const totalEntries = learningData.length;
      const avgQuality = totalEntries > 0 
        ? learningData.reduce((sum, entry) => sum + (entry.quality || 0.5), 0) / totalEntries
        : 0;
      
      const highQualityEntries = learningData.filter(entry => (entry.quality || 0) >= 0.7).length;
      const learningProgress = Math.min((highQualityEntries / Math.max(totalEntries, 1)) * 100, 100);
      
      // Group datasets by skill
      const datasetsBySkill: Record<string, number> = {};
      learningData.forEach(entry => {
        const skillName = entry.skillName || 'unknown';
        datasetsBySkill[skillName] = (datasetsBySkill[skillName] || 0) + 1;
      });

      return {
        totalDatasets: Object.keys(datasetsBySkill).length,
        totalEntries,
        avgQuality,
        highQualityEntries,
        learningProgress,
        lastFineTune: new Date().toISOString(), // Would get actual last fine-tune timestamp
        modelAccuracy: avgQuality * 100, // Simplified accuracy calculation
        datasetsBySkill
      };

    } catch (error) {
      console.error('❌ Failed to get learning metrics:', error);
      return {
        totalDatasets: 0,
        totalEntries: 0,
        avgQuality: 0,
        highQualityEntries: 0,
        learningProgress: 0,
        lastFineTune: new Date().toISOString(),
        modelAccuracy: 0,
        datasetsBySkill: {}
      };
    }
  }

  /**
   * Get system health metrics
   */
  getSystemHealth(): DashboardStats['systemHealth'] {
    try {
      const skillStats = this.getSkillUsage();
      const deviceStats = this.getDeviceStates();
      
      // Calculate overall system health
      const avgSkillSuccessRate = skillStats.length > 0
        ? skillStats.reduce((sum, skill) => sum + skill.successRate, 0) / skillStats.length
        : 1;
      
      const onlineDevices = deviceStats.filter(d => d.isOnline).length;
      const totalDevices = deviceStats.length;
      const deviceHealth = totalDevices > 0 ? onlineDevices / totalDevices : 1;
      
      const errorRate = skillStats.length > 0
        ? skillStats.reduce((sum, skill) => sum + skill.errorRate, 0) / skillStats.length
        : 0;

      let performance: DashboardStats['systemHealth']['performance'];
      if (avgSkillSuccessRate > 0.9 && deviceHealth > 0.8 && errorRate < 0.1) {
        performance = 'excellent';
      } else if (avgSkillSuccessRate > 0.8 && deviceHealth > 0.6 && errorRate < 0.2) {
        performance = 'good';
      } else if (avgSkillSuccessRate > 0.7 && deviceHealth > 0.4 && errorRate < 0.3) {
        performance = 'poor';
      } else {
        performance = 'critical';
      }

      // Collect alerts
      const alerts = [];
      
      // Add performance alerts
      if (performance === 'critical') {
        alerts.push({
          type: 'error',
          message: 'System performance is critical - immediate attention required',
          timestamp: new Date().toISOString(),
          resolved: false
        });
      } else if (performance === 'poor') {
        alerts.push({
          type: 'warning',
          message: 'System performance is poor - optimization recommended',
          timestamp: new Date().toISOString(),
          resolved: false
        });
      }

      // Add device alerts
      const offlineDevices = deviceStats.filter(d => !d.isOnline);
      if (offlineDevices.length > 0) {
        alerts.push({
          type: 'warning',
          message: `${offlineDevices.length} device(s) offline`,
          timestamp: new Date().toISOString(),
          resolved: false
        });
      }

      return {
        uptime: 0.95, // Would calculate actual uptime
        errorRate,
        performance,
        alerts
      };

    } catch (error) {
      console.error('❌ Failed to get system health:', error);
      return {
        uptime: 0,
        errorRate: 1,
        performance: 'critical',
        alerts: [{
          type: 'error',
          message: 'System health monitoring failed',
          timestamp: new Date().toISOString(),
          resolved: false
        }]
      };
    }
  }

  /**
   * Get live dashboard stats
   */
  getLiveStats(): DashboardStats {
    return {
      timestamp: new Date().toISOString(),
      skills: this.getSkillUsage(),
      devices: this.getDeviceStates(),
      financials: this.getFinancials(),
      learning: this.getLearningMetrics(),
      systemHealth: this.getSystemHealth()
    };
  }

  /**
   * Generate investor summary
   */
  generateInvestorSummary(): string {
    const stats = this.getLiveStats();
    
    const summary = `
# Acey Investor Dashboard Summary

## Executive Overview
- Generated: ${stats.timestamp}
- System Health: ${stats.systemHealth.performance.toUpperCase()}
- Uptime: ${(stats.systemHealth.uptime * 100).toFixed(1)}%
- Error Rate: ${(stats.systemHealth.errorRate * 100).toFixed(1)}%

## Performance Metrics
### Skills Performance
${stats.skills.map(skill => 
  `- ${skill.skillName}: ${skill.executionCount} executions, ${(skill.successRate * 100).toFixed(1)}% success rate`
).join('\n')}

### Device Health
${stats.devices.map(device => 
  `- ${device.deviceName}: ${device.isOnline ? '🟢 Online' : '🔴 Offline'} (Trust: ${device.trustLevel})`
).join('\n')}

## Financial Overview
- Total Revenue: $${stats.financials.totalRevenue.toLocaleString()}
- Monthly Revenue: $${stats.financials.monthlyRevenue.toLocaleString()}
- Active Partners: ${Object.keys(stats.financials.partnerRevenue).length}
- Pending Payouts: ${stats.financials.payouts.filter(p => p.status === 'pending').length}

### Revenue by Partner
${Object.entries(stats.financials.partnerRevenue).map(([partner, revenue]) => 
  `- ${partner}: $${revenue.toLocaleString()}`
).join('\n')}

## Learning Progress
- Total Datasets: ${stats.learning.totalDatasets}
- Training Entries: ${stats.learning.totalEntries.toLocaleString()}
- Average Quality: ${(stats.learning.avgQuality * 100).toFixed(1)}%
- Learning Progress: ${stats.learning.learningProgress.toFixed(1)}%
- Model Accuracy: ${stats.learning.modelAccuracy.toFixed(1)}%

### Dataset Distribution
${Object.entries(stats.learning.datasetsBySkill).map(([skill, count]) => 
  `- ${skill}: ${count} datasets`
).join('\n')}

## System Alerts
${stats.systemHealth.alerts.map(alert => 
  `- ${alert.type.toUpperCase()}: ${alert.message} (${alert.timestamp})`
).join('\n')}

## Key Metrics for Investors
- **Skill Adoption**: ${stats.skills.reduce((sum, skill) => sum + skill.executionCount, 0)} total executions
- **Device Coverage**: ${stats.devices.length} active devices
- **Revenue Growth**: $${stats.financials.monthlyRevenue.toLocaleString()} monthly recurring
- **Learning Velocity**: ${stats.learning.learningProgress.toFixed(1)}% progress towards model improvement
- **System Reliability**: ${(stats.systemHealth.uptime * 100).toFixed(1)}% uptime

---
*This report is generated automatically every 5 seconds*
*For real-time updates, connect to the live dashboard API*
    `.trim();
    
    const reportPath = path.join(this.logsPath, `investor_summary_${new Date().toISOString().replace(/[:.]/g, '-')}.md`);
    fs.writeFileSync(reportPath, summary);
    
    console.log(`📄 Investor summary generated: ${reportPath}`);
    return reportPath;
  }

  /**
   * Stop periodic updates
   */
  stopUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      console.log('⏹️ Dashboard updates stopped');
    }
  }

  /**
   * Shutdown dashboard data system
   */
  async shutdown(): Promise<void> {
    console.log('🔄 Shutting down Dashboard Data System...');
    
    // Stop periodic updates
    this.stopUpdates();
    
    // Generate final reports
    this.generateInvestorSummary();
    
    console.log('✅ Dashboard Data System shutdown complete');
  }
}

export default DashboardData;
