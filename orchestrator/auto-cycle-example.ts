/**
 * Auto-Cycle System Example for Acey
 * Phase 7: Live Auto-Cycle Scheduling
 * 
 * This example demonstrates the complete auto-cycle system including:
 * - Scheduler initialization and control
 * - Real-time monitoring and notifications
 * - Mobile UI integration
 * - Performance optimization
 * - Emergency mode handling
 */

import { AutoScheduler } from './scheduler';
import { AceyExecutionPack } from './index';
import path from 'path';

async function demonstrateAutoCycleSystem() {
  console.log('🚀 Acey Auto-Cycle System Demo');
  console.log('=====================================\n');

  try {
    // Step 1: Initialize the execution pack
    console.log('📦 Step 1: Initializing Execution Pack...');
    const pack = new AceyExecutionPack({
      // Local LLM configuration
      ollamaPath: 'ollama',
      modelsPath: path.join(process.cwd(), 'models'),
      enableStreaming: false,
      maxConcurrency: 2,
      timeoutMs: 30000,
      learningEnabled: true,
      qualityThreshold: 0.7,
      
      // Device sync configuration
      syncPath: path.join(process.cwd(), 'models', 'device_sync'),
      encryptionEnabled: true,
      autoSync: true,
      syncInterval: 5,
      maxDevices: 10,
      trustRequired: true,
      backupEnabled: true,
      
      // Skill discovery configuration
      discoveryLogPath: path.join(process.cwd(), 'logs', 'skill_discovery'),
      proposalPath: path.join(process.cwd(), 'logs', 'proposals'),
      analysisInterval: 5,
      minPatternFrequency: 10,
      proposalThreshold: 0.7,
      enableAutoAnalysis: true,
      
      // Dashboard configuration
      logsPath: path.join(process.cwd(), 'logs'),
      financialsPath: path.join(process.cwd(), 'logs', 'financials'),
      updateInterval: 5000,
      enableRealTimeUpdates: true,
      
      // Security configuration
      enableSecurityMonitoring: true,
      trustVerificationRequired: true,
      auditLogging: true,
      emergencyMode: false
    });

    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('✅ Execution Pack initialized\n');

    // Step 2: Initialize the auto scheduler
    console.log('⏰ Step 2: Initializing Auto Scheduler...');
    const scheduler = new AutoScheduler(pack, {
      intervalMs: 30000, // 30 seconds for demo
      enableAutoStart: false,
      enableNotifications: true,
      enableEmergencyMode: true,
      maxConsecutiveFailures: 3,
      healthCheckInterval: 15000,
      logRetentionDays: 7
    });

    // Set up event listeners
    scheduler.on('started', (data) => {
      console.log('🚀 Scheduler started:', data);
    });

    scheduler.on('stopped', (data) => {
      console.log('🛑 Scheduler stopped:', data);
    });

    scheduler.on('paused', (data) => {
      console.log('⏸️ Scheduler paused:', data);
    });

    scheduler.on('resumed', (data) => {
      console.log('▶️ Scheduler resumed:', data);
    });

    scheduler.on('cycleCompleted', (cycle) => {
      console.log(`✅ Cycle #${cycle.cycleNumber} completed:`);
      console.log(`   Duration: ${cycle.duration}ms`);
      console.log(`   Skills: ${cycle.skillsExecuted} executed, ${cycle.skillsSucceeded} succeeded`);
      console.log(`   Devices: ${cycle.devicesSynced} synced`);
      console.log(`   Proposals: ${cycle.proposalsGenerated} generated`);
      console.log(`   Revenue: $${cycle.revenueGenerated}`);
      console.log(`   Learning: ${cycle.learningEntriesCollected} entries`);
      console.log(`   Health: ${cycle.systemHealth}`);
    });

    scheduler.on('cycleError', (cycle) => {
      console.log(`❌ Cycle #${cycle.cycleNumber} failed:`);
      console.log(`   Errors: ${cycle.errors?.join(', ')}`);
    });

    scheduler.on('alert', (alert) => {
      console.log(`🚨 Alert [${alert.type.toUpperCase()}]: ${alert.message}`);
    });

    scheduler.on('statusUpdate', (status) => {
      console.log(`📊 Status update: ${status.isRunning ? 'Running' : 'Stopped'} (${status.totalCycles} cycles)`);
    });

    console.log('✅ Auto Scheduler initialized\n');

    // Step 3: Demonstrate scheduler control
    console.log('🎮 Step 3: Demonstrating Scheduler Control...');
    console.log('----------------------------------------\n');

    // Start the scheduler
    console.log('▶️ Starting scheduler...');
    scheduler.start();
    
    // Wait for a few cycles
    console.log('⏳ Running for 2 cycles (60 seconds total)...');
    await new Promise(resolve => setTimeout(resolve, 65000));

    // Pause the scheduler
    console.log('⏸️ Pausing scheduler...');
    scheduler.pause();
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Resume the scheduler
    console.log('▶️ Resuming scheduler...');
    scheduler.resume();
    
    // Wait for another cycle
    await new Promise(resolve => setTimeout(resolve, 35000));

    // Change interval
    console.log('⏱️ Changing interval to 15 seconds...');
    scheduler.setIntervalMs(15000);
    
    // Wait for a few more cycles
    await new Promise(resolve => setTimeout(resolve, 45000));

    // Stop the scheduler
    console.log('🛑 Stopping scheduler...');
    scheduler.stop();

    console.log('✅ Scheduler control demonstration complete\n');

    // Step 4: Show final status and metrics
    console.log('📊 Step 4: Final Status and Metrics...');
    console.log('=====================================\n');

    const finalStatus = scheduler.getStatus();
    console.log('Final Status:');
    console.log(`- Running: ${finalStatus.isRunning}`);
    console.log(`- Current Cycle: #${finalStatus.currentCycle}`);
    console.log(`- Total Cycles: ${finalStatus.totalCycles}`);
    console.log(`- Interval: ${finalStatus.intervalMs}ms`);
    console.log(`- Uptime: ${finalStatus.uptime}`);
    console.log(`- Consecutive Failures: ${finalStatus.consecutiveFailures}`);
    console.log(`- Performance:`);
    console.log(`  - Avg Cycle Time: ${finalStatus.performance.avgCycleTime.toFixed(0)}ms`);
    console.log(`  - Success Rate: ${(finalStatus.performance.successRate * 100).toFixed(1)}%`);
    console.log(`  - Error Rate: ${(finalStatus.performance.errorRate * 100).toFixed(1)}%`);

    // Show recent cycles
    const recentCycles = scheduler.getCycleHistory(5);
    console.log('\nRecent Cycles:');
    recentCycles.forEach((cycle, index) => {
      console.log(`${index + 1}. Cycle #${cycle.cycleNumber}: ${cycle.success ? '✅' : '❌'} (${cycle.duration}ms)`);
      console.log(`   Skills: ${cycle.skillsSucceeded}/${cycle.skillsExecuted}`);
      console.log(`   Revenue: $${cycle.revenueGenerated}`);
      if (cycle.errors.length > 0) {
        console.log(`   Errors: ${cycle.errors.join(', ')}`);
      }
    });

    // Show recent alerts
    const recentAlerts = scheduler.getRecentAlerts(10);
    if (recentAlerts.length > 0) {
      console.log('\nRecent Alerts:');
      recentAlerts.forEach((alert, index) => {
        console.log(`${index + 1}. [${alert.type.toUpperCase()}] ${alert.message}`);
      });
    }

    // Step 5: Generate comprehensive report
    console.log('\n📄 Step 5: Generating Comprehensive Report...');
    const report = scheduler.generateReport();
    console.log('✅ Report generated (check logs for full report)');
    console.log('\n' + '='.repeat(50));
    console.log('REPORT PREVIEW:');
    console.log(report.split('\n').slice(0, 20).join('\n'));
    console.log('...');
    console.log('='.repeat(50));

    // Step 6: Demonstrate mobile UI integration
    console.log('\n📱 Step 6: Mobile UI Integration...');
    console.log('=====================================\n');

    console.log('Mobile UI Features:');
    console.log('✅ Start/Stop scheduler controls');
    console.log('✅ Pause/Resume functionality');
    console.log('✅ Interval adjustment (30s, 60s, 120s, 300s)');
    console.log('✅ Real-time status monitoring');
    console.log('✅ Performance metrics display');
    console.log('✅ Recent cycles history');
    console.log('✅ Alert notifications');
    console.log('✅ Configuration toggles');
    console.log('✅ Schedule information');

    console.log('\nPush Notifications:');
    console.log('🔔 New skill proposals generated');
    console.log('🔔 Simulation failures detected');
    console.log('🔔 Device desync or unauthorized access');
    console.log('🔔 Financial anomalies');
    console.log('🔔 Critical system errors');

    console.log('\nDashboard Integration:');
    console.log('📊 Real-time metrics update every cycle');
    console.log('📊 Skill usage statistics');
    console.log('📊 Device synchronization status');
    console.log('📊 Financial summaries');
    console.log('📊 Learning progress tracking');
    console.log('📊 System health monitoring');

    // Step 7: Demonstrate advanced features
    console.log('\n🔧 Step 7: Advanced Features...');
    console.log('=====================================\n');

    console.log('Emergency Mode:');
    console.log('🚨 Automatically enabled on consecutive failures');
    console.log('🚨 Limits operations to essential functions');
    console.log('🚨 Increases monitoring frequency');
    console.log('🚨 Maintains owner communication');

    console.log('\nHealth Monitoring:');
    console.log('🏥 Continuous system health checks');
    console.log('🏥 Performance threshold monitoring');
    console.log('🏥 Alert frequency analysis');
    console.log('🏥 Uptime tracking');

    console.log('\nData Management:');
    console.log('📚 Automatic learning data collection');
    console.log('📚 Quality filtering and validation');
    console.log('📚 Metadata tagging and timestamps');
    console.log('📚 Log retention and cleanup');

    console.log('\nSecurity Features:');
    console.log('🔐 Trust-based device access');
    console.log('🔐 Encrypted state synchronization');
    console.log('🔐 Unauthorized device detection');
    console.log('🔐 Security violation alerts');

    // Step 8: Performance optimization
    console.log('\n⚡ Step 8: Performance Optimization...');
    console.log('=====================================\n');

    console.log('Optimization Features:');
    console.log('🎯 Adaptive cycle timing based on system load');
    console.log('🎯 Resource allocation optimization');
    console.log('🎯 Error recovery mechanisms');
    console.log('🎯 Concurrent operation management');
    console.log('🎯 Memory usage optimization');

    console.log('\nPerformance Metrics:');
    const avgCycleTime = finalStatus.performance.avgCycleTime;
    const successRate = finalStatus.performance.successRate;
    const cyclesPerHour = (3600000 / finalStatus.intervalMs) * successRate;
    
    console.log(`⚡ Average Cycle Time: ${avgCycleTime.toFixed(0)}ms`);
    console.log(`⚡ Success Rate: ${(successRate * 100).toFixed(1)}%`);
    console.log(`⚡ Cycles Per Hour: ${cyclesPerHour.toFixed(1)}`);
    console.log(`⚡ Daily Capacity: ${(cyclesPerHour * 24).toFixed(0)} cycles`);

    // Step 9: Shutdown
    console.log('\n🔄 Step 9: System Shutdown...');
    console.log('=====================================\n');

    await scheduler.shutdown();
    console.log('✅ Auto-cycle system shutdown complete');

  } catch (error) {
    console.error('❌ Auto-cycle system demo failed:', error);
  }
}

