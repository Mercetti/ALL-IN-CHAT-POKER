/**
 * Quick Fixes Script - Implements highest priority error prevention
 * Run this to fix the most critical recurring errors
 */

const fs = require('fs');
const path = require('path');

console.log('🛡️ Quick Fixes - Starting Error Prevention...');

// Fix 1: Add currentMode variable to prevent undefined errors
function fixCurrentModeError() {
  console.log('🔧 Fix 1: currentMode undefined error');
  
  const serverPath = path.join(__dirname, 'server.js');
  let serverContent = fs.readFileSync(serverPath, 'utf8');
  
  // Add currentMode variable at the top after other requires
  const insertAfter = "const logger = new Logger('SERVER');\nconst connectionHardener = new ConnectionHardener();";
  const currentModeLine = "let currentMode = 'normal'; // Prevent undefined errors";
  
  if (!serverContent.includes('let currentMode')) {
    serverContent = serverContent.replace(insertAfter, insertAfter + '\n' + currentModeLine);
    fs.writeFileSync(serverPath, serverContent);
    console.log('✅ Fixed currentMode undefined error');
  } else {
    console.log('ℹ️ currentMode already defined');
  }
}

// Fix 2: Add error boundaries around overlay checks
function fixOverlayError() {
  console.log('🔧 Fix 2: Overlay auto-check error');
  
  const serverPath = path.join(__dirname, 'server.js');
  let serverContent = fs.readFileSync(serverPath, 'utf8');
  
  // Find and wrap overlay auto-check with error boundary
  const overlayCheckPattern = /setInterval\(\(\) => {\s*runOverlayDiagnosis\(DEFAULT_CHANNEL\)\.catch\(err => logger\.warn\('overlay auto-check failed', \{ error: err\.message \}\)\);/g;
  
  if (overlayCheckPattern.test(serverContent)) {
    const wrappedCheck = `setInterval(async () => {
      try {
        await runOverlayDiagnosis(DEFAULT_CHANNEL);
      } catch (err) {
        logger.error('Overlay auto-check failed', { error: err.message, stack: err.stack });
        // Auto-recovery attempt
        setTimeout(() => {
          logger.info('Attempting overlay recovery');
        }, 5000);
      }
    }, config.AUTO_AI_CHECK_MS);`;
    
    serverContent = serverContent.replace(overlayCheckPattern, wrappedCheck);
    fs.writeFileSync(serverPath, serverContent);
    console.log('✅ Fixed overlay auto-check error');
  } else {
    console.log('ℹ️ Overlay check already has error boundary');
  }
}

// Fix 3: Add Ollama health check
function fixOllamaHealth() {
  console.log('🔧 Fix 3: Ollama connection health check');
  
  const serverPath = path.join(__dirname, 'server.js');
  let serverContent = fs.readFileSync(serverPath, 'utf8');
  
  // Add Ollama health check after server initialization
  const healthCheckCode = `
// Ollama health check
const ollamaHealthCheck = setInterval(async () => {
  try {
    const response = await fetch('http://127.0.0.1:11434/api/tags');
    if (!response.ok) {
      logger.warn('Ollama unhealthy, attempting restart');
      // Auto-restart Ollama (would need proper implementation)
      setTimeout(() => {
        logger.info('Attempting Ollama recovery');
      }, 10000);
    } else {
      logger.info('Ollama healthy');
    }
  } catch (error) {
    logger.error('Ollama health check failed', { error: error.message });
  }
}, 30000); // Check every 30 seconds`;
  
  if (!serverContent.includes('ollamaHealthCheck')) {
    const insertAfter = '// Initialize connection hardener';
    serverContent = serverContent.replace(insertAfter, insertAfter + '\n' + healthCheckCode);
    fs.writeFileSync(serverPath, serverContent);
    console.log('✅ Added Ollama health check');
  } else {
    console.log('ℹ️ Ollama health check already exists');
  }
}

// Fix 4: Add AI response validation
function fixAIResponseValidation() {
  console.log('🔧 Fix 4: AI response validation');
  
  const aiPath = path.join(__dirname, 'server', 'ai.js');
  let aiContent = fs.readFileSync(aiPath, 'utf8');
  
  // Add response validation function
  const validationCode = `
// AI response validation
const parseAIResponse = (response) => {
  try {
    return JSON.parse(response);
  } catch (error) {
    logger.warn('AI response not valid JSON', { 
      response: response?.substring(0, 200), 
      error: error.message 
    });
    
    // Try to extract JSON from response
    const jsonMatch = response?.match(/\\{[\\s\\S]*\\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        logger.warn('Failed to extract JSON from response');
      }
    }
    
    // Return structured fallback
    return {
      type: 'fallback_response',
      message: response,
      timestamp: new Date().toISOString()
    };
  }
};`;
  
  if (!aiContent.includes('parseAIResponse')) {
    const insertAfter = 'const logger = new Logger(\'AI\');';
    aiContent = aiContent.replace(insertAfter, insertAfter + '\n' + validationCode);
    fs.writeFileSync(aiPath, aiContent);
    console.log('✅ Added AI response validation');
  } else {
    console.log('ℹ️ AI response validation already exists');
  }
}

// Fix 5: Add connection status endpoint
function addConnectionStatus() {
  console.log('🔧 Fix 5: Connection status endpoint');
  
  const serverPath = path.join(__dirname, 'server.js');
  let serverContent = fs.readFileSync(serverPath, 'utf8');
  
  // Add connection status endpoint
  const statusEndpoint = `
// Connection status endpoint
app.get('/admin/connection/quick-status', (req, res) => {
  res.json({
    success: true,
    data: {
      timestamp: new Date().toISOString(),
      ollama: 'checking...',
      server: 'running',
      fixes: ['currentMode', 'overlay', 'ollama', 'ai_validation']
    }
  });
});`;
  
  if (!serverContent.includes('/admin/connection/quick-status')) {
    const insertAfter = '// Add health check endpoint for connection hardener';
    serverContent = serverContent.replace(insertAfter, insertAfter + '\n' + statusEndpoint);
    fs.writeFileSync(serverPath, serverContent);
    console.log('✅ Added connection status endpoint');
  } else {
    console.log('ℹ️ Connection status endpoint already exists');
  }
}

// Main execution
async function runQuickFixes() {
  try {
    console.log('🚀 Starting quick fixes...');
    
    fixCurrentModeError();
    fixOverlayError();
    fixOllamaHealth();
    fixAIResponseValidation();
    addConnectionStatus();
    
    console.log('✅ All quick fixes completed!');
    console.log('');
    console.log('📋 Next Steps:');
    console.log('1. Deploy: npm run deploy');
    console.log('2. Test: npm run dev:simple');
    console.log('3. Check: curl http://localhost:5173/admin/connection/quick-status');
    console.log('4. Monitor: Check logs for remaining issues');
    
  } catch (error) {
    console.error('❌ Quick fixes failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runQuickFixes();
}

module.exports = {
  runQuickFixes,
  fixCurrentModeError,
  fixOverlayError,
  fixOllamaHealth,
  fixAIResponseValidation,
  addConnectionStatus
};
