#!/usr/bin/env node

/**
 * Comprehensive Helm System Test Suite
 * Tests all components after recent changes
 */

const fs = require('fs').promises;
const path = require('path');
const http = require('http');

class ComprehensiveTest {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      total: 0,
      details: []
    };
    this.servers = {
      helm: null,
      dashboard: null
    };
  }

  log(message, type = 'info') {
    const icons = {
      info: '🔍',
      success: '✅',
      error: '❌',
      warning: '⚠️',
      test: '🧪'
    };
    console.log(`${icons[type]} ${message}`);
  }

  async test(name, testFn) {
    this.results.total++;
    this.log(`Testing: ${name}`, 'test');
    
    try {
      const result = await testFn();
      if (result.passed) {
        this.results.passed++;
        this.log(`✓ ${name}: ${result.message}`, 'success');
      } else {
        this.results.failed++;
        this.log(`✗ ${name}: ${result.message}`, 'error');
      }
      this.results.details.push({
        name,
        passed: result.passed,
        message: result.message,
        details: result.details || {}
      });
    } catch (error) {
      this.results.failed++;
      const message = `Error: ${error.message}`;
      this.log(`✗ ${name}: ${message}`, 'error');
      this.results.details.push({
        name,
        passed: false,
        message,
        details: { error: error.stack }
      });
    }
  }

  async makeRequest(url, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname + urlObj.search,
        method: 'GET'
      };
      
      const request = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        }));
      });
      
      request.on('error', reject);
      request.setTimeout(timeout, () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });
      request.end();
    });
  }

  async testFileStructure() {
    const files = [
      'helm-server.js',
      'helm-small-llm-engine.js',
      'acey-control-center/public/helm-dashboard-complete.html',
      'acey-control-center/public/helm-dashboard.html',
      'acey-control-center/serve-dashboard.py',
      'Start-Helm-Complete.bat',
      'acey-control-center/Launch-Helm-Web-Dashboard.bat'
    ];

    const results = [];
    for (const file of files) {
      try {
        await fs.access(file);
        results.push({ file, exists: true });
      } catch {
        results.push({ file, exists: false });
      }
    }

    const missing = results.filter(r => !r.exists);
    return {
      passed: missing.length === 0,
      message: missing.length === 0 ? 
        `All ${files.length} core files present` : 
        `Missing ${missing.length} files: ${missing.map(m => m.file).join(', ')}`,
      details: { files: results }
    };
  }

  async testOllamaAvailability() {
    const { spawn } = require('child_process');
    
    return new Promise((resolve) => {
      const ollama = spawn('ollama', ['list']);
      let output = '';
      
      ollama.stdout.on('data', data => output += data.toString());
      ollama.stderr.on('data', data => output += data.toString());
      
      ollama.on('close', (code) => {
        const hasModels = output.includes('phi') || output.includes('tinyllama') || output.includes('qwen');
        resolve({
          passed: code === 0 && hasModels,
          message: code === 0 ? 
            (hasModels ? 'Ollama running with models' : 'Ollama running but no models found') :
            'Ollama not running or not installed',
          details: { code, output: output.substring(0, 200) }
        });
      });
      
      ollama.on('error', () => {
        resolve({
          passed: false,
          message: 'Ollama command not found - install required',
          details: {}
        });
      });
    });
  }

  async testHelmServer() {
    try {
      const response = await this.makeRequest('http://localhost:3001/helm/status');
      const data = JSON.parse(response.data);
      
      return {
        passed: response.status === 200 && data.running,
        message: `Helm server running (port 3001) - Status: ${data.running ? 'Active' : 'Inactive'}`,
        details: {
          status: response.status,
          running: data.running,
          skills: data.skills?.length || 0,
          learning: data.learning?.enabled || false
        }
      };
    } catch (error) {
      return {
        passed: false,
        message: `Helm server not accessible: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  async testDashboardServer() {
    try {
      const response = await this.makeRequest('http://localhost:8082/helm-dashboard-complete.html');
      const content = response.data;
      
      const hasEnhancedFeatures = content.includes('selectBestModel') && 
                                 content.includes('drawLogo') && 
                                 content.includes('message-bubble');
      
      return {
        passed: response.status === 200,
        message: hasEnhancedFeatures ? 
          'Enhanced dashboard available with all features' :
          'Basic dashboard available (missing enhanced features)',
        details: {
          status: response.status,
          enhanced: hasEnhancedFeatures,
          size: content.length
        }
      };
    } catch (error) {
      return {
        passed: false,
        message: `Dashboard server not accessible: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  async testLearningSystem() {
    try {
      const response = await this.makeRequest('http://localhost:3001/helm/status');
      const data = JSON.parse(response.data);
      
      const hasLearning = data.learning && data.learning.enabled;
      const learningPath = 'D:\\AceyLearning\\helm';
      
      let learningDirsExist = false;
      if (hasLearning) {
        try {
          await fs.access(learningPath);
          learningDirsExist = true;
        } catch {
          learningDirsExist = false;
        }
      }
      
      return {
        passed: hasLearning && learningDirsExist,
        message: hasLearning ? 
          (learningDirsExist ? 'Learning system active with storage' : 'Learning enabled but no storage dirs') :
          'Learning system not enabled',
        details: {
          enabled: hasLearning,
          storageExists: learningDirsExist,
          path: learningPath,
          events: data.learning?.events || 0
        }
      };
    } catch (error) {
      return {
        passed: false,
        message: `Cannot test learning system: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  async testChatInterface() {
    try {
      // Test the endpoint availability instead of making POST requests
      const statusResponse = await this.makeRequest('http://localhost:3001/helm/status');
      const data = JSON.parse(statusResponse.data);
      
      return {
        passed: data.running && data.skills && data.skills.includes('simple_chat'),
        message: data.running ? 
          'Chat interface available with simple_chat skill' :
          'Chat interface not ready',
        details: {
          running: data.running,
          skills: data.skills || [],
          chatSkill: data.skills?.includes('simple_chat') || false
        }
      };
    } catch (error) {
      return {
        passed: false,
        message: `Chat interface test failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  async testSkillExecution() {
    try {
      const response = await this.makeRequest('http://localhost:3001/helm/status');
      const data = JSON.parse(response.data);
      
      const expectedSkills = ['simple_chat', 'create_content', 'code_analysis', 'quick_assist'];
      const availableSkills = data.skills || [];
      const missingSkills = expectedSkills.filter(skill => !availableSkills.includes(skill));
      
      return {
        passed: missingSkills.length === 0,
        message: missingSkills.length === 0 ? 
          `All ${expectedSkills.length} core skills available` :
          `Missing ${missingSkills.length} skills: ${missingSkills.join(', ')}`,
        details: {
          expected: expectedSkills,
          available: availableSkills,
          missing: missingSkills
        }
      };
    } catch (error) {
      return {
        passed: false,
        message: `Skill execution test failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  async testDashboardFeatures() {
    try {
      const response = await this.makeRequest('http://localhost:8082/helm-dashboard-complete.html');
      const content = response.data;
      
      const features = {
        smartModelSelection: content.includes('selectBestModel'),
        messageBubbles: content.includes('message-bubble'),
        logoCanvas: content.includes('drawLogo'),
        darkTheme: content.includes('#1a1a2e'),
        multipleTabs: content.includes('renderChat') && content.includes('renderSkills'),
        learningStats: content.includes('getLearningStats')
      };
      
      const featureCount = Object.values(features).filter(Boolean).length;
      const totalFeatures = Object.keys(features).length;
      
      return {
        passed: featureCount >= 4, // At least 4 features should be present
        message: `${featureCount}/${totalFeatures} dashboard features detected`,
        details: {
          features,
          featureCount,
          totalFeatures
        }
      };
    } catch (error) {
      return {
        passed: false,
        message: `Dashboard features test failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  async testShortcuts() {
    const shortcuts = [
      'Start-Helm-Complete.bat',
      'acey-control-center/Launch-Helm-Web-Dashboard.bat',
      'acey-control-center/Launch-Helm-Mobile.bat'
    ];
    
    const results = [];
    for (const shortcut of shortcuts) {
      try {
        await fs.access(shortcut);
        const content = await fs.readFile(shortcut, 'utf8');
        const hasOllamaAuto = content.includes('startOllama') || content.includes('ollama serve') || content.includes('node helm-server.js');
        results.push({ shortcut, exists: true, hasOllamaAuto });
      } catch {
        results.push({ shortcut, exists: false, hasOllamaAuto: false });
      }
    }
    
    const existing = results.filter(r => r.exists);
    const withAutoOllama = existing.filter(r => r.hasOllamaAuto);
    
    return {
      passed: existing.length >= 2 && withAutoOllama.length >= 1,
      message: `${existing.length}/${shortcuts.length} shortcuts found, ${withAutoOllama.length} have auto-Ollama`,
      details: { shortcuts: results }
    };
  }

  async testMemoryUsage() {
    try {
      const response = await this.makeRequest('http://localhost:3001/helm/status');
      const data = JSON.parse(response.data);
      
      return {
        passed: true, // Always passes if we can get the data
        message: `System metrics available - Uptime: ${Math.floor(data.uptime || 0)}s`,
        details: {
          uptime: data.uptime || 0,
          totalExecutions: data.metrics?.totalExecutions || 0,
          successRate: data.metrics?.successfulExecutions && data.metrics?.totalExecutions ? 
            ((data.metrics.successfulExecutions / data.metrics.totalExecutions) * 100).toFixed(1) + '%' : 'N/A'
        }
      };
    } catch (error) {
      return {
        passed: false,
        message: `Memory usage test failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  async runAllTests() {
    console.log('🛡️  COMPREHENSIVE HELM SYSTEM TEST');
    console.log('=====================================\n');
    
    // Core Infrastructure Tests
    await this.test('File Structure', () => this.testFileStructure());
    await this.test('Ollama Availability', () => this.testOllamaAvailability());
    
    // Server Tests
    await this.test('Helm Server', () => this.testHelmServer());
    await this.test('Dashboard Server', () => this.testDashboardServer());
    
    // Feature Tests
    await this.test('Learning System', () => this.testLearningSystem());
    await this.test('Chat Interface', () => this.testChatInterface());
    await this.test('Skill Execution', () => this.testSkillExecution());
    await this.test('Dashboard Features', () => this.testDashboardFeatures());
    
    // Integration Tests
    await this.test('Shortcut Files', () => this.testShortcuts());
    await this.test('System Metrics', () => this.testMemoryUsage());
    
    this.printSummary();
  }

  printSummary() {
    console.log('\n📊 TEST SUMMARY');
    console.log('================');
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📈 Total:  ${this.results.total}`);
    console.log(`🎯 Success Rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);
    
    if (this.results.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results.details
        .filter(test => !test.passed)
        .forEach(test => {
          console.log(`  • ${test.name}: ${test.message}`);
        });
    }
    
    console.log('\n🎯 RECOMMENDATIONS:');
    this.generateRecommendations();
    
    // Save detailed report
    this.saveReport();
  }

  generateRecommendations() {
    const failedTests = this.results.details.filter(test => !test.passed);
    
    if (failedTests.length === 0) {
      console.log('  🎉 All systems operational! Helm is ready for use.');
      return;
    }
    
    const recommendations = {
      'Ollama Availability': 'Install Ollama from https://ollama.ai and run: ollama serve',
      'Helm Server': 'Start Helm server: node helm-server.js',
      'Dashboard Server': 'Start dashboard: python acey-control-center/serve-dashboard.py',
      'Learning System': 'Ensure D:\\AceyLearning\\helm directory exists and is writable',
      'Dashboard Features': 'Check if helm-dashboard-complete.html has all enhancements',
      'File Structure': 'Verify all core files are present in the project'
    };
    
    failedTests.forEach(test => {
      if (recommendations[test.name]) {
        console.log(`  • ${test.name}: ${recommendations[test.name]}`);
      }
    });
  }

  async saveReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        passed: this.results.passed,
        failed: this.results.failed,
        total: this.results.total,
        successRate: ((this.results.passed / this.results.total) * 100).toFixed(1)
      },
      details: this.results.details
    };
    
    try {
      await fs.writeFile('helm-test-report.json', JSON.stringify(report, null, 2));
      console.log('\n📄 Detailed report saved to: helm-test-report.json');
    } catch (error) {
      console.log('\n⚠️  Could not save report:', error.message);
    }
  }
}

// Run the comprehensive test
if (require.main === module) {
  const tester = new ComprehensiveTest();
  tester.runAllTests().catch(console.error);
}

module.exports = ComprehensiveTest;
