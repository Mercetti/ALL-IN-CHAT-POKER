#!/usr/bin/env node

/**
 * Performance Testing Script
 * Validates test execution times and system performance
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class PerformanceTester {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      testSuites: {},
      overall: {
        totalTime: 0,
        averageTime: 0,
        slowestSuite: null,
        fastestSuite: null
      }
    };
  }

  async runTestSuite(suiteName, testCommand) {
    console.log(`⏱️  Running ${suiteName} performance test...`);
    
    const startTime = Date.now();
    
    try {
      const output = execSync(testCommand, { 
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 120000 // 2 minute timeout
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Parse Jest output for performance metrics
      const metrics = this.parseJestOutput(output);
      
      return {
        suiteName,
        status: 'passed',
        duration: duration,
        durationFormatted: this.formatDuration(duration),
        testCount: metrics.testCount || 0,
        passedTests: metrics.passedTests || 0,
        failedTests: metrics.failedTests || 0,
        averageTestTime: metrics.averageTestTime || 0,
        slowestTest: metrics.slowestTest || null,
        memoryUsage: metrics.memoryUsage || 0,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      return {
        suiteName,
        status: 'failed',
        duration: duration,
        durationFormatted: this.formatDuration(duration),
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  parseJestOutput(output) {
    const metrics = {
      testCount: 0,
      passedTests: 0,
      failedTests: 0,
      averageTestTime: 0,
      slowestTest: null,
      memoryUsage: 0
    };

    // Extract test counts
    const testMatch = output.match(/Tests:\s+(\d+)\s+failed,\s+(\d+)\s+passed/);
    if (testMatch) {
      metrics.failedTests = parseInt(testMatch[1]);
      metrics.passedTests = parseInt(testMatch[2]);
      metrics.testCount = metrics.failedTests + metrics.passedTests;
    }

    // Extract execution time
    const timeMatch = output.match(/Time:\s+([\d.]+)\s*s/);
    if (timeMatch) {
      metrics.averageTestTime = parseFloat(timeMatch[1]);
    }

    // Extract memory usage (if available)
    const memoryMatch = output.match(/Memory Usage:\s+([\d.]+)\s*MB/);
    if (memoryMatch) {
      metrics.memoryUsage = parseFloat(memoryMatch[1]);
    }

    return metrics;
  }

  formatDuration(ms) {
    if (ms < 1000) {
      return `${ms}ms`;
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(2)}s`;
    } else {
      const minutes = Math.floor(ms / 60000);
      const seconds = ((ms % 60000) / 1000).toFixed(2);
      return `${minutes}m ${seconds}s`;
    }
  }

  async runAllPerformanceTests() {
    console.log('🚀 Starting comprehensive performance testing...\n');

    const testSuites = [
      {
        name: 'Backend Tests',
        command: 'npm test -- --testTimeout=30000 --passWithNoTests --silent',
        expectedMaxTime: 120000 // 2 minutes
      },
      {
        name: 'Mobile Tests',
        command: 'cd mobile && npm test -- --testTimeout=30000 --passWithNoTests --silent',
        expectedMaxTime: 60000 // 1 minute
      },
      {
        name: 'E2E Tests',
        command: 'npm run test:e2e -- --timeout=60000 || echo "E2E tests require running server"',
        expectedMaxTime: 180000 // 3 minutes
      }
    ];

    const results = [];
    
    for (const suite of testSuites) {
      const result = await this.runTestSuite(suite.name, suite.command);
      result.expectedMaxTime = suite.expectedMaxTime;
      result.performanceGrade = this.calculatePerformanceGrade(result);
      results.push(result);
      
      // Store in overall results
      this.results.testSuites[suite.name] = result;
    }

    // Calculate overall metrics
    this.calculateOverallMetrics(results);
    
    return this.results;
  }

  calculatePerformanceGrade(result) {
    if (result.status === 'failed') {
      return 'F';
    }

    const performanceRatio = result.duration / result.expectedMaxTime;
    
    if (performanceRatio <= 0.5) {
      return 'A'; // Excellent - under 50% of expected time
    } else if (performanceRatio <= 0.75) {
      return 'B'; // Good - under 75% of expected time
    } else if (performanceRatio <= 1.0) {
      return 'C'; // Acceptable - within expected time
    } else if (performanceRatio <= 1.5) {
      return 'D'; // Slow - over expected time but under 50% over
    } else {
      return 'F'; // Failed - over 50% slower than expected
    }
  }

  calculateOverallMetrics(results) {
    const validResults = results.filter(r => r.status === 'passed');
    
    if (validResults.length === 0) {
      this.results.overall.status = 'failed';
      return;
    }

    const totalTime = validResults.reduce((sum, r) => sum + r.duration, 0);
    const averageTime = totalTime / validResults.length;
    
    const slowestSuite = validResults.reduce((slowest, current) => 
      current.duration > slowest.duration ? current : slowest
    );
    
    const fastestSuite = validResults.reduce((fastest, current) => 
      current.duration < fastest.duration ? current : fastest
    );

    const grades = validResults.map(r => r.performanceGrade);
    const gradePoints = { 'A': 4, 'B': 3, 'C': 2, 'D': 1, 'F': 0 };
    const averageGrade = grades.reduce((sum, grade) => sum + gradePoints[grade], 0) / grades.length;

    this.results.overall = {
      totalTime,
      averageTime,
      slowestSuite: slowestSuite.suiteName,
      fastestSuite: fastestSuite.suiteName,
      averageGrade: this.getGradeFromPoints(averageGrade),
      status: averageGrade >= 2 ? 'passed' : 'failed'
    };
  }

  getGradeFromPoints(points) {
    if (points >= 3.5) return 'A';
    if (points >= 2.5) return 'B';
    if (points >= 1.5) return 'C';
    if (points >= 0.5) return 'D';
    return 'F';
  }

  printResults() {
    console.log('📊 PERFORMANCE TEST RESULTS');
    console.log('=============================\n');

    console.log(`Overall Status: ${this.results.overall.status.toUpperCase()}`);
    console.log(`Overall Grade: ${this.results.overall.averageGrade}`);
    console.log(`Average Test Time: ${this.formatDuration(this.results.overall.averageTime)}`);
    console.log(`Total Test Time: ${this.formatDuration(this.results.overall.totalTime)}`);
    console.log(`Fastest Suite: ${this.results.overall.fastestSuite}`);
    console.log(`Slowest Suite: ${this.results.overall.slowestSuite}\n`);

    console.log('Test Suite Details:');
    Object.entries(this.results.testSuites).forEach(([name, result]) => {
      const statusIcon = result.status === 'passed' ? '✅' : '❌';
      const gradeIcon = this.getGradeIcon(result.performanceGrade);
      
      console.log(`${statusIcon} ${name}:`);
      console.log(`   Duration: ${result.durationFormatted}`);
      console.log(`   Grade: ${gradeIcon} ${result.performanceGrade}`);
      
      if (result.testCount > 0) {
        console.log(`   Tests: ${result.passedTests}/${result.testCount} passed`);
        if (result.failedTests > 0) {
          console.log(`   Failed: ${result.failedTests} tests`);
        }
      }
      
      if (result.averageTestTime > 0) {
        console.log(`   Avg Test Time: ${result.averageTestTime.toFixed(2)}s`);
      }
      
      if (result.memoryUsage > 0) {
        console.log(`   Memory Usage: ${result.memoryUsage.toFixed(2)}MB`);
      }
      
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      
      console.log('');
    });

    console.log(`Performance test completed at: ${this.results.timestamp}`);
  }

  getGradeIcon(grade) {
    const icons = {
      'A': '🏆',
      'B': '🥈',
      'C': '🥉',
      'D': '⚠️',
      'F': '❌'
    };
    return icons[grade] || '❓';
  }

  async generateReport() {
    const reportData = {
      ...this.results,
      summary: {
        overallStatus: this.results.overall.status,
        overallGrade: this.results.overall.averageGrade,
        totalTestTime: this.results.overall.totalTime,
        averageTestTime: this.results.overall.averageTime,
        testSuitesCount: Object.keys(this.results.testSuites).length,
        timestamp: this.results.timestamp
      },
      recommendations: this.generateRecommendations()
    };

    // Save report to file
    const reportPath = './performance-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    
    console.log(`\n📄 Detailed performance report saved to: ${reportPath}`);
    return reportPath;
  }

  generateRecommendations() {
    const recommendations = [];
    
    Object.entries(this.results.testSuites).forEach(([name, result]) => {
      if (result.performanceGrade === 'D' || result.performanceGrade === 'F') {
        recommendations.push({
          suite: name,
          issue: 'Poor performance',
          suggestion: 'Consider optimizing test setup or reducing test complexity'
        });
      }
      
      if (result.failedTests > 0) {
        recommendations.push({
          suite: name,
          issue: 'Test failures',
          suggestion: 'Fix failing tests to improve reliability'
        });
      }
      
      if (result.memoryUsage > 500) {
        recommendations.push({
          suite: name,
          issue: 'High memory usage',
          suggestion: 'Optimize memory usage in tests'
        });
      }
    });
    
    return recommendations;
  }
}

// Main execution
async function main() {
  const tester = new PerformanceTester();
  
  try {
    await tester.runAllPerformanceTests();
    tester.printResults();
    await tester.generateReport();
    
    // Exit with appropriate code
    process.exit(tester.results.overall.status === 'passed' ? 0 : 1);
  } catch (error) {
    console.error('❌ Performance testing failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = PerformanceTester;
