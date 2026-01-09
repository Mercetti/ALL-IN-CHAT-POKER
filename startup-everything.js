/**
 * Startup Everything Script - Ensures all systems work together
 * Starts AI Control Center, Ollama, and ensures proper integration
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Complete System...');

// Check if Ollama is running
function checkOllama() {
  return new Promise((resolve) => {
    console.log('🔍 Checking Ollama status...');
    
    const ollama = spawn('ollama', ['serve'], {
      stdio: 'pipe',
      shell: true
    });
    
    let output = '';
    ollama.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    ollama.stderr.on('data', (data) => {
      output += data.toString();
    });
    
    ollama.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Ollama is running');
        resolve(true);
      } else {
        console.log('❌ Ollama failed to start');
        console.log('Output:', output);
        resolve(false);
      }
    });
    
    // Timeout after 10 seconds
    setTimeout(() => {
      ollama.kill();
      resolve(false);
    }, 10000);
  });
}

// Check if AI Control Center is running
function checkAIControlCenter() {
  return new Promise((resolve) => {
    console.log('🔍 Checking AI Control Center...');
    
    try {
      const response = fetch('http://localhost:5173', {
        method: 'GET',
        timeout: 5000
      });
      
      if (response.ok) {
        console.log('✅ AI Control Center is running');
        resolve(true);
      } else {
        console.log('❌ AI Control Center not responding');
        resolve(false);
      }
    } catch (error) {
      console.log('❌ AI Control Center check failed:', error.message);
      resolve(false);
    }
  });
}

// Start local server
function startLocalServer() {
  return new Promise((resolve) => {
    console.log('🔍 Starting local server...');
    
    const server = spawn('npm', ['run', 'dev:simple'], {
      stdio: 'pipe',
      shell: true
    });
    
    let output = '';
    server.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    server.stderr.on('data', (data) => {
      output += data.toString();
    });
    
    server.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Local server started');
        resolve(true);
      } else {
        console.log('❌ Local server failed to start');
        console.log('Output:', output);
        resolve(false);
      }
    });
    
    // Timeout after 30 seconds
    setTimeout(() => {
      server.kill();
      resolve(false);
    }, 30000);
  });
}

// Main startup function
async function startEverything() {
  console.log('🎯 Complete System Startup');
  console.log('================================');
  
  const results = {
    ollama: false,
    aiControlCenter: false,
    localServer: false
  };
  
  // Check all systems in parallel
  const checks = await Promise.allSettled([
    checkOllama(),
    checkAIControlCenter(),
    startLocalServer()
  ]);
  
  // Process results
  checks.forEach((result, index) => {
    const names = ['Ollama', 'AI Control Center', 'Local Server'];
    if (result.status === 'fulfilled' && result.value) {
      results[names[index].toLowerCase().replace(' ', '')] = true;
      console.log(`✅ ${names[index]}: Running`);
    } else {
      results[names[index].toLowerCase().replace(' ', '')] = false;
      console.log(`❌ ${names[index]}: Failed`);
    }
  });
  
  // Summary
  console.log('================================');
  console.log('📊 Startup Summary:');
  
  const allRunning = Object.values(results).every(r => r === true);
  
  if (allRunning) {
    console.log('🎉 ALL SYSTEMS RUNNING!');
    console.log('✅ Ollama: AI engine ready');
    console.log('✅ AI Control Center: Web interface available');
    console.log('✅ Local Server: Backend running');
    console.log('');
    console.log('🌐 Access URLs:');
    console.log('   AI Control Center: http://localhost:5173');
    console.log('   Local Server: http://localhost:3000');
    console.log('   Production: https://all-in-chat-poker.fly.dev');
    console.log('');
    console.log('🎯 Ready to use:');
    console.log('   • Upload images and create cosmetic sets');
    console.log('   • Generate audio for background music and effects');
    console.log('   • Monitor system health and performance');
    console.log('   • Manage all features through web interface');
  } else {
    console.log('❌ SOME SYSTEMS FAILED!');
    console.log('🔧 Troubleshooting:');
    
    if (!results.ollama) {
      console.log('   • Ollama: Run "ollama serve" in terminal');
      console.log('   • Check: http://127.0.0.1:11434/api/tags');
    }
    
    if (!results.aiControlCenter) {
      console.log('   • AI Control Center: Run "npm run dev:simple"');
      console.log('   • Check: http://localhost:5173');
    }
    
    if (!results.localServer) {
      console.log('   • Local Server: Check for port conflicts');
      console.log('   • Try: "npm run dev:simple" manually');
    }
    
    console.log('');
    console.log('🚀 Manual startup commands:');
    console.log('   Start Ollama: ollama serve');
    console.log('   Start everything: npm run dev:simple');
    console.log('   Check status: curl http://localhost:5173');
  }
  
  console.log('================================');
  
  return allRunning;
}

// Run if called directly
if (require.main === module) {
  startEverything().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Startup failed:', error);
    process.exit(1);
  });
}

module.exports = {
  startEverything,
  checkOllama,
  checkAIControlCenter,
  startLocalServer
};
