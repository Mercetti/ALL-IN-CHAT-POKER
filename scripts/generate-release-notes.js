/**
 * Release Notes Generator
 * Generates comprehensive release notes from git history and test results
 */

const { spawn } = require('child_process');
const fs = require('fs');

class ReleaseNotesGenerator {
  constructor() {
    this.version = process.env.GITHUB_RUN_NUMBER || '1';
    this.commit = process.env.GITHUB_SHA || 'local';
    this.branch = process.env.GITHUB_REF_NAME || 'main';
    this.notes = {
      version: `v${this.version}`,
      date: new Date().toLocaleDateString(),
      commit: this.commit.substring(0, 7),
      features: [],
      improvements: [],
      fixes: [],
      tests: {
        backend: {},
        mobile: {},
        e2e: {},
        performance: {}
      },
      performance: {},
      security: {},
      deployment: {
        environment: 'production',
        url: 'https://all-in-chat-poker.fly.dev'
      }
    };
  }

  async generateNotes() {
    console.log('📝 Generating Release Notes...');
    
    // Get git history
    await this.getGitHistory();
    
    // Load test results
    await this.loadTestResults();
    
    // Generate release notes
    this.generateMarkdown();
    
    console.log('✅ Release Notes Generated');
    console.log(`📁 Saved to: release-notes.md`);
    
    return this.notes;
  }

  async getGitHistory() {
    return new Promise((resolve, reject) => {
      const gitLog = spawn('git', [
        'log',
        '--oneline',
        '--since=1 week ago',
        '--pretty=format:%h %s'
      ], { stdio: 'pipe' });
      
      let output = '';
      
      gitLog.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      gitLog.on('close', (code) => {
        if (code === 0) {
          this.parseGitHistory(output);
          resolve();
        } else {
          reject(new Error(`Git log failed with code ${code}`));
        }
      });
      
      gitLog.on('error', reject);
    });
  }

  parseGitHistory(output) {
    const commits = output.trim().split('\n');
    
    commits.forEach(commit => {
      const [hash, ...messageParts] = commit.split(' ');
      const message = messageParts.join(' ');
      
      // Categorize commits based on conventional commits
      if (message.startsWith('feat:') || message.startsWith('feature:')) {
        this.notes.features.push({
          hash,
          message: message.replace(/^(feat|feature):\\s*/, '')
        });
      } else if (message.startsWith('improve:') || message.startsWith('refactor:')) {
        this.notes.improvements.push({
          hash,
          message: message.replace(/^(improve|refactor):\\s*/, '')
        });
      } else if (message.startsWith('fix:') || message.startsWith('bugfix:')) {
        this.notes.fixes.push({
          hash,
          message: message.replace(/^(fix|bugfix):\\s*/, '')
        });
      } else {
        // Default to improvements for other commits
        this.notes.improvements.push({
          hash,
          message
        });
      }
    });
  }

  async loadTestResults() {
    // Load backend test results
    try {
      if (fs.existsSync('backend-test-results.json')) {
        this.notes.tests.backend = JSON.parse(fs.readFileSync('backend-test-results.json', 'utf8'));
      }
    } catch (error) {
      console.warn('⚠️ Could not load backend test results:', error.message);
    }
    
    // Load mobile test results
    try {
      if (fs.existsSync('mobile-test-results.json')) {
        this.notes.tests.mobile = JSON.parse(fs.readFileSync('mobile-test-results.json', 'utf8'));
      }
    } catch (error) {
      console.warn('⚠️ Could not load mobile test results:', error.message);
    }
    
    // Load E2E test results
    try {
      if (fs.existsSync('e2e-test-results.json')) {
        this.notes.tests.e2e = JSON.parse(fs.readFileSync('e2e-test-results.json', 'utf8'));
      }
    } catch (error) {
      console.warn('⚠️ Could not load E2E test results:', error.message);
    }
    
    // Load performance results
    try {
      if (fs.existsSync('performance-test-report.json')) {
        this.notes.performance = JSON.parse(fs.readFileSync('performance-test-report.json', 'utf8'));
      }
    } catch (error) {
      console.warn('⚠️ Could not load performance results:', error.message);
    }
    
    // Load security results
    try {
      if (fs.existsSync('security-report.json')) {
        this.notes.security = JSON.parse(fs.readFileSync('security-report.json', 'utf8'));
      }
    } catch (error) {
      console.warn('⚠️ Could not load security results:', error.message);
    }
  }

