/**
 * Development Environment Health Check
 * Checks for common issues and provides solutions
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function checkPort(port, name) {
  try {
    const result = execSync(`netstat -aon | find ":${port}"`, { encoding: 'utf8' });
    return {
      port,
      name,
      inUse: result.trim().length > 0,
      details: result.trim()
    };
  } catch (error) {
    return {
      port,
      name,
      inUse: false,
      details: 'Port free'
    };
  }
}

function checkProcess(processName, description) {
  try {
    const result = execSync(`tasklist | find "${processName}"`, { encoding: 'utf8' });
    return {
      process: processName,
      description,
      running: result.trim().length > 0,
      details: result.trim().split('\n').length - 1
    };
  } catch (error) {
    return {
      process: processName,
      description,
      running: false,
      details: 0
    };
  }
}

function checkFile(filePath, description) {
  const fullPath = path.join(__dirname, filePath);
  return {
    path: filePath,
    description,
    exists: fs.existsSync(fullPath),
    size: fs.existsSync(fullPath) ? fs.statSync(fullPath).size : 0
  };
}

console.log('🏥 Development Environment Health Check');
console.log('=' .repeat(50));

// Check critical ports
const ports = [
  { port: 5173, name: 'AI Control Center' },
  { port: 8080, name: 'Backend Server' },
  { port: 11434, name: 'Ollama' },
  { port: 8081, name: 'Acey WebSocket' }
];

console.log('\n🔌 Port Status:');
ports.forEach(({ port, name }) => {
  const status = checkPort(port, name);
  const icon = status.inUse ? '⚠️' : '✅';
  console.log(`${icon} ${name} (${port}): ${status.inUse ? 'In Use' : 'Free'}`);
});

// Check processes
console.log('\n🤖 Process Status:');
const processes = [
  { process: 'node.exe', description: 'Node.js' },
  { process: 'ollama.exe', description: 'Ollama' },
  { process: 'chrome.exe', description: 'Chrome' }
];

processes.forEach(({ process, description }) => {
  const status = checkProcess(process, description);
  const icon = status.running ? '✅' : '❌';
  console.log(`${icon} ${description}: ${status.running ? `${status.details} instances` : 'Not running'}`);
});

// Check important files
console.log('\n📁 File Status:');
const files = [
  { path: 'apps/ai-control-center/package.json', description: 'AI Control Center Config' },
  { path: 'server.js', description: 'Main Server' },
  { path: '.vscode/settings.json', description: 'VS Code Settings' },
  { path: 'update-ai-control-center.bat', description: 'Update Script' }
];

files.forEach(({ path, description }) => {
  const status = checkFile(path, description);
  const icon = status.exists ? '✅' : '❌';
  console.log(`${icon} ${description}: ${status.exists ? 'Exists' : 'Missing'}`);
});

// Health summary
const portConflicts = ports.filter(p => checkPort(p.port, p.name).inUse).length;
const processesRunning = processes.filter(p => checkProcess(p.process, p.description).running).length;
const filesMissing = files.filter(f => !checkFile(f.path, f.description).exists).length;

console.log('\n📊 Health Summary:');
console.log(`   Port Conflicts: ${portConflicts}/4`);
console.log(`   Processes Running: ${processesRunning}/3`);
console.log(`   Files Missing: ${filesMissing}/4`);

// Recommendations
console.log('\n💡 Recommendations:');
if (portConflicts > 1) {
  console.log('⚠️  Multiple ports in use - run: clean-restart-server.bat');
}
if (!processes.find(p => p.process === 'ollama.exe' && checkProcess(p.process, p.description).running)) {
  console.log('⚠️  Ollama not running - start it for AI features');
}
if (filesMissing > 0) {
  console.log('⚠️  Some files missing - check project integrity');
}

if (portConflicts <= 1 && processesRunning >= 1 && filesMissing === 0) {
  console.log('✅ Development environment looks healthy!');
}

console.log('\n🔧 Available Tools:');
console.log('   • Port checker: check-ports.bat');
console.log('   • Clean restart: clean-restart-server.bat');
console.log('   • Update app: update-ai-control-center.bat');
console.log('   • Version check: node check-version.js');
