/**
 * Admin code review and patch utilities
 */

const { createTwoFilesPatch } = require('diff');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Apply a patch file to the codebase
 * @param {string} patchPath - Path to the patch file
 * @param {string} targetPath - Target directory to apply patch
 * @returns {Object} - Patch application result
 */
const applyPatchFile = async (patchPath, targetPath = process.cwd()) => {
  const logger = require('../logger');
  
  try {
    if (!fs.existsSync(patchPath)) {
      throw new Error(`Patch file not found: ${patchPath}`);
    }
    
    const patchContent = fs.readFileSync(patchPath, 'utf8');
    logger.info('Applying patch file', { patchPath, targetPath });
    
    // Use git apply for proper patch handling
    const result = await runCommand('git', ['apply', patchPath], { cwd: targetPath });
    
    if (result.exitCode === 0) {
      logger.info('Patch applied successfully', { patchPath });
      return {
        success: true,
        message: 'Patch applied successfully',
        stdout: result.stdout,
        stderr: result.stderr,
      };
    } else {
      logger.error('Patch application failed', { patchPath, stderr: result.stderr });
      return {
        success: false,
        message: 'Patch application failed',
        stdout: result.stdout,
        stderr: result.stderr,
      };
    }
    
  } catch (error) {
    logger.error('Patch application error', { patchPath, error: error.message });
    return {
      success: false,
      message: error.message,
      error: error.message,
    };
  }
};

/**
 * Create a patch between two files
 * @param {string} originalPath - Original file path
 * @param {string} modifiedPath - Modified file path
 * @param {string} outputPath - Output patch file path
 * @returns {Object} - Patch creation result
 */
const createPatchFile = (originalPath, modifiedPath, outputPath) => {
  const logger = require('../logger');
  
  try {
    if (!fs.existsSync(originalPath)) {
      throw new Error(`Original file not found: ${originalPath}`);
    }
    
    if (!fs.existsSync(modifiedPath)) {
      throw new Error(`Modified file not found: ${modifiedPath}`);
    }
    
    const originalContent = fs.readFileSync(originalPath, 'utf8');
    const modifiedContent = fs.readFileSync(modifiedPath, 'utf8');
    
    const patch = createTwoFilesPatch(
      originalPath,
      modifiedPath,
      originalContent,
      modifiedContent
    );
    
    fs.writeFileSync(outputPath, patch, 'utf8');
    
    logger.info('Patch file created', { 
      originalPath, 
      modifiedPath, 
      outputPath,
      patchSize: patch.length 
    });
    
    return {
      success: true,
      message: 'Patch file created successfully',
      patchPath: outputPath,
      patchSize: patch.length,
    };
    
  } catch (error) {
    logger.error('Patch creation failed', { 
      originalPath, 
      modifiedPath, 
      outputPath, 
      error: error.message 
    });
    
    return {
      success: false,
      message: error.message,
      error: error.message,
    };
  }
};

/**
 * Run a command and capture output
 * @param {string} command - Command to execute
 * @param {string[]} args - Command arguments
 * @param {Object} options - Spawn options
 * @returns {Promise<Object>} - Command result
 */
const runCommand = (command, args, options = {}) => {
  return new Promise((resolve) => {
    const stdout = [];
    const stderr = [];
    
    const child = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
      ...options,
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
 * Get git status for the repository
 * @param {string} repoPath - Repository path
 * @returns {Object} - Git status information
 */
const getGitStatus = async (repoPath = process.cwd()) => {
  try {
    const result = await runCommand('git', ['status', '--porcelain'], { cwd: repoPath });
    
    if (result.exitCode !== 0) {
      throw new Error('Failed to get git status');
    }
    
    const lines = result.stdout.trim().split('\n');
    const status = {
      modified: [],
      added: [],
      deleted: [],
      untracked: [],
      renamed: [],
      clean: lines.length === 0,
    };
    
    lines.forEach(line => {
      if (!line) return;
      
      const statusCode = line.substring(0, 2);
      const filePath = line.substring(3);
      
      if (statusCode[0] === 'M' || statusCode[1] === 'M') {
        status.modified.push(filePath);
      } else if (statusCode[0] === 'A' || statusCode[1] === 'A') {
        status.added.push(filePath);
      } else if (statusCode[0] === 'D' || statusCode[1] === 'D') {
        status.deleted.push(filePath);
      } else if (statusCode[0] === '??') {
        status.untracked.push(filePath);
      } else if (statusCode[0] === 'R') {
        status.renamed.push(filePath);
      }
    });
    
    return {
      success: true,
      status,
      raw: result.stdout,
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get git diff for a file
 * @param {string} filePath - File path to diff
 * @param {string} repoPath - Repository path
 * @returns {Object} - Git diff information
 */
const getGitDiff = async (filePath, repoPath = process.cwd()) => {
  try {
    const result = await runCommand('git', ['diff', filePath], { cwd: repoPath });
    
    return {
      success: true,
      diff: result.stdout,
      hasChanges: result.stdout.trim().length > 0,
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Create a backup of a file before modification
 * @param {string} filePath - File to backup
 * @param {string} backupDir - Backup directory
 * @returns {Object} - Backup result
 */
const createFileBackup = (filePath, backupDir = null) => {
  const logger = require('../logger');
  
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = path.basename(filePath);
    const backupName = `${filename}.backup.${timestamp}`;
    
    const backupPath = backupDir 
      ? path.join(backupDir, backupName)
      : `${filePath}.backup.${timestamp}`;
    
    // Ensure backup directory exists
    if (backupDir) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    fs.copyFileSync(filePath, backupPath);
    
    logger.info('File backup created', { 
      originalPath: filePath, 
      backupPath,
      size: fs.statSync(filePath).size 
    });
    
    return {
      success: true,
      originalPath: filePath,
      backupPath,
      backupName,
      timestamp,
    };
    
  } catch (error) {
    logger.error('File backup failed', { filePath, error: error.message });
    
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Validate file path for security
 * @param {string} filePath - File path to validate
 * @param {string} basePath - Base path to restrict to
 * @returns {boolean} - Whether path is safe
 */
const validateFilePath = (filePath, basePath = process.cwd()) => {
  try {
    const resolvedPath = path.resolve(filePath);
    const resolvedBase = path.resolve(basePath);
    
    return resolvedPath.startsWith(resolvedBase);
  } catch {
    return false;
  }
};

/**
 * Get file statistics for code review
 * @param {string} filePath - File path
 * @returns {Object} - File statistics
 */
const getFileStats = (filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    const stats = fs.statSync(filePath);
    const content = fs.readFileSync(filePath, 'utf8');
    
    return {
      success: true,
      path: filePath,
      size: stats.size,
      lines: content.split('\n').length,
      characters: content.length,
      lastModified: stats.mtime,
      created: stats.birthtime,
      isFile: stats.isFile(),
      extension: path.extname(filePath),
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

module.exports = {
  applyPatchFile,
  createPatchFile,
  getGitStatus,
  getGitDiff,
  createFileBackup,
  validateFilePath,
  getFileStats,
  runCommand,
};
