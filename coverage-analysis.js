#!/usr/bin/env node

/**
 * Coverage Analysis Script
 * Ensures adequate test coverage across the project
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class CoverageAnalyzer {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      coverage: {},
      overall: {
        totalCoverage: 0,
        status: 'unknown',
        recommendations: []
      }
    };
  }

  async runCoverageAnalysis() {
    console.log('📊 Starting comprehensive coverage analysis...\n');

    try {
      // Run backend coverage analysis
      const backendCoverage = await this.analyzeBackendCoverage();
      this.results.coverage.backend = backendCoverage;

      // Run mobile coverage analysis
      const mobileCoverage = await this.analyzeMobileCoverage();
      this.results.coverage.mobile = mobileCoverage;

      // Calculate overall metrics
      this.calculateOverallMetrics();

      return this.results;
    } catch (error) {
      console.error('❌ Coverage analysis failed:', error.message);
      throw error;
    }
  }

  async analyzeBackendCoverage() {
    console.log('🔍 Analyzing backend test coverage...');
    
    try {
      // Run Jest with coverage
      const output = execSync('npm test -- --coverage --passWithNoTests --silent', {
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 120000
      });

      // Parse coverage output
      const coverageData = this.parseCoverageOutput(output);
      
      // Read coverage report if it exists
      const coverageReport = this.readCoverageReport('./coverage/lcov-report/index.html');
      
      return {
        status: 'completed',
        lines: coverageData.lines || 0,
        functions: coverageData.functions || 0,
        branches: coverageData.branches || 0,
        statements: coverageData.statements || 0,
        reportAvailable: coverageReport.available,
        reportPath: coverageReport.path,
        uncoveredFiles: coverageData.uncoveredFiles || [],
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async analyzeMobileCoverage() {
    console.log('📱 Analyzing mobile test coverage...');
    
    try {
      // Run mobile Jest with coverage
      const output = execSync('cd mobile && npm test -- --coverage --passWithNoTests --silent', {
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 60000
      });

      const coverageData = this.parseCoverageOutput(output);
      
      // Read mobile coverage report
      const coverageReport = this.readCoverageReport('./mobile/coverage/lcov-report/index.html');
      
      return {
        status: 'completed',
        lines: coverageData.lines || 0,
        functions: coverageData.functions || 0,
        branches: coverageData.branches || 0,
        statements: coverageData.statements || 0,
        reportAvailable: coverageReport.available,
        reportPath: coverageReport.path,
        uncoveredFiles: coverageData.uncoveredFiles || [],
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  parseCoverageOutput(output) {
    const coverageData = {
      lines: 0,
      functions: 0,
      branches: 0,
      statements: 0,
      uncoveredFiles: []
    };

    // Extract coverage percentages
    const linesMatch = output.match(/All files\s+\|\s+([\d.]+)/);
    if (linesMatch) {
      coverageData.lines = parseFloat(linesMatch[1]);
    }

    const functionsMatch = output.match(/All files\s+\|\s+[\d.]+\s+\|\s+([\d.]+)/);
    if (functionsMatch) {
      coverageData.functions = parseFloat(functionsMatch[1]);
    }

    const branchesMatch = output.match(/All files\s+\|\s+[\d.]+\s+\|\s+[\d.]+\s+\|\s+([\d.]+)/);
    if (branchesMatch) {
      coverageData.branches = parseFloat(branchesMatch[1]);
    }

    const statementsMatch = output.match(/All files\s+\|\s+[\d.]+\s+\|\s+[\d.]+\s+\|\s+[\d.]+\s+\|\s+([\d.]+)/);
    if (statementsMatch) {
      coverageData.statements = parseFloat(statementsMatch[1]);
    }

    // Find uncovered files
    const uncoveredPattern = /([^|\n]+)\s+\|\s+0\s+\|\s+0\s+\|\s+0\s+\|\s+0/g;
    let match;
    while ((match = uncoveredPattern.exec(output)) !== null) {
      const filename = match[1].trim();
      if (filename && filename !== 'All files') {
        coverageData.uncoveredFiles.push(filename);
      }
    }

    return coverageData;
  }

  readCoverageReport(reportPath) {
    try {
      if (fs.existsSync(reportPath)) {
        return {
          available: true,
          path: path.resolve(reportPath)
        };
      }
    } catch (error) {
      // Report doesn't exist
    }
    
    return {
      available: false,
      path: null
    };
  }

  calculateOverallMetrics() {
    const backend = this.results.coverage.backend;
    const mobile = this.results.coverage.mobile;

    let totalLines = 0;
    let totalFunctions = 0;
    let totalBranches = 0;
    let totalStatements = 0;
    let validSuites = 0;

    // Calculate weighted averages
    if (backend.status === 'completed') {
      totalLines += backend.lines;
      totalFunctions += backend.functions;
      totalBranches += backend.branches;
      totalStatements += backend.statements;
      validSuites++;
    }

    if (mobile.status === 'completed') {
      totalLines += mobile.lines;
      totalFunctions += mobile.functions;
      totalBranches += mobile.branches;
      totalStatements += mobile.statements;
      validSuites++;
    }

    if (validSuites > 0) {
      this.results.overall.totalCoverage = {
        lines: (totalLines / validSuites).toFixed(2),
        functions: (totalFunctions / validSuites).toFixed(2),
        branches: (totalBranches / validSuites).toFixed(2),
        statements: (totalStatements / validSuites).toFixed(2)
      };

      // Determine overall status
      const averageCoverage = parseFloat(this.results.overall.totalCoverage.statements);
      
      if (averageCoverage >= 80) {
        this.results.overall.status = 'excellent';
      } else if (averageCoverage >= 70) {
        this.results.overall.status = 'good';
      } else if (averageCoverage >= 60) {
        this.results.overall.status = 'acceptable';
      } else if (averageCoverage >= 50) {
        this.results.overall.status = 'needs-improvement';
      } else {
        this.results.overall.status = 'poor';
      }
    } else {
      this.results.overall.status = 'failed';
    }

    // Generate recommendations
    this.results.overall.recommendations = this.generateRecommendations();
  }

  generateRecommendations() {
    const recommendations = [];
    const backend = this.results.coverage.backend;
    const mobile = this.results.coverage.mobile;

    // Backend recommendations
    if (backend.status === 'completed') {
      if (backend.lines < 70) {
        recommendations.push({
          area: 'Backend Lines',
          current: backend.lines,
          target: 70,
          suggestion: 'Add more unit tests for backend logic and utilities'
        });
      }

      if (backend.functions < 70) {
        recommendations.push({
          area: 'Backend Functions',
          current: backend.functions,
          target: 70,
          suggestion: 'Test more function branches and edge cases'
        });
      }

      if (backend.uncoveredFiles.length > 0) {
        recommendations.push({
          area: 'Backend Files',
          uncoveredFiles: backend.uncoveredFiles,
          suggestion: 'Add tests for uncovered files: ' + backend.uncoveredFiles.slice(0, 3).join(', ')
        });
      }
    }

    // Mobile recommendations
    if (mobile.status === 'completed') {
      if (mobile.lines < 60) {
        recommendations.push({
          area: 'Mobile Components',
          current: mobile.lines,
          target: 60,
          suggestion: 'Add more component tests for mobile UI'
        });
      }

      if (mobile.uncoveredFiles.length > 0) {
        recommendations.push({
          area: 'Mobile Files',
          uncoveredFiles: mobile.uncoveredFiles,
          suggestion: 'Add tests for uncovered mobile files: ' + mobile.uncoveredFiles.slice(0, 3).join(', ')
        });
      }
    }

    // General recommendations
    if (this.results.overall.status === 'poor' || this.results.overall.status === 'needs-improvement') {
      recommendations.push({
        area: 'Overall Strategy',
        suggestion: 'Consider implementing test-driven development (TDD) to improve coverage'
      });
    }

    return recommendations;
  }

  printResults() {
    console.log('📊 COVERAGE ANALYSIS RESULTS');
    console.log('============================\n');

    console.log(`Overall Status: ${this.results.overall.status.toUpperCase()}`);
    
    if (this.results.overall.totalCoverage.statements) {
      console.log(`Overall Coverage:`);
      console.log(`  Statements: ${this.results.overall.totalCoverage.statements}%`);
      console.log(`  Lines: ${this.results.overall.totalCoverage.lines}%`);
      console.log(`  Functions: ${this.results.overall.totalCoverage.functions}%`);
      console.log(`  Branches: ${this.results.overall.totalCoverage.branches}%\n`);
    }

    console.log('Backend Coverage:');
    const backend = this.results.coverage.backend;
    if (backend.status === 'completed') {
      console.log(`  Status: ✅ Completed`);
      console.log(`  Statements: ${backend.statements}%`);
      console.log(`  Lines: ${backend.lines}%`);
      console.log(`  Functions: ${backend.functions}%`);
      console.log(`  Branches: ${backend.branches}%`);
      if (backend.reportAvailable) {
        console.log(`  Report: ${backend.reportPath}`);
      }
      if (backend.uncoveredFiles.length > 0) {
        console.log(`  Uncovered Files: ${backend.uncoveredFiles.length}`);
      }
    } else {
      console.log(`  Status: ❌ Failed`);
      console.log(`  Error: ${backend.error}`);
    }

    console.log('\nMobile Coverage:');
    const mobile = this.results.coverage.mobile;
    if (mobile.status === 'completed') {
      console.log(`  Status: ✅ Completed`);
      console.log(`  Statements: ${mobile.statements}%`);
      console.log(`  Lines: ${mobile.lines}%`);
      console.log(`  Functions: ${mobile.functions}%`);
      console.log(`  Branches: ${mobile.branches}%`);
      if (mobile.reportAvailable) {
        console.log(`  Report: ${mobile.reportPath}`);
      }
      if (mobile.uncoveredFiles.length > 0) {
        console.log(`  Uncovered Files: ${mobile.uncoveredFiles.length}`);
      }
    } else {
      console.log(`  Status: ❌ Failed`);
      console.log(`  Error: ${mobile.error}`);
    }

    if (this.results.overall.recommendations.length > 0) {
      console.log('\n📋 Recommendations:');
      this.results.overall.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec.area}:`);
        if (rec.current !== undefined) {
          console.log(`     Current: ${rec.current}%, Target: ${rec.target}%`);
        }
        console.log(`     ${rec.suggestion}`);
      });
    }

    console.log(`\nCoverage analysis completed at: ${this.results.timestamp}`);
  }

  async generateReport() {
    const reportData = {
      ...this.results,
      summary: {
        overallStatus: this.results.overall.status,
        overallCoverage: this.results.overall.totalCoverage,
        recommendationsCount: this.results.overall.recommendations.length,
        timestamp: this.results.timestamp
      }
    };

    // Save report to file
    const reportPath = './coverage-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    
    console.log(`\n📄 Detailed coverage report saved to: ${reportPath}`);
    return reportPath;
  }
}

// Main execution
async function main() {
  const analyzer = new CoverageAnalyzer();
  
  try {
    await analyzer.runCoverageAnalysis();
    analyzer.printResults();
    await analyzer.generateReport();
    
    // Exit with appropriate code
    const goodStatuses = ['excellent', 'good', 'acceptable'];
    process.exit(goodStatuses.includes(analyzer.results.overall.status) ? 0 : 1);
  } catch (error) {
    console.error('❌ Coverage analysis failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = CoverageAnalyzer;
