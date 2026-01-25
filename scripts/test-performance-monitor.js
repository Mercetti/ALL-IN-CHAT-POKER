#!/usr/bin/env node
/**
 * Test Performance Monitor
 * Monitors and reports test execution performance
 */

const { spawn } = require('child_process');
const { performance } = require('perf_hooks');

class TestPerformanceMonitor {
  constructor() {
    this.startTime = null;
    this.endTime = null;
    this.testResults = null;
  }

  async runTest(command) {
    console.log(`🚀 Running: ${command}`);
    this.startTime = performance.now();
    
    return new Promise((resolve, reject) => {
      const process = spawn(command, { shell: true, stdio: 'pipe' });
      let output = '';
      
      process.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      process.stderr.on('data', (data) => {
        output += data.toString();
      });
      
      process.on('close', (code) => {
        this.endTime = performance.now();
        const duration = this.endTime - this.startTime;
        
        // Parse results
        const results = this.parseResults(output);
        
        console.log('
📊 Performance Results:');
        console.log('⏱️  Duration: ' + (duration / 1000).toFixed(2) + 's');
        console.log('📝 Tests: ' + results.total + ' total, ' + results.passed + ' passed, ' + results.failed + ' failed');
        console.log('⚡ Speed: ' + (results.total / (duration / 1000)).toFixed(1) + ' tests/sec');
        
        resolve({ code, duration, results, output });
      });
      
      process.on('error', reject);
    });
  }
  
  parseResults(output) {
    const lines = output.split('
');
    const results = { total: 0, passed: 0, failed: 0 };
    
    for (const line of lines) {
      const match = line.match(/Tests:s*(d+)s*failed,s*(d+)s*passed,s*(d+)s*total/);
      if (match) {
        results.failed = parseInt(match[1]);
        results.passed = parseInt(match[2]);
        results.total = parseInt(match[3]);
        break;
      }
    }
    
    return results;
  }
}

// Command line interface
const command = process.argv[2] || 'npm run test:smoke';
const monitor = new TestPerformanceMonitor();

monitor.runTest(command)
  .then(({ code, duration, results }) => {
    process.exit(code);
  })
  .catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