// Demonstrate mobile UI integration
async function demonstrateMobileUIIntegration() {
  console.log('📱 Mobile UI Integration Demo');
  console.log('============================\n');

  console.log('Mobile Screen Features:');
  console.log('');
  console.log('📱 SchedulerControlScreen:');
  console.log('  - Real-time status display');
  console.log('  - Start/Stop/Pause/Resume controls');
  console.log('  - Interval adjustment (30s, 60s, 120s, 300s)');
  console.log('  - Performance metrics dashboard');
  console.log('  - Recent cycles history');
  console.log('  - Alert notifications');
  console.log('  - Configuration toggles');
  console.log('  - Schedule information');
  console.log('');
  
  console.log('📱 Integration Points:');
  console.log('  - Navigation from main app');
  console.log('  - Real-time updates via WebSocket');
  console.log('  - Push notifications for critical events');
  console.log('  - Offline mode support');
  console.log('  - Biometric authentication for controls');
  console.log('');
  
  console.log('📱 User Experience:');
  console.log('  - Intuitive control interface');
  console.log('  - Clear status indicators');
  console.log('  - One-tap operations');
  console.log('  - Real-time feedback');
  console.log('  - Comprehensive metrics');
  console.log('  - Alert management');
  console.log('');
  
  console.log('📱 Technical Implementation:');
  console.log('  - React Native components');
  console.log('  - Event-driven updates');
  console.log('  - Local state management');
  console.log('  - Responsive design');
  console.log('  - Error boundary handling');
  console.log('  - Performance optimization');
}

