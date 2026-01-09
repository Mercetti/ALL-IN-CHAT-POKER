// Test AI Control Center Connection
const axios = require('axios');

async function testConnection() {
  try {
    console.log('🔍 Testing AI Control Center connection...');
    
    // Test basic connection
    const response = await axios.get('http://localhost:5173', { timeout: 5000 });
    console.log('✅ AI Control Center Status:', response.status);
    console.log('✅ Response Headers:', response.headers);
    
    // Test admin endpoint (should fail without auth)
    try {
      const adminResponse = await axios.get('http://localhost:5173/admin/ai/performance/report', { timeout: 5000 });
      console.log('✅ Admin Endpoint Status:', adminResponse.status);
      console.log('✅ Admin Response:', adminResponse.data);
    } catch (adminError) {
      console.log('⚠️ Admin Endpoint Error:', adminError.response?.status || adminError.message);
    }
    
  } catch (error) {
    console.error('❌ Connection Test Failed:', error.message);
  }
}

testConnection();
