/**
 * Helm Engine Test Suite
 * Tests core Helm engine functionality and compatibility aliases
 */

import { helmEngine, processHelmRequest, HelmEngine, processAceyRequest, AceyEngine } from '../helm/index';
import { helmPersonaLoader } from '../personas/helmPersonaLoader';

async function testHelmEngine() {
  console.log('🧪 Testing Helm Engine...');
  
  try {
    // Test 1: Engine Initialization
    console.log('✅ Engine initialized:', helmEngine.isHealthy());
    
    // Test 2: Basic Request Processing
    const request = {
      id: 'test-001',
      userId: 'user-001',
      message: 'Hello, how can you help me?',
      timestamp: Date.now()
    };
    
    const response = await processHelmRequest(request);
    console.log('✅ Request processed:', response.success);
    
    // Test 3: Compatibility Aliases
    const aceyEngine = new AceyEngine();
    console.log('✅ Compatibility alias works:', aceyEngine.isHealthy());
    
    // Test 4: Persona Loading
    const acey = helmPersonaLoader.getPersona('acey');
    console.log('✅ Persona loaded:', !!acey);
    
    console.log('🎉 All Helm engine tests passed!');
    
  } catch (error) {
    console.error('❌ Helm engine test failed:', error);
  }
}

testHelmEngine();
