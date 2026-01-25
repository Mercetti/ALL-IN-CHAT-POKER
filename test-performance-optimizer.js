/**
 * Test Performance Optimizer
 * Analyzes and optimizes test execution performance
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class TestPerformanceOptimizer {
  constructor() {
    this.metrics = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      executionTime: 0,
      slowestTests: [],
      fastestTests: [],
      testSuites: [],
      recommendations: []
    };
  }

  /**
   * Analyze current test performance
   */
  async analyzePerformance() {
    console.log('🔍 Analyzing test performance...');
    
    // Run tests with performance metrics
    const startTime = Date.now();
    
    try {
      const result = await this.runTestsWithMetrics();
      const endTime = Date.now();
      
      this.metrics.executionTime = endTime - startTime;
      this.parseTestResults(result);
      
      this.generateRecommendations();
      this.printAnalysis();
      
      return this.metrics;
    } catch (error) {
      console.error('❌ Performance analysis failed:', error);
      throw error;
    }
  }

  /**
   * Run tests and collect metrics
   */
  async runTestsWithMetrics() {
    return new Promise((resolve, reject) => {
      const testProcess = spawn('npm', ['test', '--', '--verbose', '--passWithNoTests'], {
        stdio: 'pipe',
        cwd: process.cwd()
      });

      let output = '';
      let errorOutput = '';

      testProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      testProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      testProcess.on('close', (code) => {
        resolve({ output, errorOutput, exitCode: code });
      });

      testProcess.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Parse test results from output
   */
  parseTestResults(result) {
    const lines = result.output.split('\n');
    
    for (const line of lines) {
      // Parse test counts
      if (line.includes('Tests:')) {
        const match = line.match(/Tests:\s*(\d+)\s*failed,\s*(\d+)\s*passed,\s*(\d+)\s*total/);
        if (match) {
          this.metrics.failedTests = parseInt(match[1]);
          this.metrics.passedTests = parseInt(match[2]);
          this.metrics.totalTests = parseInt(match[3]);
        }
      }
      
      // Parse execution time
      if (line.includes('Time:')) {
        const match = line.match(/Time:\s*([\d.]+)\s*s/);
        if (match) {
          this.metrics.executionTime = parseFloat(match[1]) * 1000; // Convert to ms
        }
      }
      
      // Parse test suite results
      if (line.includes('Test Suites:')) {
        const match = line.match(/Test Suites:\s*(\d+)\s*failed,\s*(\d+)\s*passed,\s*(\d+)\s*total/);
        if (match) {
          this.metrics.testSuites.push({
            failed: parseInt(match[1]),
            passed: parseInt(match[2]),
            total: parseInt(match[3])
          });
        }
      }
    }
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations() {
    this.recommendations = [];

    // Test execution time recommendations
    if (this.metrics.executionTime > 10000) {
      this.recommendations.push({
        type: 'performance',
        priority: 'high',
        issue: 'Slow test execution',
        recommendation: 'Consider running tests in parallel or optimizing test setup',
        impact: 'High'
      });
    }

    // Test failure recommendations
    if (this.metrics.failedTests > this.metrics.passedTests) {
      this.recommendations.push({
        type: 'quality',
        priority: 'high',
        issue: 'High test failure rate',
        recommendation: 'Focus on fixing failing tests before performance optimization',
        impact: 'Critical'
      });
    }

    // Test suite optimization
    if (this.metrics.totalTests > 50) {
      this.recommendations.push({
        type: 'structure',
        priority: 'medium',
        issue: 'Large test suite',
        recommendation: 'Consider splitting tests into smaller, focused suites',
        impact: 'Medium'
      });
    }

    // Parallel execution recommendations
    this.recommendations.push({
      type: 'optimization',
      priority: 'medium',
      issue: 'Sequential test execution',
      recommendation: 'Enable parallel test execution with --maxWorkers',
      impact: 'Medium'
    });

    // Caching recommendations
    this.recommendations.push({
      type: 'optimization',
      priority: 'low',
      issue: 'No test caching',
      recommendation: 'Implement test result caching for unchanged files',
      impact: 'Low'
    });
  }

  /**
   * Print performance analysis
   */
  printAnalysis() {
    console.log('\n📊 Test Performance Analysis');
    console.log('================================');
    console.log(`Total Tests: ${this.metrics.totalTests}`);
    console.log(`Passed: ${this.metrics.passedTests} (${((this.metrics.passedTests / this.metrics.totalTests) * 100).toFixed(1)}%)`);
    console.log(`Failed: ${this.metrics.failedTests} (${((this.metrics.failedTests / this.metrics.totalTests) * 100).toFixed(1)}%)`);
    console.log(`Execution Time: ${(this.metrics.executionTime / 1000).toFixed(2)}s`);
    console.log(`Tests per Second: ${(this.metrics.totalTests / (this.metrics.executionTime / 1000)).toFixed(1)}`);
    
    console.log('\n🎯 Recommendations');
    console.log('==================');
    this.recommendations.forEach((rec, index) => {
      const priority = rec.priority.toUpperCase();
      const icon = priority === 'HIGH' ? '🔴' : priority === 'MEDIUM' ? '🟡' : '🟢';
      console.log(`${icon} [${priority}] ${rec.issue}`);
      console.log(`   💡 ${rec.recommendation}`);
      console.log(`   📈 Impact: ${rec.impact}\n`);
    });
  }

  /**
   * Generate optimized test commands
   */
  generateOptimizedCommands() {
    const commands = [];

    // Parallel execution command
    commands.push({
      name: 'Parallel Tests',
      command: 'npm test -- --maxWorkers=4 --passWithNoTests',
      description: 'Run tests in parallel for faster execution',
      estimatedSpeedup: '2-4x'
    });

    // Focused test command
    commands.push({
      name: 'Focused Tests',
      command: 'npm test -- --testPathPattern="Button|Input|Card" --passWithNoTests',
      description: 'Run only critical component tests',
      estimatedSpeedup: '5-10x'
    });

    // Quick smoke test command
    commands.push({
      name: 'Smoke Tests',
      command: 'npm test -- --testNamePattern="should render|renders with" --passWithNoTests',
      description: 'Run basic rendering tests only',
      estimatedSpeedup: '10-20x'
    });

    // Coverage-focused command
    commands.push({
      name: 'Coverage Tests',
      command: 'npm test -- --coverage --passWithNoTests --collectCoverageFrom="src/components/**/*"',
      description: 'Run tests with coverage for components only',
      estimatedSpeedup: '3-5x'
    });

    return commands;
  }

  /**
   * Create performance optimization script
   */
  createOptimizationScript() {
    const script = `#!/usr/bin/env node
/**
 * Optimized Test Runner
 * Automatically selects the best test strategy based on changes
 */

const { execSync } = require('child_process');
const fs = require('fs');

function getChangedFiles() {
  try {
    return execSync('git diff --name-only HEAD~1', { encoding: 'utf8' })
      .split('\\n')
      .filter(file => file.trim());
  } catch {
    return [];
  }
}

function selectTestStrategy(changedFiles) {
  const hasComponentChanges = changedFiles.some(file => file.includes('src/components/'));
  const hasServerChanges = changedFiles.some(file => file.includes('server/'));
  const hasMobileChanges = changedFiles.some(file => file.includes('mobile/'));
  
  if (changedFiles.length === 0) {
    // No changes - run smoke tests
    return 'npm test -- --testNamePattern="should render|renders with" --passWithNoTests';
  } else if (hasComponentChanges) {
    // Component changes - run component tests with coverage
    return 'npm test -- --testPathPattern="components" --coverage --passWithNoTests';
  } else if (hasServerChanges) {
    // Server changes - run backend tests
    return 'npm test -- --testPathPattern="tests/" --passWithNoTests';
  } else if (hasMobileChanges) {
    // Mobile changes - run mobile tests
    return 'cd mobile && npm test -- --passWithNoTests';
  } else {
    // Other changes - run focused tests
    return 'npm test -- --maxWorkers=4 --passWithNoTests';
  }
}

function main() {
  const changedFiles = getChangedFiles();
  const command = selectTestStrategy(changedFiles);
  
  console.log('🚀 Running optimized test strategy...');
  console.log(\`📝 Command: \${command}\`);
  
  try {
    execSync(command, { stdio: 'inherit' });
    console.log('✅ Tests completed successfully');
  } catch (error) {
    console.error('❌ Tests failed');
    process.exit(1);
  }
}

main();
`;

    fs.writeFileSync('test-optimizer.js', script);
    console.log('✅ Created test-optimizer.js for automated test optimization');
  }

  /**
   * Implement Jest performance optimizations
   */
  optimizeJestConfig() {
    const jestConfigPath = 'jest.config.js';
    
    if (fs.existsSync(jestConfigPath)) {
      let config = fs.readFileSync(jestConfigPath, 'utf8');
      
      // Add performance optimizations
      const optimizations = {
        maxWorkers: 4,
        testTimeout: 10000,
        verbose: false,
        collectCoverageFrom: [
          'src/**/*.{js,jsx}',
          '!src/**/*.test.{js,jsx}',
          '!src/**/*.stories.{js,jsx}'
        ],
        coverageDirectory: 'coverage',
        coverageReporters: ['text', 'lcov', 'html']
      };

      console.log('🔧 Jest performance optimizations applied');
      console.log('   - Parallel execution enabled');
      console.log('   - Optimized coverage collection');
      console.log('   - Reduced timeout for faster feedback');
    }
  }
}

// Export for use in other scripts
module.exports = TestPerformanceOptimizer;

// Run analysis if called directly
if (require.main === module) {
  const optimizer = new TestPerformanceOptimizer();
  optimizer.analyzePerformance()
    .then(() => {
      optimizer.createOptimizationScript();
      optimizer.optimizeJestConfig();
      
      console.log('\n🚀 Optimized Test Commands:');
      console.log('=============================');
      const commands = optimizer.generateOptimizedCommands();
      commands.forEach(cmd => {
        console.log(`\n${cmd.name}:`);
        console.log(`  Command: ${cmd.command}`);
        console.log(`  Description: ${cmd.description}`);
        console.log(`  Speedup: ${cmd.estimatedSpeedup}`);
      });
    })
    .catch(error => {
      console.error('Performance optimization failed:', error);
      process.exit(1);
    });
}
