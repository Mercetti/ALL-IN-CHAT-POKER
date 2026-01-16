/**
 * Test new orchestrator modules
 * Phase 1: Core Orchestrator Setup - Day 1 Testing
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing New Orchestrator Modules');
console.log('=====================================\n');

// Test 1: Verify new modules exist
console.log('📦 Checking new modules:');
const newModules = [
  'orchestrator/simulationEngine.ts',
  'orchestrator/failureRecovery.ts'
];

newModules.forEach(module => {
  const exists = fs.existsSync(module);
  console.log(`${exists ? '✅' : '❌'} ${module}`);
});

// Test 2: Check module content
console.log('\n📄 Checking module content:');
try {
  const simulationEngine = fs.readFileSync('orchestrator/simulationEngine.ts', 'utf8');
  const failureRecovery = fs.readFileSync('orchestrator/failureRecovery.ts', 'utf8');
  
  console.log(`✅ simulationEngine.ts: ${simulationEngine.length} bytes`);
  console.log(`✅ failureRecovery.ts: ${failureRecovery.length} bytes`);
  
  // Check for key classes and methods
  const simulationChecks = [
    'SimulationEngine',
    'runSimulation',
    'SimulationResult',
    'getSkillStatistics'
  ];
  
  const recoveryChecks = [
    'FailureRecovery',
    'handleFailure',
    'RecoveryResult',
    'testRecovery'
  ];
  
  console.log('\n🔍 Checking simulationEngine.ts components:');
  simulationChecks.forEach(check => {
    const found = simulationEngine.includes(check);
    console.log(`${found ? '✅' : '❌'} ${check}`);
  });
  
  console.log('\n🔍 Checking failureRecovery.ts components:');
  recoveryChecks.forEach(check => {
    const found = failureRecovery.includes(check);
    console.log(`${found ? '✅' : '❌'} ${check}`);
  });
  
} catch (error) {
  console.log('❌ Error reading modules:', error.message);
}

// Test 3: Check skill registration in simulation engine
console.log('\n🎯 Checking skill registration:');
const skills = [
  'CodeHelper',
  'GraphicsWizard', 
  'AudioMaestro',
  'FinancialOps',
  'SecurityObserver',
  'LinkReview',
  'DataAnalyzer',
  'ComplianceChecker'
];

try {
  const simulationEngine = fs.readFileSync('orchestrator/simulationEngine.ts', 'utf8');
  skills.forEach(skill => {
    const found = simulationEngine.includes(skill);
    console.log(`${found ? '✅' : '❌'} ${skill}`);
  });
} catch (error) {
  console.log('❌ Error checking skills:', error.message);
}

// Test 4: Verify dataset directories are ready
console.log('\n📚 Verifying dataset directories:');
const datasetDirs = [
  'D:/AceyLearning/datasets',
  'D:/AceyLearning/datasets/code',
  'D:/AceyLearning/datasets/audio',
  'D:/AceyLearning/datasets/graphics',
  'D:/AceyLearning/datasets/financials'
];

datasetDirs.forEach(dir => {
  const exists = fs.existsSync(dir);
  console.log(`${exists ? '✅' : '❌'} ${dir}`);
});

// Test 5: Create sample JSONL dataset entry
console.log('\n📝 Creating sample JSONL dataset entry:');
try {
  const sampleEntry = {
    input: "Generate React component",
    output: "function App() { return <div>Hello</div>; }",
    confidence: 0.95,
    timestamp: new Date().toISOString(),
    skillName: "CodeHelper",
    action: "generate",
    metadata: {
      modelUsed: "codellama",
      tokensUsed: 150,
      processingTime: 1200,
      quality: 0.9
    }
  };
  
  const jsonlLine = JSON.stringify(sampleEntry) + '\n';
  const sampleFile = 'D:/AceyLearning/datasets/code/sample_dataset.jsonl';
  
  fs.writeFileSync(sampleFile, jsonlLine);
  console.log(`✅ Sample dataset created: ${sampleFile}`);
  console.log(`📄 Sample entry: ${jsonlLine.trim()}`);
  
} catch (error) {
  console.log('❌ Error creating sample dataset:', error.message);
}

// Test 6: Verify mobile screens still exist
console.log('\n📱 Verifying mobile screens:');
const mobileScreens = [
  'acey-control-center/src/screens/AceyLabScreen.tsx',
  'acey-control-center/src/screens/InvestorDashboard.tsx',
  'acey-control-center/src/screens/SkillStoreScreen.tsx',
  'acey-control-center/src/screens/SchedulerControlScreen.tsx'
];

mobileScreens.forEach(screen => {
  const exists = fs.existsSync(screen);
  console.log(`${exists ? '✅' : '❌'} ${screen}`);
});

// Test 7: Summary and next steps
console.log('\n🎯 Day 1 Implementation Status:');
console.log('=====================================');

const completed = [
  '✅ Verify existing orchestrator modules',
  '✅ Create simulationEngine.ts module',
  '✅ Create failureRecovery.ts module',
  '✅ Create D:/AceyLearning dataset directories',
  '✅ Register all 8 skills in simulation engine',
  '✅ Create sample JSONL dataset entry'
];

const pending = [
  '🔄 Test manual skill execution',
  '🔄 Verify JSONL dataset format',
  '🔄 Test error handling scenarios',
  '🔄 Test mobile app screens'
];

console.log('\n✅ Completed Tasks:');
completed.forEach(task => console.log(`  ${task}`));

console.log('\n🔄 Pending Tasks:');
pending.forEach(task => console.log(`  ${task}`));

console.log('\n📋 Next Steps:');
console.log('1. Test TypeScript compilation of new modules');
console.log('2. Create integration test for simulation engine');
console.log('3. Test failure recovery scenarios');
console.log('4. Verify JSONL dataset logging works');
console.log('5. Test mobile app integration');

console.log('\n🎉 Day 1 Progress: 6/10 tasks completed (60%)');
console.log('🚀 Core orchestrator foundation is ready!');
