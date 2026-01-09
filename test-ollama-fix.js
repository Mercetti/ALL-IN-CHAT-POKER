/**
 * Test Ollama connection after 530 error fix
 */

const config = require('./server/config');

async function testOllamaConnection() {
  console.log('🔍 Testing Ollama connection...');
  console.log(`📡 OLLAMA_HOST: ${config.OLLAMA_HOST}`);
  
  try {
    const response = await fetch(`${config.OLLAMA_HOST}/api/tags`, {
      timeout: 5000
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Ollama connection successful!');
      console.log(`📊 Available models: ${data.models?.length || 0}`);
      console.log('📝 Models:', data.models?.map(m => m.name).join(', ') || 'None');
    } else {
      console.log(`❌ Ollama returned status ${response.status}`);
      console.log(`📄 Response: ${await response.text()}`);
    }
  } catch (error) {
    console.log(`❌ Failed to connect to Ollama: ${error.message}`);
  }
}

testOllamaConnection();
