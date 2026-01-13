#!/usr/bin/env node

/**
 * Environment Variable Validation Script
 * Validates all environment variables and provides helpful error messages
 */

const { validateEnv, generateEnvExample } = require('../server/env-schema');
const fs = require('fs');
const path = require('path');

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function colorLog(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function printHeader(title) {
  colorLog('\n' + '='.repeat(60), 'cyan');
  colorLog(`  ${title}`, 'cyan');
  colorLog('='.repeat(60), 'cyan');
}

function printSuccess(message) {
  colorLog(`✅ ${message}`, 'green');
}

function printError(message) {
  colorLog(`❌ ${message}`, 'red');
}

function printWarning(message) {
  colorLog(`⚠️  ${message}`, 'yellow');
}

function printInfo(message) {
  colorLog(`ℹ️  ${message}`, 'blue');
}

/**
 * Validate environment variables
 */
function validateEnvironment() {
  printHeader('Environment Variable Validation');
  
  try {
    const envConfig = validateEnv();
    
    printSuccess('Environment variables are valid!');
    printInfo(`Environment: ${envConfig.NODE_ENV}`);
    printInfo(`Server: ${envConfig.HOST}:${envConfig.PORT}`);
    
    // Check for production-specific requirements
    if (envConfig.IS_PRODUCTION) {
      printHeader('Production Environment Checks');
      
      const productionChecks = [
        { 
          name: 'JWT Secret', 
          value: envConfig.JWT_SECRET, 
          isValid: envConfig.JWT_SECRET && envConfig.JWT_SECRET.length >= 32,
          requirement: 'Must be at least 32 characters'
        },
        { 
          name: 'Session Secret', 
          value: envConfig.SESSION_SECRET, 
          isValid: envConfig.SESSION_SECRET && envConfig.SESSION_SECRET.length >= 32,
          requirement: 'Must be at least 32 characters'
        },
        { 
          name: 'Database URL', 
          value: envConfig.DATABASE_URL, 
          isValid: !!envConfig.DATABASE_URL,
          requirement: 'Must be a valid database connection string'
        }
      ];
      
      let allValid = true;
      productionChecks.forEach(check => {
        if (check.isValid) {
          printSuccess(`${check.name}: Valid`);
        } else {
          printError(`${check.name}: Invalid - ${check.requirement}`);
          allValid = false;
        }
      });
      
      if (!allValid) {
        printError('Production environment validation failed!');
        return false;
      }
    }
    
    // Check for optional but recommended variables
    printHeader('Optional Variables Check');
    
    const optionalChecks = [
      { name: 'Twitch Client ID', value: envConfig.TWITCH_CLIENT_ID },
      { name: 'Twitch Client Secret', value: envConfig.TWITCH_CLIENT_SECRET },
      { name: 'OpenAI API Key', value: envConfig.OPENAI_API_KEY },
      { name: 'Redis URL', value: envConfig.REDIS_URL }
    ];
    
    optionalChecks.forEach(check => {
      if (check.value) {
        printSuccess(`${check.name}: Configured`);
      } else {
        printWarning(`${check.name}: Not configured (optional)`);
      }
    });
    
    printSuccess('Environment validation completed successfully!');
    return true;
    
  } catch (error) {
    printError('Environment validation failed!');
    colorLog('\nError details:', 'red');
    colorLog(error.message, 'red');
    
    printHeader('Troubleshooting');
    printInfo('1. Check if your .env file exists in the project root');
    printInfo('2. Ensure all required variables are set');
    printInfo('3. Run "npm run env:example" to generate a template .env file');
    printInfo('4. Compare your .env file with .env.example');
    
    return false;
  }
}

/**
 * Generate .env.example file
 */
function generateExampleFile() {
  printHeader('Generating .env.example');
  
  try {
    const exampleContent = generateEnvExample();
    const examplePath = path.join(process.cwd(), '.env.example');
    
    fs.writeFileSync(examplePath, exampleContent);
    printSuccess(`Generated .env.example at ${examplePath}`);
    printInfo('Copy this file to .env and update the values as needed');
    
  } catch (error) {
    printError('Failed to generate .env.example');
    colorLog(error.message, 'red');
  }
}

/**
 * Check if .env file exists
 */
function checkEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  const envExists = fs.existsSync(envPath);
  
  if (envExists) {
    printSuccess('.env file found');
  } else {
    printWarning('.env file not found');
    printInfo('Create a .env file based on .env.example');
  }
  
  return envExists;
}

/**
 * Show environment configuration summary
 */
function showConfigSummary() {
  try {
    const envConfig = validateEnv();
    
    printHeader('Configuration Summary');
    
    const sections = [
      {
        title: 'Server Configuration',
        items: [
          { name: 'Environment', value: envConfig.NODE_ENV },
          { name: 'Host', value: envConfig.HOST },
          { name: 'Port', value: envConfig.PORT },
          { name: 'Server URL', value: envConfig.SERVER_URL }
        ]
      },
      {
        title: 'Feature Flags',
        items: [
          { name: 'Audio System', value: envConfig.ENABLE_AUDIO_SYSTEM ? 'Enabled' : 'Disabled' },
          { name: 'AI Features', value: envConfig.ENABLE_AI_FEATURES ? 'Enabled' : 'Disabled' },
          { name: 'WebSocket', value: envConfig.ENABLE_WEBSOCKET ? 'Enabled' : 'Disabled' },
          { name: 'Performance Monitoring', value: envConfig.ENABLE_PERFORMANCE_MONITORING ? 'Enabled' : 'Disabled' }
        ]
      },
      {
        title: 'Security Configuration',
        items: [
          { name: 'JWT Secret', value: envConfig.JWT_SECRET ? 'Set' : 'Not set' },
          { name: 'Session Secret', value: envConfig.SESSION_SECRET ? 'Set' : 'Not set' },
          { name: 'BCrypt Rounds', value: envConfig.BCRYPT_ROUNDS },
          { name: 'CORS Origin', value: envConfig.CORS_ORIGIN }
        ]
      }
    ];
    
    sections.forEach(section => {
      colorLog(`\n${section.title}:`, 'cyan');
      section.items.forEach(item => {
        const status = item.value === 'Enabled' || item.value === 'Set' ? 'green' : 'yellow';
        colorLog(`  ${item.name}: ${item.value}`, status);
      });
    });
    
  } catch (error) {
    printError('Failed to load configuration');
    colorLog(error.message, 'red');
  }
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'validate':
    case 'check':
      validateEnvironment();
      break;
      
    case 'example':
      generateExampleFile();
      break;
      
    case 'summary':
      showConfigSummary();
      break;
      
    case 'all':
      checkEnvFile();
      validateEnvironment();
      showConfigSummary();
      break;
      
    default:
      printHeader('Environment Variable Validator');
      colorLog('Usage: node scripts/validate-env.js [command]', 'cyan');
      colorLog('\nCommands:', 'cyan');
      colorLog('  validate    - Validate environment variables', 'white');
      colorLog('  check       - Same as validate', 'white');
      colorLog('  example     - Generate .env.example file', 'white');
      colorLog('  summary     - Show configuration summary', 'white');
      colorLog('  all         - Run all checks', 'white');
      colorLog('\nExamples:', 'cyan');
      colorLog('  node scripts/validate-env.js validate', 'white');
      colorLog('  node scripts/validate-env.js example', 'white');
      colorLog('  node scripts/validate-env.js summary', 'white');
      colorLog('  node scripts/validate-env.js all', 'white');
      break;
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  validateEnvironment,
  generateExampleFile,
  checkEnvFile,
  showConfigSummary
};