// Demonstrate notification system
async function demonstrateNotificationSystem() {
  console.log('🔔 Notification System Demo');
  console.log('========================\n');

  console.log('Notification Types:');
  console.log('');
  console.log('🔔 INFO Notifications:');
  console.log('  - Scheduler started/stopped');
  console.log('  - Configuration changes');
  console.log('  - System status updates');
  console.log('  - Performance milestones');
  console.log('');
  
  console.log('⚠️ WARNING Notifications:');
  console.log('  - High error rates detected');
  console.log('  - Device synchronization issues');
  console.log('  - Performance degradation');
  console.log('  - Resource utilization warnings');
  console.log('');
  
  console.log('❌ ERROR Notifications:');
  console.log('  - Cycle execution failures');
  console.log('  - Skill simulation errors');
  console.log('  - System health issues');
  console.log('  - Configuration problems');
  console.log('');
  
  console.log('🚨 CRITICAL Notifications:');
  console.log('  - Emergency mode activation');
  console.log('  - Security breaches');
  console.log('  - Financial anomalies');
  console.log('  - System failure imminent');
  console.log('');
  
  console.log('📱 Mobile Integration:');
  console.log('  - Push notifications via Expo');
  console.log('  - In-app notification center');
  console.log('  - Alert prioritization');
  console.log('  - Notification history');
  console.log('  - Do-not-disturb mode');
  console.log('  - Sound/vibration options');
}

