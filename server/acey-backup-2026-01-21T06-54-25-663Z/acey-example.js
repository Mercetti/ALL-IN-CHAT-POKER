/**
 * ACEY EXECUTION PACK EXAMPLE
 * 
 * This demonstrates how to use the complete constitutional framework
 * All new Acey modules should follow this pattern
 */

const AceyExecutionPack = require('./server/acey/AceyExecutionPack');
const db = require('./server/db');

async function initializeAcey() {
  console.log('🧠 Initializing Acey Execution Pack...');
  
  // Initialize the complete execution pack
  const acey = new AceyExecutionPack({
    backendUrl: 'http://localhost:8080',
    adminToken: process.env.ADMIN_TOKEN || 'your-admin-token',
    db: db,
    logger: {
      info: (msg, data) => console.log(`ℹ️ ${msg}`, data || ''),
      warn: (msg, data) => console.log(`⚠️ ${msg}`, data || ''),
      error: (msg, data) => console.log(`❌ ${msg}`, data || '')
    }
  });
  
  await acey.initialize();
  
  console.log('✅ Acey Execution Pack ready!');
  console.log('');
  
  // Demonstrate constitutional enforcement
  await demonstrateSecurityMonitoring(acey);
  await demonstrateSkillExecution(acey);
  await demonstrateApprovalWorkflow(acey);
  await demonstrateInvestorDashboard(acey);
  
  console.log('');
  console.log('🚀 Acey is now running as a governed AI operations platform');
  console.log('');
  console.log('Available commands:');
  console.log('- acey.executeSkill("SecurityObserver", "status")');
  console.log('- acey.executeSkill("FileTools", "scan file", {filePath: "./server.js"})');
  console.log('- acey.changeExecutionMode("simulate", "Testing new feature", "founder")');
  console.log('- acey.getSystemStatus()');
  console.log('- acey.getInvestorDashboard()');
  
  return acey;
}

async function demonstrateSecurityMonitoring(acey) {
  console.log('🛡️ Demonstrating Security Monitoring...');
  
  // Execute security observer
  const result = await acey.executeSkill('SecurityObserver', 'status');
  
  if (result.success) {
    console.log('✅ Security monitoring active:', result.result.message);
  } else {
    console.log('⚠️ Security monitoring requires attention:', result.reason);
  }
}

async function demonstrateSkillExecution(acey) {
  console.log('⚡ Demonstrating Constitutional Skill Execution...');
  
  // Try to execute a skill that requires approval
  const result = await acey.executeSkill('FileTools', 'delete system files', {
    filePath: '/etc/passwd' // This should be blocked
  });
  
  if (!result.success) {
    console.log('✅ Constitution correctly blocked dangerous action:', result.reason);
    
    if (result.requiresApproval) {
      console.log('📋 Approval requested:', result.approvalId);
    }
  }
  
  // Try a safe action
  const safeResult = await acey.executeSkill('FileTools', 'create archive', {
    files: ['./README.md'],
    format: 'zip'
  });
  
  if (safeResult.success) {
    console.log('✅ Safe action executed:', safeResult.result.message);
  }
}

async function demonstrateApprovalWorkflow(acey) {
  console.log('📋 Demonstrating Approval Workflow...');
  
  // Request approval for a sensitive action
  const approvalId = await acey.requestApproval('modify_production_config', {
    reason: 'Update production configuration for new feature',
    riskLevel: 'MEDIUM'
  });
  
  console.log('📝 Approval requested:', approvalId);
  
  // Simulate founder approval
  const approval = await acey.processApproval(approvalId, true, 'Approved after review', 'founder');
  
  console.log('✅ Approval processed:', approval.status);
}

async function demonstrateInvestorDashboard(acey) {
  console.log('📊 Demonstrating Investor Dashboard...');
  
  const dashboard = await acey.getInvestorDashboard();
  
  console.log('📈 Investor Dashboard Summary:');
  console.log(`- Constitutional Compliance: ${dashboard.overview.constitutionalCompliance}`);
  console.log(`- Security Incidents (24h): ${dashboard.security.alertsLast24h}`);
  console.log(`- Active Skills: ${dashboard.overview.skillsActive}`);
  console.log(`- Uptime: ${dashboard.overview.uptimeHours} hours`);
  console.log(`- Trust Level: ${dashboard.overview.trustLevel}`);
  console.log(`- Financial Operations Ready: ${dashboard.financial.operationsReady}`);
  console.log(`- Scalability Score: ${dashboard.scalability.skillsModular ? 'HIGH' : 'MEDIUM'}`);
}

// Example usage functions
async function exampleSecurityMonitoring(acey) {
  // Check system security status
  const status = await acey.executeSkill('SecurityObserver', 'status');
  console.log('Security Status:', status);
  
  // Get recent security alerts
  const alerts = await acey.executeSkill('SecurityObserver', 'alerts');
  console.log('Recent Alerts:', alerts);
}

async function exampleFileOperations(acey) {
  // Create secure archive
  const archive = await acey.executeSkill('FileTools', 'create archive', {
    files: ['./src', './server'],
    format: 'zip',
    compression: 6
  });
  console.log('Archive Created:', archive);
  
  // Scan file for security
  const scan = await acey.executeSkill('FileTools', 'scan file', {
    filePath: './uploaded-file.js'
  });
  console.log('File Scan:', scan);
}

async function exampleConstitutionalEnforcement(acey) {
  // Try to execute forbidden action
  const forbidden = await acey.executeSkill('AnySkill', 'access_kernel_operations');
  console.log('Forbidden Action:', forbidden); // Should be blocked
  
  // Try action requiring approval
  const needsApproval = await acey.executeSkill('FileTools', 'modify_system_files');
  console.log('Approval Required:', needsApproval); // Should require approval
  
  // Execute safe action
  const safe = await acey.executeSkill('SecurityObserver', 'monitor_systems');
  console.log('Safe Action:', safe); // Should succeed
}

async function exampleModeChanges(acey) {
  // Change to simulation mode
  await acey.changeExecutionMode('simulate', 'Testing new security feature', 'founder');
  console.log('Changed to simulation mode');
  
  // Change to prepare mode
  await acey.changeExecutionMode('prepare', 'Preparing deployment package', 'founder');
  console.log('Changed to prepare mode');
  
  // Back to observe mode
  await acey.changeExecutionMode('observe', 'Normal operations', 'founder');
  console.log('Changed to observe mode');
}

async function exampleSkillProposal(acey) {
  // Propose new skill
  const proposal = await acey.proposeSkill({
    name: 'DataAnalyzer',
    description: 'Analyzes dataset patterns and anomalies',
    permissions: ['read_datasets', 'analyze_patterns'],
    accessesSensitiveData: false,
    modifiesSystem: false,
    monetizationTier: 'Pro',
    riskLevel: 'LOW'
  });
  
  console.log('Skill Proposal:', proposal);
}

// Initialize if this file is run directly
if (require.main === module) {
  initializeAcey().catch(console.error);
}

module.exports = {
  initializeAcey,
  exampleSecurityMonitoring,
  exampleFileOperations,
  exampleConstitutionalEnforcement,
  exampleModeChanges,
  exampleSkillProposal
};