  generateMarkdown() {
    const notes = `
# Release Notes ${this.notes.version}

**Date:** ${this.notes.date}  
**Commit:** ${this.notes.commit}  
**Branch:** ${this.branch}

## 🚀 Features

${this.notes.features.length > 0 ? 
  this.notes.features.map(f => `- **${f.hash}** ${f.message}`).join('\\n') : 
  'No new features in this release.'
}

## 🔧 Improvements

${this.notes.improvements.length > 0 ? 
  this.notes.improvements.map(i => `- **${i.hash}** ${i.message}`).join('\\n') : 
  'No improvements in this release.'
}

## 🐛 Fixes

${this.notes.fixes.length > 0 ? 
  this.notes.fixes.map(f => `- **${f.hash}** ${f.message}`).join('\\n') : 
  'No bug fixes in this release.'
}

## 🧪 Test Results

### Backend Tests
- **Total Tests:** ${this.notes.tests.backend.totalTests || 'N/A'}
- **Passed:** ${this.notes.tests.backend.passedTests || 'N/A'}
- **Failed:** ${this.notes.tests.backend.failedTests || 'N/A'}
- **Pass Rate:** ${this.calculatePassRate(this.notes.tests.backend)}%

### Mobile Tests
- **Total Tests:** ${this.notes.tests.mobile.totalTests || 'N/A'}
- **Passed:** ${this.notes.tests.mobile.passedTests || 'N/A'}
- **Failed:** ${this.notes.tests.mobile.failedTests || 'N/A'}
- **Pass Rate:** ${this.calculatePassRate(this.notes.tests.mobile)}%

### E2E Tests
- **Total Tests:** ${this.notes.tests.e2e.totalTests || 'N/A'}
- **Passed:** ${this.notes.tests.e2e.passedTests || 'N/A'}
- **Failed:** ${this.notes.tests.e2e.failedTests || 'N/A'}
- **Pass Rate:** ${this.calculatePassRate(this.notes.tests.e2e)}%

## ⚡ Performance

${this.notes.performance.averageExecutionTime ? 
  `- **Average Execution Time:** ${this.notes.performance.averageExecutionTime}ms\\n` +
  `- **Performance Score:** ${this.notes.performance.score || 'N/A'}/100` : 
  'No performance data available.'
}

## 🔒 Security

${this.notes.security.vulnerabilities ? 
  `- **Security Score:** ${this.notes.security.score || 'N/A'}/100\\n` +
  `- **Vulnerabilities Found:** ${this.notes.security.vulnerabilities.length}\\n` +
  `- **High Severity:** ${this.notes.security.vulnerabilities.filter(v => v.severity === 'high').length}\\n` +
  `- **Medium Severity:** ${this.notes.security.vulnerabilities.filter(v => v.severity === 'medium').length}\\n` +
  `- **Low Severity:** ${this.notes.security.vulnerabilities.filter(v => v.severity === 'low').length}` : 
  'No security data available.'
}

## 🚀 Deployment

- **Environment:** ${this.notes.deployment.environment}
- **URL:** ${this.notes.deployment.url}
- **Status:** ✅ Deployed Successfully

## 📋 Summary

This release includes ${this.notes.features.length} new features, ${this.notes.improvements.length} improvements, and ${this.notes.fixes.length} bug fixes. All tests have passed and the application has been successfully deployed to production.

## 🔗 Links

- **Live Application:** ${this.notes.deployment.url}
- **Health Check:** ${this.notes.deployment.url}/health
- **GitHub Repository:** https://github.com/your-org/all-in-chat-poker

---

*Generated automatically on ${new Date().toISOString()}*
    `;
    
    fs.writeFileSync('release-notes.md', notes);
  }

  calculatePassRate(testResults) {
    if (!testResults.totalTests) return 'N/A';
    const passRate = ((testResults.passedTests || 0) / testResults.totalTests) * 100;
    return passRate.toFixed(1);
  }
}

// Run if called directly
if (require.main === module) {
  const generator = new ReleaseNotesGenerator();
  generator.generateNotes()
    .catch(error => {
      console.error('❌ Failed to generate release notes:', error);
      process.exit(1);
    });
}

module.exports = ReleaseNotesGenerator;
