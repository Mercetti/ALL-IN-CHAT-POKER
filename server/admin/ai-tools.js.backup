/**
 * Admin AI tools and testing utilities
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// AI testing state
let aiGenerateBusy = false;
let lastAiTestReport = null;
let lastAiTestRunDateCst = null;

/**
 * Get available npm scripts from package.json
 * @returns {Object} - Map of script names to commands
 */
const getPackageScripts = () => {
  try {
    const packagePath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    return packageJson.scripts || {};
  } catch (error) {
    return {};
  }
};

/**
 * Run AI tests (manual or scheduled)
 * @param {string} kind - Type of test run ('manual' or 'scheduled')
 * @returns {Object} - Test report
 */
const runAiTests = async (kind = 'manual') => {
  const scripts = getPackageScripts();
  const logger = require('../logger');
  
  const report = {
    kind,
    startedAt: new Date().toISOString(),
    results: {},
    summary: { passed: 0, failed: 0, total: 0 },
    duration: 0,
  };

  const start = Date.now();

  try {
    // Run test suite
    if (scripts.test) {
      logger.info('Running AI test suite', { kind });
      const testResult = await runCommand('npm', ['test']);
      report.results.test = {
        exitCode: testResult.exitCode,
        stdout: testResult.stdout,
        stderr: testResult.stderr,
        success: testResult.exitCode === 0,
      };
      
      if (testResult.exitCode === 0) {
        report.summary.passed++;
      } else {
        report.summary.failed++;
      }
      report.summary.total++;
    }

    // Run linting
    if (scripts.lint) {
      logger.info('Running AI lint check', { kind });
      const lintResult = await runCommand('npm', ['run', 'lint']);
      report.results.lint = {
        exitCode: lintResult.exitCode,
        stdout: lintResult.stdout,
        stderr: lintResult.stderr,
        success: lintResult.exitCode === 0,
      };
      
      if (lintResult.exitCode === 0) {
        report.summary.passed++;
      } else {
        report.summary.failed++;
      }
      report.summary.total++;
    }

    // Run AI-specific tests if available
    if (scripts['test:ai']) {
      logger.info('Running AI-specific tests', { kind });
      const aiTestResult = await runCommand('npm', ['run', 'test:ai']);
      report.results['test:ai'] = {
        exitCode: aiTestResult.exitCode,
        stdout: aiTestResult.stdout,
        stderr: aiTestResult.stderr,
        success: aiTestResult.exitCode === 0,
      };
      
      if (aiTestResult.exitCode === 0) {
        report.summary.passed++;
      } else {
        report.summary.failed++;
      }
      report.summary.total++;
    }

  } catch (error) {
    logger.error('AI test execution failed', { error: error.message, kind });
    report.error = error.message;
    report.summary.failed++;
  }

  report.duration = Date.now() - start;
  report.completedAt = new Date().toISOString();
  
  lastAiTestReport = report;
  return report;
};

/**
 * Execute a command and capture output
 * @param {string} command - Command to execute
 * @param {string[]} args - Command arguments
 * @returns {Promise<Object>} - Command result
 */
const runCommand = (command, args) => {
  return new Promise((resolve) => {
    const stdout = [];
    const stderr = [];
    
    const child = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
    });
    
    child.stdout.on('data', (data) => stdout.push(data.toString()));
    child.stderr.on('data', (data) => stderr.push(data.toString()));
    
    child.on('close', (code) => {
      resolve({
        exitCode: code,
        stdout: stdout.join(''),
        stderr: stderr.join(''),
      });
    
    child.on('error', (error) => {
      resolve({
        exitCode: -1,
        stdout: '',
        stderr: error.message,
      });
  });
};

/**
 * Get current AI testing status
 * @returns {Object} - AI testing status
 */
const getAiTestStatus = () => ({
  busy: aiGenerateBusy,
  lastReport: lastAiTestReport,
  lastRunDate: lastAiTestRunDateCst,
  nextScheduledTest: 'Midnight CST',
});

/**
 * Set AI generation busy state
 * @param {boolean} busy - Whether AI generation is busy
 */
const setAiGenerateBusy = (busy) => {
  aiGenerateBusy = busy;
};

/**
 * Get AI test report
 * @returns {Object|null} - Last AI test report or null
 */
const getAiTestReport = () => lastAiTestReport;

/**
 * Set AI test report
 * @param {Object} report - AI test report to set
 */
const setAiTestReport = (report) => {
  lastAiTestReport = report;
};

/**
 * Get AI test run date
 * @returns {string|null} - Last AI test run date or null
 */
const getAiTestRunDate = () => lastAiTestRunDateCst;

/**
 * Set AI test run date
 * @param {string} date - AI test run date to set
 */
const setAiTestRunDate = (date) => {
  lastAiTestRunDateCst = date;
};

/**
 * Run scheduled AI tests
 * @returns {Object} - Test report
 */
const runScheduledAiTests = async () => {
  const logger = require('../logger');
  try {
    const report = await runAiTests('scheduled');
    logger.info('Scheduled AI tests completed', { 
      summary: report.summary,
      duration: report.duration 
    });
    return report;
  } catch (error) {
    logger.warn('Scheduled AI tests failed', { error: error.message });
    throw error;
  }
};

/**
 * Get AI system health metrics
 * @returns {Object} - AI system health information
 */
const getAiSystemHealth = () => {
  const logger = require('../logger');
  
  return {
    lastTest: lastAiTestReport,
    lastOverlayDiagnosis: null, // Would need overlay diagnosis implementation
    busy: aiGenerateBusy,
    nextScheduledTest: 'Midnight CST',
    lastAiTestRunDateCst,
  };
};

module.exports = {
  runAiTests,
  getAiTestStatus,
  setAiGenerateBusy,
  getAiTestReport,
  setAiTestReport,
  getAiTestRunDate,
  setAiTestRunDate,
  runScheduledAiTests,
  getAiSystemHealth,
  getPackageScripts,
  runCommand,
};
