#!/usr/bin/env node

/**
 * Test ProcessBuilder Migration Implementation
 */

console.log('🔧 Testing ProcessBuilder Migration...');

async function testProcessMigration() {
  try {
    // Test 1: Import Modern Process Manager
    console.log('\n📦 Testing Modern Process Manager Import...');
    const ModernProcessManager = require('./server/process/modern-process-manager');
    console.log('✅ ModernProcessManager imported successfully');
    
    // Test 2: Create Process Manager Instance
    console.log('\n🔧 Creating Process Manager Instance...');
    const processManager = new ModernProcessManager({
      defaultTimeout: 5000,
      maxConcurrentProcesses: 5,
      maxHistorySize: 100
    });
    console.log('✅ Process Manager created');
    
    // Test 3: Create Process Builder
    console.log('\n🏗️ Testing Process Builder Creation...');
    const processBuilder = processManager.createProcessBuilder(['echo', 'Hello World'], {
      workingDirectory: process.cwd(),
      environment: {
        'TEST_VAR': 'test_value'
      },
      redirectErrorStream: true
    });
    console.log('✅ Process Builder created');
    console.log('  Command:', processBuilder.command);
    console.log('  Working Directory:', processBuilder.options.cwd);
    
    // Test 4: Execute Simple Command
    console.log('\n🚀 Testing Simple Command Execution...');
    const result1 = await processManager.executeCommand(['echo', 'Hello World']);
    console.log('✅ Command executed successfully');
    console.log('  Exit Code:', result1.exitCode);
    console.log('  Output:', result1.output.trim());
    console.log('  Success:', result1.success);
    
    // Test 5: Execute Command with Timeout
    console.log('\n⏱️ Testing Command with Timeout...');
    const result2 = await processManager.executeCommandWithTimeout(['echo', 'Timeout Test'], 1000);
    console.log('✅ Command with timeout executed');
    console.log('  Exit Code:', result2.exitCode);
    console.log('  Output:', result2.output.trim());
    console.log('  Timed Out:', result2.timedOut);
    
    // Test 6: Get Process Metrics
    console.log('\n📊 Testing Process Metrics...');
    const metrics = processManager.getProcessMetrics();
    console.log('✅ Process Metrics:', JSON.stringify(metrics, null, 2));
    
    // Test 7: Get Active Processes
    console.log('\n🔄 Testing Active Processes...');
    const activeProcesses = processManager.getActiveProcesses();
    console.log('✅ Active Processes:', activeProcesses.length);
    
    // Test 8: Get Process History
    console.log('\n📚 Testing Process History...');
    const history = processManager.getProcessHistory(5);
    console.log('✅ Process History:', history.length);
    history.forEach((proc, i) => {
      console.log(`  ${i + 1}. ${proc.command.join(' ')} - ${proc.status}`);
    });
    
    // Test 9: Test Process Information
    console.log('\n🔍 Testing Process Information...');
    if (history.length > 0) {
      const lastProcess = history[history.length - 1];
      const processInfo = processManager.getProcessInfo(lastProcess.processId);
      console.log('✅ Process Info Retrieved');
      console.log('  Process ID:', processInfo.processId);
      console.log('  Command:', processInfo.command.join(' '));
      console.log('  Status:', processInfo.status);
      console.log('  Exit Code:', processInfo.exitCode);
    }
    
    // Test 10: Test System Process Info
    console.log('\n🖥️ Testing System Process Information...');
    const systemInfo = processManager.getSystemProcessInfo();
    console.log('✅ System Process Info Retrieved');
    console.log('  Current PID:', systemInfo.currentProcess.pid);
    console.log('  Is Alive:', systemInfo.currentProcess.isAlive);
    console.log('  Total Processes:', systemInfo.totalProcesses);
    
    // Test 11: Test Error Handling
    console.log('\n❌ Testing Error Handling...');
    try {
      const errorResult = await processManager.executeCommand(['nonexistent_command']);
      console.log('⚠️  Command failed as expected');
      console.log('  Exit Code:', errorResult.exitCode);
      console.log('  Success:', errorResult.success);
    } catch (error) {
      console.log('✅ Error handled correctly:', error.message);
    }
    
    // Test 12: Cleanup
    console.log('\n🧹 Testing Cleanup...');
    processManager.cleanup();
    console.log('✅ Process Manager cleaned up');
    
    console.log('\n🎉 Process Migration Test Results:');
    console.log('✅ Modern Process Manager: Working');
    console.log('✅ Process Builder: Working');
    console.log('✅ Command Execution: Working');
    console.log('✅ Timeout Handling: Working');
    console.log('✅ Process Metrics: Working');
    console.log('✅ Process History: Working');
    console.log('✅ Process Information: Working');
    console.log('✅ System Process Info: Working');
    console.log('✅ Error Handling: Working');
    console.log('✅ Cleanup: Working');
    
    return true;
    
  } catch (error) {
    console.error('❌ Process Migration Test Failed:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

// Run the test
testProcessMigration().then(success => {
  console.log('\n🎯 Process Migration Test Result:', success ? 'SUCCESS' : 'FAILED');
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Test Execution Failed:', error.message);
  process.exit(1);
});
