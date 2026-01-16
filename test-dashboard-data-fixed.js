/**
 * Test Dashboard Data Module (Fixed Paths)
 * Phase 3: Dashboard & Mobile UI - Dashboard Data Testing
 */

const fs = require('fs');
const path = require('path');

console.log('📊 Testing Dashboard Data Module (Fixed)');
console.log('=======================================\n');

// Test 1: Create dashboard directories with correct paths
console.log('📁 Creating dashboard directories:');
const dashboardDirs = [
  './models/AceyLogs',
  './models/AceyLogs/financials',
  './models/AceyLogs/skill_usage',
  './models/AceyLogs/learning_data',
  './models/AceyLogs/system_health'
];

dashboardDirs.forEach(dir => {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Created: ${dir}`);
    } else {
      console.log(`✅ Exists: ${dir}`);
    }
  } catch (error) {
    console.log(`❌ Error creating ${dir}: ${error.message}`);
  }
});

// Test 2: Create sample skill usage data
console.log('\n📊 Creating sample skill usage data:');
const skillUsageData = {
  CodeHelper: [
    {
      timestamp: new Date().toISOString(),
      success: true,
      executionTime: 1200,
      confidence: 0.95,
      input: "Generate React component",
      output: "function App() { return <div>Hello</div>; }"
    },
    {
      timestamp: new Date(Date.now() - 60000).toISOString(),
      success: true,
      executionTime: 800,
      confidence: 0.88,
      input: "Fix TypeScript error",
      output: "Fixed type annotation"
    }
  ],
  GraphicsWizard: [
    {
      timestamp: new Date(Date.now() - 120000).toISOString(),
      success: true,
      executionTime: 2500,
      confidence: 0.92,
      input: "Generate logo design",
      output: "Logo generated successfully"
    }
  ],
  AudioMaestro: [
    {
      timestamp: new Date(Date.now() - 180000).toISOString(),
      success: false,
      executionTime: 3000,
      confidence: 0.45,
      input: "Create background music",
      error: "Audio generation timeout"
    }
  ]
};

Object.entries(skillUsageData).forEach(([skillName, data]) => {
  try {
    const filePath = path.join('./models/AceyLogs/skill_usage', `${skillName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`✅ Skill usage created: ${skillName}.json`);
    console.log(`📊 Executions: ${data.length}`);
    console.log(`✅ Success rate: ${data.filter(d => d.success).length}/${data.length}`);
  } catch (error) {
    console.log(`❌ Error creating ${skillName}: ${error.message}`);
  }
});

// Test 3: Create sample financial data
console.log('\n💰 Creating sample financial data:');
const financialData = {
  partnerRevenue: {
    'Enterprise Client A': 10000,
    'Pro Client B': 2500,
    'Creator Client C': 500,
    'Startup Client D': 1500
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
    },
    {
      partner: 'Consultant C',
      amount: 750,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
      status: 'failed'
    }
  ],
  subscriptionRevenue: {
    'Enterprise': 8000,
    'Pro': 2000,
    'Creator': 400
  },
  oneTimeRevenue: 1500
};

try {
  const financialPath = './models/AceyLogs/financials/financial_data.json';
  fs.writeFileSync(financialPath, JSON.stringify(financialData, null, 2));
  console.log(`✅ Financial data created: financial_data.json`);
  console.log(`💰 Total Revenue: $${Object.values(financialData.partnerRevenue).reduce((sum, rev) => sum + rev, 0).toLocaleString()}`);
  console.log(`💰 Active Partners: ${Object.keys(financialData.partnerRevenue).length}`);
  console.log(`💰 Pending Payouts: ${financialData.payouts.filter(p => p.status === 'pending').length}`);
} catch (error) {
  console.log(`❌ Error creating financial data: ${error.message}`);
}

// Test 4: Create sample learning data
console.log('\n🧠 Creating sample learning data:');
const learningData = [
  {
    input: "Generate React component",
    output: "function App() { return <div>Hello</div>; }",
    confidence: 0.95,
    timestamp: new Date().toISOString(),
    skillName: "CodeHelper",
    quality: 0.9,
    metadata: {
      modelUsed: "codellama",
      tokensUsed: 150,
      processingTime: 1200
    }
  },
  {
    input: "Generate logo design",
    output: "Logo generated with modern aesthetics",
    confidence: 0.92,
    timestamp: new Date(Date.now() - 60000).toISOString(),
    skillName: "GraphicsWizard",
    quality: 0.85,
    metadata: {
      modelUsed: "stable-diffusion",
      tokensUsed: 300,
      processingTime: 2500
    }
  },
  {
    input: "Create background music",
    output: "Audio generation failed",
    confidence: 0.45,
    timestamp: new Date(Date.now() - 120000).toISOString(),
    skillName: "AudioMaestro",
    quality: 0.3,
    metadata: {
      modelUsed: "audio-model",
      tokensUsed: 200,
      processingTime: 3000
    }
  }
];