// Demonstrate emergency scenarios
async function demonstrateEmergencyScenarios() {
  console.log('🚨 Emergency Scenarios Demo');
  console.log('========================\n');

  console.log('Scenario 1: Consecutive Failures');
  console.log('-----------------------------------');
  console.log('📊 3 consecutive cycle failures detected');
  console.log('🚨 Auto-enabling emergency mode');
  console.log('⏸️ Auto-pausing scheduler');
  console.log('🔔 Critical alert sent to owner');
  console.log('📱 Mobile app shows emergency banner');
  console.log('🔄 Limited to essential operations only');
  console.log('');

  console.log('Scenario 2: Security Breach');
  console.log('-----------------------------------');
  console.log('🔓 Unauthorized device access attempt');
  console.log('🚨 Immediate security alert');
  console.log('🔐 Auto-revoking device access');
  console.log('📊 Security audit triggered');
  console.log('📱 Owner notified with details');
  console.log('🔄 All operations suspended');
  console.log('');

  console.log('Scenario 3: Financial Anomaly');
  console.log('-----------------------------------');
  console.log('💰 Unusual revenue spike detected');
  console.log('🚨 Financial anomaly alert');
  console.log('📊 Auto-freeze financial operations');
  console.log('🔍 Automatic audit initiated');
  console.log('📱 Owner notified with details');
  console.log('🔄 Normal operations continue');
  console.log('');

  console.log('Scenario 4: System Health Critical');
  console.log('-----------------------------------');
  console.log('🏥 System health score: 15%');
  console.log('🚨 Critical health alert');
  console.log('📊 Auto-enable emergency mode');
  console.log('⏸️ Auto-pause non-essential operations');
  console.log('📱 Owner notified with health report');
  console.log('🔄 Recovery mode activated');
  console.log('');

  console.log('Emergency Mode Features:');
  console.log('✅ Automatic detection of critical conditions');
  console.log('✅ Immediate system protection');
  console.log('✅ Owner notification with details');
  console.log('✅ Limited operation mode');
  console.log('✅ Enhanced monitoring');
  console.log('✅ Recovery assistance');
}

// Main demonstration function
async function runAutoCycleDemo() {
  console.log('🚀 ACEY AUTO-CYCLE SYSTEM DEMONSTRATION');
  console.log('=====================================\n');

  try {
    await demonstrateAutoCycleSystem();
    await demonstrateMobileUIIntegration();
    await demonstrateNotificationSystem();
    await demonstrateEmergencyScenarios();
    
    console.log('\n🎉 AUTO-CYCLE DEMONSTRATION COMPLETE!');
    console.log('=====================================\n');
    
    console.log('Key Achievements:');
    console.log('✅ Autonomous execution cycles');
    console.log('✅ Real-time monitoring and control');
    console.log('✅ Mobile UI integration');
    console.log('✅ Comprehensive notification system');
    console.log('✅ Emergency mode protection');
    console.log('✅ Performance optimization');
    console.log('✅ Owner control and oversight');
    console.log('✅ Continuous learning integration');
    console.log('✅ Cross-device synchronization');
    console.log('✅ Enterprise-grade security');
    
    console.log('\n🚀 Acey is now a fully autonomous AI system!');
    console.log('📱 Mobile controlled, 📊 Real-time monitored, 🚨 Emergency protected');
    console.log('🔄 Self-optimizing, 📚 Continuously learning, 🔐 Secure by design');
    
  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

// Export for use in other modules
export {
  demonstrateAutoCycleSystem,
  demonstrateMobileUIIntegration,
  demonstrateNotificationSystem,
  demonstrateEmergencyScenarios,
  runAutoCycleDemo
};

// Run demo if this file is executed directly
if (require.main === module) {
  runAutoCycleDemo().catch(console.error);
}
