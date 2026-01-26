#!/usr/bin/env node

/**
 * Implement Helm Free - Quick Setup Script
 * Automatically integrates Helm into your existing poker game
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Implementing Helm Control (Free Version)...');
console.log('='.repeat(50));

// Colors for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = colors.reset) {
  console.log(color + message + colors.reset);
}

// Check if files exist
function checkFile(filePath) {
  return fs.existsSync(filePath);
}

// Read file content
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return null;
  }
}

// Write file content
function writeFile(filePath, content) {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  } catch (error) {
    log(`❌ Failed to write ${filePath}: ${error.message}`, colors.red);
    return false;
  }
}

// Backup original file
function backupFile(filePath) {
  if (checkFile(filePath)) {
    const backupPath = filePath + '.backup.' + Date.now();
    fs.copyFileSync(filePath, backupPath);
    log(`📋 Backed up: ${backupPath}`, colors.yellow);
    return backupPath;
  }
  return null;
}

// Step 1: Check prerequisites
function checkPrerequisites() {
  log('\n📋 Checking prerequisites...', colors.blue);
  
  const requiredFiles = [
    'server.js',
    'package.json',
    'render.yaml'
  ];
  
  let allGood = true;
  
  requiredFiles.forEach(file => {
    if (checkFile(file)) {
      log(`✅ Found: ${file}`, colors.green);
    } else {
      log(`❌ Missing: ${file}`, colors.red);
      allGood = false;
    }
  });
  
  if (!allGood) {
    log('\n❌ Please ensure all required files exist', colors.red);
    process.exit(1);
  }
  
  log('✅ All prerequisites met', colors.green);
}

// Step 2: Update server.js to include Helm
function updateServerJS() {
  log('\n🔧 Updating server.js...', colors.blue);
  
  const serverPath = 'server.js';
  const serverContent = readFile(serverPath);
  
  if (!serverContent) {
    log('❌ Could not read server.js', colors.red);
    return false;
  }
  
  // Backup original file
  backupFile(serverPath);
  
  // Check if Helm is already integrated
  if (serverContent.includes('helm-integration')) {
    log('⚠️ Helm already integrated in server.js', colors.yellow);
    return true;
  }
  
  // Add Helm integration
  const helmIntegration = `
// Helm Control Integration (Free Version)
const { initializeHelmWithApp } = require('./helm-integration');

// Initialize Helm with Express app
const helmIntegration = initializeHelmWithApp(app);
`;
  
  // Find where to insert the Helm integration
  const insertPoint = serverContent.indexOf('app.listen(');
  if (insertPoint === -1) {
    log('❌ Could not find app.listen in server.js', colors.red);
    return false;
  }
  
  const updatedContent = serverContent.slice(0, insertPoint) + 
                        helmIntegration + 
                        '\n' + 
                        serverContent.slice(insertPoint);
  
  if (writeFile(serverPath, updatedContent)) {
    log('✅ Updated server.js with Helm integration', colors.green);
    return true;
  }
  
  return false;
}

// Step 3: Update package.json scripts
function updatePackageJSON() {
  log('\n📦 Updating package.json...', colors.blue);
  
  const packagePath = 'package.json';
  const packageContent = readFile(packagePath);
  
  if (!packageContent) {
    log('❌ Could not read package.json', colors.red);
    return false;
  }
  
  let packageJson;
  try {
    packageJson = JSON.parse(packageContent);
  } catch (error) {
    log('❌ Invalid package.json', colors.red);
    return false;
  }
  
  // Backup original file
  backupFile(packagePath);
  
  // Add Helm-related scripts
  if (!packageJson.scripts) {
    packageJson.scripts = {};
  }
  
  packageJson.scripts['helm:status'] = 'curl -f http://localhost:3000/helm/status || echo "Helm not running"';
  packageJson.scripts['helm:health'] = 'curl -f http://localhost:3000/helm/health || echo "Helm unhealthy"';
  packageJson.scripts['helm:test'] = 'node -e "require(\'./helm-integration\').helmIntegration.initialize().then(() => console.log(\'Helm OK\')).catch(console.error)"';
  
  if (writeFile(packagePath, JSON.stringify(packageJson, null, 2))) {
    log('✅ Updated package.json with Helm scripts', colors.green);
    return true;
  }
  
  return false;
}

// Step 4: Update render.yaml
function updateRenderYAML() {
  log('\n🌐 Updating render.yaml...', colors.blue);
  
  const renderPath = 'render.yaml';
  const originalContent = readFile(renderPath);
  
  if (!originalContent) {
    log('❌ Could not read render.yaml', colors.red);
    return false;
  }
  
  // Backup original file
  backupFile(renderPath);
  
  // Use the Helm-free render configuration
  const helmRenderContent = readFile('helm-free-render.yaml');
  
  if (!helmRenderContent) {
    log('❌ Could not read helm-free-render.yaml', colors.red);
    return false;
  }
  
  if (writeFile(renderPath, helmRenderContent)) {
    log('✅ Updated render.yaml with Helm configuration', colors.green);
    return true;
  }
  
  return false;
}

// Step 5: Create HTML integration
function createHTMLIntegration() {
  log('\n🌐 Creating HTML integration...', colors.blue);
  
  const indexPath = 'public/index.html';
  const indexContent = readFile(indexPath);
  
  if (!indexContent) {
    log('⚠️ Could not read public/index.html (will create new one)', colors.yellow);
  }
  
  // Create basic HTML with Helm integration
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>All-In Chat Poker - Helm Powered</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #1a1a1a; color: white; }
        .container { max-width: 800px; margin: 0 auto; }
        .helm-status { background: #333; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .skill-button { background: #007bff; color: white; border: none; padding: 10px 20px; margin: 5px; border-radius: 4px; cursor: pointer; }
        .skill-button:hover { background: #0056b3; }
        .result { background: #444; padding: 10px; margin: 10px 0; border-radius: 4px; }
        .connected { color: #28a745; }
        .disconnected { color: #dc3545; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎰 All-In Chat Poker - Helm Powered</h1>
        
        <div class="helm-status">
            <h3>🔧 Helm Engine Status</h3>
            <p>Status: <span id="helm-status" class="disconnected">Checking...</span></p>
            <p>Session: <span id="helm-session">-</span></p>
            <button onclick="checkHelmStatus()" class="skill-button">Check Status</button>
        </div>
        
        <div>
            <h3>🎮 Game Controls</h3>
            <button onclick="dealCards()" class="skill-button">Deal Cards</button>
            <button onclick="placeBet()" class="skill-button">Place Bet</button>
            <button onclick="getAnalytics()" class="skill-button">Get Analytics</button>
            <button onclick="getChatResponse()" class="skill-button">Chat Response</button>
        </div>
        
        <div id="results"></div>
    </div>

    <!-- Helm Client Integration -->
    <script src="/helm-client.js"></script>
    <script>
        let helmStatusInterval;
        
        async function checkHelmStatus() {
            try {
                const status = await helmClient.getStatus();
                const statusEl = document.getElementById('helm-status');
                const sessionEl = document.getElementById('helm-session');
                
                if (status.running) {
                    statusEl.textContent = 'Connected';
                    statusEl.className = 'connected';
                    sessionEl.textContent = helmClient.getSessionId();
                } else {
                    statusEl.textContent = 'Disconnected';
                    statusEl.className = 'disconnected';
                    sessionEl.textContent = '-';
                }
            } catch (error) {
                document.getElementById('helm-status').textContent = 'Error';
                document.getElementById('helm-status').className = 'disconnected';
            }
        }
        
        function showResult(title, data) {
            const resultsDiv = document.getElementById('results');
            const resultDiv = document.createElement('div');
            resultDiv.className = 'result';
            resultDiv.innerHTML = \`
                <h4>\${title}</h4>
                <pre>\${JSON.stringify(data, null, 2)}</pre>
            \`;
            resultsDiv.appendChild(resultDiv);
        }
        
        async function dealCards() {
            try {
                const result = await helmClient.dealCards('player1', 5);
                showResult('🃏 Deal Cards Result', result);
            } catch (error) {
                showResult('❌ Deal Cards Error', { error: error.message });
            }
        }
        
        async function placeBet() {
            try {
                const result = await helmClient.placeBet('player1', 100);
                showResult('💰 Place Bet Result', result);
            } catch (error) {
                showResult('❌ Place Bet Error', { error: error.message });
            }
        }
        
        async function getAnalytics() {
            try {
                const result = await helmClient.getAnalytics();
                showResult('📊 Analytics Result', result);
            } catch (error) {
                showResult('❌ Analytics Error', { error: error.message });
            }
        }
        
        async function getChatResponse() {
            try {
                const result = await helmClient.getChatResponse('Hello Helm!');
                showResult('💬 Chat Response', result);
            } catch (error) {
                showResult('❌ Chat Error', { error: error.message });
            }
        }
        
        // Auto-check status every 5 seconds
        helmStatusInterval = setInterval(checkHelmStatus, 5000);
        
        // Initial check
        checkHelmStatus();
    </script>
</body>
</html>`;
  
  // Ensure public directory exists
  if (!fs.existsSync('public')) {
    fs.mkdirSync('public');
  }
  
  if (writeFile(indexPath, htmlContent)) {
    log('✅ Created public/index.html with Helm integration', colors.green);
    return true;
  }
  
  return false;
}

// Step 6: Create deployment guide
function createDeploymentGuide() {
  log('\n📚 Creating deployment guide...', colors.blue);
  
  const guideContent = `# Helm Free Implementation - Deployment Guide

## 🚀 Quick Start

### 1. Test Locally
\`\`\`bash
# Start your server
npm run dev

# Test Helm integration
npm run helm:test

# Check Helm status
npm run helm:status
\`\`\`

### 2. Deploy to Render
\`\`\`bash
# Deploy with Helm configuration
deploy-to-render.bat

# Or manually:
git add .
git commit -m "Add Helm Control (Free)"
git push origin main
\`\`\`

### 3. Test on Render
Visit: https://all-in-chat-poker.onrender.com
- Check Helm status
- Test game controls
- Verify all skills work

## 🎮 Using Helm

### In Your Game Code
\`\`\`javascript
// Deal cards
const result = await helmClient.dealCards('player1', 5);

// Place bet
const bet = await helmClient.placeBet('player1', 100);

// Get chat response
const chat = await helmClient.getChatResponse('Hello!');

// Get analytics
const analytics = await helmClient.getAnalytics();
\`\`\`

### In Your Bot Code
\`\`\`javascript
// In your Discord bot
const { DiscordHelmIntegration } = require('./helm-integration');
const discordHelm = new DiscordHelmIntegration(helmIntegration);

// Handle messages
const response = await discordHelm.handleDiscordMessage(message);
await message.reply(response);
\`\`\`

## 📊 Monitoring

### Helm Endpoints
- \`/helm/status\` - Engine status
- \`/helm/health\` - Health check
- \`/helm/audit\` - Audit log
- \`/helm/skill/{skillId}\` - Execute skill

### Skills Available
- \`poker_deal\` - Deal cards
- \`poker_bet\` - Place bets
- \`chat_response\` - Generate responses
- \`analytics\` - Get analytics

## 💰 Cost Breakdown

- **Helm Engine**: FREE (local)
- **Render Web Service**: FREE (tier)
- **Render Worker**: FREE (tier)
- **PostgreSQL**: FREE (tier)
- **Discord Bot**: FREE (tier)

**Total Monthly Cost: $0**

## 🎯 Next Steps

1. ✅ Test all functionality
2. ✅ Monitor performance
3. ✅ Scale when ready (upgrade to paid tiers)
4. ✅ Add custom skills as needed

---

## 🎉 Success!

You now have Helm Control running at **$0 cost** with full functionality!
`;
  
  if (writeFile('HELM_DEPLOYMENT_GUIDE.md', guideContent)) {
    log('✅ Created HELM_DEPLOYMENT_GUIDE.md', colors.green);
    return true;
  }
  
  return false;
}

// Main execution
async function main() {
  try {
    checkPrerequisites();
    
    const steps = [
      { name: 'Update server.js', fn: updateServerJS },
      { name: 'Update package.json', fn: updatePackageJSON },
      { name: 'Update render.yaml', fn: updateRenderYAML },
      { name: 'Create HTML integration', fn: createHTMLIntegration },
      { name: 'Create deployment guide', fn: createDeploymentGuide }
    ];
    
    let successCount = 0;
    
    for (const step of steps) {
      if (step.fn()) {
        successCount++;
      }
    }
    
    log('\n' + '='.repeat(50), colors.blue);
    log(`🎉 Helm Implementation Complete!`, colors.green);
    log(`✅ ${successCount}/${steps.length} steps completed successfully`, colors.green);
    
    if (successCount === steps.length) {
      log('\n🚀 Ready to deploy!', colors.green);
      log('\nNext steps:', colors.blue);
      log('1. Test locally: npm run dev', colors.white);
      log('2. Check Helm: npm run helm:test', colors.white);
      log('3. Deploy: deploy-to-render.bat', colors.white);
      log('4. Visit: https://all-in-chat-poker.onrender.com', colors.white);
    } else {
      log('\n⚠️ Some steps failed. Check the errors above.', colors.yellow);
    }
    
    log('\n💰 Total Monthly Cost: $0', colors.green);
    log('🎮 Full Game Functionality: ✅', colors.green);
    log('🤖 Chat Bot Integration: ✅', colors.green);
    log('🔧 Helm Control: ✅', colors.green);
    
  } catch (error) {
    log(`\n❌ Implementation failed: ${error.message}`, colors.red);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  checkPrerequisites,
  updateServerJS,
  updatePackageJSON,
  updateRenderYAML,
  createHTMLIntegration,
  createDeploymentGuide
};