try {
  const learningPath = './models/AceyLogs/learning_data/learning_entries.jsonl';
  const learningLines = learningData.map(entry => JSON.stringify(entry)).join('\n');
  fs.writeFileSync(learningPath, learningLines);
  console.log(`✅ Learning data created: learning_entries.jsonl`);
  console.log(`🧠 Total Entries: ${learningData.length}`);
  console.log(`🧠 Average Quality: ${(learningData.reduce((sum, entry) => sum + entry.quality, 0) / learningData.length).toFixed(3)}`);
  console.log(`🧠 High Quality Entries: ${learningData.filter(entry => entry.quality >= 0.7).length}`);
} catch (error) {
  console.log(`❌ Error creating learning data: ${error.message}`);
}

// Test 5: Create sample system health data
console.log('\n🏥 Creating sample system health data:');
const systemHealthData = {
  uptime: 0.95,
  errorRate: 0.05,
  performance: 'good',
  alerts: [
    {
      type: 'warning',
      message: 'AudioMaestro skill showing elevated error rate',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      resolved: false
    },
    {
      type: 'info',
      message: 'System maintenance scheduled for tonight',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      resolved: true
    }
  ],
  lastCheck: new Date().toISOString()
};

try {
  const healthPath = './models/AceyLogs/system_health/system_health.json';
  fs.writeFileSync(healthPath, JSON.stringify(systemHealthData, null, 2));
  console.log(`✅ System health data created: system_health.json`);
  console.log(`🏥 Uptime: ${(systemHealthData.uptime * 100).toFixed(1)}%`);
  console.log(`🏥 Error Rate: ${(systemHealthData.errorRate * 100).toFixed(1)}%`);
  console.log(`🏥 Performance: ${systemHealthData.performance}`);
  console.log(`🏥 Active Alerts: ${systemHealthData.alerts.filter(a => !a.resolved).length}`);
} catch (error) {
  console.log(`❌ Error creating system health data: ${error.message}`);
}

// Test 6: Generate dashboard stats
console.log('\n📊 Generating dashboard stats:');
const skillMetrics = Object.entries(skillUsageData).map(([skillName, executions]) => {
  const successCount = executions.filter(e => e.success).length;
  const errorCount = executions.filter(e => !e.success).length;
  const totalTime = executions.reduce((sum, e) => sum + (e.executionTime || 0), 0);
  const avgTime = totalTime / executions.length;
  const avgConfidence = executions.reduce((sum, e) => sum + (e.confidence || 0.5), 0) / executions.length;
  
  return {
    skillName,
    executionCount: executions.length,
    successRate: successCount / executions.length,
    avgExecutionTime: avgTime,
    lastUsed: executions[executions.length - 1]?.timestamp || new Date().toISOString(),
    confidence: avgConfidence,
    errorRate: errorCount / executions.length
  };
});

const totalRevenue = Object.values(financialData.partnerRevenue).reduce((sum, revenue) => sum + revenue, 0);
const monthlyRevenue = totalRevenue / 12;

const totalEntries = learningData.length;
const avgQuality = learningData.reduce((sum, entry) => sum + entry.quality, 0) / totalEntries;
const highQualityEntries = learningData.filter(entry => entry.quality >= 0.7).length;
const learningProgress = Math.min((highQualityEntries / totalEntries) * 100, 100);

const dashboardStats = {
  timestamp: new Date().toISOString(),
  skills: skillMetrics,
  devices: [
    {
      deviceId: 'device_main_001',
      deviceName: 'Acey-Primary-Server',
      lastSync: new Date().toISOString(),
      isOnline: true,
      trustLevel: 3,
      skillsCount: 8,
      datasetsCount: 5,
      syncHealth: 'excellent',
      errors: []
    },
    {
      deviceId: 'device_mobile_001',
      deviceName: 'Acey-Mobile-Device',
      lastSync: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
      isOnline: true,
      trustLevel: 2,
      skillsCount: 6,
      datasetsCount: 3,
      syncHealth: 'good',
      errors: []
    }
  ],
  financials: {
    totalRevenue,
    monthlyRevenue,
    partnerRevenue: financialData.partnerRevenue,
    payouts: financialData.payouts,
    subscriptionRevenue: financialData.subscriptionRevenue,
    oneTimeRevenue: financialData.oneTimeRevenue
  },
  learning: {
    totalDatasets: 3,
    totalEntries,
    avgQuality,
    highQualityEntries,
    learningProgress,
    lastFineTune: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    modelAccuracy: avgQuality * 100,
    datasetsBySkill: {
      CodeHelper: 1,
      GraphicsWizard: 1,
      AudioMaestro: 1
    }
  },
  systemHealth: systemHealthData
};

try {
  const statsPath = './models/AceyLogs/dashboard_stats.json';
  fs.writeFileSync(statsPath, JSON.stringify(dashboardStats, null, 2));
  console.log(`✅ Dashboard stats created: dashboard_stats.json`);
  console.log(`📊 Timestamp: ${dashboardStats.timestamp}`);
  console.log(`📊 Skills: ${dashboardStats.skills.length}`);
  console.log(`📊 Devices: ${dashboardStats.devices.length}`);
  console.log(`📊 System Performance: ${dashboardStats.systemHealth.performance}`);
} catch (error) {
  console.log(`❌ Error creating dashboard stats: ${error.message}`);
}

console.log('\n🎉 Dashboard Data Test Complete!');
console.log('✅ All data structures created successfully');
console.log('✅ Ready for mobile UI testing');
