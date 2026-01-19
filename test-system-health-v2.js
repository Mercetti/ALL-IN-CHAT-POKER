#!/usr/bin/env node

const Logger = require('./server/logger');
const logger = new Logger('SystemHealth');

// Test AI Manager connectivity
async function testAIManager() {
  try {
    const ai = require('./server/ai');
    
    // Test basic connectivity
    const testResponse = await ai.chat([
      { role: 'system', content: 'Health check' },
      { role: 'user', content: 'Respond with OK' }
    ], { timeout: 5000 });
    
    if (testResponse && testResponse.message) {
      logger.info('✅ AI Manager: CONNECTED');
      logger.info(`   Provider: ${ai.aiManager?.currentProvider?.name || 'unknown'}`);
      logger.info(`   Response: ${testResponse.message.substring(0, 50)}...`);
      return true;
    } else {
      logger.error('❌ AI Manager: FAILED');
      return false;
    }
  } catch (error) {
    logger.error('❌ AI Manager Test Error:', error.message);
    return false;
  }
}

// Test Audio System
async function testAudioSystem() {
  try {
    const PokerAudioSystem = require('./server/poker-audio-system');
    const audioSystem = new PokerAudioSystem({ outputDir: './test-output' });
    
    // Test procedural generation
    const proceduralResult = await audioSystem.generateAudioItem({
      name: 'health_check_sfx',
      duration: 1,
      mood: 'neutral'
    }, 'sfx');
    
    if (proceduralResult && proceduralResult.success) {
      logger.info('✅ Audio System: PROCEDURAL GENERATION OK');
    } else {
      logger.error('❌ Audio System: PROCEDURAL GENERATION FAILED');
      return false;
    }
    
    // Test AI integration
    const aiResult = await audioSystem.generateAudioWithAI({
      name: 'health_check_music',
      duration: 2,
      mood: 'neutral'
    }, 'music');
    
    if (aiResult && aiResult.success) {
      logger.info('✅ Audio System: AI INTEGRATION OK');
      logger.info(`   Fallback used: ${aiResult.fallback ? 'YES' : 'NO'}`);
    } else {
      logger.warn('⚠️  Audio System: AI INTEGRATION LIMITED');
    }
    
    return true;
  } catch (error) {
    logger.error('❌ Audio System Test Error:', error.message);
    return false;
  }
}

// Test configuration
function testConfiguration() {
  try {
    const config = require('./server/config');
    
    logger.info('📋 Configuration Check:');
    logger.info(`   AI Provider: ${config.AI_PROVIDER || 'ollama'}`);
    logger.info(`   Ollama Model: ${config.OLLAMA_MODEL || 'deepseek-coder:1.3b'}`);
    logger.info(`   Node Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`   Memory Available: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB / ${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`);
    
    return true;
  } catch (error) {
    logger.error('❌ Configuration Test Error:', error.message);
    return false;
  }
}

// Main health check
async function runHealthCheck() {
  logger.info('🔍 Starting System Health Check...');
  logger.info('');
  
  const results = {
    timestamp: new Date().toISOString(),
    aiManager: await testAIManager(),
    audioSystem: await testAudioSystem(),
    configuration: testConfiguration()
  };
  
  logger.info('');
  logger.info('📊 Health Check Summary:');
  logger.info(`   AI Manager: ${results.aiManager ? '✅ PASS' : '❌ FAIL'}`);
  logger.info(`   Audio System: ${results.audioSystem ? '✅ PASS' : '❌ FAIL'}`);
  logger.info(`   Configuration: ${results.configuration ? '✅ PASS' : '❌ FAIL'}`);
  
  const overallHealth = results.aiManager && results.audioSystem && results.configuration;
  logger.info(`   Overall Status: ${overallHealth ? '🟢 HEALTHY' : '🔴 UNHEALTHY'}`);
  logger.info('');
  
  if (overallHealth) {
    logger.info('🎉 System is ready for production!');
  } else {
    logger.warn('⚠️  System needs attention before production deployment.');
  }
  
  return overallHealth;
}

// Run if called directly
if (require.main === module) {
  runHealthCheck().catch(error => {
    logger.error('Health check failed:', error);
    process.exit(1);
  });
}

module.exports = { runHealthCheck, testAIManager, testAudioSystem, testConfiguration };
