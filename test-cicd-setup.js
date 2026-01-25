/**
 * CI/CD Setup Test
 * Tests the CI/CD pipeline configuration and scripts
 */

const fs = require('fs');
const path = require('path');

class CICDSetupTest {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async runTests() {
    console.log('🧪 Testing CI/CD Setup...');
    
    // Test CI/CD configuration
    this.testCIConfiguration();
    
    // Test supporting scripts
    this.testScripts();
    
    // Test documentation
    this.testDocumentation();
    
    // Test deployment configuration
    this.testDeploymentConfig();
    
    // Print results
    this.printResults();
    
    return this.results;
  }

  testCIConfiguration() {
    this.addTest('GitHub Actions Workflow', () => {
      const workflowPath = '.github/workflows/ci.yml';
      if (!fs.existsSync(workflowPath)) {
        throw new Error('GitHub Actions workflow file not found');
      }
      
      const workflow = fs.readFileSync(workflowPath, 'utf8');
      
      // Check for required jobs
      const requiredJobs = ['backend-tests', 'mobile-tests', 'e2e-tests', 'build-and-deploy'];
      requiredJobs.forEach(job => {
        if (!workflow.includes(job)) {
          throw new Error(`Missing required job: ${job}`);
        }
      });
      
      return '✅ GitHub Actions workflow is properly configured';
    });
  }

  testScripts() {
    this.addTest('Quality Report Generator', () => {
      const scriptPath = 'scripts/generate-quality-report.js';
      if (!fs.existsSync(scriptPath)) {
        throw new Error('Quality report generator script not found');
      }
      
      const script = fs.readFileSync(scriptPath, 'utf8');
      
      // Check for required methods
      const requiredMethods = ['generateReport', 'analyzeBackendTests', 'analyzeMobileTests'];
      requiredMethods.forEach(method => {
        if (!script.includes(method)) {
          throw new Error(`Missing required method: ${method}`);
        }
      });
      
      return '✅ Quality report generator script is properly configured';
    });
    
    this.addTest('Release Notes Generator', () => {
      const scriptPath = 'scripts/generate-release-notes.js';
      if (!fs.existsSync(scriptPath)) {
        throw new Error('Release notes generator script not found');
      }
      
      const script = fs.readFileSync(scriptPath, 'utf8');
      
      // Check for required methods
      const requiredMethods = ['generateNotes', 'getGitHistory', 'generateMarkdown'];
      requiredMethods.forEach(method => {
        if (!script.includes(method)) {
          throw new Error(`Missing required method: ${method}`);
        }
      });
      
      return '✅ Release notes generator script is properly configured';
    });
  }

  testDocumentation() {
    this.addTest('CI/CD Documentation', () => {
      const docPath = 'docs/CI-CD-SETUP.md';
      if (!fs.existsSync(docPath)) {
        throw new Error('CI/CD documentation not found');
      }
      
      const doc = fs.readFileSync(docPath, 'utf8');
      
      // Check for required sections
      const requiredSections = [
        '## Overview',
        '## 🚀 Pipeline Architecture',
        '## 📋 Required Secrets',
        '## 🔧 Local Development Setup'
      ];
      
      requiredSections.forEach(section => {
        if (!doc.includes(section)) {
          throw new Error(`Missing required section: ${section}`);
        }
      });
      
      return '✅ CI/CD documentation is comprehensive';
    });
  }

  testDeploymentConfig() {
    this.addTest('Fly.io Configuration', () => {
      const configPath = 'fly.toml';
      if (!fs.existsSync(configPath)) {
        throw new Error('Fly.io configuration file not found');
      }
      
      const config = fs.readFileSync(configPath, 'utf8');
      
      // Check for required configuration
      const requiredConfig = [
        'app = "all-in-chat-poker"',
        'primary_region = "iad"',
        '[http_service]',
        'internal_port = 8080'
      ];
      
      requiredConfig.forEach(configLine => {
        if (!config.includes(configLine)) {
          throw new Error(`Missing required configuration: ${configLine}`);
        }
      });
      
      return '✅ Fly.io configuration is properly set up';
    });
  }

  addTest(name, testFn) {
    try {
      const result = testFn();
      this.results.tests.push({
        name,
        status: 'PASS',
        message: result
      });
      this.results.passed++;
    } catch (error) {
      this.results.tests.push({
        name,
        status: 'FAIL',
        message: error.message
      });
      this.results.failed++;
    }
  }

  printResults() {
    console.log('\n📊 CI/CD Setup Test Results');
    console.log('============================');
    
    this.results.tests.forEach(test => {
      const icon = test.status === 'PASS' ? '✅' : '❌';
      console.log(`${icon} ${test.name}: ${test.message}`);
    });
    
    console.log('\n📈 Summary:');
    console.log(`   Passed: ${this.results.passed}`);
    console.log(`   Failed: ${this.results.failed}`);
    console.log(`   Total: ${this.results.passed + this.results.failed}`);
    
    if (this.results.failed === 0) {
      console.log('\n🎉 All CI/CD setup tests passed!');
    } else {
      console.log('\n⚠️ Some CI/CD setup tests failed. Please review the issues above.');
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new CICDSetupTest();
  tester.runTests()
    .then(results => {
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('❌ CI/CD setup test failed:', error);
      process.exit(1);
    });
}

module.exports = CICDSetupTest;
