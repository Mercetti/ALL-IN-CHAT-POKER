/**
 * Quality Report Generator
 * Generates comprehensive quality reports from CI/CD test results
 */

const fs = require('fs');
const path = require('path');

class QualityReportGenerator {
  constructor() {
    this.report = {
      timestamp: new Date().toISOString(),
      buildNumber: process.env.GITHUB_RUN_NUMBER || 'local',
      commit: process.env.GITHUB_SHA || 'local',
      branch: process.env.GITHUB_REF_NAME || 'local',
      metrics: {
        backend: {},
        mobile: {},
        e2e: {},
        performance: {},
        security: {}
      },
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        coverage: 0,
        performanceScore: 0,
        securityScore: 0,
        overallGrade: 'A'
      },
      recommendations: []
    };
  }

  async generateReport() {
    console.log('📊 Generating Quality Report...');
    
    // Analyze test results
    await this.analyzeBackendTests();
    await this.analyzeMobileTests();
    await this.analyzeE2ETests();
    await this.analyzePerformanceTests();
    await this.analyzeSecurityTests();
    
    // Calculate summary metrics
    this.calculateSummary();
    
    // Generate recommendations
    this.generateRecommendations();
    
    // Save report
    this.saveReport();
    
    console.log('✅ Quality Report Generated');
    console.log(`📁 Saved to: quality-report.json`);
    
    return this.report;
  }

  async analyzeBackendTests() {
    try {
      const coveragePath = 'coverage/coverage-summary.json';
      if (fs.existsSync(coveragePath)) {
        const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
        this.report.metrics.backend = {
          coverage: coverage.total,
          tests: this.parseTestResults('backend-test-results.json')
        };
      }
    } catch (error) {
      console.warn('⚠️ Could not analyze backend tests:', error.message);
    }
  }

  async analyzeMobileTests() {
    try {
      const coveragePath = 'mobile/coverage/coverage-summary.json';
      if (fs.existsSync(coveragePath)) {
        const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
        this.report.metrics.mobile = {
          coverage: coverage.total,
          tests: this.parseTestResults('mobile-test-results.json')
        };
      }
    } catch (error) {
      console.warn('⚠️ Could not analyze mobile tests:', error.message);
    }
  }

  async analyzeE2ETests() {
    try {
      const resultsPath = 'e2e-test-results.json';
      if (fs.existsSync(resultsPath)) {
        const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
        this.report.metrics.e2e = {
          tests: results,
          passRate: this.calculatePassRate(results)
        };
      }
    } catch (error) {
      console.warn('⚠️ Could not analyze E2E tests:', error.message);
    }
  }

  async analyzePerformanceTests() {
    try {
      const resultsPath = 'performance-test-report.json';
      if (fs.existsSync(resultsPath)) {
        const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
        this.report.metrics.performance = {
          score: this.calculatePerformanceScore(results),
          metrics: results
        };
      }
    } catch (error) {
      console.warn('⚠️ Could not analyze performance tests:', error.message);
    }
  }

  async analyzeSecurityTests() {
    try {
      const resultsPath = 'security-report.json';
      if (fs.existsSync(resultsPath)) {
        const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
        this.report.metrics.security = {
          score: this.calculateSecurityScore(results),
          vulnerabilities: results.vulnerabilities || []
        };
      }
    } catch (error) {
      console.warn('⚠️ Could not analyze security tests:', error.message);
    }
  }

  parseTestResults(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        const results = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        return {
          total: results.totalTests || 0,
          passed: results.passedTests || 0,
          failed: results.failedTests || 0,
          passRate: this.calculatePassRate(results)
        };
      }
    } catch (error) {
      console.warn(`⚠️ Could not parse ${filePath}:`, error.message);
    }
    return { total: 0, passed: 0, failed: 0, passRate: 0 };
  }

  calculatePassRate(results) {
    const total = results.totalTests || results.total || 0;
    const passed = results.passedTests || results.passed || 0;
    return total > 0 ? (passed / total) * 100 : 0;
  }

  calculatePerformanceScore(results) {
    // Simple performance scoring based on test execution time
    const avgTime = results.averageExecutionTime || 0;
    if (avgTime < 1000) return 100; // Excellent
    if (avgTime < 2000) return 90;  // Good
    if (avgTime < 5000) return 80;  // Fair
    if (avgTime < 10000) return 70; // Poor
    return 50; // Very Poor
  }

  calculateSecurityScore(results) {
    const vulnerabilities = results.vulnerabilities || [];
    const highVulns = vulnerabilities.filter(v => v.severity === 'high').length;
    const mediumVulns = vulnerabilities.filter(v => v.severity === 'medium').length;
    const lowVulns = vulnerabilities.filter(v => v.severity === 'low').length;
    
    let score = 100;
    score -= highVulns * 25;
    score -= mediumVulns * 10;
    score -= lowVulns * 5;
    
    return Math.max(0, score);
  }

  calculateSummary() {
    // Calculate total tests
    const backendTests = this.report.metrics.backend.tests || {};
    const mobileTests = this.report.metrics.mobile.tests || {};
    const e2eTests = this.report.metrics.e2e.tests || {};
    
    this.report.summary.totalTests = 
      (backendTests.total || 0) + 
      (mobileTests.total || 0) + 
      (e2eTests.total || 0);
    
    this.report.summary.passedTests = 
      (backendTests.passed || 0) + 
      (mobileTests.passed || 0) + 
      (e2eTests.passed || 0);
    
    this.report.summary.failedTests = 
      (backendTests.failed || 0) + 
      (mobileTests.failed || 0) + 
      (e2eTests.failed || 0);
    
    // Calculate coverage
    const backendCoverage = this.report.metrics.backend.coverage || {};
    const mobileCoverage = this.report.metrics.mobile.coverage || {};
    
    const backendLines = backendCoverage.lines || {};
    const mobileLines = mobileCoverage.lines || {};
    
    const totalLines = (backendLines.total || 0) + (mobileLines.total || 0);
    const coveredLines = (backendLines.covered || 0) + (mobileLines.covered || 0);
    
    this.report.summary.coverage = totalLines > 0 ? (coveredLines / totalLines) * 100 : 0;
    
    // Calculate performance and security scores
    this.report.summary.performanceScore = this.report.metrics.performance.score || 0;
    this.report.summary.securityScore = this.report.metrics.security.score || 0;
    
    // Calculate overall grade
    this.report.summary.overallGrade = this.calculateOverallGrade();
  }

  calculateOverallGrade() {
    const passRate = this.report.summary.totalTests > 0 ? 
      (this.report.summary.passedTests / this.report.summary.totalTests) * 100 : 0;
    
    const coverage = this.report.summary.coverage;
    const performance = this.report.summary.performanceScore;
    const security = this.report.summary.securityScore;
    
    const averageScore = (passRate + coverage + performance + security) / 4;
    
    if (averageScore >= 90) return 'A';
    if (averageScore >= 80) return 'B';
    if (averageScore >= 70) return 'C';
    if (averageScore >= 60) return 'D';
    return 'F';
  }

  generateRecommendations() {
    this.recommendations = [];
    
    // Test coverage recommendations
    if (this.report.summary.coverage < 80) {
      this.recommendations.push({
        type: 'coverage',
        priority: 'high',
        message: 'Test coverage is below 80%. Add more tests to improve coverage.',
        action: 'Run npm run test:coverage to identify uncovered areas.'
      });
    }
    
    // Test failure recommendations
    if (this.report.summary.failedTests > 0) {
      this.recommendations.push({
        type: 'tests',
        priority: 'high',
        message: `${this.report.summary.failedTests} tests are failing.`,
        action: 'Review test failures and fix issues before deployment.'
      });
    }
    
    // Performance recommendations
    if (this.report.summary.performanceScore < 80) {
      this.recommendations.push({
        type: 'performance',
        priority: 'medium',
        message: 'Performance score is below optimal.',
        action: 'Consider optimizing test execution and application performance.'
      });
    }
    
    // Security recommendations
    if (this.report.summary.securityScore < 90) {
      this.recommendations.push({
        type: 'security',
        priority: 'high',
        message: 'Security vulnerabilities detected.',
        action: 'Address security issues before production deployment.'
      });
    }
  }

  saveReport() {
    const reportPath = 'quality-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(this.report, null, 2));
    
    // Also generate a human-readable version
    this.generateHumanReadableReport();
  }

  generateHumanReadableReport() {
    const report = `
# Quality Report - ${new Date().toLocaleDateString()}

## Summary
- **Build**: #${this.report.buildNumber}
- **Commit**: ${this.report.commit.substring(0, 7)}
- **Branch**: ${this.report.branch}
- **Overall Grade**: ${this.report.summary.overallGrade}

## Test Results
- **Total Tests**: ${this.report.summary.totalTests}
- **Passed**: ${this.report.summary.passedTests}
- **Failed**: ${this.report.summary.failedTests}
- **Pass Rate**: ${((this.report.summary.passedTests / this.report.summary.totalTests) * 100).toFixed(1)}%

## Coverage
- **Overall Coverage**: ${this.report.summary.coverage.toFixed(1)}%

## Performance
- **Performance Score**: ${this.report.summary.performanceScore}/100

## Security
- **Security Score**: ${this.report.summary.securityScore}/100

## Recommendations
${this.recommendations.map(rec => `- **${rec.priority.toUpperCase()}**: ${rec.message}`).join('\n')}

---
Generated on ${new Date().toISOString()}
    `;
    
    fs.writeFileSync('quality-report.md', report);
  }
}

// Run if called directly
if (require.main === module) {
  const generator = new QualityReportGenerator();
  generator.generateReport()
    .catch(error => {
      console.error('❌ Failed to generate quality report:', error);
      process.exit(1);
    });
}

module.exports = QualityReportGenerator;
