#!/usr/bin/env node

/**
 * AI Quality Integration Setup Script
 * Sets up the AI quality guardrails system
 */

const fs = require('fs');
const path = require('path');

async function setupAIQualityIntegration() {
  console.log('🤖 Setting up AI Quality Integration...\n');

  try {
    // 1. Update package.json with new dependencies
    await updatePackageJson();

    // 2. Create ESLint configuration
    await createESLintConfig();

    // 3. Set up pre-commit hooks
    await setupPreCommitHooks();

    // 4. Create integration script for server.js
    await createServerIntegration();

    // 5. Add to existing AI system
    await integrateWithExistingAI();

    console.log('✅ AI Quality Integration setup complete!');
    console.log('\nNext steps:');
    console.log('1. Run: npm install');
    console.log('2. Add to server.js: require("./server/ai-quality-integration")');
    console.log('3. Test with: npm run check-duplicates');
    console.log('4. Start server and visit /admin/ai/code/quality');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

async function updatePackageJson() {
  console.log('📦 Updating package.json...');
  
  const packagePath = path.join(__dirname, '../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  // Add quality scripts
  packageJson.scripts = {
    ...packageJson.scripts,
    'check-duplicates': 'node scripts/check-duplicates.js',
    'audit-orphaned': 'node scripts/audit-orphaned.js',
    'quality-check': 'node scripts/quality-check.js',
    'ai-quality': 'node server/ai-quality-integration.js'
  };

  // Add dev dependencies for quality tools
  packageJson.devDependencies = {
    ...packageJson.devDependencies,
    'husky': '^8.0.3',
    'lint-staged': '^13.2.3',
    'eslint': '^8.45.0'
  };

  // Add husky configuration
  packageJson.husky = {
    hooks: {
      'pre-commit': 'lint-staged && npm run check-duplicates',
      'pre-push': 'npm run audit-orphaned'
    }
  };

  // Add lint-staged configuration
  packageJson['lint-staged'] = {
    '*.js': ['eslint --fix', 'prettier --write']
  };

  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
  console.log('   ✅ package.json updated');
}

async function createESLintConfig() {
  console.log('⚙️ Creating ESLint configuration...');
  
  const eslintConfig = {
    extends: ['eslint:recommended'],
    rules: {
      'no-duplicate-imports': 'error',
      'no-shadow': 'error',
      'no-redeclare': 'error',
      'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
      'no-console': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-arrow-callback': 'error',
      'arrow-spacing': 'error',
      'no-trailing-spaces': 'error',
      'eol-last': 'error',
      'comma-dangle': ['error', 'never'],
      'semi': ['error', 'always'],
      'quotes': ['error', 'single'],
      'indent': ['error', 2],
      'max-len': ['warn', { 'code': 120 }],
      'max-lines-per-function': ['warn', 50],
      'complexity': ['warn', 10]
    },
    overrides: [
      {
        files: ['server.js'],
        rules: {
          'max-lines': ['warn', 300],
          'max-lines-per-function': ['warn', 100]
        }
      }
    ]
  };

  fs.writeFileSync(
    path.join(__dirname, '../.eslintrc.json'),
    JSON.stringify(eslintConfig, null, 2)
  );
  console.log('   ✅ .eslintrc.json created');
}

async function setupPreCommitHooks() {
  console.log('🔧 Setting up pre-commit hooks...');
  
  // Create .gitignore if it doesn't exist
  const gitignorePath = path.join(__dirname, '../.gitignore');
  if (!fs.existsSync(gitignorePath)) {
    fs.writeFileSync(gitignorePath, 'node_modules\n.env\n*.log\n.DS_Store\n');
  }

  console.log('   ✅ Pre-commit hooks configured');
}

async function createServerIntegration() {
  console.log('🔗 Creating server integration...');
  
  const integrationCode = `
// AI Quality Integration
const AIQualityIntegration = require('./server/ai-quality-integration');

// Initialize AI Quality Integration
const aiQuality = new AIQualityIntegration();

// Initialize after server starts
server.listen(PORT, HOST, async () => {
  logger.info(\`Server running on \${HOST}:\${PORT}\`);
  logger.info(\`Environment: \${process.env.NODE_ENV || 'development'}\`);
  
  // Initialize connection hardener after server starts
  connectionHardener.startMonitoring();
  
  // Initialize AI Quality Integration
  await aiQuality.initialize();
  
  // Add AI quality endpoints
  aiQuality.addQualityEndpoints(app);
  
  logger.info('AI Quality Integration initialized');
});
`;

  const serverPath = path.join(__dirname, '../server.js');
  const serverContent = fs.readFileSync(serverPath, 'utf8');
  
  // Check if already integrated
  if (serverContent.includes('AIQualityIntegration')) {
    console.log('   ⚠️  AI Quality Integration already exists in server.js');
    return;
  }

  console.log('   📝 Add this code to server.js after the existing server.listen() call:');
  console.log(integrationCode);
  
  // Save integration snippet for easy copy-paste
  fs.writeFileSync(
    path.join(__dirname, '../ai-quality-integration-snippet.js'),
    integrationCode.trim()
  );
  
  console.log('   ✅ Integration snippet saved to ai-quality-integration-snippet.js');
}

async function integrateWithExistingAI() {
  console.log('🤖 Creating AI integration guide...');
  
  const guide = `
# AI Quality Integration Guide

## Quick Start

1. **Install dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

2. **Add to server.js:**
   Copy the code from \`ai-quality-integration-snippet.js\` to your server.js file

3. **Test the integration:**
   \`\`\`bash
   npm run check-duplicates
   npm run audit-orphaned
   \`\`\`

4. **Start server and test endpoints:**
   \`\`\`bash
   npm start
   \`\`\`

## Available Endpoints

### POST /admin/ai/code/generate
Generate code with quality guardrails
\`\`\`json
{
  "type": "function|route|module|refactor",
  "description": "What the code should do",
  "context": {}
}
\`\`\`

### GET /admin/ai/code/quality
Check current code quality
Returns health status and recommendations

### POST /admin/ai/code/refactor
Get refactoring suggestions for code
\`\`\`json
{
  "code": "code to analyze"
}
\`\`\`

### POST /admin/ai/code/validate
Validate generated code
\`\`\`json
{
  "code": "code to validate",
  "context": {}
}
\`\`\`

## Integration with Existing AI

To enhance your existing AI system:

\`\`\`javascript
const AIQualityIntegration = require('./server/ai-quality-integration');
const aiQuality = new AIQualityIntegration();

// Enhance existing AI
const enhancedAI = aiQuality.enhanceExistingAISystem(yourExistingAI);

// Use quality prompts
const qualityPrompt = aiQuality.createQualityPrompt('Create a new route');
\`\`\`

## Quality Rules

The AI will automatically prevent:
- Duplicate function definitions
- Multiple server.listen() calls
- Orphaned code blocks
- Unused imports
- Console statements (uses logger instead)

## Automated Checks

- **Pre-commit**: Duplicate detection and linting
- **Pre-push**: Orphaned code audit
- **Hourly**: Automatic quality monitoring
- **Manual**: Quality endpoints and scripts

## Monitoring

Check the logs for:
- Quality validation failures
- Automatic fixes applied
- Refactoring suggestions
- Code health metrics
`;

  fs.writeFileSync(
    path.join(__dirname, '../docs/ai-quality-integration-guide.md'),
    guide.trim()
  );
  
  console.log('   ✅ Integration guide saved to docs/ai-quality-integration-guide.md');
}

// Run setup
if (require.main === module) {
  setupAIQualityIntegration();
}

module.exports = { setupAIQualityIntegration };
